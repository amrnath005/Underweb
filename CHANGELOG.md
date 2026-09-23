# Changelog

All notable changes to the **Underweb** project will be documented in this file.

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
