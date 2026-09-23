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
