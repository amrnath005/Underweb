# UNDERWEB — System Architecture & Design Specification

---

## 1. Architectural Overview

Underweb is architected as a modular, event-driven, multi-tier inspection system designed specifically for the Chrome Extension Manifest V3 runtime environment.

```
+----------------------------------------------------------------------------------------------------+
|                                         TARGET WEBPAGE                                             |
|  +-----------------------------------+               +------------------------------------------+  |
|  |       MAIN World Injector         |               |           Isolated Content Script        |  |
|  |  - window.* Globals Inspection    |  CustomEvent  |  - DOM Traversal & MutationObserver      |  |
|  |  - fetch/XHR Monkey-Patching      | ------------> |  - CSS Class & Selector Scanning         |  |
|  |  - WebSocket Hooking              |  postMessage  |  - PerformanceObserver (LCP, CLS, NT)    |  |
|  |  - Navigator Permission Probing   |               |  - LocalStorage / IndexedDB Probing      |  |
|  +-----------------------------------+               +------------------------------------------+  |
+-------------------------------------------------------------|--------------------------------------+
                                                              | chrome.runtime.sendMessage
                                                              v
+----------------------------------------------------------------------------------------------------+
|                                    BACKGROUND SERVICE WORKER                                       |
|                                                                                                    |
|   +-----------------------+     +------------------------+     +-------------------------------+   |
|   | chrome.webRequest     |     | Session & Tab Manager  |     | chrome.debugger (CDP Engine)  |   |
|   | - Remote IPs & Ports  |     | - Tab State Lifecycle  |     | - TLS Cipher & Cert Details   |   |
|   | - Headers (CSP, HSTS) | --> | - Ring Buffer Storage  | <-- | - WebSocket Frame Capture     |   |
|   | - Timing & Sizes      |     | - Session Snapshotting |     | - Precise DevTools Timelines  |   |
|   +-----------------------+     +------------------------+     +-------------------------------+   |
|                                             |                                                      |
|                   +-------------------------+-------------------------+                            |
|                   v                                                   v                            |
|   +-------------------------------+                   +-------------------------------+            |
|   | Core Detection & Graph Engine |                   | Local Storage & Cache         |            |
|   | - Multi-signal Fingerprinting |                   | - IndexedDB Session History   |            |
|   | - Evidence Aggregation Engine |                   | - Signatures & Knowledge Base |            |
|   | - Directed Graph Builder      |                   | - chrome.storage.local Config |            |
|   +-------------------------------+                   +-------------------------------+            |
+----------------------------------------------------------------------------------------------------+
                                      |                     |
                  chrome.runtime.port |                     | BroadcastChannel / State Sync
                                      v                     v
+----------------------------------------------------------------------------------------------------+
|                                        PRESENTATION LAYER                                          |
|                                                                                                    |
|   +------------------------------------+             +-----------------------------------------+   |
|   | Quick Popup UI (popup.html)        |             | Full Dashboard (dashboard.html)         |   |
|   | - Instant Website DNA              |             | - Architecture Graph (Interactive SVG)  |   |
|   | - Stack Badges & Vital Stats       |             | - Live Network Waterfall & Filter       |   |
|   | - Security & Privacy Scores        |             | - API Explorer & WebSocket Inspector    |   |
|   | - 1-Click Launch Full Dashboard    |             | - Deep "What Happens When I Click" Mode |   |
|   +------------------------------------+             | - Student Learning Guide & Tech Wiki    |   |
|                                                      | - Side-by-Side Website Comparison Engine|   |
|                                                      | - Multi-Format Export (JSON, MD, CSV)   |   |
|                                                      +-----------------------------------------+   |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Directory & Module Decomposition

```
Underweb/
├── manifest.json
├── README.md
├── PROJECT_SPEC.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── CHANGELOG.md
│
├── src/
│   ├── background/
│   │   ├── service-worker.js         # Central background coordinator, MV3 lifecycle handler
│   │   ├── message-router.js         # Type-safe dispatching between popup, content, dashboard
│   │   └── session-manager.js        # Tab session state, ring buffer management, history cache
│   │
│   ├── content/
│   │   ├── content.js                # Isolated world content script initializer
│   │   ├── dom-analyzer.js           # Structural DOM signals, meta tags, framework attributes
│   │   ├── page-analyzer.js          # Injected MAIN world runtime explorer (window globals, prototypes)
│   │   ├── script-analyzer.js        # Script tags, inline bundles, module patterns, source maps
│   │   ├── resource-analyzer.js      # PerformanceResourceTiming, prefetch, preload, worker analysis
│   │   └── runtime-monitor.js        # User interaction listener (Click-to-Request correlation)
│   │
│   ├── network/
│   │   ├── request-analyzer.js       # Request lifecycle tracker, size, duration, status
│   │   ├── response-analyzer.js      # Response header extractor (caching, security, compression)
│   │   ├── domain-analyzer.js        # eTLD+1 parser, subdomain splitter, first vs third party
│   │   ├── resource-classifier.js    # Rule-based resource categorizer (Document, API, CDN, Ad, etc.)
│   │   ├── request-timeline.js       # Waterfall calculator, navigation timing alignment
│   │   ├── api-detector.js           # REST, GraphQL, SSE, RPC pattern recognition
│   │   ├── websocket-analyzer.js     # WebSocket connection tracker, frame payload analyzer
│   │   └── network-graph.js          # Domain-to-domain and page-to-endpoint network topologies
│   │
│   ├── detection/
│   │   ├── technology-detector.js    # Master orchestrator combining all sub-detectors
│   │   ├── framework-detector.js     # React, Vue, Angular, Svelte, Next, Nuxt, Remix, Astro
│   │   ├── library-detector.js       # jQuery, Axios, Lodash, Three.js, GSAP, D3, Chart.js, etc.
│   │   ├── cms-detector.js           # WordPress, Drupal, Shopify, Wix, Webflow, Ghost
│   │   ├── build-tool-detector.js    # Vite, Webpack, Turbopack, Rollup, Parcel, esbuild
│   │   ├── analytics-detector.js     # GA4, GTM, Meta Pixel, Mixpanel, Segment, Hotjar, Clarity
│   │   ├── payment-detector.js       # Stripe, PayPal, Razorpay, Adyen, Square
│   │   ├── cloud-detector.js         # AWS, GCP, Azure, Cloudflare, Vercel, Netlify, Fastly
│   │   └── fingerprint-engine.js     # Multi-factor signature matcher with evidence scoring
│   │
│   ├── infrastructure/
│   │   ├── dns-analyzer.js           # DNS record inference, CNAME tracking, DNS-over-HTTPS
│   │   ├── ip-analyzer.js            # IPv4 / IPv6 parsing, local CIDR table matching
│   │   ├── asn-analyzer.js           # Autonomous System Number & Organization classification
│   │   ├── cdn-detector.js           # Edge network fingerprinting (Cloudflare, Akamai, Fastly, etc.)
│   │   ├── hosting-detector.js       # Origin cloud host detection (AWS, Vercel, Netlify, GCP)
│   │   ├── tls-analyzer.js           # Protocol version (TLS 1.2/1.3), ALPN, cipher suites
│   │   ├── http-analyzer.js          # HTTP/1.1, HTTP/2, HTTP/3 (QUIC) protocol classification
│   │   └── infrastructure-graph.js   # Client -> DNS -> Edge/CDN -> Origin topology mapping
│   │
│   ├── privacy/
│   │   ├── privacy-analyzer.js       # Aggregate privacy posture, fingerprinting surface
│   │   ├── cookie-analyzer.js        # First/Third party cookie auditor, lifespan, security flags
│   │   ├── storage-analyzer.js       # LocalStorage, SessionStorage, IndexedDB, Cache storage
│   │   ├── browser-api-analyzer.js   # Sensor, Geolocation, Camera, Mic, Clipboard surveillance
│   │   ├── tracker-detector.js       # Known advertising, telemetry, tracker signature matching
│   │   └── data-access-analyzer.js   # Audit of what the site accesses in browser sandbox
│   │
│   ├── security/
│   │   ├── security-analyzer.js      # Overall security score and vulnerability heuristics
│   │   ├── header-analyzer.js        # CSP, HSTS, X-Frame-Options, Referrer-Policy, COOP/COEP
│   │   ├── cors-analyzer.js          # CORS configuration auditor (Access-Control-*, wildcards)
│   │   ├── cookie-security.js        # HttpOnly, Secure, SameSite compliance validator
│   │   ├── mixed-content.js          # Insecure HTTP asset detection on HTTPS origins
│   │   └── security-signals.js       # Heuristics for Subresource Integrity, credentialed calls
│   │
│   ├── architecture/
│   │   ├── graph.js                  # Generic Directed Graph data structure (Adjacency List)
│   │   ├── graph-builder.js          # Converts session telemetry into interconnected nodes & edges
│   │   ├── graph-analyzer.js         # Computes architectural metrics, node degrees, densities
│   │   ├── dependency-analyzer.js    # Determines direct vs transitive runtime dependencies
│   │   ├── centrality.js             # Degree centrality, Betweenness centrality, PageRank
│   │   ├── clustering.js             # Graph community detection, service grouping
│   │   ├── traversal.js              # BFS, DFS, shortest path discovery
│   │   └── inference-engine.js       # Infers architectural archetype (SPA, SSR, Jamstack, Headless)
│   │
│   ├── algorithms/
│   │   ├── bfs.js                    # Breadth-First Search implementation
│   │   ├── dfs.js                    # Depth-First Search implementation
│   │   ├── shortest-path.js          # Dijkstra & Unweighted Shortest Path algorithms
│   │   ├── connected-components.js   # Connected component & SCC detection
│   │   ├── centrality.js             # Algorithmic centrality engines
│   │   ├── clustering.js             # Label propagation / modularity clustering
│   │   └── dependency-depth.js       # Calculates max and average dependency call depths
│   │
│   ├── evidence/
│   │   ├── evidence-engine.js        # Structured confidence scoring & proof accumulation
│   │   ├── confidence.js             # HIGH, MEDIUM, LOW confidence calculators
│   │   ├── evidence-types.js         # DOM, SCRIPT, HEADER, GLOBAL, NETWORK, INFERRED types
│   │   └── explanations.js           # Student-friendly explanation text generator
│   │
│   ├── storage/
│   │   ├── storage-manager.js        # High-level persistence coordinator
│   │   ├── indexeddb.js              # Local IndexedDB database for complete site profiles
│   │   └── history.js                # Search, delete, bookmark, and export site history
│   │
│   ├── ui/
│   │   ├── popup/                    # Compact popup UI
│   │   │   ├── popup.html
│   │   │   ├── popup.js
│   │   │   └── popup.css
│   │   ├── dashboard/                # Main comprehensive dashboard
│   │   │   ├── dashboard.html
│   │   │   ├── dashboard.js
│   │   │   └── dashboard.css
│   │   ├── components/               # Modular UI widgets
│   │   │   ├── badge.js
│   │   │   ├── card.js
│   │   │   ├── modal.js
│   │   │   ├── table.js
│   │   │   └── dna-chart.js          # Radar / Multi-axis Website DNA visualization
│   │   ├── graph/                    # Force-directed interactive graph visualizer
│   │   │   ├── graph-renderer.js     # HTML5 Canvas / SVG interactive renderer
│   │   │   ├── graph-layout.js       # Force simulation layout engine (velocity, charge, spring)
│   │   │   └── graph-controls.js     # Pan, zoom, drag, filter, selection inspector
│   │   ├── timeline/                 # Waterfall & click investigation timeline
│   │   │   ├── timeline-renderer.js
│   │   │   └── click-recorder.js
│   │   └── styles/
│   │       ├── theme.css             # Developer-tool dark theme palette
│   │       ├── typography.css        # Monospace & Sans typography system
│   │       └── layout.css            # Grid & Flex layout primitives
│   │
│   └── utils/
│       ├── url-utils.js              # URL sanitization, normalization, protocol stripping
│       ├── domain-utils.js           # TLD extraction, PSL matching, domain categorization
│       ├── time-utils.js             # High-precision formatting, durations, relative timestamps
│       ├── parsers.js                # Header parsers, CSP rule tree parser, cookie tokenizer
│       └── logger.js                 # Scoped console logger with debug switches
│
├── data/
│   ├── technologies.js               # Signatures for 200+ frameworks, libraries, and tools
│   ├── frameworks.js                 # Specialized frontend & meta-framework signatures
│   ├── libraries.js                  # JS utility, UI, 3D, charting library signatures
│   ├── trackers.js                   # Tracker, analytics, and advertising domain patterns
│   ├── cdns.js                       # CDN header, IP range, and CNAME signatures
│   ├── hosting.js                    # Cloud and hosting provider patterns
│   ├── signatures.js                 # Compiled signature registry
│   └── providers.js                  # Educational wiki data: WHAT, WHY, HOW, EVIDENCE
│
├── tests/
│   ├── test-runner.js                # Zero-dependency local unit test suite
│   ├── domain-analyzer.test.js
│   ├── technology-detector.test.js
│   ├── graph-algorithms.test.js
│   └── security-analyzer.test.js
│
└── assets/
    ├── icons/                        # Extension icons (16, 32, 48, 128)
    └── branding/                     # Logo, diagrams
