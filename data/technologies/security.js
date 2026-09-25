// data/technologies/security.js
// Signatures for transport security, HTTP security headers, and origin isolation mechanisms.

export const SECURITY_TECHNOLOGIES = [
  {
    id: 'https',
    name: 'HTTPS / TLS Encryption',
    category: 'Security',
    website: 'https://developer.mozilla.org/en-US/docs/Glossary/HTTPS',
    description: 'Encrypted communication channel using Transport Layer Security (TLS).',
    signatures: {
      protocols: ['https:']
    }
  },
  {
    id: 'hsts',
    name: 'HTTP Strict Transport Security (HSTS)',
    category: 'Security',
    website: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
    description: 'Enforces HTTPS by informing browsers to never load site using HTTP.',
    signatures: {
      headers: {
        'strict-transport-security': /max-age=\d+/i
      }
    }
  },
  {
    id: 'csp',
    name: 'Content Security Policy (CSP)',
    category: 'Security',
    website: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
    description: 'Layer of security helping detect and mitigate certain types of attacks, including XSS and data injection.',
    signatures: {
      headers: {
        'content-security-policy': /.+/i
      }
    }
  },
  {
    id: 'x-frame-options',
    name: 'X-Frame-Options (Clickjacking Protection)',
    category: 'Security',
    website: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options',
    description: 'Indicates whether browser should be allowed to render a page in frame or iframe.',
    signatures: {
      headers: {
        'x-frame-options': /DENY|SAMEORIGIN/i
      }
    }
  },
  {
    id: 'x-content-type-options',
    name: 'X-Content-Type-Options (MIME Sniffing Protection)',
    category: 'Security',
    website: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options',
    description: 'Prevents MIME-type sniffing of response content.',
    signatures: {
      headers: {
        'x-content-type-options': /nosniff/i
      }
    }
  },
  {
    id: 'referrer-policy',
    name: 'Referrer-Policy',
    category: 'Security',
    website: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy',
    description: 'Controls how much referrer information is sent with requests.',
    signatures: {
      headers: {
        'referrer-policy': /.+/i
      }
    }
  },
  {
    id: 'permissions-policy',
    name: 'Permissions-Policy',
    category: 'Security',
    website: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy',
    description: 'Allows site to enable or disable browser features and APIs.',
    signatures: {
      headers: {
        'permissions-policy': /.+/i
      }
    }
  },
  {
    id: 'coop',
    name: 'Cross-Origin-Opener-Policy (COOP)',
    category: 'Security',
    website: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy',
    description: 'Enforces process-level origin isolation for browsing context.',
    signatures: {
      headers: {
        'cross-origin-opener-policy': /same-origin|same-origin-allow-popups/i
      }
    }
  },
  {
    id: 'coep',
    name: 'Cross-Origin-Embedder-Policy (COEP)',
    category: 'Security',
    website: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy',
    description: 'Prevents loading cross-origin resources that do not explicitly grant permission.',
    signatures: {
      headers: {
        'cross-origin-embedder-policy': /require-corp|credentialless/i
      }
    }
  },
  {
    id: 'cors',
    name: 'Cross-Origin Resource Sharing (CORS)',
    category: 'Security',
    website: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
    description: 'HTTP-header based mechanism allowing servers to indicate origins other than its own to load resources.',
    signatures: {
      headers: {
        'access-control-allow-origin': /.+/i
      }
    }
  },
  {
    id: 'sri',
    name: 'Subresource Integrity (SRI)',
    category: 'Security',
    website: 'https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity',
    description: 'Security feature enabling browsers to verify that resources fetched are delivered without unexpected manipulation.',
    signatures: {
      dom: ['script[integrity]', 'link[integrity]']
    }
  }
];
