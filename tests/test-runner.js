// tests/test-runner.js
// Automated zero-dependency unit test suite for Underweb algorithms and analyzers.

import { DomainUtils } from '../src/utils/domain-utils.js';
import { UrlUtils } from '../src/utils/url-utils.js';
import { Parsers } from '../src/utils/parsers.js';
import { ResourceClassifier, RESOURCE_CATEGORIES } from '../src/network/resource-classifier.js';
import { DirectedGraph } from '../src/architecture/graph.js';
import { BreadthFirstSearch } from '../src/algorithms/bfs.js';
import { DepthFirstSearch } from '../src/algorithms/dfs.js';
import { ShortestPath } from '../src/algorithms/shortest-path.js';
import { Centrality } from '../src/algorithms/centrality.js';
import { ConnectedComponents } from '../src/algorithms/connected-components.js';
import { DependencyDepth } from '../src/algorithms/dependency-depth.js';
import { EvidenceRecord, EVIDENCE_TYPES } from '../src/evidence/evidence-engine.js';
import { IpAnalyzer } from '../src/infrastructure/ip-analyzer.js';
import { AsnAnalyzer } from '../src/infrastructure/asn-analyzer.js';
import { TabSession, SessionManager } from '../src/background/session-manager.js';
import { createMockSession } from '../src/utils/mock-data.js';
import { ApiDetector } from '../src/network/api-detector.js';
import { WebSocketAnalyzer } from '../src/network/websocket-analyzer.js';
import { FingerprintEngine } from '../src/detection/fingerprint-engine.js';
import { SecurityAnalyzer } from '../src/security/security-analyzer.js';
import { MixedContentDetector } from '../src/security/mixed-content.js';
import { HeaderAnalyzer } from '../src/security/header-analyzer.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
  }
}

function suite(name, fn) {
  console.log(`\n\x1b[36m--- Suite: ${name} ---\x1b[0m`);
  fn();
}

// -------------------------------------------------------------
// 1. DomainUtils & eTLD+1 Tests
// -------------------------------------------------------------
suite('DomainUtils & eTLD+1 Decomposition', () => {
  assert(DomainUtils.getApexDomain('example.com') === 'example.com', 'Standard single TLD');
  assert(DomainUtils.getApexDomain('sub.example.com') === 'example.com', 'Subdomain of standard TLD');
  assert(DomainUtils.getApexDomain('api.cdn.service.co.uk') === 'service.co.uk', 'Multi-part suffix .co.uk');
  assert(DomainUtils.getApexDomain('app.vercel.app') === 'app.vercel.app', 'Vercel app subdomain');
  assert(DomainUtils.isFirstParty('cdn.example.com', 'example.com') === true, 'First-party comparison');
  assert(DomainUtils.isFirstParty('analytics.google.com', 'example.com') === false, 'Third-party comparison');
  assert(DomainUtils.isIpAddress('192.168.1.1') === true, 'IPv4 address detection');
  assert(DomainUtils.isIpAddress('example.com') === false, 'Hostname is not IP');
});

// -------------------------------------------------------------
// 2. ResourceClassifier Tests
// -------------------------------------------------------------
suite('ResourceClassifier', () => {
  assert(
    ResourceClassifier.classify({ url: 'https://example.com/api/v1/products', type: 'xmlhttprequest' }) === RESOURCE_CATEGORIES.API,
    'Classifies /api/ endpoint as API'
  );
  assert(
    ResourceClassifier.classify({ url: 'https://www.google-analytics.com/g/collect', type: 'other' }) === RESOURCE_CATEGORIES.ANALYTICS,
    'Classifies Google Analytics as ANALYTICS'
  );
  assert(
    ResourceClassifier.classify({ url: 'https://js.stripe.com/v3/', type: 'script' }) === RESOURCE_CATEGORIES.PAYMENT,
    'Classifies Stripe as PAYMENT'
  );
  assert(
    ResourceClassifier.classify({ url: 'https://example.com/main.bundle.js', type: 'script' }) === RESOURCE_CATEGORIES.SCRIPT,
    'Classifies JavaScript bundle as SCRIPT'
  );
});

