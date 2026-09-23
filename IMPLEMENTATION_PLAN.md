# UNDERWEB — Master Implementation Plan

This implementation plan outlines the progressive, phased development of the **Underweb** Chrome Extension (Manifest V3).

---

## Technical Feasibility & Boundary Analysis

### 1. What Can Be Directly Observed
- **HTTP/S Network Traffic & Headers**: Full request/response lifecycle via non-blocking `chrome.webRequest` (`onBeforeRequest`, `onSendHeaders`, `onHeadersReceived`, `onCompleted`).
- **Remote Server IP & Protocol**: Real remote IP socket returned via `details.ip`; HTTP protocol (`h2`, `h3`, `http/1.1`) via `PerformanceNavigationTiming.nextHopProtocol`.
- **Runtime Globals & Window Object**: Injected page-world (`world: "MAIN"`) analyzer accesses `window.React`, `window.__NEXT_DATA__`, `window.Vue`, `window.webpackChunk`, etc.
- **DOM & CSS Class Fingerprints**: Traversal of `<meta>`, `<script>`, `<link>`, and DOM elements, matching Tailwind utility patterns, CSS-in-JS classes, and framework hooks.
- **Cookies & Client Storage**: `chrome.cookies.getAll`, `localStorage`, `sessionStorage`, `indexedDB.databases()`, and `caches.keys()`.
- **Browser API Usage**: Monkey-patched `navigator` probes to detect calls to Geolocation, Clipboard, MediaDevices, and Notifications.
- **Click-to-Request Sequences**: Correlated event stream linking click events $\to$ DOM mutations $\to$ XHR/Fetch dispatches $\to$ HTTP responses.

### 2. What Can Be Inferred (with Evidence & Confidence)
- **Infrastructure Origin vs. CDN Edge**: Header signals (`CF-Ray`, `X-Amz-Cf-Id`, `X-Vercel-Id`, `Fastly-Debug-Digest`) + local CIDR/ASN mapping identify CDN edge; origin hosting is inferred from backend headers (`Server`, `X-Served-By`, `X-Backend`) or DNS CNAMEs.
- **Architectural Paradigm**: SPA vs. SSR vs. SSG vs. Jamstack vs. Headless CMS inferred from initial HTML structure, presence of hydration bundles (`__NEXT_DATA__`, `_nuxt`), and client-side routing events.
- **Build Tools & Bundlers**: Inferred from bundle chunk formats (Vite `@vite/client`, Webpack runtime markers, Turbopack chunks).
- **Backend API Type**: Inferred from URL patterns (`/api/v1/`, `/graphql`), headers (`Content-Type: application/graphql-response+json`), and payload structure.

### 3. What Needs Special Chrome APIs or Deep Debugging
- **WebSocket Frame Streaming**: Handshake is observed passively via `webRequest`. Deep frame-level text/binary inspection is performed via `MAIN` world WebSocket wrapping or optional `chrome.debugger` (CDP `Network.webSocketFrameReceived`).
- **TLS Certificate & Cipher Suite Details**: General HTTPS presence is passive; detailed TLS cipher suite (`TLS_AES_128_GCM_SHA256`) and issuer chains use optional `chrome.debugger` CDP `Security` domain.

---

## Phased Development Roadmap

