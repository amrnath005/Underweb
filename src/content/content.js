// src/content/content.js
// Isolated Content Script: DOM analysis, client storage auditing,
// PerformanceObserver telemetry, and page-world relay to Background Service Worker.

(function () {
  const EVENT_PREFIX = '__UNDERWEB_TELEMETRY__';

  // Inject page-analyzer.js into MAIN world
  function injectPageAnalyzer() {
    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('src/content/page-analyzer.js');
      script.onload = () => script.remove();
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {
      console.warn('[Underweb] Failed to inject page analyzer:', e);
    }
  }

  // Runtime findings aggregated in this content script
  const runtimeState = {
    globals: [],
    frameworks: [],
    libraries: [],
    apis: [],
    websockets: [],
    browserApis: [],
    performance: {},
    storage: {
      localStorageCount: 0,
      localStorageKeys: [],
      sessionStorageCount: 0,
      indexedDbDatabases: [],
      cookies: []
    },
    permissions: {},
    domMetrics: {
      scriptsCount: 0,
      stylesheetsCount: 0,
      imagesCount: 0,
      iframesCount: 0,
      scripts: [],
      stylesheets: [],
      metaTags: {},
      manifest: null,
      frameworkMarkers: []
    }
  };

  // 1. Listen for messages from MAIN world page-analyzer
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== EVENT_PREFIX) return;

    const { type, data } = event.data;

    if (type === 'GLOBALS_DETECTED') {
      runtimeState.globals = data;
      dispatchTelemetry();
    } else if (type === 'BROWSER_API_USED') {
      if (!runtimeState.browserApis.some(b => b.api === data.api)) {
        runtimeState.browserApis.push(data);
        dispatchTelemetry();
      }
    } else if (type === 'API_REQUEST_START' || type === 'API_REQUEST_FINISH') {
      // Append or update in runtimeState.apis
      if (!runtimeState.apis.some(a => a.url === data.url && a.timestamp === data.timestamp)) {
        runtimeState.apis.push(data);
        if (runtimeState.apis.length > 50) runtimeState.apis.shift();
      }
      dispatchTelemetry();
    } else if (type === 'WEBSOCKET_OPEN' || type === 'WEBSOCKET_CLOSE') {
      const existing = runtimeState.websockets.find(ws => ws.url === data.url);
      if (existing) {
        existing.status = type === 'WEBSOCKET_OPEN' ? 'OPEN' : 'CLOSED';
        existing.timestamp = data.timestamp;
      } else {
        runtimeState.websockets.push({
          url: data.url,
          status: type === 'WEBSOCKET_OPEN' ? 'OPEN' : 'CLOSED',
          timestamp: data.timestamp
        });
        if (runtimeState.websockets.length > 30) runtimeState.websockets.shift();
      }
      dispatchTelemetry();
    }
  });

  // 2. Perform DOM & CSS Inspection
  function analyzeDom() {
    // Scripts & stylesheets
    const scriptElements = Array.from(document.querySelectorAll('script[src]'));
    runtimeState.domMetrics.scriptsCount = document.querySelectorAll('script').length;
    runtimeState.domMetrics.scripts = scriptElements.map(s => s.src).filter(Boolean).slice(0, 100);

    const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    runtimeState.domMetrics.stylesheetsCount = linkElements.length;
    runtimeState.domMetrics.stylesheets = linkElements.map(l => l.href).filter(Boolean).slice(0, 50);

    const manifestLink = document.querySelector('link[rel="manifest"]');
    runtimeState.domMetrics.manifest = manifestLink ? manifestLink.href : null;

    runtimeState.domMetrics.imagesCount = document.querySelectorAll('img').length;
    runtimeState.domMetrics.iframesCount = document.querySelectorAll('iframe').length;

    // Meta tags
    const metas = document.querySelectorAll('meta');
    const metaMap = {};
    metas.forEach(m => {
      const name = m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('http-equiv');
      const content = m.getAttribute('content');
      if (name && content) {
        metaMap[name.toLowerCase()] = content;
      }
    });
    runtimeState.domMetrics.metaTags = metaMap;

    // Framework DOM markers
    const markers = [];
    if (document.getElementById('__next')) markers.push({ framework: 'Next.js', marker: '#__next' });
    if (document.getElementById('___gatsby')) markers.push({ framework: 'Gatsby', marker: '#___gatsby' });
    if (document.getElementById('__nuxt') || document.querySelector('[data-n-head]')) markers.push({ framework: 'Nuxt', marker: '#__nuxt or [data-n-head]' });
    if (document.getElementById('app') || document.querySelector('[data-v-]')) markers.push({ framework: 'Vue.js', marker: 'data-v- attribute or #app' });
    if (document.querySelector('[data-reactroot]') || document.querySelector('[data-react-helmet]')) markers.push({ framework: 'React', marker: '[data-reactroot]' });
    if (document.querySelector('[ng-version]')) markers.push({ framework: 'Angular', marker: `ng-version: ${document.querySelector('[ng-version]').getAttribute('ng-version')}` });
    if (document.querySelector('[ng-app]')) markers.push({ framework: 'AngularJS', marker: '[ng-app]' });
    if (document.querySelector('[class*="svelte-"]')) markers.push({ framework: 'Svelte', marker: 'class="svelte-*"' });
    if (document.querySelector('astro-island') || document.querySelector('[class*="astro-"]')) markers.push({ framework: 'Astro', marker: 'astro-island or class="astro-*"' });
    if (document.querySelector('[x-data]')) markers.push({ framework: 'Alpine.js', marker: '[x-data]' });
    if (document.querySelector('[hx-get]') || document.querySelector('[hx-post]')) markers.push({ framework: 'HTMX', marker: '[hx-*]' });
    if (document.querySelector('meta[name="generator"][content*="WordPress"]') || document.querySelector('link[href*="wp-content"]')) markers.push({ framework: 'WordPress', marker: 'WordPress asset/meta' });
    if (document.querySelector('#shopify-features') || document.querySelector('link[href*="cdn.shopify.com"]')) markers.push({ framework: 'Shopify', marker: 'Shopify asset/marker' });
    if (document.querySelector('#__VIEWSTATE')) markers.push({ framework: 'ASP.NET', marker: '#__VIEWSTATE' });
    if (document.querySelector('canvas')) markers.push({ framework: 'HTML5 Canvas', marker: 'canvas element' });

    // CSS Class inspections
    const classListSample = Array.from(document.querySelectorAll('[class]')).slice(0, 100).map(el => el.className).join(' ');
    if (/\b(flex|grid|p-\d|m-\d|text-(sm|base|lg|xl)|bg-(white|black|gray|slate))\b/.test(classListSample)) {
      markers.push({ framework: 'Tailwind CSS', marker: 'Utility class signatures (flex, grid, p-*, text-*)' });
    }
    if (/\b(container|row|col-(sm|md|lg)-\d|btn-primary)\b/.test(classListSample)) {
      markers.push({ framework: 'Bootstrap', marker: 'Bootstrap class signatures (row, col-*, btn-primary)' });
    }
    if (/\b(MuiButton|MuiBox|MuiTypography)\b/.test(classListSample)) {
      markers.push({ framework: 'Material UI (MUI)', marker: 'MUI component class signatures' });
    }
    if (/\b(ant-btn|ant-layout|ant-row)\b/.test(classListSample)) {
      markers.push({ framework: 'Ant Design', marker: 'Ant Design class signatures' });
    }
    if (/\b(chakra-button|chakra-stack)\b/.test(classListSample)) {
      markers.push({ framework: 'Chakra UI', marker: 'Chakra UI class signatures' });
    }

    runtimeState.domMetrics.frameworkMarkers = markers;
  }

  // 3. Inspect Client Storage
  function analyzeStorage() {
    try {
      if (window.localStorage) {
        runtimeState.storage.localStorageCount = window.localStorage.length;
        runtimeState.storage.localStorageKeys = Object.keys(window.localStorage).slice(0, 50);
      }
    } catch {
      // Storage access blocked or restricted
    }

    try {
      if (window.sessionStorage) {
        runtimeState.storage.sessionStorageCount = window.sessionStorage.length;
      }
    } catch {
      // Storage access blocked
    }

    if (window.indexedDB && indexedDB.databases) {
      indexedDB.databases().then(dbs => {
        runtimeState.storage.indexedDbDatabases = dbs.map(db => db.name || 'unnamed');
        dispatchTelemetry();
      }).catch(() => {});
    }
  }

  // 4. Audit Browser Permissions & Capabilities
  async function auditPermissions() {
    const permissionsToCheck = ['geolocation', 'notifications', 'clipboard-read', 'camera', 'microphone'];
    for (const name of permissionsToCheck) {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name });
          runtimeState.permissions[name] = status.state;
        } catch {
          // Permission not supported or restricted in this browser context
        }
      }
    }
  }

  // 5. Audit Real PerformanceNavigationTiming
  function analyzePerformance() {
    try {
      if (typeof window !== 'undefined' && window.performance && window.performance.getEntriesByType) {
        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries && navEntries.length > 0) {
          const nav = navEntries[0];
          runtimeState.performance = {
            protocol: nav.nextHopProtocol || '',
            ttfb: Math.max(0, Math.round(nav.responseStart - nav.requestStart)),
            dns: Math.max(0, Math.round(nav.domainLookupEnd - nav.domainLookupStart)),
            tcp: Math.max(0, Math.round(nav.connectEnd - nav.connectStart)),
            tls: nav.secureConnectionStart > 0 ? Math.max(0, Math.round(nav.connectEnd - nav.secureConnectionStart)) : 0,
            download: Math.max(0, Math.round(nav.responseEnd - nav.responseStart)),
            domContentLoaded: Math.max(0, Math.round(nav.domContentLoadedEventEnd - nav.startTime)),
            domInteractive: Math.max(0, Math.round(nav.domInteractive - nav.startTime)),
            loadComplete: Math.max(0, Math.round(nav.loadEventEnd - nav.startTime)),
            transferSize: nav.transferSize || 0,
            encodedBodySize: nav.encodedBodySize || 0,
            decodedBodySize: nav.decodedBodySize || 0
          };
        }
      }
    } catch {}
  }

  // 6. Send aggregated telemetry to Background Service Worker
  let debounceTimeout = null;
  function dispatchTelemetry() {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'CONTENT_TELEMETRY',
        url: window.location.href,
        payload: runtimeState
      }).catch(() => {});
    }, 200);
  }

  // 7. Interactive Click Recorder ("What Happens When I Click")
  let isRecordingClick = false;
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'SET_CLICK_RECORDING') {
      isRecordingClick = !!message.enabled;
    }
  });

  window.addEventListener('click', (e) => {
    if (!isRecordingClick) return;
    const target = e.target;
    if (!target) return;

    const clickData = {
      tagName: target.tagName,
      id: target.id || '',
      className: typeof target.className === 'string' ? target.className : '',
      text: (target.innerText || target.value || '').slice(0, 40),
      timestamp: Date.now()
    };

    chrome.runtime.sendMessage({
      action: 'INTERACTION_EVENT',
      event: {
        type: 'CLICK',
        target: clickData
      }
    }).catch(() => {});
  }, true);

  // Initialize
  injectPageAnalyzer();
  analyzeDom();
  analyzeStorage();
  analyzePerformance();
  auditPermissions().then(() => dispatchTelemetry());

  // Re-run DOM & performance inspection once DOM and window are completely ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      analyzeDom();
      analyzeStorage();
      analyzePerformance();
      dispatchTelemetry();
    });
  } else {
    analyzeDom();
    analyzeStorage();
    analyzePerformance();
    dispatchTelemetry();
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      analyzePerformance();
      dispatchTelemetry();
    }, 300);
  });
})();
