// src/utils/mock-data.js
// Realistic telemetry data session for localhost preview and offline exploration.

export function createMockSession() {
  const now = Date.now();
  const domain = 'hermes-agent.nousresearch.com';

  const mockRequests = [
    {
      id: 'req_1',
      url: 'https://hermes-agent.nousresearch.com/',
      host: domain,
      pathname: '/',
      method: 'GET',
      type: 'main_frame',
      category: 'DOCUMENT',
      isFirstParty: true,
      status: 200,
      size: 42100,
      duration: 85,
      startTime: now - 3200,
      ip: '104.21.48.212',
      protocol: 'h3',
      responseHeaders: {
        'server': 'cloudflare',
        'cf-ray': '89012345678-LHR',
        'cf-cache-status': 'DYNAMIC',
        'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://api.nousresearch.com https://www.google-analytics.com;",
        'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
        'x-content-type-options': 'nosniff',
        'x-nextjs-cache': 'HIT',
        'x-powered-by': 'Next.js'
      }
    },
    {
      id: 'req_2',
      url: 'https://hermes-agent.nousresearch.com/_next/static/css/styles.chunk.css',
      host: domain,
      pathname: '/_next/static/css/styles.chunk.css',
      method: 'GET',
      type: 'stylesheet',
      category: 'STYLESHEET',
      isFirstParty: true,
      status: 200,
      size: 18400,
      duration: 32,
      startTime: now - 3100,
      ip: '104.21.48.212',
      protocol: 'h3'
    },
    {
      id: 'req_3',
      url: 'https://hermes-agent.nousresearch.com/_next/static/chunks/main-app.js',
      host: domain,
      pathname: '/_next/static/chunks/main-app.js',
      method: 'GET',
      type: 'script',
      category: 'SCRIPT',
      isFirstParty: true,
      status: 200,
      size: 142000,
      duration: 110,
      startTime: now - 3050,
      ip: '104.21.48.212',
      protocol: 'h3'
    },
    {
      id: 'req_4',
      url: 'https://hermes-agent.nousresearch.com/_next/static/chunks/react-dom.production.min.js',
      host: domain,
      pathname: '/_next/static/chunks/react-dom.production.min.js',
      method: 'GET',
      type: 'script',
      category: 'SCRIPT',
      isFirstParty: true,
      status: 200,
      size: 89000,
      duration: 65,
      startTime: now - 2980,
      ip: '104.21.48.212',
      protocol: 'h3'
    },
    {
      id: 'req_5',
      url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk',
      host: 'fonts.googleapis.com',
      pathname: '/css2',
      method: 'GET',
      type: 'stylesheet',
      category: 'FONT',
      isFirstParty: false,
      status: 200,
      size: 2400,
      duration: 45,
      startTime: now - 2900,
      ip: '142.250.187.234',
      protocol: 'h2'
    },
    {
      id: 'req_6',
      url: 'https://api.nousresearch.com/v1/agent/status',
      host: 'api.nousresearch.com',
      pathname: '/v1/agent/status',
      method: 'GET',
      type: 'fetch',
      category: 'API',
      isFirstParty: true,
      status: 200,
      size: 1280,
      duration: 72,
      startTime: now - 2750,
      ip: '104.21.48.212',
      protocol: 'h3'
    },
    {
      id: 'req_7',
      url: 'https://api.nousresearch.com/graphql',
      host: 'api.nousresearch.com',
      pathname: '/graphql',
      method: 'POST',
      type: 'fetch',
      category: 'API',
      isFirstParty: true,
      status: 200,
      size: 4500,
      duration: 95,
      startTime: now - 2650,
      ip: '104.21.48.212',
      protocol: 'h3'
    },
    {
      id: 'req_8',
      url: 'https://js.stripe.com/v3/',
      host: 'js.stripe.com',
      pathname: '/v3/',
      method: 'GET',
      type: 'script',
      category: 'PAYMENT',
      isFirstParty: false,
      status: 200,
      size: 58000,
      duration: 78,
      startTime: now - 2500,
      ip: '151.101.1.187',
      protocol: 'h2'
    },
    {
      id: 'req_9',
      url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-XXXXX',
      host: 'www.google-analytics.com',
      pathname: '/g/collect',
      method: 'POST',
      type: 'other',
      category: 'ANALYTICS',
      isFirstParty: false,
      status: 204,
      size: 0,
      duration: 40,
      startTime: now - 2300,
      ip: '142.250.187.206',
      protocol: 'h2'
    },
    {
      id: 'req_10',
      url: 'https://browser.sentry-cdn.com/7.x/bundle.min.js',
      host: 'browser.sentry-cdn.com',
      pathname: '/7.x/bundle.min.js',
      method: 'GET',
      type: 'script',
      category: 'SCRIPT',
      isFirstParty: false,
      status: 200,
      size: 28000,
      duration: 52,
      startTime: now - 2150,
      ip: '104.16.123.96',
      protocol: 'h3'
    }
  ];

  return {
    tabId: 999,
    url: 'https://hermes-agent.nousresearch.com',
    title: "Hermes Agent — The Internet's Own AI",
    favicon: 'assets/branding/scorpion.svg',
    startTime: now - 3500,
    primaryDomain: domain,
    primaryApex: 'nousresearch.com',
    stats: {
      totalRequests: 84,
      totalBytes: 2450000,
      firstPartyCount: 52,
      thirdPartyCount: 32,
      apiCount: 7,
      scriptCount: 24,
      stylesheetCount: 6,
      imageCount: 35,
      fontCount: 4,
      trackerCount: 3,
      websocketCount: 1
    },
    domainsCount: 14,
    firstPartyDomainsCount: 3,
    thirdPartyDomainsCount: 11,
    ipAddresses: ['104.21.48.212', '142.250.187.234', '151.101.1.187'],
    protocols: ['h3', 'h2', 'TLS 1.3'],
    domains: [
      domain,
      'api.nousresearch.com',
      'fonts.googleapis.com',
      'js.stripe.com',
      'www.google-analytics.com',
      'browser.sentry-cdn.com'
    ],
    firstPartyDomains: [domain, 'api.nousresearch.com'],
    thirdPartyDomains: [
      'fonts.googleapis.com',
      'js.stripe.com',
      'www.google-analytics.com',
      'browser.sentry-cdn.com'
    ],
    requests: mockRequests,
    runtime: {
      globals: [
        { name: 'React', category: 'FRAMEWORK', version: '18.3.1', evidenceKey: 'window.React' },
        { name: 'Next.js', category: 'META_FRAMEWORK', evidenceKey: 'window.__NEXT_DATA__' },
        { name: 'Stripe', category: 'PAYMENT', evidenceKey: 'window.Stripe' },
        { name: 'Sentry', category: 'MONITORING', evidenceKey: 'window.Sentry' },
        { name: 'Google Analytics', category: 'ANALYTICS', evidenceKey: 'window.gtag' }
      ],
      storage: {
        localStorageCount: 8,
        localStorageKeys: ['theme', 'agent_session_id', 'user_pref', 'cart_token', 'ga_client_id'],
        sessionStorageCount: 3,
        indexedDbDatabases: ['agent_workspace_cache', 'vector_index']
      },
      permissions: {
        geolocation: 'prompt',
        notifications: 'granted',
        'clipboard-read': 'prompt'
      },
      domMetrics: {
        scriptsCount: 18,
        stylesheetsCount: 4,
        imagesCount: 32,
        iframesCount: 1,
        metaTags: {
          generator: 'Next.js',
          viewport: 'width=device-width, initial-scale=1'
        },
        frameworkMarkers: [
          { framework: 'Next.js', marker: '#__next' },
          { framework: 'React', marker: '[data-reactroot]' },
          { framework: 'Tailwind CSS', marker: 'flex grid p-4 text-white bg-blue-600' }
        ]
      }
    },
    security: {
      isHttps: true,
      headers: {
        'server': 'cloudflare',
        'cf-ray': '89012345678-LHR',
        'cf-cache-status': 'HIT',
        'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://api.nousresearch.com https://www.google-analytics.com;",
        'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
        'x-content-type-options': 'nosniff',
        'x-nextjs-cache': 'HIT',
        'x-powered-by': 'Next.js'
      }
    },
    mockCookies: [
      { name: '__cf_bm', domain: '.hermes-agent.nousresearch.com', secure: true, httpOnly: true, sameSite: 'none' },
      { name: 'session_token', domain: 'hermes-agent.nousresearch.com', secure: true, httpOnly: true, sameSite: 'lax' },
      { name: '_ga', domain: '.nousresearch.com', secure: false, httpOnly: false, sameSite: 'lax', expirationDate: now / 1000 + 450 * 86400 }
    ],
    interactionLogs: [
      { type: 'CLICK', target: { tagName: 'BUTTON', className: 'agent-run-btn', text: 'Deploy Agent Substrate' }, timestamp: now - 1800 },
      { type: 'DOM_MUTATION', detail: 'Rendered neural execution console', timestamp: now - 1760 },
      { type: 'API', method: 'POST', url: '/api/v1/agent/execute', status: 200, duration: 84, timestamp: now - 1650 },
      { type: 'STORAGE', key: 'agent_session_id', timestamp: now - 1520 }
    ]
  };
}
