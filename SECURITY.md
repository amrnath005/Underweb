# Security Policy

## 🔒 Extension Security Model

Underweb is built with defense-in-depth principles to protect both the user and the websites inspected:

1. **100% Local-First Sandbox**:
   - Underweb makes **zero** outbound telemetry or cloud API requests.
   - All network observation, DOM inspection, signature matching, and security auditing occur entirely inside the local browser process.
   - Inspected payloads, cookies, and tokens are never exfiltrated or transmitted across the network.

2. **Strict Manifest V3 Content Security Policy (CSP)**:
   - Policy: `script-src 'self'; object-src 'self'`
   - Underweb enforces a strict CSP that prohibits `unsafe-eval`, `unsafe-inline`, and remote script injection.
   - All code executed in extension pages (popup, dashboard) is bundled locally with static module resolution.

3. **Execution Context Isolation**:
   - `content.js` runs in an **ISOLATED world** with standard DOM access, prevented from polluting or accessing sensitive closures in the host web page.
   - `page-analyzer.js` is injected into the **MAIN world** strictly for read-only runtime probes (detecting `window.*` framework globals and instrumenting `fetch` / `XHR` for API telemetry).
   - Communication between the MAIN world and the ISOLATED world is strictly mediated via cryptographically prefixed DOM custom events and `window.postMessage` validation.

4. **Passive Observation Only**:
   - Underweb uses Chrome's `webRequest` API in **non-blocking** (passive) mode. It does not intercept, modify, block, or redirect web traffic during standard operation.

---

## 🛡️ Supported Versions

We provide security updates for the current major release of Underweb:

| Version | Supported          |
| :------ | :----------------- |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability in Underweb, please report it responsibly:

1. **Do NOT** open a public GitHub issue for security vulnerabilities.
2. Email the maintainers directly or use GitHub's private security advisories feature (`Security` tab -> `Report a vulnerability`).
3. Include detailed steps to reproduce the issue, including:
   - Target browser and version (e.g. Google Chrome 128 / Microsoft Edge 128)
   - Extension version
   - Sample URL or proof-of-concept code
   - Potential impact of the vulnerability

We will acknowledge receipt within 48 hours and work with you to remediate the vulnerability promptly.
