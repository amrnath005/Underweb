# UNDERWEB — Technology Detection Engine Specification

---

## 1. Detection Philosophy & Design Goals

The Underweb Detection Engine is built on three foundational principles:
1. **Multi-Factor Fingerprinting**: Avoid relying on a single signal (such as a generic `generator` meta tag or a minified variable name). Technologies are verified through a combination of DOM markers, runtime globals, HTTP response headers, script path regexes, and CSS classes.
2. **Transparent Evidence**: Every detection produces a verifiable `EvidenceRecord` specifying the exact keys, values, and browser contexts observed.
3. **Probabilistic Confidence Scoring**: Detections are assigned a status (`OBSERVED`, `INFERRED`, `UNKNOWN`) and confidence (`HIGH`, `MEDIUM`, `LOW`).

---

## 2. Signal Dimensions & Relative Weighting

Each detection rule evaluates multiple orthogonal signal dimensions:

| Signal Type | Description | Weight ($w_i$) | Direct Observation? |
| :--- | :--- | :--- | :--- |
| `WINDOW_GLOBAL` | Direct inspection of `window.*` properties in the page's `MAIN` execution world (e.g. `window.React`, `window.__NEXT_DATA__`, `window.Vue`). | **1.00** | Yes |
| `HTTP_HEADER` | Response headers received over HTTP/S (e.g. `X-Powered-By: Next.js`, `Server: cloudflare`, `CF-Ray`). | **0.95** | Yes |
| `DOM_MARKER` | Unambiguous DOM elements or selectors (e.g. `<div id="__next">`, `[data-reactroot]`, `[ng-version]`). | **0.90** | Yes |
| `SCRIPT_URL` | Pattern-matched bundle paths (e.g. `/_next/static/chunks/`, `vite/client`, `bundle.js`). | **0.85** | Yes |
| `META_TAG` | Meta tags in document `<head>` (e.g. `<meta name="generator" content="Astro">`). | **0.85** | Yes |
| `CSS_CLASS` | Utility class tokens on rendered elements (e.g. Tailwind `flex`, `grid`, `p-\d`, Bootstrap `col-*-*`). | **0.75** | Yes |
| `NETWORK_BEHAVIOR` | API transactions matching specific query schemas (e.g. GraphQL operations, tRPC batch calls). | **0.70** | Inferred |
| `INFERRED_HEURISTIC`| Secondary inferences based on correlated tooling. | **0.40** | Inferred |

---

## 3. Mathematical Confidence Model

The overall confidence score $S \in [0.0, 1.0]$ for a detected technology is computed using a cumulative independent-signal formula:

$$S = 1 - \prod_{i=1}^{n} (1 - 0.85 \cdot w_i)$$

Where $w_i$ represents the weight of the $i$-th observed signal.

### Confidence Categories:
- **`HIGH`**: $S \ge 0.85$ (At least one high-weight direct observation or multiple correlated signals)
- **`MEDIUM`**: $0.50 \le S < 0.85$ (Secondary or inferred signals such as CSS utility patterns)
- **`LOW`**: $S < 0.50$ (Single weak heuristic)

---

## 4. Execution Pipeline

```
Page Load / DOM Ready
       │
       ├──> 1. MAIN World Page Analyzer evaluates `window.*` globals & prototypes
       │       └─ Emits GLOBALS_DETECTED via postMessage
       │
       ├──> 2. Isolated Content Script traverses DOM:
       │       ├─ Scans <meta>, <script>, <link> tags
       │       ├─ Evaluates CSS class signatures (Tailwind, Bootstrap, MUI)
       │       └─ Audits client storage (LocalStorage, IndexedDB)
       │
       └──> 3. Background Service Worker captures HTTP Response Headers via webRequest:
               └─ Analyzes Server, Via, X-Powered-By, CF-Ray, etc.
                       │
                       ▼
             FingerprintEngine.detect()
                       │
                       ├── Matches against 200+ technology signatures
                       ├── Computes cumulative EvidenceRecord
                       └── Renders Stack & Evidence Modals in UI
```
