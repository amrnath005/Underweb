# Underweb

> "Explore the technology beneath every website."

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Tests: 126 Passed](https://img.shields.io/badge/Tests-126%20Passed-emerald.svg)](tests/test-runner.js)
[![Zero Telemetry](https://img.shields.io/badge/Telemetry-Zero%20(Local--First)-blueviolet.svg)](#privacy)
[![Chromium Compatible](https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Brave-informational.svg)](#try-it-in-30-seconds)

Underweb turns any website into an evidence-backed technical blueprint — technology stack, network, APIs, infrastructure, security, browser APIs, and architecture.

Built as an open-source Manifest V3 Chromium extension, Underweb functions as a hybrid website analyzer, network inspector, and architecture explorer. It replaces guesswork with concrete, verifiable browser evidence.

---

## What Can Underweb See?

```
+---------------------------------------------------------------------------------------+
|                                    UNDERWEB CONSOLE                                   |
+---------------------------+---------------------------+-------------------------------+
| Technology Detection      | Network Intelligence      | API Detection                 |
| 206+ observable stack     | Remote server IPs, HTTP/2 | Automatic REST and GraphQL    |
| signatures across modern  | and HTTP/3 QUIC, transfer | cataloging, operation names,  |
| frameworks, CSS, libraries| sizes, and eTLD+1 party   | timing, and WebSocket socket  |
| build tools, and CDNs.    | attribution boundaries.   | connection profiling.         |
+---------------------------+---------------------------+-------------------------------+
| Infrastructure Mapping    | Security & Privacy Audit  | Architecture Graph            |
| End-to-end delivery path: | 5-pillar posture scoring, | Force-directed dependency     |
| Client -> Remote IP / ASN | CSP, HSTS, active/passive | graph with Dijkstra shortest  |
| -> CDN Edge -> Host.      | mixed content, & cookies. | path & betweenness centrality.|
+---------------------------+---------------------------+-------------------------------+
| Browser APIs              | Evidence & Confidence     | Interaction Investigator      |
| Storage keys, canvas,     | Every detection cites its | Records cause-and-effect:     |
| WebGL, Web Audio, sensors,| exact signal source with  | Click -> DOM -> API Request   |
| and permission surfaces.  | probabilistic confidence. | -> Response -> Storage Update.|
+---------------------------+---------------------------+-------------------------------+
```

---

## Why Underweb?

Most web technology detectors operate on superficial URL string matching or fabricate internal components. Underweb is designed for engineers who want technical accuracy:

- **Browser-First and 100% Local-First**: Runs entirely within your browser process. Zero third-party telemetry, zero external APIs, and zero data exfiltration.
- **Evidence-Backed Detection**: Every technology identified is anchored to an inspectable `EvidenceRecord` citing the exact runtime global, DOM node, or HTTP response header that proved its presence.
- **Observable vs. Inferred Differentiation**: Directly observed technologies are clearly separated from architectural inferences. If a framework implies a parent (e.g. Next.js implying React), the inference relationship is explicitly labeled.
- **No Fabricated Backend Claims**: Underweb will never guess invisible backend components. Unless an explicit response header or cookie provides proof, it will never claim to detect internal databases (PostgreSQL, MySQL, Redis, MongoDB) or internal orchestration (Docker, Kubernetes).
- **Zero AI API or Cloud Dependencies**: Deterministic, offline-capable analysis engines ensure reproducible, instant results without subscription fees or rate limits.

---

## Real-World Detection in Action

Underweb inspects multiple execution tiers simultaneously:

```text
React       — OBSERVED — HIGH (94% confidence)
GraphQL     — OBSERVED — HIGH (89% confidence)
Cloudflare  — OBSERVED — HIGH (96% confidence)
Fastify     — OBSERVED — MEDIUM (74% confidence)
Tailwind    — OBSERVED — HIGH (91% confidence)
```

### Traceable Evidence Breakdown
```text
[✓ Runtime Signal]   window.React detected (version 18.3.1); window.__APOLLO_CLIENT__ present
[✓ Network Signal]   POST /api/v2/graphql with JSON payload containing query "GetCatalogData"
[✓ Header Signal]    cf-ray: 8df4a1b0-ORD; server: cloudflare; x-powered-by: Fastify
[✓ DOM Signal]       Tailwind utility token signatures detected across 42 DOM nodes
```

---

## System Architecture

```mermaid
flowchart TD
    subgraph Browser ["Web Page Execution"]
        DOM[DOM Elements & Meta Tags]
        WIN["Runtime Globals (window.*)"]
        NET["Fetch / XHR / WebSockets"]
        CK[Browser Cookie Store]
    end

    subgraph ContentScript ["Content Pipeline"]
        CS[content.js - DOM & Storage Observer]
        PA[page-analyzer.js - Main World Injected Probe]
    end

    subgraph ExtensionEngine ["Background Service Worker (MV3)"]
        SW[service-worker.js]
        WR["webRequest (Passive IP & Header Tracking)"]
        SM[SessionManager - Ring Buffer Session Cache]
        ST["chrome.storage.session (Sleep/Wake Safe)"]
    end

    subgraph Analyzers ["Analysis Pipeline"]
        FE[FingerprintEngine - 206+ Signatures]
        SEC[SecurityAnalyzer - 5-Pillar Rubric]
        MC[MixedContentDetector - Active vs Passive]
        HA[HeaderAnalyzer - Defense-in-Depth]
        CD[CdnDetector & HostingDetector]
        API[ApiDetector - REST & GraphQL]
        GB[GraphBuilder - Topology & CS Algorithms]
    end

    subgraph UI ["Underweb Interface"]
        POP[Extension Popup]
        DASH[Intelligence Dashboard]
        MODAL[Evidence & Finding Inspector Modal]
    end

    DOM --> CS
    WIN --> PA
    NET --> PA
    CK --> SW

    PA -->|postMessage| CS
    CS -->|runtime.sendMessage| SW
    WR --> SW
    SW <--> SM
    SM <--> ST

    SM --> FE & SEC & MC & HA & CD & API & GB
    FE & SEC & MC & HA & CD & API & GB --> DASH
    DASH --> MODAL
    SM --> POP
```

---

## Try It in 30 Seconds

Underweb runs unpacked in any Chromium browser (Google Chrome, Microsoft Edge, Brave, Opera).

### Step 1: Clone the Repository
```bash
git clone https://github.com/amrnath005/Underweb.git
cd Underweb
```

### Step 2: Load into Browser
1. Open your browser's extension settings:
   - Chrome / Brave: `chrome://extensions/`
   - Microsoft Edge: `edge://extensions/`
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click **Load unpacked**.
4. Select the `Underweb` root folder.
5. Pin the Underweb icon to your browser toolbar.

### Step 3: Inspect Any Site
Navigate to any website (e.g. GitHub, Stripe, Vercel, Shopify) and click the Underweb icon to launch the popup or full intelligence dashboard.

---

## Capabilities & Implementation Status

| Module | Core Functionality | Status | Test Coverage |
| :--- | :--- | :--- | :--- |
| **Technology Fingerprinting** | 206+ modular signatures (Globals, DOM, Scripts, Headers, Cookies) | Active | 100% (Suites 7-15) |
| **Network Engine** | Real remote IP capture, HTTP/2 & HTTP/3 QUIC, transfer sizing | Active | 100% (Suites 2, 5) |
| **API Cataloger** | REST endpoints, GraphQL operations, WebSocket handshake profiling | Active | 100% (Suite 2, 6) |
| **Infrastructure Resolver** | ASN registry mapping, CDN edge headers, hosting detection | Active | 100% (Suite 5) |
| **Security Analyzer** | 5-pillar scoring (Transport, Headers, Mixed Content, Cookies, Isolation) | Active | 100% (Suite 16) |
| **Architecture Graph** | Interactive Canvas, Dijkstra shortest path, betweenness centrality | Active | 100% (Suite 3) |
| **Interaction Investigator** | "What Happens When I Click?" event-to-request causal recorder | Active | Verified |
| **Student Learning Mode** | WHAT, WHY, HOW, EVIDENCE educational reference cards | Active | Verified |

---

## Built for Developers, Students & Security Researchers

- **Frontend & Full-Stack Engineers**: Discover the exact libraries, bundlers, and styling systems powering your favorite web applications.
- **Cybersecurity Researchers**: Audit defense-in-depth header configuration, identify active mixed content, check cookie isolation flags, and map third-party tracking surfaces.
- **Computer Science Students**: Learn how real-world websites work under the hood. Run classic graph algorithms (BFS, DFS, Dijkstra, Centrality) against live website architectures.
- **API Designers & Integrators**: Discover undocumented REST endpoints, observe GraphQL query schemas, and examine WebSocket protocols in action.

---

## Privacy

Underweb is built on a strict privacy model:

- **Zero Outbound Telemetry**: Underweb does not send HTTP requests to remote analytics servers, third-party trackers, or cloud storage.
- **No Third-Party Cookies or Identifiers**: Underweb creates no cross-site identifiers or telemetry beacons.
- **Local Storage Only**: Inspected history and user configuration reside solely in local extension storage (`chrome.storage.session` and local `IndexedDB`).
- **Strict Content Security Policy**: Configured with `script-src 'self'; object-src 'self'`. No `unsafe-eval`, no `unsafe-inline`, and no remote script execution.

---

## Permissions & Usage Rationale

Underweb requests only permissions necessary to observe the active page:

| Permission | Technical Rationale |
| :--- | :--- |
| `webRequest` | Passively captures request headers, status codes, protocols, and remote server socket IPs (`details.ip`). |
| `cookies` | Reads cookie flags (`HttpOnly`, `Secure`, `SameSite`) on the inspected domain for security posture auditing. |
| `storage` | Preserves tab session data across service worker sleep/wake cycles and stores local user preferences. |
| `scripting` | Executes non-invasive DOM checks and read-only runtime global probes. |
| `tabs` & `activeTab` | Resolves the URL, title, and ID of the current tab to bind telemetry to the dashboard. |
| `<all_urls>` | Allows inspecting public websites navigated by the user. |

---

## Technical Limitations

Underweb operates transparently within the security boundaries of standard browser extensions:

1. **Browser-Observable Evidence Only**: Underweb cannot inspect backend databases (PostgreSQL, MySQL, Redis, MongoDB) or container orchestration (Docker, Kubernetes) unless an explicit server header or debug artifact is exposed in the HTTP response.
2. **Pre-Existing Tabs**: If Underweb is installed or reloaded while tabs are already open, response headers from the initial document navigation were not observed. Underweb flags these sessions as `PARTIALLY_ASSESSED` to avoid applying unobserved header penalties until the tab is refreshed.
3. **Encrypted Cross-Origin Iframes**: Subresources loaded inside sandboxed cross-origin iframes without content script permissions cannot be deeply inspected.

---

## Verification & Automated Tests

Underweb includes a zero-dependency test suite running across 16 test suites:

```bash
node tests/test-runner.js
```

```text
--- Suite: DomainUtils & eTLD+1 Decomposition ---
  ✔ PASS: Standard single TLD
  ✔ PASS: Multi-part suffix .co.uk
...
--- Suite: Universal Fingerprint Detection Engine ---
  ✔ PASS: Detects React from globals & DOM markers
  ✔ PASS: Detects Tailwind CSS from DOM class utility marker
  ✔ PASS: Detects Cloudflare from cf-ray and server headers
...
--- Suite: Security Analyzer & Evidence-Driven Posture Scoring ---
  ✔ PASS: HTTPS site is fully ASSESSED
  ✔ PASS: REGRESSION FIXED: HTTPS site with passive HTTP image is NOT Grade F
  ✔ PASS: Active mixed content (script) is flagged with HIGH severity
  ✔ PASS: CSP frame-ancestors provides clickjacking protection

========================================
Test Execution Finished: 126 Passed, 0 Failed
========================================
```

---

## Roadmap

- [ ] Firefox Add-ons (Manifest V3) support and packaging.
- [ ] Exportable architecture topology reports in SVG, Mermaid, and Cytoscape formats.
- [ ] Expanded WASM (WebAssembly) binary inspection and export profiling.
- [ ] Deep HTTP/3 0-RTT and QUIC connection parameter telemetry.
- [ ] Community technology signature submission pipeline with automated CI verification.

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on adding technology signatures, writing unit tests, and adhering to our evidence standards.

The Underweb Standard:
> "Detect everything observable. Infer only what evidence supports. Mark everything else UNKNOWN."

---

## Support the Project

If Underweb helps you understand what's happening beneath the web, star the repository and help others discover it.

---

## License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more details.
Built for developers, cybersecurity researchers, students, and curious internet explorers.
