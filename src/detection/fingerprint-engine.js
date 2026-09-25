// src/detection/fingerprint-engine.js
// Universal, multi-factor technology detection engine synthesizing 28 evidence vectors.
// Follows the core rule: "Detect everything observable. Infer only what evidence supports. Mark everything else UNKNOWN."

import { TECHNOLOGIES, TECH_BY_ID } from '../../data/technologies.js';
import { EvidenceRecord, EVIDENCE_TYPES } from '../evidence/evidence-engine.js';
import { WasmDetector } from './wasm-detector.js';

export class FingerprintEngine {
  /**
   * Run fingerprint detection across all collected session telemetry and optional cookies.
   * @param {object} sessionSnapshot
   * @param {Array<object>} [cookieList]
   * @returns {Array<EvidenceRecord>}
   */
  static detect(sessionSnapshot, cookieList = []) {
    const results = [];
    if (!sessionSnapshot) return results;

    const {
      url = '',
      runtime = {},
      security = {},
      requests = [],
      protocols = []
    } = sessionSnapshot;

    const globals = runtime.globals || [];
    const domMetrics = runtime.domMetrics || {};
    const metaTags = domMetrics.metaTags || {};
    const frameworkMarkers = domMetrics.frameworkMarkers || [];
    const mainHeaders = security.headers || {};
    const browserApis = runtime.browserApis || [];
    const runtimeApis = runtime.apis || [];
    const websockets = runtime.websockets || [];
    const storage = runtime.storage || {};
    const localStorageKeys = storage.localStorageKeys || [];
    const indexedDbDatabases = storage.indexedDbDatabases || [];

    // 1. Compile all observed script URLs (from DOM inspection + network requests)
    const scriptUrlSet = new Set(domMetrics.scripts || []);
    for (const r of requests) {
      if (
        r.category === 'SCRIPT' ||
        (r.type && r.type === 'script') ||
        (r.url && (r.url.endsWith('.js') || r.url.includes('.js?')))
      ) {
        scriptUrlSet.add(r.url);
      }
    }
    const allScriptUrls = Array.from(scriptUrlSet);

    // 2. Compile all observed stylesheet URLs
    const stylesheetUrlSet = new Set(domMetrics.stylesheets || []);
    for (const r of requests) {
      if (
        r.category === 'STYLESHEET' ||
        (r.type && r.type === 'stylesheet') ||
        (r.url && (r.url.endsWith('.css') || r.url.includes('.css?')))
      ) {
        stylesheetUrlSet.add(r.url);
      }
    }
    const allStylesheetUrls = Array.from(stylesheetUrlSet);

    // 3. Compile all API endpoints (from runtime interception + network requests + websockets)
    const apiUrlSet = new Set();
    for (const api of runtimeApis) {
      if (api.url) apiUrlSet.add(api.url);
    }
    for (const ws of websockets) {
      if (ws.url) apiUrlSet.add(ws.url);
    }
    for (const r of requests) {
      if (
        r.category === 'API' ||
        r.category === 'WEBSOCKET' ||
        r.type === 'xmlhttprequest' ||
        r.type === 'fetch' ||
        r.type === 'websocket' ||
        (r.url && (r.url.includes('/api/') || r.url.includes('/graphql') || r.url.includes('/gql') || r.url.startsWith('ws://') || r.url.startsWith('wss://')))
      ) {
        apiUrlSet.add(r.url);
      }
    }
    const allApiUrls = Array.from(apiUrlSet);

    // 4. Compile all observed cookies
    const allCookies = [
      ...(storage.cookies || []),
      ...(cookieList || [])
    ];
    const cookieNames = new Set(allCookies.map(c => typeof c === 'string' ? c : (c.name || '')));

    // 5. Build lookup map for subresource response headers
    const subresourceHeaders = [];
    for (const req of requests) {
      if (req.responseHeaders && Object.keys(req.responseHeaders).length > 0) {
        subresourceHeaders.push({
          url: req.url,
          headers: req.responseHeaders
        });
      }
    }

    // Map to hold detected records by tech ID
    const detectedRecords = new Map();

    // -------------------------------------------------------------
    // PHASE 1: DIRECT EVIDENCE SIGNATURE MATCHING
    // -------------------------------------------------------------
    for (const tech of TECHNOLOGIES) {
      const sigs = tech.signatures || {};
      const record = new EvidenceRecord(tech.id, tech.name, tech.category, {
        website: tech.website,
        description: tech.description
      });

      // 1. Window Globals
      if (sigs.globals) {
        for (const g of sigs.globals) {
          const match = globals.find(item => item.name === tech.name || item.evidenceKey === `window.${g}`);
          if (match) {
            record.addSignal(
              EVIDENCE_TYPES.WINDOW_GLOBAL,
              `window.${g}`,
              match.version || 'present',
              `Observed global variable window.${g}${match.version ? ` (v${match.version})` : ''}`,
              'page-analyzer.js',
              'HIGH'
            );
          }
        }
      }

      // 2. DOM Markers & Selectors
      if (sigs.dom) {
        for (const marker of sigs.dom) {
          const match = frameworkMarkers.find(m =>
            m.framework === tech.name ||
            m.marker === marker ||
            m.marker.includes(marker)
          );
          if (match) {
            record.addSignal(
              EVIDENCE_TYPES.DOM_MARKER,
              marker,
              'matched',
              `Observed DOM selector or marker: ${match.marker}`,
              'DOM',
              'HIGH'
            );
          }
        }
      }

      // 3. CSS Class Signatures
      if (sigs.domClasses) {
        for (const clsRegex of sigs.domClasses) {
          const match = frameworkMarkers.find(m => m.framework === tech.name || clsRegex.test(m.marker));
          if (match) {
            record.addSignal(
              EVIDENCE_TYPES.CSS_CLASS,
              clsRegex.toString(),
              'matched',
              `Observed CSS class signature: ${match.marker}`,
              'DOM',
              'MEDIUM'
            );
          }
        }
      }

      // 4. HTTP Headers (Main Frame Document AND Subresources)
      if (sigs.headers) {
        for (const [headerKey, pattern] of Object.entries(sigs.headers)) {
          const lowerKey = headerKey.toLowerCase();

          // Check main frame document headers first
          const mainVal = mainHeaders[lowerKey];
          if (mainVal && pattern.test(mainVal)) {
            record.addSignal(
              EVIDENCE_TYPES.HTTP_HEADER,
              headerKey,
              mainVal,
              `Main frame HTTP response header ${headerKey}: "${mainVal}" matches signature`,
              'main_frame header',
              'HIGH'
            );
          } else {
            // Check subresource response headers (APIs, static bundles)
            for (const sub of subresourceHeaders) {
              const subVal = sub.headers[lowerKey];
              if (subVal && pattern.test(subVal)) {
                record.addSignal(
                  EVIDENCE_TYPES.HTTP_HEADER,
                  headerKey,
                  subVal,
                  `Subresource HTTP response header ${headerKey}: "${subVal}" on ${sub.url.slice(0, 60)}... matches signature`,
                  'subresource header',
                  'HIGH'
                );
                break; // One match per header pattern is sufficient
              }
            }
          }
        }
      }

      // 5. Script Bundle URLs
      if (sigs.scripts) {
        for (const scriptRegex of sigs.scripts) {
          for (const sUrl of allScriptUrls) {
            if (scriptRegex.test(sUrl)) {
              record.addSignal(
                EVIDENCE_TYPES.SCRIPT_URL,
                scriptRegex.toString(),
                sUrl,
                `Loaded script bundle URL matches pattern: ${sUrl.slice(0, 80)}`,
                'network/script',
                'HIGH'
              );
              break;
            }
          }
        }
      }

      // 6. Stylesheet URLs
      if (sigs.stylesheets) {
        for (const styleRegex of sigs.stylesheets) {
          for (const sUrl of allStylesheetUrls) {
            if (styleRegex.test(sUrl)) {
              record.addSignal(
                EVIDENCE_TYPES.STYLESHEET_URL,
                styleRegex.toString(),
                sUrl,
                `Stylesheet URL matches pattern: ${sUrl.slice(0, 80)}`,
                'DOM stylesheet',
                'MEDIUM'
              );
              break;
            }
          }
        }
      }

      // 7. Meta Tags
      if (sigs.meta) {
        for (const m of sigs.meta) {
          const content = metaTags[m.name.toLowerCase()];
          if (content && m.content.test(content)) {
            record.addSignal(
              EVIDENCE_TYPES.META_TAG,
              `<meta name="${m.name}">`,
              content,
              `Confirmed meta tag <meta name="${m.name}" content="${content}">`,
              'DOM meta',
              'HIGH'
            );
          }
        }
      }

      // 8. Cookies
      if (sigs.cookies) {
        for (const cookieRegex of sigs.cookies) {
          for (const cName of cookieNames) {
            if (cookieRegex.test(cName)) {
              record.addSignal(
                EVIDENCE_TYPES.COOKIE_NAME,
                cookieRegex.toString(),
                cName,
                `Cookie "${cName}" matches known signature`,
                'cookies',
                'MEDIUM'
              );
              break;
            }
          }
        }
      }

      // 9. Client Storage & Databases
      if (sigs.storageTypes) {
        for (const st of sigs.storageTypes) {
          if (st === 'localStorage' && (storage.localStorageCount > 0 || localStorageKeys.length > 0)) {
            record.addSignal(
              EVIDENCE_TYPES.STORAGE_KEY,
              'localStorage',
              `${storage.localStorageCount || localStorageKeys.length} items`,
              `Active localStorage usage with ${storage.localStorageCount || localStorageKeys.length} keys`,
              'client storage',
              'MEDIUM'
            );
          } else if (st === 'sessionStorage' && storage.sessionStorageCount > 0) {
            record.addSignal(
              EVIDENCE_TYPES.STORAGE_KEY,
              'sessionStorage',
              `${storage.sessionStorageCount} items`,
              `Active sessionStorage usage with ${storage.sessionStorageCount} keys`,
              'client storage',
              'MEDIUM'
            );
          } else if (st === 'indexedDB' && indexedDbDatabases.length > 0) {
            record.addSignal(
              EVIDENCE_TYPES.STORAGE_KEY,
              'indexedDB',
              indexedDbDatabases.join(', '),
              `IndexedDB databases observed: ${indexedDbDatabases.join(', ')}`,
              'IndexedDB',
              'HIGH'
            );
          } else if (st === 'cookies' && cookieNames.size > 0) {
            record.addSignal(
              EVIDENCE_TYPES.COOKIE_NAME,
              'cookies',
              `${cookieNames.size} cookies`,
              `HTTP Cookies present on client (${cookieNames.size} observed)`,
              'cookies',
              'MEDIUM'
            );
          }
        }
      }

      // 10. API Communication Signatures
      if (sigs.apis) {
        for (const apiRegex of sigs.apis) {
          for (const aUrl of allApiUrls) {
            if (apiRegex.test(aUrl)) {
              record.addSignal(
                EVIDENCE_TYPES.API_ENDPOINT,
                apiRegex.toString(),
                aUrl,
                `Observed API communication route matching pattern: ${aUrl.slice(0, 80)}`,
                'API network',
                'HIGH'
              );
              break;
            }
          }
        }
      }

      // 11. Browser Hardware / System APIs
      if (sigs.browserApis) {
        for (const bApi of sigs.browserApis) {
          const match = browserApis.find(item => item.api === bApi);
          if (match) {
            record.addSignal(
              EVIDENCE_TYPES.BROWSER_API,
              bApi,
              match.detail || 'invoked',
              `Browser API "${bApi}" explicitly invoked by page: ${match.detail || 'active'}`,
              'page-analyzer.js',
              'HIGH'
            );
          }
          // Also check active websockets if this is websocket API
          if (bApi === 'websocket' && websockets.length > 0 && !record.signals.some(s => s.key === 'websocket')) {
            record.addSignal(
              EVIDENCE_TYPES.BROWSER_API,
              'websocket',
              websockets[0].url,
              `Active WebSocket connection opened to: ${websockets[0].url}`,
              'page-analyzer.js',
              'HIGH'
            );
          }
        }
      }

      // 12. PWA Manifest & Signals
      if (sigs.pwaSignals) {
        if (domMetrics.manifest) {
          record.addSignal(
            EVIDENCE_TYPES.PWA_MANIFEST,
            'manifest',
            domMetrics.manifest,
            `Web App Manifest link detected: ${domMetrics.manifest}`,
            'DOM manifest',
            'HIGH'
          );
        }
        if (browserApis.some(b => b.api === 'service-worker')) {
          record.addSignal(
            EVIDENCE_TYPES.PWA_MANIFEST,
            'serviceWorker',
            'active',
            'Service Worker active for offline capability / PWA support',
            'Service Worker',
            'HIGH'
          );
        }
        if (metaTags['theme-color']) {
          record.addSignal(
            EVIDENCE_TYPES.PWA_MANIFEST,
            'theme-color',
            metaTags['theme-color'],
            `PWA theme-color declared: ${metaTags['theme-color']}`,
            'DOM meta',
            'MEDIUM'
          );
        }
      }

      // 13. Security Protocols
      if (sigs.protocols) {
        if (security.isHttps || url.startsWith('https://') || protocols.includes('https:') || protocols.includes('h2') || protocols.includes('h3')) {
          record.addSignal(
            EVIDENCE_TYPES.PROTOCOL,
            'https',
            'TLS',
            'Encrypted TLS/HTTPS transport channel confirmed',
            'network protocol',
            'HIGH'
          );
        }
      }

      // If at least one valid signal was detected, store record
      if (record.signals.length > 0 && record.score >= 20) {
        detectedRecords.set(record.id, record);
      }
    }

    // -------------------------------------------------------------
    // PHASE 2: EVIDENCE-BASED ARCHITECTURAL IMPLICATION (INFERENCE)
    // -------------------------------------------------------------
    // For example: Next.js implies React, Nuxt implies Vue, SvelteKit implies Svelte.
    for (const [techId, record] of Array.from(detectedRecords.entries())) {
      const techDef = TECH_BY_ID.get(techId);
      if (techDef && techDef.signatures && techDef.signatures.implies) {
        for (const impliedId of techDef.signatures.implies) {
          const impliedDef = TECH_BY_ID.get(impliedId);
          if (!impliedDef) continue;

          let impliedRecord = detectedRecords.get(impliedId);
          if (!impliedRecord) {
            impliedRecord = new EvidenceRecord(impliedDef.id, impliedDef.name, impliedDef.category, {
              website: impliedDef.website,
              description: impliedDef.description
            });
            impliedRecord.addSignal(
              EVIDENCE_TYPES.INFERRED_HEURISTIC,
              techDef.name,
              techDef.id,
              `Inferred from parent framework ${techDef.name} (${record.confidence} confidence)`,
              'architecture inference',
              'HIGH'
            );
            detectedRecords.set(impliedDef.id, impliedRecord);
          } else {
            // Already observed directly, add parent inference as supporting evidence
            impliedRecord.addSignal(
              EVIDENCE_TYPES.INFERRED_HEURISTIC,
              techDef.name,
              techDef.id,
              `Confirmed as underlying engine of detected parent framework ${techDef.name}`,
              'architecture inference',
              'MEDIUM'
            );
          }
        }
      }
    }

    // -------------------------------------------------------------
    // PHASE 2.5: DEEP WEBASSEMBLY (WASM) & TOOLCHAIN DETECTION
    // -------------------------------------------------------------
    try {
      const wasmTechs = WasmDetector.detect(sessionSnapshot);
      for (const wt of wasmTechs) {
        if (!detectedRecords.has(wt.id)) {
          detectedRecords.set(wt.id, wt.evidence);
        }
      }
    } catch (err) {
      console.warn('WasmDetector execution failed:', err);
    }

    // -------------------------------------------------------------
    // PHASE 3: ROLE ASSIGNMENT & SORTING
    // -------------------------------------------------------------
    const finalResults = Array.from(detectedRecords.values());

    // Sort: Primary technologies first, then by score descending
    finalResults.sort((a, b) => {
      const roleOrder = { PRIMARY: 0, SECONDARY: 1, THIRD_PARTY: 2, EMBEDDED: 3 };
      const roleDiff = (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
      if (roleDiff !== 0) return roleDiff;
      return b.score - a.score;
    });

    return finalResults;
  }
}