// -------------------------------------------------------------
// 3. DirectedGraph & CS Algorithms Tests
// -------------------------------------------------------------
suite('DirectedGraph & Computer Science Algorithms', () => {
  const g = new DirectedGraph();
  g.addNode('Website', 'Website', 'WEBSITE');
  g.addNode('Bundle.js', 'Bundle.js', 'SCRIPT');
  g.addNode('API_Gateway', 'API_Gateway', 'API');
  g.addNode('Database', 'Database', 'HOST');
  g.addNode('Tracker', 'Tracker', 'TRACKER');

  g.addEdge('Website', 'Bundle.js', 'LOADS');
  g.addEdge('Bundle.js', 'API_Gateway', 'CALLS');
  g.addEdge('API_Gateway', 'Database', 'CONNECTS_TO');
  g.addEdge('Website', 'Tracker', 'CONNECTS_TO');

  // Shortest Path
  const path = ShortestPath.findPath(g, 'Website', 'Database');
  assert(path.found === true && path.distance === 3, 'Shortest path found with 3 hops');
  assert(path.path.join('->') === 'Website->Bundle.js->API_Gateway->Database', 'Correct path trajectory');

  // BFS & DFS
  const bfs = BreadthFirstSearch.traverse(g, 'Website');
  assert(bfs.visitedOrder.length === 5, 'BFS visits all reachable nodes');

  const dfs = DepthFirstSearch.traverse(g, 'Website');
  assert(dfs.hasCycle === false, 'Graph is a DAG without cycles');

  // Centrality
  const degrees = Centrality.degreeCentrality(g);
  assert(degrees.get('Website').outDegree === 2, 'Website out-degree is 2');
  assert(degrees.get('API_Gateway').inDegree === 1, 'API_Gateway in-degree is 1');

  // Dependency Depth
  const depth = DependencyDepth.compute(g, 'Website');
  assert(depth.maxDepth === 3, 'Max dependency depth is 3');

  // Connected Components
  const components = ConnectedComponents.findComponents(g);
  assert(components.length === 1 && components[0].length === 5, 'All nodes belong to 1 connected component');
});

// -------------------------------------------------------------
// 4. Evidence Engine Confidence Scoring Tests
// -------------------------------------------------------------
suite('EvidenceEngine Confidence Calculation', () => {
  const rec = new EvidenceRecord('nextjs', 'Next.js', 'META_FRAMEWORK');
  rec.addSignal(EVIDENCE_TYPES.DOM_MARKER, '#__next', 'matched', 'Root DOM node #__next found');
  rec.addSignal(EVIDENCE_TYPES.WINDOW_GLOBAL, 'window.__NEXT_DATA__', 'present', 'Next data global found');

  assert(rec.status === 'OBSERVED', 'Status is OBSERVED from direct runtime signals');
  assert(rec.confidence === 'HIGH', 'Confidence is HIGH with multiple direct signals');
  assert(rec.score >= 0.85, 'Score exceeds 0.85 threshold');
});

// -------------------------------------------------------------
// 5. Infrastructure & ASN Tests
// -------------------------------------------------------------
suite('Infrastructure & ASN Matcher', () => {
  assert(IpAnalyzer.isPrivate('127.0.0.1') === true, '127.0.0.1 is private');
  assert(IpAnalyzer.isPrivate('192.168.1.100') === true, '192.168.1.100 is private');
  assert(IpAnalyzer.isPrivate('104.16.123.96') === false, '104.16.123.96 is public');

  const cfAsn = AsnAnalyzer.lookup('104.16.50.5');
  assert(cfAsn.asn === 'AS13335' && cfAsn.org.includes('Cloudflare'), 'Resolves Cloudflare ASN');

  const awsAsn = AsnAnalyzer.lookup('52.1.2.3');
  assert(awsAsn.asn === 'AS16509' && awsAsn.org.includes('Amazon'), 'Resolves AWS ASN');
});

