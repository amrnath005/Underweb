// data/technologies.js
// Exhaustive signature registry for technology fingerprinting across frameworks,
// libraries, build tools, CMS, analytics, payments, and cloud infrastructure.

export const TECHNOLOGIES = [
  // ==========================================
  // 1. FRONTEND FRAMEWORKS
  // ==========================================
  {
    id: 'react',
    name: 'React',
    category: 'FRAMEWORK',
    website: 'https://react.dev',
    description: 'Declarative component-based JavaScript library for building user interfaces.',
    signatures: {
      globals: ['React', '__REACT_DEVTOOLS_GLOBAL_HOOK__'],
      dom: ['[data-reactroot]', '#root', '#__next', '#___gatsby'],
      scripts: [/react(?:\.production|\.development)?\.js/, /react-dom/],
      meta: []
    }
  },
  {
    id: 'vue',
    name: 'Vue.js',
    category: 'FRAMEWORK',
    website: 'https://vuejs.org',
    description: 'Progressive framework for building user interfaces with reactive data binding.',
    signatures: {
      globals: ['Vue', '__VUE__'],
      dom: ['[data-v-]', '#app'],
      scripts: [/vue(?:\.runtime)?(?:\.min)?\.js/],
      meta: []
    }
  },
  {
    id: 'angular',
    name: 'Angular',
    category: 'FRAMEWORK',
    website: 'https://angular.io',
    description: 'Full-featured enterprise TypeScript-based application framework maintained by Google.',
    signatures: {
      globals: ['ng', 'getAllAngularRootElements'],
      dom: ['[ng-version]', 'app-root', '[_nghost-]', '[_ngcontent-]'],
      scripts: [/main(?:\.[a-z0-9]+)?\.js/, /polyfills(?:\.[a-z0-9]+)?\.js/],
      meta: []
    }
  },
  {
    id: 'angularjs',
    name: 'AngularJS',
    category: 'FRAMEWORK',
    website: 'https://angularjs.org',
    description: 'Legacy 1.x MVC framework for client-side web applications.',
    signatures: {
      globals: ['angular'],
      dom: ['[ng-app]', '[ng-controller]', '[ng-model]'],
      scripts: [/angular(?:\.min)?\.js/],
      meta: []
    }
  },
  {
    id: 'svelte',
    name: 'Svelte',
    category: 'FRAMEWORK',
    website: 'https://svelte.dev',
    description: 'Compiler-based component framework converting declarative code into tiny imperative DOM updates.',
    signatures: {
      globals: ['__svelte'],
      dom: ['[class*="svelte-"]'],
      scripts: [/svelte/],
      meta: []
    }
  },
  {
    id: 'solid',
    name: 'SolidJS',
    category: 'FRAMEWORK',
    website: 'https://www.solidjs.com',
    description: 'Reactive declarative JavaScript framework using fine-grained reactivity and direct DOM execution.',
    signatures: {
      globals: ['_$HY'],
      dom: ['[data-hk]'],
      scripts: [/solid-js/],
      meta: []
    }
  },
  {
    id: 'preact',
    name: 'Preact',
    category: 'FRAMEWORK',
    website: 'https://preactjs.com',
    description: 'Fast 3kB alternative to React with the same modern API.',
    signatures: {
      globals: ['preact'],
      dom: [],
      scripts: [/preact(?:\.min)?\.js/],
      meta: []
    }
  },
  {
    id: 'ember',
    name: 'Ember.js',
    category: 'FRAMEWORK',
    website: 'https://emberjs.com',
    description: 'Opinionated web framework for ambitious web applications.',
    signatures: {
      globals: ['Ember', 'Em'],
      dom: ['div.ember-view', '[id^="ember"]'],
      scripts: [/ember(?:\.prod)?\.js/],
      meta: []
    }
  },
  {
    id: 'backbone',
    name: 'Backbone.js',
    category: 'FRAMEWORK',
    website: 'https://backbonejs.org',
    description: 'Minimal MVC foundation with Models, Collections, and Views.',
    signatures: {
      globals: ['Backbone'],
      dom: [],
      scripts: [/backbone(?:\.min)?\.js/],
      meta: []
    }
  },

  // ==========================================
  // 2. META-FRAMEWORKS
  // ==========================================
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'META_FRAMEWORK',
    website: 'https://nextjs.org',
    description: 'Full-stack React framework by Vercel supporting SSR, SSG, Server Components, and App Router.',
    signatures: {
      globals: ['__NEXT_DATA__', 'next'],
      dom: ['#__next', 'script[id="__NEXT_DATA__"]'],
      scripts: [/\/_next\/static\//],
      headers: { 'x-powered-by': /Next\.js/i, 'x-nextjs-cache': /.+/i },
      meta: []
    }
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    category: 'META_FRAMEWORK',
    website: 'https://nuxt.com',
    description: 'Intuitive full-stack framework built on top of Vue.js.',
    signatures: {
      globals: ['__NUXT__', '$nuxt'],
      dom: ['#__nuxt', '#__layout'],
      scripts: [/\/_nuxt\//],
      headers: { 'x-powered-by': /Nuxt/i },
      meta: []
    }
  },
  {
    id: 'remix',
    name: 'Remix',
    category: 'META_FRAMEWORK',
    website: 'https://remix.run',
    description: 'Edge-native full-stack React framework focused on web standards and modern UX.',
    signatures: {
      globals: ['__remixContext', '__remixManifest'],
      dom: [],
      scripts: [/\/build\/(?:manifest-|root-)/],
      meta: []
    }
  },
  {
    id: 'astro',
    name: 'Astro',
    category: 'META_FRAMEWORK',
    website: 'https://astro.build',
    description: 'All-in-one web framework designed for content-focused sites with zero-JS island architecture.',
    signatures: {
      globals: ['__astro'],
      dom: ['[class*="astro-"]', 'style[data-astro-id]'],
      scripts: [/\/_astro\//],
      meta: [{ name: 'generator', content: /Astro/i }]
    }
  },
  {
    id: 'gatsby',
    name: 'Gatsby',
    category: 'META_FRAMEWORK',
    website: 'https://www.gatsbyjs.com',
    description: 'React-based static site generator powered by GraphQL data layer.',
    signatures: {
      globals: ['___gatsby'],
      dom: ['#___gatsby'],
      scripts: [/\/static\/d\/\d+-\w+\.json/],
      meta: [{ name: 'generator', content: /Gatsby/i }]
    }
  },
  {
    id: 'sveltekit',
    name: 'SvelteKit',
    category: 'META_FRAMEWORK',
    website: 'https://kit.svelte.dev',
    description: 'Official application framework for Svelte.',
    signatures: {
      globals: ['__sveltekit_data'],
      dom: ['div[data-sveltekit-hydrate]'],
      scripts: [/\/_app\/immutable\//],
      meta: []
    }
  },

  // ==========================================
  // 3. CSS FRAMEWORKS & STYLING ENGINES
  // ==========================================
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    category: 'CSS_FRAMEWORK',
    website: 'https://tailwindcss.com',
    description: 'Utility-first CSS framework packed with classes like flex, pt-4, text-center, and rotate-90.',
    signatures: {
      domClasses: [/\b(flex|grid|p-\d|m-\d|text-(sm|base|lg|xl)|bg-(white|black|gray|slate)|rounded-(sm|md|lg|full))\b/],
      styles: [/tailwindcss/i]
    }
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    category: 'CSS_FRAMEWORK',
    website: 'https://getbootstrap.com',
    description: 'Popular HTML, CSS, and JS library for building responsive, mobile-first websites.',
    signatures: {
      globals: ['bootstrap'],
      domClasses: [/\b(container|row|col-(?:sm|md|lg)-\d|btn-primary|navbar-nav)\b/],
      scripts: [/bootstrap(?:\.bundle)?(?:\.min)?\.js/],
      styles: [/bootstrap(?:\.min)?\.css/]
    }
  },
  {
    id: 'material-ui',
    name: 'Material UI (MUI)',
    category: 'CSS_FRAMEWORK',
    website: 'https://mui.com',
    description: 'Comprehensive React UI library implementing Google Material Design.',
    signatures: {
      domClasses: [/\b(MuiButton-root|MuiBox-root|MuiTypography-root|MuiContainer-root)\b/],
      scripts: [/material-ui|@mui/]
    }
  },
  {
    id: 'bulma',
    name: 'Bulma',
    category: 'CSS_FRAMEWORK',
    website: 'https://bulma.io',
    description: 'Free, open source modern CSS framework based on Flexbox.',
    signatures: {
      domClasses: [/\b(columns|column|is-primary|is-flex|hero-body)\b/],
      styles: [/bulma(?:\.min)?\.css/]
    }
  },
  {
    id: 'styled-components',
    name: 'Styled Components',
    category: 'CSS_FRAMEWORK',
    website: 'https://styled-components.com',
    description: 'Visual primitives for the component age using tagged template literals in React.',
    signatures: {
      dom: ['style[data-styled]', 'style[data-styled-components]'],
      domClasses: [/\bsc-[a-zA-Z0-9]+/i]
    }
  },
  {
    id: 'emotion',
    name: 'Emotion',
    category: 'CSS_FRAMEWORK',
    website: 'https://emotion.sh',
    description: 'Flexible and performant CSS-in-JS library.',
    signatures: {
      dom: ['style[data-emotion]'],
      domClasses: [/\bcss-[a-zA-Z0-9]+/i]
    }
  },

  // ==========================================
  // 4. JAVASCRIPT UTILITY & VISUAL LIBRARIES
  // ==========================================
  {
    id: 'jquery',
    name: 'jQuery',
    category: 'LIBRARY',
    website: 'https://jquery.com',
    description: 'Classic DOM manipulation, event handling, and Ajax library.',
    signatures: {
      globals: ['jQuery', '$'],
      scripts: [/jquery(?:\.min)?\.js/]
    }
  },
  {
    id: 'lodash',
    name: 'Lodash',
    category: 'LIBRARY',
    website: 'https://lodash.com',
    description: 'Modern JavaScript utility library delivering modularity, performance, and extras.',
    signatures: {
      globals: ['_'],
      scripts: [/lodash(?:\.min)?\.js/]
    }
  },
  {
    id: 'threejs',
    name: 'Three.js',
    category: 'LIBRARY',
    website: 'https://threejs.org',
    description: 'Cross-browser JavaScript 3D engine using WebGL/WebGPU.',
    signatures: {
      globals: ['THREE'],
      scripts: [/three(?:\.min)?\.js/]
    }
  },
  {
    id: 'gsap',
    name: 'GSAP',
    category: 'LIBRARY',
    website: 'https://greensock.com',
    description: 'High-performance JavaScript animation platform for modern web interactive effects.',
    signatures: {
      globals: ['gsap', 'TweenMax'],
      scripts: [/gsap(?:\.min)?\.js/]
    }
  },
  {
    id: 'd3',
    name: 'D3.js',
    category: 'LIBRARY',
    website: 'https://d3js.org',
    description: 'Data-Driven Documents library for manipulating SVG, Canvas, and HTML using data.',
    signatures: {
      globals: ['d3'],
      scripts: [/d3(?:\.v\d+)?(?:\.min)?\.js/]
    }
  },
  {
    id: 'chartjs',
    name: 'Chart.js',
    category: 'LIBRARY',
    website: 'https://www.chartjs.org',
    description: 'Simple yet flexible JavaScript charting for designers and developers.',
    signatures: {
      globals: ['Chart'],
      scripts: [/chart(?:\.min)?\.js/]
    }
  },
  {
    id: 'axios',
    name: 'Axios',
    category: 'LIBRARY',
    website: 'https://axios-http.com',
    description: 'Promise-based HTTP client for browser and Node.js.',
    signatures: {
      globals: ['axios'],
      scripts: [/axios(?:\.min)?\.js/]
    }
  },
  {
    id: 'moment',
    name: 'Moment.js',
    category: 'LIBRARY',
    website: 'https://momentjs.com',
    description: 'Legacy date manipulation and formatting library.',
    signatures: {
      globals: ['moment'],
      scripts: [/moment(?:\.min)?\.js/]
    }
  },
  {
    id: 'dayjs',
    name: 'Day.js',
    category: 'LIBRARY',
    website: 'https://day.js.org',
    description: 'Fast 2kB alternative to Moment.js with largely compatible API.',
    signatures: {
      globals: ['dayjs'],
      scripts: [/dayjs(?:\.min)?\.js/]
    }
  },
  {
    id: 'rxjs',
    name: 'RxJS',
    category: 'LIBRARY',
    website: 'https://rxjs.dev',
    description: 'Reactive Extensions library for JavaScript utilizing Observables.',
    signatures: {
      globals: ['rxjs'],
      scripts: [/rxjs(?:\.min)?\.js/]
    }
  },

  // ==========================================
  // 5. BUILD TOOLS & BUNDLERS
  // ==========================================
  {
    id: 'vite',
    name: 'Vite',
    category: 'BUILD_TOOL',
    website: 'https://vitejs.dev',
    description: 'Next-generation frontend tooling providing lightning-fast dev server and Rollup builds.',
    signatures: {
      globals: ['__vite_plugin_react_preamble_installed__'],
      scripts: [/@vite\/client/, /\/vite\/client/],
      dom: ['script[type="module"][src*="@vite/client"]']
    }
  },
  {
    id: 'webpack',
    name: 'Webpack',
    category: 'BUILD_TOOL',
    website: 'https://webpack.js.org',
    description: 'Static module bundler for modern JavaScript applications.',
    signatures: {
      globals: ['webpackChunk', 'webpackJsonp'],
      scripts: [/webpack-runtime/i, /bundle(?:\.[a-z0-9]+)?\.js/i]
    }
  },
  {
    id: 'turbopack',
    name: 'Turbopack',
    category: 'BUILD_TOOL',
    website: 'https://turbo.build/pack',
    description: 'Incremental Rust-based bundler optimized for Next.js.',
    signatures: {
      globals: ['__turbopack__', '__TURBOPACK__'],
      scripts: [/_turbopack/i]
    }
  },

  // ==========================================
  // 6. CONTENT MANAGEMENT SYSTEMS (CMS)
  // ==========================================
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'CMS',
    website: 'https://wordpress.org',
    description: 'Open-source Content Management System powering over 40% of the web.',
    signatures: {
      dom: ['link[rel*="wp-"]', 'script[src*="/wp-content/"]', 'script[src*="/wp-includes/"]'],
      scripts: [/\/wp-content\//, /\/wp-includes\//],
      meta: [{ name: 'generator', content: /WordPress/i }],
      headers: { 'x-powered-by': /WordPress/i }
    }
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'CMS',
    website: 'https://www.shopify.com',
    description: 'Leading hosted multi-channel commerce platform.',
    signatures: {
      globals: ['Shopify', 'ShopifyAnalytics'],
      dom: ['script[src*="cdn.shopify.com"]'],
      scripts: [/cdn\.shopify\.com/],
      meta: []
    }
  },
  {
    id: 'webflow',
    name: 'Webflow',
    category: 'CMS',
    website: 'https://webflow.com',
    description: 'Visual web design platform and hosting engine.',
    signatures: {
      globals: ['Webflow'],
      dom: ['html[data-wf-page]', 'html[data-wf-site]'],
      scripts: [/webflow(?:\.[a-z0-9]+)?\.js/],
      meta: [{ name: 'generator', content: /Webflow/i }]
    }
  },
  {
    id: 'wix',
    name: 'Wix',
    category: 'CMS',
    website: 'https://www.wix.com',
    description: 'Cloud-based website builder and hosting service.',
    signatures: {
      globals: ['wixBiSession'],
      dom: ['meta[name="generator"][content*="Wix"]'],
      scripts: [/static\.parastorage\.com/],
      meta: [{ name: 'generator', content: /Wix/i }]
    }
  },
  {
    id: 'drupal',
    name: 'Drupal',
    category: 'CMS',
    website: 'https://www.drupal.org',
    description: 'Modular enterprise open-source PHP CMS.',
    signatures: {
      globals: ['Drupal'],
      dom: ['script[src*="/sites/default/files/"]'],
      scripts: [/\/core\/misc\/drupal\.js/],
      meta: [{ name: 'generator', content: /Drupal/i }],
      headers: { 'x-drupal-cache': /.+/i, 'x-generator': /Drupal/i }
    }
  },
  {
    id: 'ghost',
    name: 'Ghost',
    category: 'CMS',
    website: 'https://ghost.org',
    description: 'Modern Node.js-based publishing platform for professional creators.',
    signatures: {
      meta: [{ name: 'generator', content: /Ghost/i }],
      headers: { 'x-ghost-cache-status': /.+/i }
    }
  },

  // ==========================================
  // 7. ANALYTICS & TAG MANAGERS
  // ==========================================
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    category: 'ANALYTICS',
    website: 'https://analytics.google.com',
    description: 'Comprehensive digital analytics platform by Google.',
    signatures: {
      globals: ['gtag', 'ga', 'GoogleAnalyticsObject'],
      scripts: [/google-analytics\.com\/analytics\.js/, /googletagmanager\.com\/gtag\/js/]
    }
  },
  {
    id: 'google-tag-manager',
    name: 'Google Tag Manager',
    category: 'ANALYTICS',
    website: 'https://tagmanager.google.com',
    description: 'Tag management system that allows updating measurement codes and tracking tags.',
    signatures: {
      globals: ['google_tag_manager', 'dataLayer'],
      scripts: [/googletagmanager\.com\/gtm\.js/]
    }
  },
  {
    id: 'meta-pixel',
    name: 'Meta Pixel',
    category: 'ANALYTICS',
    website: 'https://developers.facebook.com',
    description: 'Analytics tool for measuring advertising effectiveness and tracking visitor actions on Facebook/Instagram.',
    signatures: {
      globals: ['fbq', '_fbq'],
      scripts: [/connect\.facebook\.net\/.+\/fbevents\.js/]
    }
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    category: 'ANALYTICS',
    website: 'https://www.hotjar.com',
    description: 'Product experience insights platform with heatmaps and session recordings.',
    signatures: {
      globals: ['hj', '_hjSettings'],
      scripts: [/static\.hotjar\.com/]
    }
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    category: 'ANALYTICS',
    website: 'https://mixpanel.com',
    description: 'Self-serve product analytics solution for tracking user events.',
    signatures: {
      globals: ['mixpanel'],
      scripts: [/cdn\.mxpnl\.com/]
    }
  },
  {
    id: 'segment',
    name: 'Segment',
    category: 'ANALYTICS',
    website: 'https://segment.com',
    description: 'Customer Data Platform (CDP) for collecting and routing event telemetry.',
    signatures: {
      globals: ['analytics'],
      scripts: [/cdn\.segment\.com\/analytics\.js/]
    }
  },
  {
    id: 'clarity',
    name: 'Microsoft Clarity',
    category: 'ANALYTICS',
    website: 'https://clarity.microsoft.com',
    description: 'Free behavioral analytics tool that captures heatmaps and session replay.',
    signatures: {
      globals: ['clarity'],
      scripts: [/www\.clarity\.ms\/tag\//]
    }
  },

  // ==========================================
  // 8. PAYMENTS
  // ==========================================
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'PAYMENT',
    website: 'https://stripe.com',
    description: 'Global financial infrastructure and payment processing platform.',
    signatures: {
      globals: ['Stripe'],
      scripts: [/js\.stripe\.com\/v\d+/]
    }
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'PAYMENT',
    website: 'https://www.paypal.com',
    description: 'Worldwide online payments system supporting online money transfers.',
    signatures: {
      globals: ['paypal'],
      scripts: [/www\.paypalobjects\.com\/api\/checkout\.js/, /www\.paypal\.com\/sdk\/js/]
    }
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    category: 'PAYMENT',
    website: 'https://razorpay.com',
    description: 'Full-stack financial solutions and payment gateway.',
    signatures: {
      globals: ['Razorpay'],
      scripts: [/checkout\.razorpay\.com\/v\d+\/checkout\.js/]
    }
  },

  // ==========================================
  // 9. MONITORING & ERROR TRACKING
  // ==========================================
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'MONITORING',
    website: 'https://sentry.io',
    description: 'Application performance monitoring and error tracking software.',
    signatures: {
      globals: ['Sentry', '__SENTRY__'],
      scripts: [/browser\.sentry-cdn\.com/]
    }
  },
  {
    id: 'datadog',
    name: 'Datadog RUM',
    category: 'MONITORING',
    website: 'https://www.datadoghq.com',
    description: 'Real User Monitoring and application performance monitoring platform.',
    signatures: {
      globals: ['DD_RUM'],
      scripts: [/www\.datadoghq-browser-agent\.com/]
    }
  },

  // ==========================================
  // 10. CLOUD & CDN INFRASTRUCTURE
  // ==========================================
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'CLOUD',
    website: 'https://www.cloudflare.com',
    description: 'Global edge network providing CDN, DDoS protection, DNS, and serverless compute.',
    signatures: {
      headers: {
        'cf-ray': /.+/i,
        'server': /cloudflare/i,
        'cf-cache-status': /.+/i
      }
    }
  },
  {
    id: 'aws-cloudfront',
    name: 'AWS CloudFront',
    category: 'CLOUD',
    website: 'https://aws.amazon.com/cloudfront',
    description: 'Global content delivery network (CDN) service built for high performance and developer friendliness.',
    signatures: {
      headers: {
        'x-amz-cf-id': /.+/i,
        'x-amz-cf-pop': /.+/i,
        'via': /CloudFront/i
      }
    }
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'CLOUD',
    website: 'https://vercel.com',
    description: 'Frontend cloud platform combining developer experience with edge deployment.',
    signatures: {
      headers: {
        'x-vercel-id': /.+/i,
        'server': /Vercel/i
      }
    }
  },
  {
    id: 'netlify',
    name: 'Netlify',
    category: 'CLOUD',
    website: 'https://www.netlify.com',
    description: 'Serverless platform for composable web architectures.',
    signatures: {
      headers: {
        'x-nf-request-id': /.+/i,
        'server': /Netlify/i
      }
    }
  },
  {
    id: 'fastly',
    name: 'Fastly',
    category: 'CLOUD',
    website: 'https://www.fastly.com',
    description: 'Edge cloud platform offering real-time CDN and compute at edge.',
    signatures: {
      headers: {
        'x-fastly-request-id': /.+/i,
        'x-served-by': /cache-/i,
        'via': /varnish/i
      }
    }
  },
  {
    id: 'akamai',
    name: 'Akamai',
    category: 'CLOUD',
    website: 'https://www.akamai.com',
    description: 'Global distributed computing and CDN edge delivery network.',
    signatures: {
      headers: {
        'x-akamai-transformed': /.+/i,
        'server': /AkamaiGHost/i
      }
    }
  }
];
