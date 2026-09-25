# Contributing to Underweb 🦂

Thank you for your interest in contributing to **Underweb**!

Underweb is an open-source website intelligence platform and developer tool built for software engineers, cybersecurity researchers, students, and curious internet explorers.

---

## 🏛️ Core Architectural Principles

When contributing to Underweb, you must follow these fundamental tenets:

1. **100% Local-First & Privacy-Preserving**:
   - Underweb must run entirely within the user's browser sandbox.
   - **Never** add network calls to external APIs, telemetry beacons, analytics trackers, or remote servers.
   - All signature matching, graph computing, and security assessments must be performed locally.

2. **The Observable Evidence Standard**:
   - **"Detect everything observable. Infer only what evidence supports. Mark everything else UNKNOWN."**
   - Underweb never fabricates invisible architecture.
   - **Do NOT create signatures for internal databases** (PostgreSQL, MySQL, Redis, MongoDB, SQLite) or internal orchestration (Docker, Kubernetes) unless an explicit HTTP response header (e.g. `X-Powered-By`) or debug cookie genuinely leaks proof to the browser.
   - Every detected technology must be backed by an `EvidenceRecord` citing concrete, inspectable evidence.

3. **Strict Chromium Extension Security (Manifest V3)**:
   - Content Security Policy: `script-src 'self'; object-src 'self'`.
   - Never use `eval()`, `new Function()`, or inline `<script>` tags.
   - Never weaken the extension CSP.

4. **Zero Heavy Runtime Dependencies**:
   - The extension core is written in pure vanilla modern JavaScript (ES Modules).
   - Keep the footprint lightweight, fast, and instant-loading.

---

## 🔍 Adding or Updating a Technology Signature

Signatures are organized modularly in `data/technologies/` by category:
- `frontend.js`: Frameworks & Meta-frameworks (React, Next.js, Vue, Angular, Svelte, etc.)
- `css.js`: CSS Frameworks & Utility Systems (Tailwind, Bootstrap, MUI, etc.)
- `libraries.js`: Utilities & Visual Libraries (Three.js, Axios, Redux, D3, etc.)
- `build-tools.js`: Bundlers & Dev Servers (Vite, Webpack, Turbopack, etc.)
- `cms.js`: Content Management Systems (WordPress, Drupal, Ghost, Webflow, etc.)
- `ecommerce.js`: E-Commerce Platforms (Shopify, WooCommerce, Magento, etc.)
- `analytics.js`: Telemetry & Tracking (GA4, Mixpanel, Amplitude, etc.)
- `advertising.js`: Ad Networks & Marketing Beacons
- `authentication.js`: Auth & Identity Providers (Auth0, Clerk, Firebase Auth, etc.)
- `infrastructure.js`: Hosting & Edge Networks (Cloudflare, Vercel, Netlify, AWS, etc.)
- `api.js`: API Frameworks & Protocols (GraphQL, REST, Socket.io, etc.)
- `storage.js`: Client Storage Technologies (IndexedDB, LocalStorage, etc.)
- `browser-apis.js`: Modern Web APIs (WebGL, WebGPU, Web Audio, etc.)
- `security.js`: Security Headers & Transport Protocols (HSTS, CSP, etc.)

### Signature Schema

Add your signature to the appropriate file in `data/technologies/`:

```javascript
{
  id: 'my-tech',
  name: 'My Technology',
  category: 'FRAMEWORK', // FRAMEWORK | META_FRAMEWORK | CSS | LIBRARY | BUILD_TOOL | CMS | ECOMMERCE | ANALYTICS | CLOUD | API | SECURITY
  website: 'https://example.com',
  description: 'Concise summary of the technology and its primary purpose.',
  signatures: {
    // 1. Injected window globals (observed in MAIN world)
    globals: ['myFramework', '__MY_FRAMEWORK_DATA__'],

    // 2. DOM selectors or element attributes (observed in content script)
    dom: ['#my-root', '[data-my-framework]', 'meta[name="my-generator"]'],

    // 3. Script bundle URLs or path regexes
    scripts: [/my-framework(?:\.min)?\.js/, /cdn\.example\.com\/sdk\.js/],

    // 4. HTTP response headers (exact match or regex)
    headers: {
      'x-powered-by': /MyFramework/i,
      'server': /MyEdge/i
    },

    // 5. Cookies
    cookies: ['my_session_id', 'my_csrf_token'],

    // 6. Meta generator tags
    meta: {
      'generator': /MyFramework\s*([\d.]+)?/i
    }
  },
  // Optional: Heuristic parent relationships (e.g., Next.js implies React)
  implies: ['react']
}
```

### Educational Breakdown in `data/providers.js`

If you add a widely used technology, also add an educational entry in `data/providers.js` so it lights up in **Student Learning Mode**:

```javascript
'my-tech': {
  name: 'My Technology',
  what: 'High-performance reactive frontend framework.',
  why: 'Enables declarative component trees with minimal runtime overhead.',
  how: 'Compiles templates to reactive fine-grained DOM operations.',
  evidence: 'Observed window.myFramework runtime global and data-my-framework DOM attribute.',
  realWorld: 'Commonly adopted for high-throughput single-page applications.'
}
```

---

## 🧪 Testing Your Changes

Before submitting a pull request, run the zero-dependency test suite:

```bash
node tests/test-runner.js
```

Ensure:
- All unit tests pass (`126 Passed, 0 Failed`).
- No syntax errors exist in any file (`node --check <file>`).
- If you introduced a new signature, add a corresponding test case in `tests/test-runner.js`.

---

## 📋 Pull Request Checklist

Before opening a pull request, verify:
- [ ] Code follows vanilla modern JavaScript (ES Modules).
- [ ] Zero external network calls or remote tracking added.
- [ ] No invisible databases or backend servers are fabricated.
- [ ] All unit tests pass (`node tests/test-runner.js`).
- [ ] Manifest V3 security rules and CSP (`script-src 'self'`) are respected.
- [ ] Commit message is clear and describes the exact change.

Thank you for helping build transparent, evidence-first web intelligence!