// -------------------------------------------------------------
// 6. TabSession & SessionManager Lifecycle (Phase 1)
// -------------------------------------------------------------
suite('TabSession & SessionManager Lifecycle', () => {
  const session = new TabSession(42, 'https://example.com/app');
  session.recordRequest({
    requestId: 'req_test_1',
    url: 'https://example.com/api/data',
    method: 'GET',
    type: 'xmlhttprequest',
    size: 2048,
    duration: 45,
    ip: '93.184.216.34',
    status: 200
  });

  assert(session.stats.totalRequests === 1, 'Records single request in stats');
  assert(session.stats.totalBytes === 2048, 'Tracks byte payload');
  assert(session.domains.has('example.com'), 'Tracks domain in set');
  assert(session.ipAddresses.has('93.184.216.34'), 'Tracks IP address');

  // Snapshot & Hydration Test
  const snapshot = session.getSnapshot();
  assert(snapshot.tabId === 42, 'Snapshot retains tabId');
  assert(snapshot.requests.length === 1, 'Snapshot serializes requests array');

  const hydrated = TabSession.fromSnapshot(snapshot);
  assert(hydrated instanceof TabSession, 'fromSnapshot returns TabSession instance');
  assert(hydrated.tabId === 42, 'Hydrated instance retains tabId');
  assert(hydrated.domains.has('example.com'), 'Hydrated instance restores Set objects');
  assert(hydrated.requestsById.has('req_test_1'), 'Hydrated instance restores requestsById Map');

  // SessionManager in-memory tests
  const sm = new SessionManager();
  const created = sm.getOrCreate(101, 'https://test.org');
  assert(created.tabId === 101, 'SessionManager creates tab session');
  assert(sm.get(101) === created, 'SessionManager retrieves existing session synchronously');

  sm.removeTab(101);
  assert(sm.get(101) === null, 'SessionManager removes tab cleanly');

  // Mock data fixture isolation test
  const fixture = createMockSession();
  assert(fixture && fixture.primaryDomain.length > 0, 'Mock session remains available as test fixture');
});

// -------------------------------------------------------------
// 7. Phase 2: Telemetry Pipelines (WebSockets, APIs, Classification)
// -------------------------------------------------------------
suite('Phase 2 Telemetry Pipelines & Synthesis', () => {
  const s = new TabSession(88, 'https://myapp.com');

  // Test 1: Automatic classification and categorical increment
  s.recordRequest({
    requestId: 'r_api',
    url: 'https://myapp.com/api/v2/users',
    type: 'fetch',
    size: 512
  });
  s.recordRequest({
    requestId: 'r_script',
    url: 'https://myapp.com/static/bundle.js',
    type: 'script',
    size: 1024
  });
  s.recordRequest({
    requestId: 'r_track',
    url: 'https://www.google-analytics.com/g/collect',
    type: 'other'
  });

  assert(s.stats.apiCount === 1, 'Auto-increments stats.apiCount from classification');
  assert(s.stats.scriptCount === 1, 'Auto-increments stats.scriptCount from classification');
  assert(s.stats.trackerCount === 1, 'Auto-increments stats.trackerCount from classification');

  // Test 2: ApiDetector merges webRequest + runtime intercepted APIs
  const networkRequests = [
    { url: 'https://myapp.com/api/v1/orders', method: 'GET', type: 'fetch', isFirstParty: true, status: 200 }
  ];
  const runtimeApis = [
    { url: 'https://myapp.com/graphql', method: 'POST', isGraphQL: true, operationName: 'GetInventory', status: 200 }
  ];
  const cataloged = ApiDetector.catalogApis(networkRequests, runtimeApis);
  assert(cataloged.length === 2, 'ApiDetector synthesizes both network and runtime intercepted APIs');
  assert(cataloged.some(a => a.apiType === 'GraphQL' && a.operationName === 'GetInventory'), 'Catalogs runtime GraphQL queries with operation name');
  assert(cataloged.some(a => a.path === '/api/v1/orders'), 'Catalogs standard REST endpoint');

  // Test 3: WebSocket connection profiling
  const rawSockets = [
    { url: 'wss://realtime.myapp.com/socket.io/?EIO=4&transport=websocket', status: 'OPEN' }
  ];
  const sockets = WebSocketAnalyzer.analyze(rawSockets);
  assert(sockets.length === 1, 'WebSocketAnalyzer profiles socket connection');
  assert(sockets[0].isSecure === true, 'Detects secure wss:// protocol');
  assert(sockets[0].subProtocol === 'Socket.io', 'Identifies Socket.io sub-protocol');
});

