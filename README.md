# UNDERWEB

> **"Explore the technology beneath every website."**

Underweb is an advanced website intelligence and inspection platform built as a Manifest V3 Chrome Extension. It functions as a hybrid DevTools inspector, network investigator, technology fingerprinter, security/privacy auditor, and interactive computer science learning environment.

---

## ⚡ Key Capabilities

- **🔍 Technology & Framework Detection**: Pinpoints 200+ technologies across Frontend Frameworks (React, Next.js, Vue, Nuxt, Svelte, Remix, Angular), CSS Frameworks (Tailwind, Bootstrap, MUI), Libraries, Build Tools (Vite, Webpack, Turbopack), CMS, Analytics, Payments, and Cloud Hosting.
- **🌐 Network Intelligence**: Analyzes all network requests, remote server IPs, protocols (HTTP/1.1, HTTP/2, HTTP/3 QUIC), compression, caching headers, and first-party vs. third-party attribution.
- **⚡ API & Protocol Explorer**: Automatically surfaces REST endpoints, GraphQL queries/mutations, WebSockets, and Server-Sent Events with payload and timing telemetry.
- **☁️ Infrastructure Topology**: Reconstructs the end-to-end delivery pipeline: `Browser → DNS → Remote IP / ASN → CDN Edge → Origin Hosting Server`.
- **🛡️ Security & Privacy Analysis**: Evaluates CSP, HSTS, CORS, Cookie security flags (`HttpOnly`, `Secure`, `SameSite`), Mixed Content, and dangerous browser API surveillance (Geolocation, MediaDevices, Clipboard).
- **🕸️ Interactive Architecture Graph**: Visualizes the website's complete dependency graph with real-time computer science graph algorithms (BFS, DFS, Shortest Path, Degree Centrality, Betweenness Centrality, Connected Components).
- **🖱️ "What Happens When I Click?"**: Interactive investigation mode that records and visualizes the exact cause-and-effect cascade: `Click → DOM Mutation → API Request → Response → Storage Mutation → Analytics Dispatch`.
- **🎓 Student Learning Mode**: Detailed educational breakdowns for every detected technology explaining **WHAT**, **WHY**, **HOW**, **EVIDENCE**, and **REAL-WORLD USE**.
- **🧬 Website DNA & Multi-Site Comparison**: Multi-dimensional complexity radar comparing architecture, network footprint, third-party reliance, and privacy surfaces across sites.
- **💾 Local-First & Privacy Preserving**: Zero external server telemetry, 100% deterministic local inspection, local IndexedDB history, and multi-format export (JSON, Markdown, CSV).

---

## 📦 Project Structure

```
Underweb/
├── manifest.json                  # Manifest V3 Extension Configuration
├── PROJECT_SPEC.md                # Feasibility study & API specifications
├── ARCHITECTURE.md                # System topology, data flow & modular design
├── IMPLEMENTATION_PLAN.md         # Phased implementation roadmap
├── src/
│   ├── background/                # Service worker, session manager, webRequest dispatcher
│   ├── content/                   # Content scripts, DOM analyzer, MAIN world runtime monitor
│   ├── network/                   # Request/response analyzers, domain classifier, API detector
│   ├── detection/                 # Framework, library, CMS, build-tool fingerprinting engines
│   ├── infrastructure/            # IP, ASN, CDN, hosting, TLS & HTTP protocol analyzers
│   ├── privacy/                   # Cookie, storage, tracker & browser API analyzers
│   ├── security/                  # Header, CORS, mixed content & cookie security evaluators
│   ├── architecture/              # Directed graph builder, centrality, community clustering
│   ├── algorithms/                # Pure JS BFS, DFS, Dijkstra, Tarjan, Centrality algorithms
│   ├── evidence/                  # Confidence scorer & proof explanation engine
│   ├── storage/                   # IndexedDB storage coordinator & history manager
│   ├── ui/                        # Popup UI, full Dashboard, interactive Canvas graph, timeline
│   └── utils/                     # URL, domain (PSL), timing, and parser utilities
├── data/                          # Signature databases for 200+ technologies & providers
└── tests/                         # Automated unit & integration tests
```

---

## 🚀 Installation & Development

### 1. Load in Google Chrome
1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked** and select the root `Underweb/` folder.
5. Pin the **Underweb** icon to your Chrome toolbar.

### 2. Running Tests
Run the standalone Node/browser test suite:
```bash
node tests/test-runner.js
```

---

## 🔒 Permissions & Security Safeguards

Underweb operates under strict local-first principles. No network requests are made to third-party telemetry servers.

- `webRequest`: Required to inspect request headers, status codes, and remote server IP addresses passively.
- `cookies`: Required to audit cookie security attributes (`HttpOnly`, `SameSite`, `Secure`) for the active domain.
- `storage`: Stores user preferences and inspection history in local extension storage.
- `scripting`: Executes non-invasive DOM and page-world runtime property probes.
- `tabs`: Connects the inspector dashboard to the active inspected tab session.
- `debugger` *(Optional)*: Used exclusively when user launches Deep Protocol Investigation mode.

---

## 📜 License
MIT License. Built for developers, students, and curious internet explorers.
