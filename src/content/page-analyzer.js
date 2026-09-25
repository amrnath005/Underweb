// src/content/page-analyzer.js
// Injected into the page's MAIN execution world to inspect runtime globals,
// monitor API calls (fetch/XHR), inspect WebSockets, and detect actual browser API usage.

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

  // Set of detected browser APIs (to avoid spamming messages)
  const observedBrowserApis = new Set();
  function recordBrowserApi(apiName, detail = '') {
    if (!observedBrowserApis.has(apiName)) {
      observedBrowserApis.add(apiName);
      emitToContentScript('BROWSER_API_USED', {
        api: apiName,
        detail,
        timestamp: Date.now()
      });
    }
  }

  // 1. Detect runtime window globals
  function inspectGlobals() {
    const detected = [];

    const GLOBAL_PROBES = [
      // Frontend Frameworks
      { key: 'React', name: 'React', category: 'Frontend Framework' },
      { key: '__REACT_DEVTOOLS_GLOBAL_HOOK__', name: 'React', category: 'Frontend Framework' },
      { key: '__NEXT_DATA__', name: 'Next.js', category: 'Frontend Framework' },
      { key: '__NUXT__', name: 'Nuxt', category: 'Frontend Framework' },
      { key: '$nuxt', name: 'Nuxt', category: 'Frontend Framework' },
      { key: '__remixContext', name: 'Remix', category: 'Frontend Framework' },
      { key: '__astro', name: 'Astro', category: 'Frontend Framework' },
      { key: 'Vue', name: 'Vue.js', category: 'Frontend Framework' },
      { key: '__VUE__', name: 'Vue.js', category: 'Frontend Framework' },
      { key: 'angular', name: 'AngularJS', category: 'Frontend Framework' },
      { key: 'ng', name: 'Angular', category: 'Frontend Framework' },
      { key: '__svelte', name: 'Svelte', category: 'Frontend Framework' },
      { key: '__sveltekit_data', name: 'SvelteKit', category: 'Frontend Framework' },
      { key: 'preact', name: 'Preact', category: 'Frontend Framework' },
      { key: '_$HY', name: 'SolidJS', category: 'Frontend Framework' },
      { key: 'qwikevents', name: 'Qwik', category: 'Frontend Framework' },
      { key: 'Alpine', name: 'Alpine.js', category: 'Frontend Framework' },
      { key: 'htmx', name: 'HTMX', category: 'Frontend Framework' },
      { key: 'litHtml', name: 'Lit', category: 'Frontend Framework' },
      { key: 'Ember', name: 'Ember.js', category: 'Frontend Framework' },
      { key: 'Backbone', name: 'Backbone.js', category: 'Frontend Framework' },
      { key: 'ko', name: 'Knockout', category: 'Frontend Framework' },
      { key: 'm', name: 'Mithril.js', category: 'Frontend Framework' },
      { key: 'Stimulus', name: 'Stimulus', category: 'Frontend Framework' },
      { key: 'Polymer', name: 'Polymer', category: 'Frontend Framework' },
      { key: 'Meteor', name: 'Meteor', category: 'Frontend Framework' },
      { key: 'Inferno', name: 'Inferno', category: 'Frontend Framework' },
      { key: 'docusaurus', name: 'Docusaurus', category: 'Frontend Framework' },

      // JavaScript Libraries
      { key: 'jQuery', name: 'jQuery', category: 'JavaScript Library' },
      { key: '$', name: 'jQuery', category: 'JavaScript Library' },
      { key: '_', name: 'Lodash / Underscore', category: 'JavaScript Library' },
      { key: 'axios', name: 'Axios', category: 'JavaScript Library' },
      { key: 'moment', name: 'Moment.js', category: 'JavaScript Library' },
      { key: 'dayjs', name: 'Day.js', category: 'JavaScript Library' },
      { key: 'dateFns', name: 'date-fns', category: 'JavaScript Library' },
      { key: 'rxjs', name: 'RxJS', category: 'JavaScript Library' },
      { key: 'THREE', name: 'Three.js', category: 'JavaScript Library' },
      { key: 'd3', name: 'D3.js', category: 'JavaScript Library' },
      { key: 'Chart', name: 'Chart.js', category: 'JavaScript Library' },
      { key: 'echarts', name: 'Apache ECharts', category: 'JavaScript Library' },
      { key: 'gsap', name: 'GSAP (GreenSock)', category: 'JavaScript Library' },
      { key: 'anime', name: 'Anime.js', category: 'JavaScript Library' },
      { key: '__REDUX_DEVTOOLS_EXTENSION__', name: 'Redux', category: 'JavaScript Library' },
      { key: '__zustand', name: 'Zustand', category: 'JavaScript Library' },
      { key: 'mobx', name: 'MobX', category: 'JavaScript Library' },
      { key: '__recoil', name: 'Recoil', category: 'JavaScript Library' },
      { key: '__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__', name: 'TanStack Query (React Query)', category: 'JavaScript Library' },
      { key: 'io', name: 'Socket.IO Client', category: 'JavaScript Library' },
      { key: 'L', name: 'Leaflet', category: 'JavaScript Library' },
      { key: 'mapboxgl', name: 'Mapbox GL JS', category: 'JavaScript Library' },
      { key: 'BABYLON', name: 'Babylon.js', category: 'JavaScript Library' },
      { key: 'tf', name: 'TensorFlow.js', category: 'JavaScript Library' },
      { key: 'ort', name: 'ONNX Runtime Web', category: 'JavaScript Library' },

      // UI Frameworks
      { key: 'bootstrap', name: 'Bootstrap', category: 'CSS & UI' },
      { key: 'Foundation', name: 'Foundation', category: 'CSS & UI' },
      { key: 'UIkit', name: 'UIkit', category: 'CSS & UI' },

      // CMS & E-Commerce
      { key: 'Shopify', name: 'Shopify', category: 'E-Commerce' },
      { key: 'ShopifyAnalytics', name: 'Shopify', category: 'E-Commerce' },
      { key: 'wp', name: 'WordPress', category: 'CMS' },
      { key: '_wpemojiSettings', name: 'WordPress', category: 'CMS' },
      { key: 'Drupal', name: 'Drupal', category: 'CMS' },
      { key: 'Joomla', name: 'Joomla', category: 'CMS' },
      { key: 'Webflow', name: 'Webflow', category: 'CMS' },
      { key: 'wixBiSession', name: 'Wix', category: 'CMS' },
      { key: 'Squarespace', name: 'Squarespace', category: 'CMS' },
      { key: 'Mage', name: 'Magento (Adobe Commerce)', category: 'E-Commerce' },
      { key: 'BCData', name: 'BigCommerce', category: 'E-Commerce' },
      { key: 'woocommerce_params', name: 'WooCommerce', category: 'E-Commerce' },
      { key: 'prestashop', name: 'PrestaShop', category: 'E-Commerce' },

      // Analytics & Monitoring
      { key: 'dataLayer', name: 'Google Tag Manager', category: 'Analytics' },
      { key: 'google_tag_manager', name: 'Google Tag Manager', category: 'Analytics' },
      { key: 'gtag', name: 'Google Analytics', category: 'Analytics' },
      { key: 'ga', name: 'Google Analytics', category: 'Analytics' },
      { key: 'fbq', name: 'Meta Pixel', category: 'Analytics' },
      { key: 'clarity', name: 'Microsoft Clarity', category: 'Analytics' },
      { key: 'hj', name: 'Hotjar', category: 'Analytics' },
      { key: 'amplitude', name: 'Amplitude', category: 'Analytics' },
      { key: 'mixpanel', name: 'Mixpanel', category: 'Analytics' },
      { key: 'analytics', name: 'Segment', category: 'Analytics' },
      { key: 'posthog', name: 'PostHog', category: 'Analytics' },
      { key: 'plausible', name: 'Plausible Analytics', category: 'Analytics' },
      { key: '_paq', name: 'Matomo', category: 'Analytics' },
      { key: 'FS', name: 'FullStory', category: 'Analytics' },
      { key: 'Sentry', name: 'Sentry', category: 'Analytics' },
      { key: '__SENTRY__', name: 'Sentry', category: 'Analytics' },
      { key: 'DD_RUM', name: 'Datadog RUM', category: 'Analytics' },
      { key: 'newrelic', name: 'New Relic Browser', category: 'Analytics' },
      { key: 'LogRocket', name: 'LogRocket', category: 'Analytics' },

      // Advertising
      { key: 'adsbygoogle', name: 'Google AdSense', category: 'Advertising' },
      { key: 'googletag', name: 'Google Ad Manager (DFP)', category: 'Advertising' },
      { key: 'apstag', name: 'Amazon Advertising', category: 'Advertising' },
      { key: 'criteo_q', name: 'Criteo', category: 'Advertising' },
      { key: 'pbjs', name: 'Prebid.js', category: 'Advertising' },
      { key: '_taboola', name: 'Taboola', category: 'Advertising' },
      { key: 'OBR', name: 'Outbrain', category: 'Advertising' },

      // Authentication
      { key: 'auth0', name: 'Auth0', category: 'Authentication' },
      { key: 'Clerk', name: 'Clerk', category: 'Authentication' },
      { key: 'OktaAuth', name: 'Okta', category: 'Authentication' },
      { key: '__SUPABASE__', name: 'Supabase', category: 'Cloud & Hosting' },

      // Build Tools & Bundlers
      { key: '__vite_plugin_react_preamble_installed__', name: 'Vite', category: 'Build Tool' },
      { key: 'webpackChunk', name: 'Webpack', category: 'Build Tool' },
      { key: '__webpack_require__', name: 'Webpack', category: 'Build Tool' },
      { key: '__turbopack__', name: 'Turbopack', category: 'Build Tool' },
      { key: 'parcelRequire', name: 'Parcel', category: 'Build Tool' },
      { key: '__rspack_require__', name: 'Rspack', category: 'Build Tool' },
      { key: 'regeneratorRuntime', name: 'Babel', category: 'Build Tool' }
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

    // Dynamic checks for webpack chunks matching window.webpackChunk*
    for (const prop of Object.keys(window)) {
      if (prop.startsWith('webpackChunk') && !detected.some(d => d.name === 'Webpack')) {
        detected.push({
          name: 'Webpack',
          category: 'Build Tool',
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
        } catch {}
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

  // 3. Intercept XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  if (originalXHR && originalXHR.prototype) {
    const origOpen = originalXHR.prototype.open;
    const origSend = originalXHR.prototype.send;

    originalXHR.prototype.open = function (method, url, ...rest) {
      this.__underweb_method = (method || 'GET').toUpperCase();
      this.__underweb_url = typeof url === 'string' ? url : url.toString();
      return origOpen.call(this, method, url, ...rest);
    };

    originalXHR.prototype.send = function (body) {
      const url = this.__underweb_url || '';
      const method = this.__underweb_method || 'GET';
      const startTime = performance.now();

      let isGraphQL = url.includes('/graphql') || url.includes('/gql');
      let operationName = null;
      if (body && typeof body === 'string') {
        try {
          const parsed = JSON.parse(body);
          if (parsed.query || parsed.operationName) {
            isGraphQL = true;
            operationName = parsed.operationName || null;
          }
        } catch {}
      }

      emitToContentScript('API_REQUEST_START', {
        type: 'XHR',
        url,
        method,
        isGraphQL,
        operationName,
        timestamp: Date.now()
      });

      this.addEventListener('loadend', () => {
        const duration = Math.round(performance.now() - startTime);
        emitToContentScript('API_REQUEST_FINISH', {
          type: 'XHR',
          url,
          method,
          status: this.status,
          duration,
          isGraphQL,
          timestamp: Date.now()
        });
      });

      return origSend.call(this, body);
    };
  }

  // 4. Intercept window.WebSocket
  const OriginalWebSocket = window.WebSocket;
  if (OriginalWebSocket) {
    window.WebSocket = function (url, protocols) {
      const ws = new OriginalWebSocket(url, protocols);
      recordBrowserApi('websocket', typeof url === 'string' ? url : url.toString());

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

  // 5. Intercept HTMLCanvasElement.prototype.getContext (WebGL & Canvas 2D)
  if (window.HTMLCanvasElement && HTMLCanvasElement.prototype.getContext) {
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextType, ...args) {
      if (contextType === 'webgl' || contextType === 'experimental-webgl') {
        recordBrowserApi('webgl', 'WebGL 1.0 context created');
      } else if (contextType === 'webgl2') {
        recordBrowserApi('webgl', 'WebGL 2.0 context created');
      } else if (contextType === '2d') {
        recordBrowserApi('canvas2d', '2D Canvas context created');
      } else if (contextType === 'webgpu') {
        recordBrowserApi('webgpu', 'WebGPU context created');
      }
      return origGetContext.call(this, contextType, ...args);
    };
  }

  // 6. Monitor WebAssembly
  if (window.WebAssembly && typeof WebAssembly.instantiate === 'function') {
    const origInstantiate = WebAssembly.instantiate;
    WebAssembly.instantiate = function (...args) {
      recordBrowserApi('webassembly', 'WebAssembly.instantiate called');
      return origInstantiate.apply(this, args);
    };
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      const origInstantiateStreaming = WebAssembly.instantiateStreaming;
      WebAssembly.instantiateStreaming = function (...args) {
        recordBrowserApi('webassembly', 'WebAssembly.instantiateStreaming called');
        return origInstantiateStreaming.apply(this, args);
      };
    }
  }

  // 7. Monitor Web Workers
  if (window.Worker) {
    const OrigWorker = window.Worker;
    window.Worker = function (scriptURL, options) {
      recordBrowserApi('web-worker', typeof scriptURL === 'string' ? scriptURL : 'Worker instantiated');
      return new OrigWorker(scriptURL, options);
    };
    window.Worker.prototype = OrigWorker.prototype;
  }

  // 8. Monitor Geolocation
  if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
    const origGeo = navigator.geolocation.getCurrentPosition;
    navigator.geolocation.getCurrentPosition = function (...args) {
      recordBrowserApi('geolocation', 'navigator.geolocation.getCurrentPosition called');
      return origGeo.apply(this, args);
    };
  }

  // 9. Monitor Notifications
  if (window.Notification && Notification.requestPermission) {
    const origReq = Notification.requestPermission;
    Notification.requestPermission = function (...args) {
      recordBrowserApi('notifications', 'Notification.requestPermission called');
      return origReq.apply(this, args);
    };
  }

  // 10. Check Service Worker presence
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    recordBrowserApi('service-worker', `Active controller: ${navigator.serviceWorker.controller.scriptURL || 'active'}`);
  }

  // 11. Run initial inspection after page stabilization
  if (document.readyState === 'complete') {
    inspectGlobals();
  } else {
    window.addEventListener('load', () => {
      setTimeout(inspectGlobals, 500);
    });
  }

  // Periodic check for deferred/lazy loaded libraries
  setTimeout(inspectGlobals, 1500);
  setTimeout(inspectGlobals, 4000);
})();