// -------------------------------------------------------------
// 8. Phase 3: Expanded ASN Registry & Optional DoH
// -------------------------------------------------------------
suite('Phase 3 Expanded ASN Registry & Optional DoH', () => {
  const hetzner = AsnAnalyzer.lookup('78.46.10.20');
  assert(hetzner.asn === 'AS24940' && hetzner.org.includes('Hetzner'), 'Resolves Hetzner ASN');

  const oracle = AsnAnalyzer.lookup('129.213.5.10');
  assert(oracle.asn === 'AS31898' && oracle.org.includes('Oracle'), 'Resolves Oracle Cloud ASN');

  const github = AsnAnalyzer.lookup('140.82.112.5');
  assert(github.asn === 'AS36459' && github.org.includes('GitHub'), 'Resolves GitHub ASN');

  // Verify non-blocking graceful return of resolveDoh on empty/offline
  assert(typeof AsnAnalyzer.resolveDoh === 'function', 'resolveDoh is defined as optional method');
});

// -------------------------------------------------------------
// 9. Universal Fingerprint Detection Across Vectors
// -------------------------------------------------------------
suite('Universal Fingerprint Detection Engine', () => {
  const session = {
    url: 'https://app.mysite.com/dashboard',
    runtime: {
      globals: [
        { name: 'React', evidenceKey: 'window.React', version: '18.2.0' },
        { name: 'Redux', evidenceKey: 'window.__REDUX_DEVTOOLS_EXTENSION__' }
      ],
      domMetrics: {
        frameworkMarkers: [
          { framework: 'Tailwind CSS', marker: 'Utility class signatures (flex, grid, p-*, text-*)' },
          { framework: 'React', marker: '[data-reactroot]' }
        ],
        scripts: ['https://cdn.example.com/assets/vendor.js'],
        stylesheets: ['https://cdn.example.com/assets/styles.css'],
        metaTags: { generator: 'WordPress 6.4' }
      },
      browserApis: [
        { api: 'webgl', detail: 'WebGL 2.0 context created' },
        { api: 'service-worker', detail: 'Active controller' }
      ],
      storage: {
        localStorageCount: 5,
        localStorageKeys: ['theme', 'authToken'],
        indexedDbDatabases: ['offline_store']
      }
    },
    security: {
      isHttps: true,
      headers: {
        'server': 'cloudflare',
        'cf-ray': '8f7a6b5c4d3e-SJC',
        'content-security-policy': "default-src 'self'"
      }
    },
    requests: [
      { url: 'https://app.mysite.com/api/graphql', category: 'API', type: 'fetch' },
      { url: 'https://www.google-analytics.com/analytics.js', category: 'SCRIPT', type: 'script' }
    ]
  };

  const detected = FingerprintEngine.detect(session);
  const byId = new Map(detected.map(d => [d.id, d]));

  // React via global and DOM
  assert(byId.has('react'), 'Detects React from globals & DOM markers');
  const react = byId.get('react');
  assert(react.status === 'OBSERVED', 'React status is OBSERVED');
  assert(react.confidence === 'HIGH', 'React confidence is HIGH');
  assert(react.score >= 80, 'React score >= 80%');

  // Tailwind CSS
  assert(byId.has('tailwindcss'), 'Detects Tailwind CSS from DOM class utility marker');

  // WebGL hardware acceleration
  assert(byId.has('webgl'), 'Detects WebGL from intercepted canvas context');

  // IndexedDB
  assert(byId.has('indexeddb'), 'Detects IndexedDB client storage');

  // GraphQL
  assert(byId.has('graphql'), 'Detects GraphQL from network request pattern');

  // Cloudflare CDN
  assert(byId.has('cloudflare'), 'Detects Cloudflare from cf-ray and server headers');

  // Google Analytics
  assert(byId.has('google-analytics'), 'Detects Google Analytics from script bundle URL');

  // HTTPS Security Protocol
  assert(byId.has('https'), 'Detects HTTPS transport protocol');
});

