# UNDERWEB — Web Security & Vulnerability Model

---

## 1. Security Architecture & Threat Vectors

Underweb evaluates browser security signals against modern defensive standards:

### 1. Content Security Policy (CSP)
- Parsed into discrete directives: `default-src`, `script-src`, `object-src`, `frame-ancestors`, `connect-src`.
- Highlights high-risk bypasses:
  - Presence of `'unsafe-inline'`: permits inline script injection, significantly weakening XSS defenses.
  - Presence of `'unsafe-eval'`: allows dynamic code evaluation via `eval()` or `new Function()`.
  - Missing `frame-ancestors`: permits unauthorized clickjacking unless guarded by `X-Frame-Options`.

### 2. Transport & Protocol Security (HSTS & HTTPS)
- Validates full HTTPS encryption on the main document.
- Parses `Strict-Transport-Security` parameters:
  - `max-age`: flags configurations with duration under 1 year (31,536,000s).
  - `includeSubDomains` and `preload` flags for HSTS preload list eligibility.

### 3. Cross-Origin Resource Sharing (CORS)
- Flags high-risk misconfigurations such as `Access-Control-Allow-Origin: *` in combination with `Access-Control-Allow-Credentials: true`.

### 4. Cross-Origin Isolation & Defense-in-Depth
- Checks for `Cross-Origin-Opener-Policy` (COOP) and `Cross-Origin-Embedder-Policy` (COEP) to verify whether the page runs in an isolated execution environment immune to Spectre-style side-channel leaks.

### 5. Mixed Content Detection
- Flags passive mixed content (HTTP images/media) and active mixed content (HTTP scripts/stylesheets) loaded within HTTPS contexts.

---

## 2. Security Grading Rubric

Websites are graded from **A** to **F** based on cumulative security score:
- **Grade A** ($Score \ge 85$): Full HTTPS, robust CSP without unsafe keywords, strict HSTS, safe CORS.
- **Grade B** ($70 \le Score < 85$): Encrypted transport, standard security headers, minor CSP gaps.
- **Grade C** ($50 \le Score < 70$): Missing key defensive headers (CSP or HSTS), permissive cookies.
- **Grade F** ($Score < 50$): Unencrypted HTTP, mixed content, or dangerous wildcard CORS.
