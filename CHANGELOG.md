# Changelog

All notable changes to the **Underweb** project will be documented in this file.

---

## [1.1.0] - 2026-09-24

### Fixed
- **Critical Security Posture Grading Bug**: Resolved issue where multiple HTTPS websites were incorrectly awarded `Grade F (Score: 10/100)` with false "Plaintext Unencrypted HTTP Connection", "Missing CSP", and "Missing HSTS".
- **Main Document vs Subresource Isolation**: Security analyzer now isolates the main document's transport and response headers from subresource assets, preventing a single passive HTTP image from collapsing the entire site's security score.
- **Active vs. Passive Mixed Content**: Created dedicated `MixedContentDetector` distinguishing high-risk Active Mixed Content (scripts, stylesheets, XHR/fetch, -8 pts) from Passive Mixed Content (images, audio, video, -2 pts).
- **Modern Clickjacking Defense Recognition**: `HeaderAnalyzer` now recognizes `Content-Security-Policy: frame-ancestors` (e.g. `'none'`, `'self'`) as complete, superior protection against clickjacking, eliminating false "Missing X-Frame-Options" alerts.
- **Unobserved Response Headers Mitigation**: Added `PARTIALLY_ASSESSED` state for pre-existing tabs opened prior to extension installation or reload; prevents penalizing sites for unobserved response headers.
- **Service Worker Lifecycle & Persistence**: Main document URL, primary domain, and HTTPS status now consistently sync to `chrome.storage.session` and survive background service worker sleep/wake events.

### Added
- **5-Pillar Categorical Security Scoring**:
  - Transport Security (25 pts)
  - Defense-in-Depth Headers (30 pts)
  - Mixed Content (15 pts)
  - Cookie Hygiene (15 pts)
  - Origin Isolation (15 pts)
- **Security Finding Inspector Modal**: Interactive deep-dive modal in the Dashboard displaying affected URL, resource scope (Main Document vs Subresource), party scope (First-Party vs Third-Party), observed evidence, expected security baseline, and actionable remediation guidance.
- **Category Score Breakdown Pills**: Dashboard now displays per-category score pills (`Transport: 25/25`, `Headers: 30/30`, etc.) and a Main Document Baseline grid.
- **Automated Regression Test Suite**: Added Suite 16 to `tests/test-runner.js` with comprehensive regression tests validating HTTPS baselines, mixed content differentiation, modern clickjacking detection, and partial assessment handling (126 passing tests).
- **Open-Source GitHub Architecture Overhaul**: Complete documentation revamp including Mermaid architecture diagram, transparent capability limits, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and GitHub issue/PR templates.

---

## [1.0.0] - 2026-09-23

### Added
- **Core Extension Engine**: Manifest V3 architecture with background service worker, type-safe message router, and per-tab ring-buffer session manager.
- **Runtime Page Analyzer**: Injected `MAIN` world monitor inspecting `window.*` globals, hooking `fetch` & `XMLHttpRequest` for API telemetry, and observing `WebSocket` handshakes.
- **Content Script Explorer**: Non-invasive isolated world DOM scanner evaluating framework markers, meta generator tags, CSS utility class tokens (Tailwind, Bootstrap, MUI), and client storage.
- **Network Intelligence**: Passive webRequest inspector tracking real socket IPs (`details.ip`), protocols (HTTP/1.1, HTTP/2, HTTP/3 QUIC), compression, and eTLD+1 first-party vs third-party attribution.
- **Technology Fingerprinting Engine**: Multi-factor detection covering 200+ technologies across Frontend Frameworks, Meta-Frameworks, CSS, Libraries, Build Tools, CMS, Analytics, Payments, and Cloud Infrastructure with probabilistic confidence scoring.
- **Infrastructure Topology**: Client-to-origin resolution pipeline mapping `Browser → DNS → Remote IP / ASN → CDN Edge → Origin Host → Application`.
- **Privacy & Storage Auditor**: In-depth cookie hygiene inspection, tracker detection, storage auditing (LocalStorage, SessionStorage, IndexedDB), and sensor/hardware surveillance scoring.
- **Security Posture Evaluator**: CSP directive parser, HSTS validation, CORS wildcard detector, mixed content scanner, and security grading rubric (A-F).
- **Interactive Architecture Graph**: Canvas force-directed graph renderer with zoom, pan, node dragging, node inspector drawer, and integrated CS graph algorithms (BFS, DFS, Dijkstra Shortest Path, Betweenness Centrality, Connected Components, Dependency Depth).
- **"What Happens When I Click?"**: Interactive investigation mode recording step-by-step causal cascades (`Click → DOM Mutation → API Request → Response → Storage Update → Analytics Beacon`).
- **Student Learning Mode**: Educational encyclopedia offering WHAT, WHY, HOW, EVIDENCE, and REAL-WORLD USE explanations for web concepts and technologies.
- **Website DNA & Comparison**: Multi-axis radar complexity visualization and side-by-side comparison engine.
- **Persistence & Export**: Local IndexedDB historical session storage and multi-format export (JSON, Markdown, CSV).
- **Automated Test Suite**: Zero-dependency test runner validating domain extraction, resource classification, fingerprinting, and graph algorithms.