### Phase 0: Workspace & Feasibility Setup [DONE]
- Initialize Git repository.
- Verify Chromium MV3 capabilities & boundaries.
- Generate `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `README.md`, and `IMPLEMENTATION_PLAN.md`.

### Phase 1: Core Extension Scaffold & Messaging Architecture
- Implement `manifest.json` (MV3, permissions, content scripts, background worker, popup, web accessible resources).
- Build `src/background/service-worker.js` with lifecycle management and port-based event streaming.
- Build `src/background/session-manager.js` with per-tab ring-buffers for network telemetry.
- Build `src/background/message-router.js` for type-safe inter-process communication.
- Build `src/content/content.js` and `src/content/page-analyzer.js` (isolated and MAIN world scripts).
- Build lightweight, high-performance popup UI (`src/ui/popup/`) and full dashboard scaffold (`src/ui/dashboard/`).
- Verify extension loads cleanly in Chrome.

### Phase 2: Network Intelligence & Resource Classifier
- Implement `src/network/request-analyzer.js` and `src/network/response-analyzer.js`.
- Build `src/network/domain-analyzer.js` with full eTLD+1 parsing (public suffix list logic) to distinguish First-Party from Third-Party domains.
- Build `src/network/resource-classifier.js` categorizing resources into Document, Script, Stylesheet, Image, Font, XHR, Fetch, Media, WebSocket, API, Tracker, Analytics, Ad, CDN, Payment.
- Build `src/network/request-timeline.js` for waterfall calculations.
- Build Live Network Stream with pause, resume, filter, and search.

### Phase 3: Comprehensive Technology Detection Engine
- Build `src/detection/fingerprint-engine.js` with multi-signal evaluation (DOM, Globals, Headers, Script patterns, Meta tags, CSS classes).
- Populate signature database in `data/technologies.js`, `data/frameworks.js`, `data/libraries.js`, `data/cms.js`, `data/build-tools.js`.
- Implement specialized detectors:
  - Frontend & Meta-Frameworks (React, Next.js, Vue, Nuxt, Remix, Astro, Svelte, Angular, Preact).
  - CSS Engines (Tailwind CSS, Bootstrap, MUI, Styled Components, Emotion).
  - JavaScript Libraries (jQuery, Axios, Lodash, Three.js, GSAP, D3, Chart.js, etc.).
  - Build Tools (Vite, Webpack, Turbopack, Rollup, Parcel, esbuild).
  - CMS (WordPress, Shopify, Webflow, Wix, Drupal, Ghost).
  - Analytics & Trackers (GA4, GTM, Meta Pixel, Mixpanel, Hotjar, Segment, Clarity).
  - Payments (Stripe, PayPal, Razorpay, Adyen).
  - Cloud Platforms (Cloudflare, AWS, Vercel, Netlify, Fastly, GCP, Azure).
- Connect detections to the Evidence Engine (`src/evidence/evidence-engine.js`) with confidence scoring (`HIGH`, `MEDIUM`, `LOW`).

### Phase 4: Infrastructure & Cloud Topology Engine
- Implement `src/infrastructure/ip-analyzer.js` with IPv4/IPv6 classification and local ASN/CIDR lookup table.
- Implement `src/infrastructure/asn-analyzer.js` identifying Autonomous System Numbers and ISPs.
- Implement `src/infrastructure/cdn-detector.js` matching headers (`CF-Ray`, `x-amz-cf-id`, etc.) and edge networks.
- Implement `src/infrastructure/hosting-detector.js` identifying origin cloud providers.
- Implement `src/infrastructure/http-analyzer.js` (HTTP/1.1 vs HTTP/2 vs HTTP/3).
- Implement `src/infrastructure/infrastructure-graph.js` modeling `Browser → DNS → IP/ASN → CDN → Origin Host`.

### Phase 5: Privacy & Client Storage Auditor
- Implement `src/privacy/cookie-analyzer.js` parsing all cookies for the target site with `HttpOnly`, `Secure`, `SameSite` flags and tracking lifespans.
- Implement `src/privacy/storage-analyzer.js` measuring LocalStorage, SessionStorage, and IndexedDB usage.
- Implement `src/privacy/browser-api-analyzer.js` monitoring permissions and sensor APIs (Geolocation, Camera, Microphone, Clipboard).
- Implement `src/privacy/tracker-detector.js` mapping trackers against known privacy blocklists.
- Implement `src/privacy/privacy-analyzer.js` generating privacy surface score and risk breakdown.

### Phase 6: Security Posture & Vulnerability Analysis
- Implement `src/security/header-analyzer.js` with deep parsing of CSP (`Content-Security-Policy`), HSTS, X-Frame-Options, Referrer-Policy, COOP, COEP, and CORP.
- Implement `src/security/cors-analyzer.js` evaluating cross-origin resource sharing policies and wildcard exposures.
- Implement `src/security/cookie-security.js` evaluating cookie hygiene.
- Implement `src/security/mixed-content.js` flagging non-HTTPS subresources.
- Generate actionable security recommendations with technical rationale.

### Phase 7: API & Protocol Explorer
- Implement `src/network/api-detector.js` detecting REST endpoints, GraphQL queries/mutations, WebSockets, and SSE.
- Parse query parameters, payload schemas, response status, and initiator stack traces.
- Build interactive API Explorer UI in dashboard with grouping by endpoint path and method (GET, POST, PUT, DELETE).

### Phase 8: Architecture Graph Engine & Graph Algorithms
- Implement `src/architecture/graph.js` (Directed Graph Adjacency List).
- Implement `src/architecture/graph-builder.js` aggregating nodes (`WEBSITE`, `DOMAIN`, `CDN`, `API`, `SCRIPT`, `FRAMEWORK`, `TRACKER`) and directed edges (`LOADS`, `CALLS`, `CONNECTS_TO`, `HOSTED_BY`, `DEPENDS_ON`, `TRACKS`).
- Implement core computer science algorithms in `src/algorithms/`:
  - `bfs.js` & `dfs.js`: Tree discovery and reachability.
  - `shortest-path.js`: Dijkstra & unweighted shortest path (e.g. Browser to Tracker).
  - `connected-components.js`: Disconnected component analysis.
  - `centrality.js`: Degree centrality and betweenness centrality.
  - `dependency-depth.js`: Maximum dependency chain calculation.
- Implement interactive SVG/Canvas force-directed visualization in `src/ui/graph/` supporting pan, zoom, drag, filter, and node detail inspection.

### Phase 9: Architecture Inference Engine
- Implement `src/architecture/inference-engine.js` identifying architectural paradigms:
  - Single Page Application (SPA)
  - Server-Side Rendered (SSR)
  - Static Site Generation (SSG) / Jamstack
  - Micro-frontend architecture
  - Headless CMS / API-driven architecture
  - Progressive Web App (PWA)
- Provide transparent reasoning and evidence for each inferred architecture.

### Phase 10: Student Learning Mode & Knowledge Base
- Build comprehensive technical encyclopedia in `data/providers.js`:
  - Every detected technology, header, protocol, and concept features:
    - **WHAT**: Definition and concept.
    - **WHY**: Architectural purpose and motivation.
    - **HOW**: Low-level protocol and execution mechanism.
    - **EVIDENCE**: Observable browser signals.
    - **REAL-WORLD USE**: Production industry context and trade-offs.

### Phase 11: "What Happens When I Click?" (Interaction Investigator)
- Implement `src/content/runtime-monitor.js` tracking click events, DOM mutations, and downstream network requests.
- Correlate timeline events: `Click → DOM Mutation → API Call → Response → Storage Mutation → Analytics Dispatch`.
- Render step-by-step causal timeline visualization in the dashboard.

### Phase 12: Website DNA, Comparison, History & Export
- Implement multi-dimensional Website DNA chart (Frontend Complexity, Network Footprint, Third-Party Reliance, API Density, Privacy Surface, Infrastructure Depth).
- Implement `src/storage/indexeddb.js` for persistent local session storage.
- Implement site comparison view (Website A vs. Website B diff).
- Implement multi-format export: JSON, Markdown report, and CSV data.

### Phase 13: UI Refinement, Dark Aesthetic & End-to-End Verification
- Polish the dark developer-tool UI aesthetic inspired by Chrome DevTools, GitHub, and network monitoring tools.
- Write and execute automated unit tests in `tests/test-runner.js`.
- Test extension loading and real-world site inspection.
