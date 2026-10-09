// tests/fixtures/synthetic-pages.js
// Synthetic test fixtures and controlled telemetry sessions representing standard web architecture archetypes.
// Uses purely synthetic data and non-functional dummy credentials.

export const DUMMY_STRIPE_KEY = ['sk', 'live', '51ABCDefgh1234567890abcdefghijklmnopqrstuvwxyz'].join('_');
export const DUMMY_OPENAI_KEY = ['sk', 'proj', '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN'].join('-');
export const DUMMY_AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';
export const DUMMY_POSTGRES_URI = 'postgres://test_user:SyntheticPassword123!@127.0.0.1:5432/synthetic_db';

/**
 * 1. Modern Frontend Application Fixture
 * Represents a modern Next.js / React 18 / Tailwind CSS / WebGL application with full HTTPS and CSP.
 */
export const modernFrontendFixture = {
  url: 'https://modern-app.local/dashboard',
  primaryDomain: 'modern-app.local',
  primaryApex: 'modern-app.local',
  runtime: {
    globals: [
      { name: 'Next.js', evidenceKey: 'window.__NEXT_DATA__', version: '14.2.3' },
      { name: 'React', evidenceKey: 'window.React', version: '18.3.1' }
    ],
    domMetrics: {
      frameworkMarkers: [
        { framework: 'Next.js', marker: '#__next' },
        { framework: 'React', marker: '[data-reactroot]' },
        { framework: 'Tailwind CSS', marker: 'Utility class signatures (flex, grid, p-*, text-*)' }
      ],
      scripts: [
        'https://modern-app.local/_next/static/chunks/main-app.js?v=14.2.3',
        'https://modern-app.local/_next/static/chunks/framework.js'
      ],
      stylesheets: [
        'https://modern-app.local/_next/static/css/app.css'
      ],
      manifest: 'https://modern-app.local/manifest.json'
    },
    browserApis: [
      { api: 'webgl', detail: 'WebGL 2.0 Context' },
      { api: 'service-worker', detail: 'Service worker controller active' }
    ],
    storage: {
      localStorageCount: 2,
      localStorageKeys: ['theme_pref', 'layout_state'],
      indexedDbDatabases: ['offline_app_cache']
    }
  },
  security: {
    isHttps: true,
    headers: {
      'content-security-policy': "default-src 'self'; script-src 'self' 'nonce-test123'; object-src 'none'; frame-ancestors 'none'",
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin'
    }
  },
  requests: [
    {
      requestId: 'req_mf_1',
      url: 'https://modern-app.local/dashboard',
      type: 'main_frame',
      responseHeaders: {
        'content-security-policy': "default-src 'self'; script-src 'self' 'nonce-test123'; object-src 'none'; frame-ancestors 'none'",
        'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin'
      }
    },
    {
      requestId: 'req_mf_2',
      url: 'https://modern-app.local/api/v1/user/profile',
      type: 'fetch',
      category: 'API',
      status: 200,
      responseHeaders: {
        'content-type': 'application/json'
      }
    }
  ]
};

/**
 * 2. Website with Common Security Headers Fixture
 * Exemplary enterprise security configuration with defense-in-depth headers.
 */
export const secureHeadersFixture = {
  url: 'https://secure-banking.local/',
  primaryDomain: 'secure-banking.local',
  primaryApex: 'secure-banking.local',
  security: {
    isHttps: true,
    headers: {
      'content-security-policy': "default-src 'self'; script-src 'self' 'nonce-456'; frame-ancestors 'self'; object-src 'none'",
      'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=(), microphone=(), geolocation=()'
    }
  },
  requests: [
    {
      requestId: 'req_sh_1',
      url: 'https://secure-banking.local/',
      type: 'main_frame',
      responseHeaders: {
        'content-security-policy': "default-src 'self'; script-src 'self' 'nonce-456'; frame-ancestors 'self'; object-src 'none'",
        'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'referrer-policy': 'strict-origin-when-cross-origin'
      }
    }
  ]
};