// -------------------------------------------------------------
// 10. Implied Technology & Role Attribution
// -------------------------------------------------------------
suite('Implied Technology & Role Attribution', () => {
  const nextSession = {
    url: 'https://nextjs-app.example.com',
    runtime: {
      globals: [{ name: 'Next.js', evidenceKey: 'window.__NEXT_DATA__' }],
      domMetrics: {
        frameworkMarkers: [{ framework: 'Next.js', marker: '#__next' }]
      }
    },
    security: {
      isHttps: true,
      headers: { 'x-powered-by': 'Next.js' }
    },
    requests: []
  };

  const detected = FingerprintEngine.detect(nextSession);
  const byId = new Map(detected.map(d => [d.id, d]));

  assert(byId.has('nextjs'), 'Next.js directly detected');
  assert(byId.get('nextjs').role === 'PRIMARY', 'Next.js assigned PRIMARY role');

  // React should be automatically inferred from Next.js parent relationship
  assert(byId.has('react'), 'React automatically inferred from Next.js parent');
  const impliedReact = byId.get('react');
  assert(impliedReact.status === 'INFERRED', 'Implied React has status INFERRED');
  assert(impliedReact.sources.includes('INFERRED_HEURISTIC'), 'Implied React contains INFERRED_HEURISTIC source');
});

// -------------------------------------------------------------
// 11. Subresource Headers & Cookie Evidence Synthesis
// -------------------------------------------------------------
suite('Subresource Headers & Cookie Evidence Synthesis', () => {
  // Scenario: Edge CDN masks main_frame server header, but backend returns Express X-Powered-By on API route
  const subresourceSession = {
    url: 'https://masked-origin.com',
    runtime: {
      globals: [],
      domMetrics: {}
    },
    security: {
      isHttps: true,
      headers: {
        'server': 'cloudflare',
        'cf-ray': '12345-IAD'
      }
    },
    requests: [
      {
        url: 'https://masked-origin.com/api/v1/users',
        type: 'fetch',
        category: 'API',
        responseHeaders: {
          'x-powered-by': 'Express',
          'content-type': 'application/json'
        }
      }
    ]
  };

  const cookies = [
    { name: 'connect.sid', value: 's%3Aabc123' },
    { name: 'csrftoken', value: 'xyz789' }
  ];

  const detected = FingerprintEngine.detect(subresourceSession, cookies);
  const byId = new Map(detected.map(d => [d.id, d]));

  assert(byId.has('express'), 'Express detected from subresource API route header');
  assert(byId.has('django'), 'Django detected from csrftoken cookie');
});

// -------------------------------------------------------------
// 12. Safety: No Fabricated Databases or Hidden Infrastructure
// -------------------------------------------------------------
suite('Safety: No Fabricated Databases or Hidden Architecture', () => {
  const genericSession = {
    url: 'https://simple-blog.com',
    runtime: {
      globals: [],
      domMetrics: {}
    },
    security: { isHttps: true, headers: {} },
    requests: []
  };

  const detected = FingerprintEngine.detect(genericSession);
  const byId = new Map(detected.map(d => [d.id, d]));

  // Databases must NEVER be inferred without observable browser evidence
  assert(!byId.has('postgresql'), 'PostgreSQL is NOT fabricated');
  assert(!byId.has('mysql'), 'MySQL is NOT fabricated');
  assert(!byId.has('mongodb'), 'MongoDB is NOT fabricated');
  assert(!byId.has('redis'), 'Redis is NOT fabricated');
  assert(!byId.has('docker'), 'Docker is NOT fabricated');
  assert(!byId.has('kubernetes'), 'Kubernetes is NOT fabricated');
});

// -------------------------------------------------------------
// 13. Evidence Duplicate Dampening
// -------------------------------------------------------------
suite('Evidence Duplicate Dampening', () => {
  const record = new EvidenceRecord('react', 'React', 'Frontend Framework');
  // Add 10 duplicate DOM marker signals
  for (let i = 0; i < 10; i++) {
    record.addSignal(EVIDENCE_TYPES.DOM_MARKER, '[data-reactroot]', 'matched', `Instance ${i}`);
  }

  // The 10 duplicate signals must NOT yield an unfair score; duplicate damping must constrain them
  assert(record.score < 100, `Score is dampened (${record.score}%), not 100%`);
  assert(record.signals.length === 10, 'All 10 signals recorded');
  assert(record.sources.length === 1, 'Only 1 unique source category');
});

