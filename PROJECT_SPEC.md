# UNDERWEB — Project Specification & Technical Feasibility

> **Tagline**: *"Explore the technology beneath every website."*  
> **System Type**: Chrome Extension (Manifest V3)  
> **Target Environment**: Chromium Browsers (Google Chrome 114+), MV3 Service Worker Architecture  
> **Core Architecture**: Local-first, deterministic, explainable, zero external cloud dependencies  

---

## 1. Executive Summary & Vision

**Underweb** is an advanced website intelligence, browser internals inspection, and reverse-engineering platform built as a Manifest V3 Chrome Extension. It bridges the gap between raw developer tools and high-level technology detectors, transforming any visited website into a comprehensive, interactive computer science and cybersecurity case study.

Underweb answers three foundational questions for every page:
1. **"What is this website actually made of?"** (Frontend frameworks, libraries, build tools, CMS, runtime engines, meta tags, DOM markers)
2. **"What happens when my browser interacts with it?"** (Network requests, protocol handshakes, WebSocket frames, storage access, API transactions, third-party tracking)
3. **"How do all these technologies connect?"** (Interactive directed dependency graphs, graph algorithms, infrastructure topology, security posture, privacy surface)

---

## 2. Technical Feasibility & Browser API Investigation

Manifest V3 introduces specific security and architectural boundaries (e.g., service worker lifecycles, removal of blocking `webRequest`, sandboxed content scripts). Underweb leverages a multi-layer observation pipeline that maximizes what can be collected legally, deterministically, and performantly.

### 2.1 Feasibility Matrix

| Domain | Direct Observation API | Inference / Secondary Signals | Chrome Permissions Needed | Feasibility Status |
| :--- | :--- | :--- | :--- | :--- |
| **Network Requests** | `chrome.webRequest.onBeforeRequest`, `onSendHeaders`, `onHeadersReceived`, `onCompleted` | URL patterns, resource classification, payload signatures | `"webRequest"` | **100% Fully Feasible** |
| **IP & Server Addresses** | `details.ip` in `chrome.webRequest.onResponseStarted` / `onCompleted` | ASN lookup, ISP, hosting provider mapping via local CIDR / IP table | `"webRequest"` | **100% Fully Feasible** |
| **HTTP Protocols & Headers** | `chrome.webRequest` response headers; `PerformanceNavigationTiming.nextHopProtocol` (`h2`, `h3`, `http/1.1`) | Server technology (`Server`, `Via`, `X-Powered-By`), CDN signatures | `"webRequest"` | **100% Fully Feasible** |
| **Page Runtime & Globals** | Script injection into `MAIN` world (`world: "MAIN"`) via content script / declaration | Library versions (`window.React`, `window.__NEXT_DATA__`, `window.Vue`) | `"scripting"`, host permissions | **100% Fully Feasible** |
| **DOM & CSS Signatures** | Content Script DOM traversal, `MutationObserver`, CSS style analysis | Framework detection (Tailwind classes, MUI, styled-components) | Content script | **100% Fully Feasible** |
| **API Endpoints (REST/GraphQL)**| `MAIN` world monkey-patching of `fetch` & `XMLHttpRequest` + `webRequest` | Query/mutation parsing, REST endpoint pattern extraction | Page script + `webRequest` | **100% Fully Feasible** |
| **WebSocket Activity** | `MAIN` world proxy of `window.WebSocket` + CDP `Network.webSocketFrame*` in Debugger mode | Protocol detection (Socket.io, STOMP, ActionCable, GraphQL WS) | `MAIN` script / optional `debugger` | **100% Fully Feasible** |
| **Cookies & Cookie Security** | `chrome.cookies.getAll({ url })` | HttpOnly, Secure, SameSite, Expiry audit, Tracker attribution | `"cookies"` | **100% Fully Feasible** |
| **Client Storage** | Content script access to `localStorage`, `sessionStorage`, `indexedDB.databases()`, `caches.keys()` | Storage quota, persistent identification patterns | Content script | **100% Fully Feasible** |
| **Browser APIs & Permissions** | `navigator.permissions.query()`, proxying `navigator.geolocation`, `navigator.clipboard`, `mediaDevices` | Sensor & privacy surveillance surface assessment | `MAIN` script | **100% Fully Feasible** |
| **Performance & Web Vitals** | `PerformanceObserver` (navigation, resource, paint, LCP, CLS, longtask) | Bottleneck detection, render blocking assets | Content script | **100% Fully Feasible** |
| **TLS & Certificates** | Deep: `chrome.debugger` (`Security.visibleSecurityStateChanged`); Passive: HSTS headers, HTTPS schemes | Cipher suites, protocol version, issuer | Optional `"debugger"` | **100% Feasible** (Passive + Active) |
| **Backend & Databases** | Inferred via response headers, API payload structures, error formats, known SaaS integrations | Detection of Supabase, Firebase, GraphQL backends, Prisma errors | Heuristic inference | **Inferred (Clearly Labeled)** |

---

## 3. What Can Be Directly Observed vs. Inferred

