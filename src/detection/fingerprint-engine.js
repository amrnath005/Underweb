// src/detection/fingerprint-engine.js
// Multi-factor technology fingerprinting engine linking observed signals with evidence.

import { TECHNOLOGIES } from '../../data/technologies.js';
import { EvidenceRecord, EVIDENCE_TYPES } from '../evidence/evidence-engine.js';

export class FingerprintEngine {
  /**
   * Run fingerprint detection across all collected session telemetry.
   * @param {object} sessionSnapshot
   * @returns {Array<EvidenceRecord>}
   */
  static detect(sessionSnapshot) {
    const results = [];
    if (!sessionSnapshot) return results;

    const { runtime = {}, security = {}, requests = [] } = sessionSnapshot;
    const globals = runtime.globals || [];
    const domMetrics = runtime.domMetrics || {};
    const metaTags = domMetrics.metaTags || {};
    const frameworkMarkers = domMetrics.frameworkMarkers || [];
    const headers = security.headers || {};

    // Collect all script URLs
    const scriptUrls = requests
      .filter(r => r.category === 'SCRIPT' || (r.type && r.type === 'script') || (r.url && r.url.endsWith('.js')))
      .map(r => r.url);

    for (const tech of TECHNOLOGIES) {
      const record = new EvidenceRecord(tech.id, tech.name, tech.category);
      const sigs = tech.signatures || {};

      // 1. Check Window Globals
      if (sigs.globals) {
        for (const g of sigs.globals) {
          const match = globals.find(item => item.name === tech.name || item.evidenceKey === `window.${g}`);
          if (match) {
            record.addSignal(
              EVIDENCE_TYPES.WINDOW_GLOBAL,
              `window.${g}`,
              match.version || 'present',
              `Observed global variable window.${g}${match.version ? ` (v${match.version})` : ''}`
            );
          }
        }
      }

      // 2. Check DOM markers
      if (sigs.dom) {
        for (const marker of sigs.dom) {
          const match = frameworkMarkers.find(m => m.framework === tech.name || m.marker === marker);
          if (match) {
            record.addSignal(
              EVIDENCE_TYPES.DOM_MARKER,
              marker,
              'matched',
              `Observed DOM selector/marker: ${match.marker}`
            );
          }
        }
      }

      // 3. Check CSS classes
      if (sigs.domClasses) {
        for (const clsRegex of sigs.domClasses) {
          const match = frameworkMarkers.find(m => m.framework === tech.name && clsRegex.test(m.marker));
          if (match) {
            record.addSignal(
              EVIDENCE_TYPES.CSS_CLASS,
              clsRegex.toString(),
              'matched',
              `Observed CSS class signature: ${match.marker}`
            );
          }
        }
      }

      // 4. Check HTTP Response Headers
      if (sigs.headers) {
        for (const [headerName, pattern] of Object.entries(sigs.headers)) {
          const val = headers[headerName.toLowerCase()];
          if (val && pattern.test(val)) {
            record.addSignal(
              EVIDENCE_TYPES.HTTP_HEADER,
              headerName,
              val,
              `HTTP response header ${headerName}: "${val}" matches signature`
            );
          }
        }
      }

      // 5. Check Script URLs
      if (sigs.scripts) {
        for (const scriptRegex of sigs.scripts) {
          for (const sUrl of scriptUrls) {
            if (scriptRegex.test(sUrl)) {
              record.addSignal(
                EVIDENCE_TYPES.SCRIPT_URL,
                scriptRegex.toString(),
                sUrl,
                `Loaded script URL matches bundle pattern: ${sUrl.slice(0, 70)}...`
              );
              break; // One match per regex is enough
            }
          }
        }
      }

      // 6. Check Meta tags
      if (sigs.meta) {
        for (const m of sigs.meta) {
          const content = metaTags[m.name];
          if (content && m.content.test(content)) {
            record.addSignal(
              EVIDENCE_TYPES.META_TAG,
              `<meta name="${m.name}">`,
              content,
              `Meta tag <meta name="${m.name}" content="${content}"> confirmed`
            );
          }
        }
      }

      // If at least one positive signal was recorded, add to results
      if (record.signals.length > 0) {
        results.push(record);
      }
    }

    return results;
  }
}
