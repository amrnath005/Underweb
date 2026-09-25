// data/demo-snapshots.js
// Realistic telemetry snapshots for Underweb's GitHub Pages Live Web Playground.

export const DEMO_SNAPSHOTS = {
  shopify: {
    tabId: 9001,
    url: 'https://shop.gymshark.com/collections/all',
    title: 'Gymshark Official Store — Gym Clothes & Workout Wear',
    favicon: '',
    startTime: Date.now() - 3200,
    primaryDomain: 'shop.gymshark.com',
    primaryApex: 'gymshark.com',
    stats: {
      totalRequests: 28,
      totalBytes: 1845920,
      firstPartyCount: 14,
      thirdPartyCount: 14,
      apiCount: 5,
      scriptCount: 12,
      stylesheetCount: 3,
      imageCount: 6,
      fontCount: 2,
      trackerCount: 4,
      websocketCount: 1
    },
    domainsCount: 6,
    firstPartyDomainsCount: 1,
    thirdPartyDomainsCount: 5,
    ipAddresses: ['104.16.123.96', '151.101.65.140'],
    protocols: ['h2', 'h3'],
    domains: ['shop.gymshark.com', 'cdn.shopify.com', 'www.google-analytics.com', 'js.stripe.com', 'api.fastify-store.io'],
    firstPartyDomains: ['shop.gymshark.com'],
    thirdPartyDomains: ['cdn.shopify.com', 'www.google-analytics.com', 'js.stripe.com', 'api.fastify-store.io'],
    requests: [
      {
        url: 'https://shop.gymshark.com/collections/all',
        method: 'GET',
        status: 200,
        type: 'main_frame',
        category: 'DOCUMENT',
        duration: 210,
        size: 84200,
        firstParty: true,
        responseHeaders: {
          'server': 'cloudflare',
          'cf-ray': '8df4a1b0-ORD',
          'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
          'content-security-policy': "default-src 'self' https:; frame-ancestors 'none'; img-src * http: https: data:;",
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'strict-origin-when-cross-origin'
        }
      },
      {
        url: 'https://cdn.shopify.com/s/files/1/bundle-shopify.js',
        method: 'GET',
        status: 200,
        type: 'script',
        category: 'SCRIPT',
        duration: 95,
        size: 320000,
        firstParty: false
      },
      {
        url: 'https://shop.gymshark.com/api/v2/products',
        method: 'GET',
        status: 200,
        type: 'fetch',
        category: 'API',
        duration: 140,
        size: 42100,
        firstParty: true,
        responseHeaders: {
          'x-powered-by': 'Fastify'
        }
      },
      {
        url: 'https://js.stripe.com/v3/',
        method: 'GET',
        status: 200,
        type: 'script',
        category: 'PAYMENT',
        duration: 80,
        size: 94000,
        firstParty: false
      },
      {
        url: 'https://www.google-analytics.com/g/collect',
        method: 'POST',
        status: 204,
        type: 'ping',
        category: 'ANALYTICS',
        duration: 45,
        size: 210,
        firstParty: false
      },
      {
        url: 'http://cdn.partner-images.com/banner-promo.jpg',
        method: 'GET',
        status: 200,
        type: 'image',
        category: 'IMAGE',
        duration: 110,
        size: 58000,
        firstParty: false
      }
    ],
    runtime: {
      globals: [
        { name: 'Shopify', evidenceKey: 'window.Shopify' },
        { name: 'React', evidenceKey: 'window.React', version: '18.2.0' },
        { name: 'Stripe', evidenceKey: 'window.Stripe' }
      ],
      domMetrics: {
        frameworkMarkers: [
          { framework: 'Tailwind CSS', marker: 'Utility classes detected on 38 elements' }
        ],
        metaTags: {
          generator: 'Shopify'
        }
      },
      browserApis: [
        { api: 'localstorage', detail: 'localStorage active' },
        { api: 'indexeddb', detail: 'IndexedDB active' }
      ],
      storage: {
        localStorageCount: 8,
        localStorageKeys: ['cart_currency', 'checkout_session'],
        sessionStorageCount: 2,
        indexedDbDatabases: ['shopify_cache'],
        cookies: [
          { name: '_shopify_s', domain: '.gymshark.com', secure: true, httpOnly: true },
          { name: '_shopify_y', domain: '.gymshark.com', secure: true, httpOnly: false }
        ]
      },
      websockets: [
        { url: 'wss://shop.gymshark.com/live-inventory', status: 'OPEN', subprotocol: 'inventory-v1' }
      ],
      apis: [
        { method: 'GET', url: 'https://shop.gymshark.com/api/v2/products', type: 'REST' },
        { method: 'POST', url: 'https://shop.gymshark.com/api/graphql', type: 'GraphQL', operation: 'GetProducts' }
      ]
    },
    security: {
      isHttps: true,
      headers: {
        'server': 'cloudflare',
        'cf-ray': '8df4a1b0-ORD',
        'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
        'content-security-policy': "default-src 'self' https:; frame-ancestors 'none'; img-src * http: https: data:;",
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin'
      }
    },
    interactionLogs: []
  },

  nextjs: {
    tabId: 9002,
    url: 'https://vercel.com/dashboard',
    title: 'Vercel — Build and deploy the best web experiences',
    favicon: '',
    startTime: Date.now() - 4100,
    primaryDomain: 'vercel.com',
    primaryApex: 'vercel.com',
    stats: {
      totalRequests: 34,
      totalBytes: 2410800,
      firstPartyCount: 22,
      thirdPartyCount: 12,
      apiCount: 8,
      scriptCount: 16,
      stylesheetCount: 2,
      imageCount: 4,
      fontCount: 2,
      trackerCount: 2,
      websocketCount: 1
    },
    domainsCount: 5,
    firstPartyDomainsCount: 1,
    thirdPartyDomainsCount: 4,
    ipAddresses: ['76.76.21.21'],
    protocols: ['h2', 'h3'],
    domains: ['vercel.com', 'assets.vercel.com', 'api.segment.io', 'stats.g.doubleclick.net'],
    firstPartyDomains: ['vercel.com', 'assets.vercel.com'],
    thirdPartyDomains: ['api.segment.io', 'stats.g.doubleclick.net'],
    requests: [
      {
        url: 'https://vercel.com/dashboard',
        method: 'GET',
        status: 200,
        type: 'main_frame',
        category: 'DOCUMENT',
        duration: 180,
        size: 72000,
        firstParty: true,
        responseHeaders: {
          'server': 'Vercel',
          'x-vercel-id': 'iad1::8291-172722',
          'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
          'content-security-policy': "default-src 'self'; frame-ancestors 'self'",
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'strict-origin-when-cross-origin'
        }
      },
      {
        url: 'https://vercel.com/api/v1/projects',
        method: 'GET',
        status: 200,
        type: 'fetch',
        category: 'API',
        duration: 120,
        size: 28400,
        firstParty: true
      },
      {
        url: 'https://vercel.com/api/graphql',
        method: 'POST',
        status: 200,
        type: 'fetch',
        category: 'API',
        duration: 155,
        size: 45000,
        firstParty: true
      }
    ],
    runtime: {
      globals: [
        { name: 'Next.js', evidenceKey: 'window.__NEXT_DATA__' },
        { name: 'React', evidenceKey: 'window.React', version: '18.3.1' },
        { name: 'Three.js', evidenceKey: 'window.THREE' }
      ],
      domMetrics: {
        frameworkMarkers: [
          { framework: 'Tailwind CSS', marker: 'Tailwind utility class tokens' }
        ]
      },
      browserApis: [
        { api: 'webgl', detail: 'WebGL 2.0 active' },
        { api: 'service-worker', detail: 'Service worker active' }
      ],
      storage: {
        localStorageCount: 14,
        localStorageKeys: ['theme', 'current_team', 'recent_deployments'],
        sessionStorageCount: 1,
        indexedDbDatabases: ['vercel_sw_cache'],
        cookies: [
          { name: '_vercel_jwt', domain: '.vercel.com', secure: true, httpOnly: true }
        ]
      },
      websockets: [
        { url: 'wss://vercel.com/api/deployments/live', status: 'OPEN' }
      ],
      apis: [
        { method: 'POST', url: 'https://vercel.com/api/graphql', type: 'GraphQL', operation: 'GetDeploymentLogs' }
      ]
    },
    security: {
      isHttps: true,
      headers: {
        'server': 'Vercel',
        'x-vercel-id': 'iad1::8291-172722',
        'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
        'content-security-policy': "default-src 'self'; frame-ancestors 'self'",
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin'
      }
    },
    interactionLogs: []
  },

  wordpress: {
    tabId: 9003,
    url: 'https://techcrunch.com/category/startups/',
    title: 'Startups — TechCrunch',
    favicon: '',
    startTime: Date.now() - 5200,
    primaryDomain: 'techcrunch.com',
    primaryApex: 'techcrunch.com',
    stats: {
      totalRequests: 42,
      totalBytes: 3120000,
      firstPartyCount: 18,
      thirdPartyCount: 24,
      apiCount: 4,
      scriptCount: 20,
      stylesheetCount: 4,
      imageCount: 10,
      fontCount: 2,
      trackerCount: 6,
      websocketCount: 0
    },
    domainsCount: 8,
    firstPartyDomainsCount: 1,
    thirdPartyDomainsCount: 7,
    ipAddresses: ['192.0.66.2'],
    protocols: ['h3'],
    domains: ['techcrunch.com', 'wp.com', 'securepubads.g.doubleclick.net', 'www.googletagservices.com'],
    firstPartyDomains: ['techcrunch.com'],
    thirdPartyDomains: ['wp.com', 'securepubads.g.doubleclick.net', 'www.googletagservices.com'],
    requests: [
      {
        url: 'https://techcrunch.com/category/startups/',
        method: 'GET',
        status: 200,
        type: 'main_frame',
        category: 'DOCUMENT',
        duration: 250,
        size: 98000,
        firstParty: true,
        responseHeaders: {
          'server': 'Automattic',
          'strict-transport-security': 'max-age=31536000',
          'x-content-type-options': 'nosniff'
        }
      },
      {
        url: 'https://techcrunch.com/wp-json/wp/v2/posts',
        method: 'GET',
        status: 200,
        type: 'fetch',
        category: 'API',
        duration: 180,
        size: 48000,
        firstParty: true
      }
    ],
    runtime: {
      globals: [
        { name: 'WordPress', evidenceKey: 'window.wp' },
        { name: 'jQuery', evidenceKey: 'window.jQuery', version: '3.7.1' }
      ],
      domMetrics: {
        metaTags: {
          generator: 'WordPress 6.5.2'
        }
      },
      browserApis: [
        { api: 'localstorage', detail: 'localStorage active' }
      ],
      storage: {
        localStorageCount: 4,
        localStorageKeys: ['consent_status'],
        sessionStorageCount: 0,
        indexedDbDatabases: [],
        cookies: [
          { name: 'wordpress_logged_in', domain: '.techcrunch.com', secure: true, httpOnly: true }
        ]
      },
      websockets: [],
      apis: [
        { method: 'GET', url: 'https://techcrunch.com/wp-json/wp/v2/posts', type: 'REST' }
      ]
    },
    security: {
      isHttps: true,
      headers: {
        'server': 'Automattic',
        'strict-transport-security': 'max-age=31536000',
        'x-content-type-options': 'nosniff'
      }
    },
    interactionLogs: []
  }
};