### 3.1 Directly Observed (High Confidence: 95% - 100%)
- **Network Transactions**: Full URL, method, status code, initiator, timing (DNS, connect, TLS, TTFB, download), transfer size, decoded size.
- **Remote Endpoint IP**: Direct socket IP provided by Chromium network stack via `chrome.webRequest`.
- **HTTP Headers**: Complete request and response header sets (CSP, HSTS, CORS, Server, Cache-Control, Set-Cookie).
- **DOM & Page Globals**: Specific DOM node properties (`id="__next"`, `data-reactroot`), window objects (`window.__NUXT__`, `window.webpackChunk`), meta tags.
- **Cookies & Storage**: All cookie names, values, flags (`HttpOnly`, `Secure`, `SameSite`), LocalStorage keys and sizes, IndexedDB databases.
- **Resource Composition**: JavaScript bundles, CSS stylesheets, web fonts, SVG/images, WASM binaries, Web Workers.
- **Event Listeners & User Interactions**: Click events, DOM mutations, subsequent fetch triggers.

### 3.2 Inferred (Medium to High Confidence with Evidence: 60% - 90%)
- **Backend Architecture**: SSR vs. SSG vs. SPA vs. JAMstack vs. Headless CMS inferred from initial HTML body content vs. client hydration scripts, presence of `__NEXT_DATA__`, dynamic client rendering, and API-heavy XHR traffic.
- **Cloud Hosting & CDN Origin**: CDN edge (e.g., Cloudflare, Fastly, AWS CloudFront, Vercel) observed via headers and IP; origin server (e.g., AWS EC2, GCP, Heroku) inferred when edge headers expose origin bypass or custom backend headers (`X-Backend-Server`, `X-Served-By`).
- **Build Tools & Bundlers**: Inferred from bundle chunk formats (e.g., Webpack runtime `webpackJsonp` or `webpackChunk`, Vite `/vite/client` and `import.meta.hot`, Rollup variable mangling, Turbopack markers).
- **Database/ORM Layer**: Inferred from GraphQL schemas, REST error responses (e.g., PostgreSQL unique violation code, Prisma error payload, Hasura headers), or Firebase/Supabase client endpoints.

### 3.3 What Requires Special Handling / Permissions
- **WebSocket Frame Payloads**: `chrome.webRequest` observes HTTP 101 Switching Protocols handshake, but does *not* read post-handshake binary/text frames. Underweb solves this via:
  1. *Passive Mode*: Intercepting `window.WebSocket` constructor and `send`/`onmessage` handlers in `MAIN` world script.
  2. *Deep Debug Mode*: `chrome.debugger` CDP `Network.webSocketFrameReceived` / `Network.webSocketFrameSent`.
- **Service Worker Payloads & Cache Content**: Inspected through the browser Cache Storage API in the content script context.
- **Detailed TLS Handshake & Cipher Suite**: In standard MV3, webRequest provides IP and headers; full TLS cipher suite (`TLS_AES_128_GCM_SHA256`) is obtained via the Chrome Debugger CDP `Security` domain when deep inspection is initiated.

---

## 4. Permission Justifications

Every requested permission in Underweb is tied to a specific inspection capability:

| Permission | Technical Requirement | User Privacy Safeguard |
| :--- | :--- | :--- |
| `"webRequest"` | Intercepts HTTP/S network metadata, request/response headers, remote server IP, and initiator across tab sessions. | Non-blocking; no credentials or private data modified. Completely local inspection. |
| `"cookies"` | Reads cookie attributes (`HttpOnly`, `Secure`, `SameSite`, `Domain`, `Expiration`) to analyze security and tracking surface. | Only queries cookies for the active examined site URL; data never exfiltrated. |
| `"storage"` | Stores user settings, session history, website comparisons, and technology signatures locally in `chrome.storage.local`. | Data never leaves local device storage. |
| `"tabs"` | Identifies active tab URL, title, favicon, and manages navigation timing synchronization. | Limited to tab context tracking. |
| `"scripting"` | Injects content scripts and page-world analyzers to inspect DOM, runtime globals, and performance metrics. | Injected strictly into the active inspection target. |
| `"debugger"` (Optional) | Deep protocol inspection (WebSocket frames, TLS cipher details, memory footprints, exact DevTools timeline events). | Only attached when user explicitly launches "Deep Investigation Mode" / "Click Investigator". |
| `<all_urls>` | Required for `webRequest` to monitor all first-party and third-party network connections initiated by the inspected tab. | Purely passive telemetry. |

---

## 5. System Performance & Safety Guardrails

- **Memory Bounding**: Ring buffer of max 1,000 requests per tab session to eliminate memory leaks.
- **Debounced Analysis**: DOM and runtime inspections use `requestIdleCallback` and 200ms debounce to prevent any frame drops or UI latency on heavy web apps.
- **Zero Network Overhead**: All fingerprinting, regex matching, graph algorithms, and threat classifications execute locally within Web Workers or Extension runtime threads.
- **No Remote Telemetry**: 100% air-gapped from analytics or external telemetry servers.
