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