/**
 * 3. Website with Missing Security Headers Fixture
 * HTTPS origin lacking CSP, HSTS, XFO, XCTO, and Referrer-Policy.
 */
export const missingHeadersFixture = {
  url: 'https://legacy-unprotected.local/',
  primaryDomain: 'legacy-unprotected.local',
  primaryApex: 'legacy-unprotected.local',
  security: {
    isHttps: true,
    headers: {
      'server': 'nginx',
      'content-type': 'text/html; charset=utf-8'
      // No CSP, no HSTS, no XFO, no XCTO, no Referrer-Policy
    }
  },
  requests: [
    {
      requestId: 'req_mh_1',
      url: 'https://legacy-unprotected.local/',
      type: 'main_frame',
      responseHeaders: {
        'server': 'nginx',
        'content-type': 'text/html; charset=utf-8'
      }
    }
  ]
};

/**
 * 4. Page Loading Third-Party Scripts Fixture
 * Verifies correct partyScope attribution, third-party request classification, and isolated auditing.
 */
export const thirdPartyScriptsFixture = {
  url: 'https://content-portal.local/',
  primaryDomain: 'content-portal.local',
  primaryApex: 'content-portal.local',
  security: {
    isHttps: true,
    headers: {
      'strict-transport-security': 'max-age=31536000'
    }
  },
  requests: [
    {
      requestId: 'req_tp_1',
      url: 'https://content-portal.local/',
      type: 'main_frame',
      responseHeaders: {
        'strict-transport-security': 'max-age=31536000'
      }
    },
    {
      requestId: 'req_tp_2',
      url: 'https://www.google-analytics.com/analytics.js',
      type: 'script',
      category: 'ANALYTICS'
    },
    {
      requestId: 'req_tp_3',
      url: 'https://js.stripe.com/v3/',
      type: 'script',
      category: 'PAYMENT'
    },
    {
      requestId: 'req_tp_4',
      url: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.min.js',
      type: 'script',
      category: 'SCRIPT'
    }
  ]
};

/**
 * 5. Page with Intentionally Exposed Dummy Credential Fixture
 * Synthetic credentials exposed in API payloads, response headers, and connection parameters.
 */
export const exposedDummyCredentialFixture = {
  url: 'https://vulnerable-testapp.local/',
  primaryDomain: 'vulnerable-testapp.local',
  primaryApex: 'vulnerable-testapp.local',
  security: {
    isHttps: true,
    headers: {}
  },
  requests: [
    {
      requestId: 'req_leak_1',
      url: 'https://vulnerable-testapp.local/api/config',
      type: 'fetch',
      responseBody: JSON.stringify({
        database_url: DUMMY_POSTGRES_URI,
        payment_service_key: DUMMY_STRIPE_KEY,
        ai_provider_secret: DUMMY_OPENAI_KEY
      })
    },
    {
      requestId: 'req_leak_2',
      url: 'https://vulnerable-testapp.local/debug/database',
      type: 'fetch',
      responseBody: 'Fatal error: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version near "SELECT * FROM users"'
    }
  ]
};

/**
 * 6. Page with Ambiguous Technology Fingerprints Fixture
 * Contains weak, non-unique, or conflicting signals (e.g. utility classes without frameworks).
 * Must NEVER be classified as confirmed!
 */
export const ambiguousFingerprintsFixture = {
  url: 'https://ambiguous-sample.local/',
  primaryDomain: 'ambiguous-sample.local',
  primaryApex: 'ambiguous-sample.local',
  runtime: {
    globals: [],
    domMetrics: {
      frameworkMarkers: [
        { framework: 'Tailwind CSS', marker: 'Utility class signatures (flex, grid, p-*, text-*)' }
      ],
      scripts: ['https://ambiguous-sample.local/js/common.js'],
      stylesheets: ['https://ambiguous-sample.local/css/style.css']
    }
  },
  security: {
    isHttps: true,
    headers: {
      'server': 'webserver'
    }
  },
  requests: [
    {
      requestId: 'req_amb_1',
      url: 'https://ambiguous-sample.local/',
      type: 'main_frame'
    }
  ]
};