```

---

## 3. Core Data Structures & Graph Representation

### 3.1 Directed Graph Adjacency Model
The architecture graph is represented as a directed graph $G = (V, E)$ where vertices $V$ represent architectural entities and edges $E$ represent directional relationships.

```javascript
class DirectedGraph {
  constructor() {
    this.nodes = new Map(); // id -> Node { id, label, type, category, metadata }
    this.adjacency = new Map(); // id -> Set<Edge { targetId, relation, weight, evidence }>
    this.reverseAdjacency = new Map(); // id -> Set<Edge { sourceId, relation, weight }>
  }
}
```

#### Node Types:
- `WEBSITE`: The root inspected site (e.g. `example.com`)
- `PAGE`: Specific HTML documents loaded
- `SCRIPT`: Executable JavaScript files and chunks
- `STYLE`: Stylesheets and font definitions
- `API`: REST, GraphQL, WebSocket endpoints
- `DOMAIN`: First-party and third-party hostnames
- `CDN`: Content Delivery Network edge nodes
- `HOST`: Cloud/origin hosting servers
- `ASN`: Autonomous System routing nodes
- `ANALYTICS`: Telemetry and user tracking nodes
- `TRACKER`: Advertising and tracking entities
- `FRAMEWORK`: Detected runtime framework (e.g. React, Next.js)
- `LIBRARY`: Detected utility library (e.g. Lodash, Three.js)

#### Edge Types:
- `LOADS`: Website loads resource ($A \to B$)
- `CALLS`: Script calls API endpoint ($A \to B$)
- `CONNECTS_TO`: Browser connects to domain ($A \to B$)
- `HOSTED_BY`: Domain is hosted by Cloud/Server ($A \to B$)
- `DELIVERED_BY`: Resource is delivered by CDN ($A \to B$)
- `DEPENDS_ON`: Component depends on Library ($A \to B$)
- `EMBEDS`: Page embeds iframe or external asset ($A \to B$)
- `TRACKS`: Tracker monitors user interaction ($A \to B$)
- `USES`: Website utilizes Framework/Technology ($A \to B$)

---

## 4. Graph Algorithms & Analysis Pipeline

1. **Breadth-First Search (BFS) & Depth-First Search (DFS)**:
   - Traversal to discover dependency trees, reachability, and orphan resource nodes.
2. **Shortest Path (Dijkstra / Unweighted BFS)**:
   - Computes minimum hops from User Browser $\to$ Origin Server or 3rd-Party Tracker to explain data flow.
3. **Degree & Centrality Metrics**:
   - **In-Degree**: Most depended-upon core resources (e.g. core bundle, shared API gateway).
   - **Out-Degree**: Components initiating highest external calls (e.g. analytics manager).
   - **Betweenness Centrality**: Bridges that connect disparate clusters (e.g. CDN edge or tag manager).
4. **Connected Components**:
   - Identifies isolated subgraphs and unlinked external beacons.
5. **Dependency Depth Analysis**:
   - Calculates longest critical dependency chain before initial interactive state.

---

## 5. Evidence Engine & Confidence Model

Every single detection in Underweb is paired with formal evidence:

```typescript
interface EvidenceRecord {
  technologyId: string;
  category: "FRAMEWORK" | "CMS" | "CDN" | "API" | "SECURITY" | "TRACKER";
  status: "OBSERVED" | "INFERRED" | "UNKNOWN";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  score: number; // 0.0 to 1.0
  signals: Array<{
    type: "DOM_MARKER" | "WINDOW_GLOBAL" | "HEADER" | "URL_PATTERN" | "COOKIE" | "CSS_RULE" | "NETWORK_BEHAVIOR";
    key: string;
    value: string;
    description: string;
  }>;
  explanation: string;
}
```

- **HIGH Confidence ($> 0.85$)**: Observed via direct runtime globals (`window.__NEXT_DATA__`) or definitive headers (`x-powered-by: Next.js`).
- **MEDIUM Confidence ($0.50 - 0.85$)**: Inferred through correlated secondary signals (e.g. Tailwind CSS utility classes in DOM + Vite chunk naming conventions).
- **LOW Confidence ($< 0.50$)**: Generic heuristics requiring further confirmation.

---

## 6. Student Learning Mode: Conceptual Model

Underweb functions as a live computer science textbook. Every card and finding is annotated with:
- **WHAT**: Concrete technical definition.
- **WHY**: Architectural reason for its existence.
- **HOW**: Protocol-level mechanism (e.g. how HTTP/2 multiplexing works over a single TCP stream).
- **EVIDENCE**: Exact browser signals that verified its presence.
- **REAL-WORLD CONTEXT**: Industry trade-offs and alternatives.

---

## 7. Interactive Click Investigation ("What Happens When I Click?")

```
[User Clicks Button]
       |
       v
1. Content Script Captures DOM Event:
   - Target element: <button class="checkout-btn">
   - Timestamp: T_0
       |
       v
2. MutationObserver captures DOM subtree changes:
   - Spinner added at T_0 + 12ms
       |
       v
3. MAIN World Interceptor records Fetch/XHR:
   - POST /api/v1/checkout (payload size, headers) at T_0 + 35ms
       |
       v
4. Background webRequest records network response:
   - 200 OK (duration 140ms, TLS 1.3, remote IP: 104.18.2.1) at T_0 + 175ms
       |
       v
5. Storage & Analytics Tracker logs:
   - localStorage updated with 'cart_token'
   - Tracking beacon sent to analytics.google.com
       |
       v
6. Underweb compiles interactive timeline sequence:
   [CLICK] -> [DOM SPINNER] -> [API CALL] -> [HTTP 200] -> [DOM UPDATE] -> [ANALYTICS BEACON]
```