// -------------------------------------------------------------
// 14. CMS & E-Commerce Telemetry Detection
// -------------------------------------------------------------
suite('CMS & E-Commerce Telemetry Detection', () => {
  const wpSession = {
    url: 'https://news.wpblog.org',
    runtime: {
      globals: [{ name: 'WordPress', evidenceKey: 'window.wp' }],
      domMetrics: {
        metaTags: { generator: 'WordPress 6.5.2' },
        scripts: ['https://news.wpblog.org/wp-content/themes/twentytwentyfour/assets/js/index.js']
      }
    },
    security: { isHttps: true, headers: {} },
    requests: []
  };

  const detectedWp = FingerprintEngine.detect(wpSession);
  const wpById = new Map(detectedWp.map(d => [d.id, d]));
  assert(wpById.has('wordpress'), 'Detects WordPress from global, meta generator, and script path');
  assert(wpById.get('wordpress').role === 'PRIMARY', 'WordPress assigned PRIMARY role');

  const shopifySession = {
    url: 'https://store.brand.com/products/jacket',
    runtime: {
      globals: [{ name: 'Shopify', evidenceKey: 'window.Shopify' }],
      domMetrics: {
        frameworkMarkers: [{ framework: 'Shopify', marker: 'Shopify asset/marker' }]
      }
    },
    security: { isHttps: true, headers: {} },
    requests: [
      { url: 'https://cdn.shopify.com/s/files/1/bundle.js', category: 'SCRIPT', type: 'script' }
    ]
  };

  const detectedShopify = FingerprintEngine.detect(shopifySession);
  const shopifyById = new Map(detectedShopify.map(d => [d.id, d]));
  assert(shopifyById.has('shopify'), 'Detects Shopify from globals, DOM, and CDN script');
  assert(shopifyById.get('shopify').role === 'PRIMARY', 'Shopify assigned PRIMARY role');
});

// -------------------------------------------------------------
// 15. Complex Multi-Tech Stack Co-existence
// -------------------------------------------------------------
suite('Complex Multi-Tech Stack Co-existence', () => {
  const fullStackSession = {
    url: 'https://portal.enterprise.io/app',
    runtime: {
      globals: [
        { name: 'React', evidenceKey: 'window.React', version: '18.3.1' },
        { name: 'Redux', evidenceKey: 'window.__REDUX_DEVTOOLS_EXTENSION__' },
        { name: 'Axios', evidenceKey: 'window.axios' },
        { name: 'Three.js', evidenceKey: 'window.THREE' }
      ],
      domMetrics: {
        frameworkMarkers: [
          { framework: 'Tailwind CSS', marker: 'Utility class signatures (flex, grid, p-*, text-*)' },
          { framework: 'Material UI (MUI)', marker: 'MUI component class signatures' }
        ],
        manifest: 'https://portal.enterprise.io/manifest.json'
      },
      browserApis: [
        { api: 'webgl', detail: 'WebGL 2.0' },
        { api: 'service-worker', detail: 'Service worker active' }
      ],
      storage: {
        localStorageCount: 12,
        localStorageKeys: ['user_pref', 'session_cache'],
        indexedDbDatabases: ['enterprise_db']
      },
      websockets: [
        { url: 'wss://portal.enterprise.io/live', status: 'OPEN' }
      ]
    },
    security: {
      isHttps: true,
      headers: {
        'server': 'cloudflare',
        'cf-ray': '9922aa11-ORD',
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'content-security-policy': "default-src 'self'",
        'x-frame-options': 'DENY'
      }
    },
    requests: [
      {
        url: 'https://portal.enterprise.io/api/v2/data',
        category: 'API',
        type: 'fetch',
        responseHeaders: { 'x-powered-by': 'Fastify' }
      },
      {
        url: 'https://www.googletagmanager.com/gtag/js?id=G-12345',
        category: 'ANALYTICS',
        type: 'script'
      }
    ]
  };

  const detected = FingerprintEngine.detect(fullStackSession);
  const byId = new Map(detected.map(d => [d.id, d]));

  // Verify multi-tier detection across all categories
  assert(byId.has('react'), 'React frontend detected');
  assert(byId.has('redux'), 'Redux state management detected');
  assert(byId.has('axios'), 'Axios HTTP client detected');
  assert(byId.has('threejs'), 'Three.js 3D library detected');
  assert(byId.has('tailwindcss'), 'Tailwind CSS detected');
  assert(byId.has('mui'), 'Material UI detected');
  assert(byId.has('fastify'), 'Fastify backend detected from API subresource header');
  assert(byId.has('cloudflare'), 'Cloudflare CDN detected');
  assert(byId.has('google-analytics'), 'Google Analytics detected');
  assert(byId.has('webgl'), 'WebGL detected');
  assert(byId.has('websocket'), 'WebSocket API detected');
  assert(byId.has('indexeddb'), 'IndexedDB detected');
  assert(byId.has('localstorage'), 'localStorage detected');
  assert(byId.has('hsts'), 'HSTS security header detected');
  assert(byId.has('csp'), 'CSP security header detected');
  assert(byId.has('x-frame-options'), 'X-Frame-Options security header detected');

  // Verify that results are properly sorted with Primary first
  assert(detected[0].role === 'PRIMARY', 'Top sorted technology is a PRIMARY framework');
});

