// data/providers.js
// Educational encyclopedia for Student Learning Mode.
// Provides WHAT, WHY, HOW, EVIDENCE, and REAL-WORLD USE for every detected technology or concept.

export const KNOWLEDGE_BASE = {
  // --- FRONTEND FRAMEWORKS ---
  'react': {
    name: 'React',
    category: 'Frontend Framework',
    what: 'A declarative, component-based JavaScript library created by Meta for rendering interactive user interfaces.',
    why: 'Simplifies state management and DOM manipulation by maintaining a Virtual DOM that computes minimal differential updates (reconciliation).',
    how: 'Developers define components that return JSX. When component state changes, React recalculates the virtual DOM tree and efficiently applies changes to the browser DOM.',
    evidence: 'Detected via window.React global, root DOM attributes (e.g. data-reactroot, #root), and bundled script patterns (react.production.min.js).',
    realWorldUse: 'Used across millions of consumer web applications, enterprise dashboards, and platforms like Facebook, Netflix, Airbnb, and Discord.'
  },
  'nextjs': {
    name: 'Next.js',
    category: 'Meta-Framework',
    what: 'A full-stack React framework by Vercel offering hybrid static & server rendering, TypeScript support, smart bundling, and route pre-fetching.',
    why: 'Provides SEO optimization, initial page load speed, and server-side logic integration without managing complex custom Webpack or SSR servers.',
    how: 'Executes React components on the Node.js or Edge runtime, renders HTML for the initial response, and injects hydration bundles via __NEXT_DATA__ so client interactivity takes over.',
    evidence: 'Identified by #__next root element, window.__NEXT_DATA__ script tag, /_next/static/ chunk paths, and x-nextjs-cache or x-powered-by headers.',
    realWorldUse: 'The de facto standard for modern production React applications, powering TikTok, Twitch, Hulu, Nike, and Notion.'
  },
  'vue': {
    name: 'Vue.js',
    category: 'Frontend Framework',
    what: 'A progressive JavaScript framework with a template-based syntax and fine-grained reactive system.',
    why: 'Combines an approachable learning curve with powerful Single-File Components (.vue) and efficient two-way reactive state tracking.',
    how: 'Uses ES6 Proxies to intercept property access and mutation. When data changes, only dependent DOM nodes re-render without dirty-checking the whole tree.',
    evidence: 'Identified by window.Vue, data-v-* scoped style attributes, and #app mount nodes.',
    realWorldUse: 'Massively popular in modern web development, utilized by GitLab, Nintendo, BMW, and Behance.'
  },
  'angular': {
    name: 'Angular',
    category: 'Enterprise Framework',
    what: 'A robust, opinionated, TypeScript-based client framework developed and maintained by Google.',
    why: 'Provides everything out of the box: dependency injection, routing, forms validation, HTTP client, and testing utilities for large teams.',
    how: 'Compiles HTML templates into imperative JavaScript instructions using the Ivy compiler. Employs Zone.js for change detection.',
    evidence: 'Identified by [ng-version] HTML attribute, <app-root>, and ng global object.',
    realWorldUse: 'Standard for large financial institutions, enterprise portals, Google Cloud Console, and Forbes.'
  },
  'tailwind': {
    name: 'Tailwind CSS',
    category: 'Styling Engine',
    what: 'A utility-first CSS framework that composes designs directly in HTML using low-level utility classes.',
    why: 'Eliminates naming CSS classes, prevents CSS file bloat over time, and enforces consistent spacing, typography, and color scales.',
    how: 'Scans source files at build time for class names (e.g. flex, pt-4, text-slate-800) and generates an optimized, purged stylesheet containing only classes actually used.',
    evidence: 'Detected via repetitive utility class signatures (flex, grid, p-*, text-*, bg-*) across rendered DOM elements.',
    realWorldUse: 'Widely adopted standard for modern web design, used by GitHub, OpenAI, Shopify, and NASA.'
  },

  // --- INFRASTRUCTURE & CDNs ---
  'cloudflare': {
    name: 'Cloudflare Edge',
    category: 'Edge Network & Security',
    what: 'A massive global distributed network providing Content Delivery Network (CDN), DDoS mitigation, SSL termination, and Edge computing.',
    why: 'Reduces latency by serving cached static assets close to end-users worldwide, while protecting origin servers from malicious attacks.',
    how: 'Uses Anycast DNS routing to direct user traffic to the geographically nearest Cloudflare edge data center. The edge proxies requests to the origin if not cached.',
    evidence: 'Identified by cf-ray header, server: cloudflare, and cf-cache-status headers.',
    realWorldUse: 'Protects and accelerates more than 20% of the entire internet.'
  },
  'aws-cloudfront': {
    name: 'AWS CloudFront',
    category: 'CDN & Cloud Delivery',
    what: 'Amazon Web Services global content delivery network integrated directly with S3, EC2, and Lambda@Edge.',
    why: 'Delivers content with high transfer speeds, low latency, and deep AWS infrastructure security integration.',
    how: 'Routes requests to AWS Edge Locations (Points of Presence) and optimizes network routing through the private AWS global backbone.',
    evidence: 'Identified by x-amz-cf-id, x-amz-cf-pop, and via: 1.1 ...cloudfront.net headers.',
    realWorldUse: 'Powers high-scale streaming, gaming downloads, and enterprise media for Slack, Hulu, and Amazon.'
  },
  'vercel': {
    name: 'Vercel Edge Cloud',
    category: 'Serverless Hosting Platform',
    what: 'Cloud platform designed specifically for frontend developers and Jamstack architectures.',
    why: 'Provides instant worldwide deployments, automatic edge routing, preview URLs, and seamless zero-configuration Next.js hosting.',
    how: 'Deploys static files to a global edge network and runs server-side logic in lightweight V8 isolates (Edge Functions) or AWS Lambda.',
    evidence: 'Identified by x-vercel-id header and server: Vercel.',
    realWorldUse: 'Hosts major frontend frameworks and apps including Next.js docs, HashiCorp, Loom, and Washington Post.'
  },

  // --- PROTOCOLS & NETWORK ---
  'http2': {
    name: 'HTTP/2 Protocol',
    category: 'Network Transport',
    what: 'Major revision of the HTTP network protocol featuring binary framing, multiplexing, and header compression.',
    why: 'Solves HTTP/1.1 head-of-line blocking by allowing hundreds of requests and responses to stream concurrently over a single TCP connection.',
    how: 'Splits messages into independent binary frames tagged with a stream ID. Frames are interleaved over a single TCP socket and reassembled at the receiver.',
    evidence: 'Observed via performance.getEntriesByType("navigation")[0].nextHopProtocol === "h2".',
    realWorldUse: 'Default protocol for modern web APIs and secure websites.'
  },
  'http3': {
    name: 'HTTP/3 (QUIC)',
    category: 'Next-Gen Protocol',
    what: 'The latest generation of HTTP running over QUIC (UDP) rather than TCP.',
    why: 'Eliminates TCP transport-level head-of-line blocking on packet loss and drastically speeds up connection establishment (0-RTT handshakes).',
    how: 'Combines transport and cryptographic handshakes into a single round trip over UDP datagrams. Each stream is truly independent at the transport layer.',
    evidence: 'Observed via nextHopProtocol === "h3" and Alt-Svc headers advertising h3 endpoints.',
    realWorldUse: 'Pioneered by Google, Meta, and Cloudflare; now standard across top websites.'
  },

  // --- SECURITY HEADERS ---
  'csp': {
    name: 'Content Security Policy (CSP)',
    category: 'Browser Security Mechanism',
    what: 'An HTTP response header that restricts the resources (scripts, images, stylesheets, iframes) the browser is allowed to load.',
    why: 'The primary defense-in-depth mechanism against Cross-Site Scripting (XSS) and data injection attacks.',
    how: 'Browser parses directives (e.g. script-src \'self\' https://trusted.com) and blocks execution of any script originating from an unauthorized origin or inline eval.',
    evidence: 'Observed via content-security-policy response header.',
    realWorldUse: 'Mandatory standard for banking, healthcare, and high-security enterprise web applications.'
  },
  'hsts': {
    name: 'Strict Transport Security (HSTS)',
    category: 'Transport Security',
    what: 'A web security header that forces browsers to interact with the domain exclusively over encrypted HTTPS connections.',
    why: 'Protects against man-in-the-middle attacks, SSL stripping, and cookie interception on public Wi-Fi networks.',
    how: 'Browser remembers the max-age policy and automatically upgrades all insecure http:// requests to https:// before sending any network packets.',
    evidence: 'Observed via strict-transport-security response header.',
    realWorldUse: 'Required for inclusion in browser HSTS preload lists and modern compliance certifications.'
  },

  // --- PRIVACY & CLIENT STORAGE ---
  'cookies': {
    name: 'HTTP Cookies',
    category: 'Client State Storage',
    what: 'Small key-value pairs stored by the browser and automatically transmitted with matching network requests.',
    why: 'Maintains user session state, authentication credentials, and user preferences across stateless HTTP requests.',
    how: 'Set via Set-Cookie response header or document.cookie. Browser attaches them to subsequent request Cookie headers based on Domain, Path, and SameSite rules.',
    evidence: 'Audited directly via chrome.cookies API and request headers.',
    realWorldUse: 'Core mechanism for web authentication, session cookies, and third-party advertising tracking.'
  },
  'localstorage': {
    name: 'Web Storage (LocalStorage)',
    category: 'Client Storage API',
    what: 'Persistent key-value client storage accessible synchronously via JavaScript with approximately 5MB-10MB quota.',
    why: 'Allows caching user preferences, offline drafts, and UI settings directly in the browser without sending them over the wire with every HTTP request.',
    how: 'Saved to disk per origin protocol + domain + port. Unlike cookies, LocalStorage data is never sent to the server in HTTP headers.',
    evidence: 'Directly inspected via window.localStorage.length and keys.',
    realWorldUse: 'Client state caching, theme toggles, JWT access token storage (though HttpOnly cookies are safer).'
  }
};
