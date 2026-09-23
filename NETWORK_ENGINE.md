# UNDERWEB — Network Intelligence Engine Specification

---

## 1. Network Telemetry Architecture

Underweb captures all browser-level network transactions initiated by a webpage using a dual-layer observation model:
1. **Passive Chromium Network Layer (`chrome.webRequest`)**:
   - Observes pre-flight handshakes, real remote socket IPs (`details.ip`), exact status codes, raw headers, transfer sizes, and durations.
   - Operates in non-blocking mode to ensure 0ms latency impact on browser page rendering.
2. **Page-World Runtime Interceptor (`window.fetch` / `XMLHttpRequest`)**:
   - Captures client-initiated asynchronous API transactions, request payloads, and GraphQL query operations directly from the execution context.

---

## 2. Resource Classification Matrix

Every network transaction is parsed and classified into one of 17 functional categories:

```
                  ┌─────────────────────────────────────┐
                  │          Incoming Request           │
                  └──────────────────┬──────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         │                                                       │
         ▼                                                       ▼
[Protocol Inspection]                                   [Domain & URL Pattern]
- WebSocket (ws://, wss://)                             - Ad networks -> AD
- Main/Sub Document -> DOCUMENT                         - Analytics -> ANALYTICS
- Script -> SCRIPT                                      - Payment gateways -> PAYMENT
- Stylesheet -> STYLESHEET                              - Auth endpoints -> AUTHENTICATION
- Image/Media -> IMAGE/MEDIA                            - REST/GraphQL -> API
- Font -> FONT                                          - CDN assets -> CDN
```

---

## 3. First-Party vs. Third-Party Decomposition (eTLD+1)

To accurately classify resources as internal or external, Underweb implements an apex domain extractor:
- Parses effective Top-Level Domains (eTLDs) including multi-part public suffixes such as `.co.uk`, `.com.au`, `.pages.dev`, `.vercel.app`.
- A request to `api.cdn.example.co.uk` initiated by `www.example.co.uk` is correctly recognized as **First-Party** because both share the common apex domain `example.co.uk`.
- A request to `fonts.googleapis.com` is flagged as **Third-Party**.

---

## 4. "First Contact" Sequence

Underweb reconstructs the initial bootstrap handshake of the website:
- Identifies the first 8 distinct domains or endpoints contacted upon navigation.
- Highlights whether the site begins by contacting third-party trackers or internal CDNs before user interaction occurs.
- Displays relative time offsets ($T_0 + \Delta t$) for each initial contact.