// -------------------------------------------------------------
// 16. Security Analyzer & Evidence-Driven Posture Scoring
// -------------------------------------------------------------
suite('Security Analyzer & Evidence-Driven Posture Scoring', () => {
  // 1. Fully protected HTTPS site
  const secureSession = {
    url: 'https://security-first.org/',
    primaryDomain: 'security-first.org',
    primaryApex: 'security-first.org',
    security: {
      isHttps: true,
      headers: {
        'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
        'content-security-policy': "default-src 'self'; frame-ancestors 'self'",
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin'
      }
    },
    requests: [
      { url: 'https://security-first.org/app.js', type: 'script', category: 'SCRIPT' }
    ]
  };

  const secureRes = SecurityAnalyzer.analyze(secureSession, []);
  assert(secureRes.assessmentState === 'ASSESSED', 'HTTPS site is fully ASSESSED');
  assert(secureRes.grade === 'A', 'Well-configured HTTPS site earns Grade A');
  assert(secureRes.score >= 90, 'Score is >= 90 (no spurious deductions)');
  assert(secureRes.summary.transportScore === 25, 'Full transport score of 25/25');
  assert(secureRes.summary.mixedContentScore === 15, 'Zero mixed content deductions (15/15)');

  // 2. CRITICAL REGRESSION TEST: HTTPS site with a single passive HTTP image must NEVER receive Grade F / 10!
  const passiveMixedContentSession = {
    url: 'https://ecommerce-store.com/product/123',
    primaryDomain: 'ecommerce-store.com',
    primaryApex: 'ecommerce-store.com',
    security: {
      isHttps: true,
      headers: {
        'strict-transport-security': 'max-age=15552000; includeSubDomains',
        'content-security-policy': "default-src 'self' https:; img-src * http: https: data:; frame-ancestors 'none'",
        'x-content-type-options': 'nosniff'
      }
    },
    requests: [
      { url: 'https://ecommerce-store.com/bundle.js', type: 'script', category: 'SCRIPT' },
      { url: 'http://cdn.partner-images.com/banner.jpg', type: 'image', category: 'IMAGE' }
    ]
  };

  const passiveRes = SecurityAnalyzer.analyze(passiveMixedContentSession, []);
  assert(passiveRes.grade !== 'F', 'REGRESSION FIXED: HTTPS site with passive HTTP image is NOT Grade F');
  assert(passiveRes.score >= 80, 'Score remains solid (>= 80) despite passive HTTP image');
  assert(passiveRes.summary.transportScore === 25, 'Transport is 25/25 because main document is HTTPS');
  assert(passiveRes.summary.mixedContentScore === 13, 'Passive mixed content deducts only 2 pts (13/15)');
  
  const passiveFinding = passiveRes.findings.find(f => f.category === 'MIXED_CONTENT' || f.category === 'mixed-content');
  assert(passiveFinding && passiveFinding.severity === 'LOW', 'Passive mixed content is classified with LOW severity');
  assert(passiveFinding.resourceScope === 'SUBRESOURCE', 'Resource scope is SUBRESOURCE');
  assert(passiveFinding.partyScope === 'THIRD_PARTY', 'Party scope is correctly tagged THIRD_PARTY');

  // 3. Active mixed content test
  const activeMixedContentSession = {
    url: 'https://insecure-subresource.com/',
    primaryDomain: 'insecure-subresource.com',
    primaryApex: 'insecure-subresource.com',
    security: {
      isHttps: true,
      headers: {
        'strict-transport-security': 'max-age=31536000'
      }
    },
    requests: [
      { url: 'http://compromised-cdn.net/library.js', type: 'script', category: 'SCRIPT' }
    ]
  };

  const activeRes = SecurityAnalyzer.analyze(activeMixedContentSession, []);
  const activeFinding = activeRes.findings.find(f => f.category === 'MIXED_CONTENT' || f.category === 'mixed-content');
  assert(activeFinding && activeFinding.severity === 'HIGH', 'Active mixed content (script) is flagged with HIGH severity');
  assert(activeFinding.scoreDeduction === 8, 'Active mixed content incurs an 8 pt penalty');

  // 4. Clickjacking: modern CSP frame-ancestors fulfills defense without X-Frame-Options
  const cspClickjackingSession = {
    url: 'https://modern-app.io/',
    primaryDomain: 'modern-app.io',
    primaryApex: 'modern-app.io',
    security: {
      isHttps: true,
      headers: {
        'content-security-policy': "frame-ancestors 'none'"
        // No x-frame-options!
      }
    },
    requests: []
  };

  const clickjackingAnalysis = HeaderAnalyzer.analyze(cspClickjackingSession.security.headers, true);
  assert(clickjackingAnalysis.clickjacking.protected === true, 'CSP frame-ancestors provides clickjacking protection');
  assert(clickjackingAnalysis.clickjacking.mechanism.includes('CSP frame-ancestors'), 'Correctly identifies mechanism as CSP frame-ancestors');
  
  const cspCjRes = SecurityAnalyzer.analyze(cspClickjackingSession, []);
  const xfoFinding = cspCjRes.findings.find(f => f.id === 'MISSING_CLICKJACKING_DEFENSE');
  assert(!xfoFinding, 'No false Missing X-Frame-Options finding when CSP frame-ancestors is present');

  // 5. Unobserved headers (tab opened before extension)
  const unobservedHeadersSession = {
    url: 'https://pre-existing-tab.com/dashboard',
    primaryDomain: 'pre-existing-tab.com',
    primaryApex: 'pre-existing-tab.com',
    security: {
      isHttps: true,
      headers: {} // Empty because tab opened before listener was bound
    },
    requests: []
  };

  const partialRes = SecurityAnalyzer.analyze(unobservedHeadersSession, []);
  assert(partialRes.assessmentState === 'PARTIALLY_ASSESSED', 'Correctly marked as PARTIALLY_ASSESSED');
  assert(partialRes.grade !== 'F', 'Unobserved headers tab is NOT penalized to Grade F');
  assert(partialRes.summary.headerScore === 30, 'Unobserved headers are not falsely deducted (30/30 preserved)');

  // 6. Plaintext HTTP main document
  const plaintextSession = {
    url: 'http://legacy-plaintext-web.org/',
    primaryDomain: 'legacy-plaintext-web.org',
    primaryApex: 'legacy-plaintext-web.org',
    security: {
      isHttps: false,
      headers: {}
    },
    requests: []
  };

  const plaintextRes = SecurityAnalyzer.analyze(plaintextSession, []);
  assert(plaintextRes.summary.transportScore === 0, 'Plaintext HTTP main document receives 0/25 transport score');
  const criticalPlaintext = plaintextRes.findings.find(f => f.id === 'PLAINTEXT_HTTP');
  assert(criticalPlaintext && criticalPlaintext.severity === 'CRITICAL', 'Flags CRITICAL Plaintext Unencrypted HTTP Connection');
  assert(criticalPlaintext.resourceScope === 'MAIN_DOCUMENT', 'Flags main document as plaintext');
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log(`\n========================================`);
console.log(`Test Execution Finished: \x1b[32m${passed} Passed\x1b[0m, \x1b[31m${failed} Failed\x1b[0m`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
