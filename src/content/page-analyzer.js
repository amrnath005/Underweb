// src/content/page-analyzer.js
// Injected into the page's MAIN execution world to inspect runtime globals,
// monitor API calls (fetch/XHR), and inspect WebSockets.

(function () {
  if (window.__UNDERWEB_INITIALIZED__) return;
  window.__UNDERWEB_INITIALIZED__ = true;

  const EVENT_PREFIX = '__UNDERWEB_TELEMETRY__';

  function emitToContentScript(type, data) {
    window.postMessage(
      {
        source: EVENT_PREFIX,
        type,
        data
      },
      '*'
    );
  }

  // 1. Detect runtime window globals
  function inspectGlobals() {
    const detected = [];

    const GLOBAL_PROBES = [
      { key: 'React', name: 'React', category: 'FRAMEWORK' },
      { key: '__NEXT_DATA__', name: 'Next.js', category: 'FRAMEWORK' },
      { key: '__NUXT__', name: 'Nuxt', category: 'FRAMEWORK' },
      { key: '__remixContext', name: 'Remix', category: 'FRAMEWORK' },
      { key: '__astro', name: 'Astro', category: 'FRAMEWORK' },
      { key: 'Vue', name: 'Vue.js', category: 'FRAMEWORK' },
      { key: 'angular', name: 'AngularJS', category: 'FRAMEWORK' },
      { key: 'ng', name: 'Angular', category: 'FRAMEWORK' },
      { key: 'Svelte', name: 'Svelte', category: 'FRAMEWORK' },
      { key: 'Preact', name: 'Preact', category: 'FRAMEWORK' },
      { key: 'jQuery', name: 'jQuery', category: 'LIBRARY' },
      { key: '$', name: 'jQuery / Zepto', category: 'LIBRARY' },
      { key: '_', name: 'Lodash / Underscore', category: 'LIBRARY' },
      { key: 'THREE', name: 'Three.js', category: 'LIBRARY' },
      { key: 'gsap', name: 'GSAP', category: 'LIBRARY' },
      { key: 'd3', name: 'D3.js', category: 'LIBRARY' },
      { key: 'Chart', name: 'Chart.js', category: 'LIBRARY' },
      { key: 'axios', name: 'Axios', category: 'LIBRARY' },
      { key: 'moment', name: 'Moment.js', category: 'LIBRARY' },
      { key: 'dayjs', name: 'Day.js', category: 'LIBRARY' },
      { key: 'rxjs', name: 'RxJS', category: 'LIBRARY' },
      { key: 'Stripe', name: 'Stripe', category: 'PAYMENT' },
      { key: 'paypal', name: 'PayPal', category: 'PAYMENT' },
      { key: 'Razorpay', name: 'Razorpay', category: 'PAYMENT' },
      { key: 'dataLayer', name: 'Google Tag Manager', category: 'ANALYTICS' },
      { key: 'gtag', name: 'Google Analytics (gtag)', category: 'ANALYTICS' },
      { key: 'ga', name: 'Google Analytics (Universal)', category: 'ANALYTICS' },
      { key: 'fbq', name: 'Meta Pixel', category: 'ANALYTICS' },
      { key: 'mixpanel', name: 'Mixpanel', category: 'ANALYTICS' },
      { key: 'hj', name: 'Hotjar', category: 'ANALYTICS' },
      { key: 'clarity', name: 'Microsoft Clarity', category: 'ANALYTICS' },
      { key: 'analytics', name: 'Segment', category: 'ANALYTICS' },
      { key: 'Sentry', name: 'Sentry', category: 'MONITORING' },
      { key: 'DD_RUM', name: 'Datadog RUM', category: 'MONITORING' },
      { key: 'newrelic', name: 'New Relic', category: 'MONITORING' },
      { key: '__vite_plugin_react_preamble_installed__', name: 'Vite', category: 'BUILD_TOOL' },
      { key: 'webpackChunk', name: 'Webpack', category: 'BUILD_TOOL' }
    ];

    for (const probe of GLOBAL_PROBES) {
      if (probe.key in window && window[probe.key] !== undefined) {
        let version = null;
        try {
          const obj = window[probe.key];
          if (obj && typeof obj === 'object') {
            version = obj.version || obj.VERSION || (obj.fn && obj.fn.jquery) || null;
          }
        } catch {
          // Cross-origin or restricted accessor
        }
        detected.push({
          name: probe.name,
          category: probe.category,
          evidenceKey: `window.${probe.key}`,
          version: typeof version === 'string' ? version : null
        });
      }
    }

    // Check for webpack chunks matching window.webpackChunk*
    for (const prop of Object.keys(window)) {
      if (prop.startsWith('webpackChunk') && !detected.some(d => d.name === 'Webpack')) {
        detected.push({
          name: 'Webpack',
          category: 'BUILD_TOOL',
          evidenceKey: `window.${prop}`,
          version: null
        });
        break;
      }
    }

    emitToContentScript('GLOBALS_DETECTED', detected);
  }

  // 2. Intercept window.fetch to capture API calls in runtime
  const originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = async function (...args) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
      const options = args[1] || {};
      const method = (options.method || (args[0] && args[0].method) || 'GET').toUpperCase();
      const startTime = performance.now();

      // Check if GraphQL
      let isGraphQL = url.includes('/graphql') || url.includes('/gql');
      let operationName = null;
      if (options.body && typeof options.body === 'string') {
        try {
          const parsed = JSON.parse(options.body);
          if (parsed.query || parsed.operationName) {
            isGraphQL = true;
            operationName = parsed.operationName || null;
          }
        } catch {
          // not JSON
        }
      }

      emitToContentScript('API_REQUEST_START', {
        type: 'FETCH',
        url,
        method,
        isGraphQL,
        operationName,
        timestamp: Date.now()
      });

      try {
        const response = await originalFetch.apply(this, args);
        const duration = Math.round(performance.now() - startTime);

        emitToContentScript('API_REQUEST_FINISH', {
          type: 'FETCH',
          url,
          method,
          status: response.status,
          duration,
          isGraphQL,
          timestamp: Date.now()
        });

        return response;
      } catch (err) {
        emitToContentScript('API_REQUEST_ERROR', {
          type: 'FETCH',
          url,
          method,
          error: err.message,
          timestamp: Date.now()
        });
        throw err;
      }
    };
  }

  // 3. Intercept window.WebSocket
  const OriginalWebSocket = window.WebSocket;
  if (OriginalWebSocket) {
    window.WebSocket = function (url, protocols) {
      const ws = new OriginalWebSocket(url, protocols);
      emitToContentScript('WEBSOCKET_OPEN', {
        url: typeof url === 'string' ? url : url.toString(),
        timestamp: Date.now()
      });

      ws.addEventListener('close', () => {
        emitToContentScript('WEBSOCKET_CLOSE', {
          url: typeof url === 'string' ? url : url.toString(),
          timestamp: Date.now()
        });
      });

      return ws;
    };
    window.WebSocket.prototype = OriginalWebSocket.prototype;
  }

  // Run initial inspection after page stabilization
  if (document.readyState === 'complete') {
    inspectGlobals();
  } else {
    window.addEventListener('load', () => {
      setTimeout(inspectGlobals, 500);
    });
  }

  // Periodic check for deferred/lazy loaded libraries
  setTimeout(inspectGlobals, 2000);
  setTimeout(inspectGlobals, 5000);
})();
