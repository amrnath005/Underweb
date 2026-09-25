// data/technologies/analytics.js
// Signatures for analytics, product telemetry, and monitoring services.

export const ANALYTICS_TECHNOLOGIES = [
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    category: 'Analytics',
    website: 'https://analytics.google.com',
    description: 'Web analytics service offering statistics and basic analytical tools for SEO and marketing.',
    signatures: {
      globals: ['gtag', 'ga', 'GoogleAnalyticsObject'],
      scripts: [/google-analytics\.com\/analytics\.js/i, /googletagmanager\.com\/gtag\/js/i],
      cookies: [/^_ga$/i, /^_gid$/i, /^_gat_/i],
      apis: [/google-analytics\.com\/g\/collect/i, /google-analytics\.com\/collect/i]
    }
  },
  {
    id: 'google-tag-manager',
    name: 'Google Tag Manager',
    category: 'Analytics',
    website: 'https://tagmanager.google.com',
    description: 'Tag management system that allows updating measurement codes and related code fragments.',
    signatures: {
      globals: ['dataLayer', 'google_tag_manager'],
      scripts: [/googletagmanager\.com\/gtm\.js/i]
    }
  },
  {
    id: 'meta-pixel',
    name: 'Meta Pixel',
    category: 'Analytics',
    website: 'https://www.facebook.com/business/tools/meta-pixel',
    description: 'Analytics tool that allows measuring the effectiveness of advertising by understanding actions on site.',
    signatures: {
      globals: ['fbq', '_fbq'],
      scripts: [/connect\.facebook\.net\/[a-zA-Z_]+\/fbevents\.js/i],
      cookies: [/^_fbp$/i, /^_fbc$/i],
      apis: [/facebook\.com\/tr\//i]
    }
  },
  {
    id: 'clarity',
    name: 'Microsoft Clarity',
    category: 'Analytics',
    website: 'https://clarity.microsoft.com',
    description: 'Behavioral analytics tool that helps understand user interaction through session replays and heatmaps.',
    signatures: {
      globals: ['clarity'],
      scripts: [/clarity\.ms\/tag\//i],
      cookies: [/^_clck$/i, /^_clsk$/i],
      apis: [/clarity\.ms\/collect/i]
    }
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    category: 'Analytics',
    website: 'https://www.hotjar.com',
    description: 'Product experience insights platform providing behavior analytics through heatmaps and recordings.',
    signatures: {
      globals: ['hj', '_hjSettings'],
      scripts: [/static\.hotjar\.com\/c\/hotjar-/i],
      cookies: [/^_hjSession/i, /^_hjIncludedIn/i]
    }
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    category: 'Analytics',
    website: 'https://amplitude.com',
    description: 'Digital analytics platform helping companies understand user behavior and optimize products.',
    signatures: {
      globals: ['amplitude'],
      scripts: [/cdn\.amplitude\.com\/libs\//i],
      apis: [/api(?:2)?\.amplitude\.com/i]
    }
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    category: 'Analytics',
    website: 'https://mixpanel.com',
    description: 'Product analytics tool that helps companies analyze user actions with individual and group events.',
    signatures: {
      globals: ['mixpanel'],
      scripts: [/cdn\.mxpnl\.com\/libs\/mixpanel/i],
      apis: [/api\.mixpanel\.com\/track/i]
    }
  },
  {
    id: 'segment',
    name: 'Segment',
    category: 'Analytics',
    website: 'https://segment.com',
    description: 'Customer data platform (CDP) that helps collect, clean, and activate customer data.',
    signatures: {
      globals: ['analytics'],
      scripts: [/cdn\.segment\.com\/analytics\.js/i],
      cookies: [/^ajs_user_id$/i, /^ajs_anonymous_id$/i],
      apis: [/api\.segment\.io\/v1/i]
    }
  },
  {
    id: 'posthog',
    name: 'PostHog',
    category: 'Analytics',
    website: 'https://posthog.com',
    description: 'Open-source product analytics suite with session replay, feature flags, and heatmaps.',
    signatures: {
      globals: ['posthog'],
      scripts: [/\/static\/array\.js/i],
      cookies: [/^ph_[a-zA-Z0-9_-]+_posthog$/i],
      apis: [/\/e\/\?ip=1/i, /app\.posthog\.com\/e/i]
    }
  },
  {
    id: 'plausible',
    name: 'Plausible Analytics',
    category: 'Analytics',
    website: 'https://plausible.io',
    description: 'Intuitive, lightweight and open-source web analytics without cookies or personal data tracking.',
    signatures: {
      globals: ['plausible'],
      scripts: [/plausible\.io\/js\/script/i],
      apis: [/plausible\.io\/api\/event/i]
    }
  },
  {
    id: 'matomo',
    name: 'Matomo',
    category: 'Analytics',
    website: 'https://matomo.org',
    description: 'Open-source web analytics platform with 100% data ownership.',
    signatures: {
      globals: ['_paq', 'Matomo'],
      scripts: [/matomo\.js/i, /piwik\.js/i],
      cookies: [/^_pk_ref/i, /^_pk_id/i, /^_pk_ses/i]
    }
  },
  {
    id: 'fullstory',
    name: 'FullStory',
    category: 'Analytics',
    website: 'https://www.fullstory.com',
    description: 'Digital experience intelligence platform that captures user journeys and digital interactions.',
    signatures: {
      globals: ['FS', '_fs_loaded'],
      scripts: [/fullstory\.com\/s\/fs\.js/i],
      cookies: [/fs_uid/i]
    }
  },
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'Analytics',
    website: 'https://sentry.io',
    description: 'Application performance monitoring and error tracking software for developers.',
    signatures: {
      globals: ['Sentry', '__SENTRY__'],
      scripts: [/browser\.sentry-cdn\.com/i],
      apis: [/sentry\.io\/api\//i]
    }
  },
  {
    id: 'datadog-rum',
    name: 'Datadog RUM',
    category: 'Analytics',
    website: 'https://www.datadoghq.com/product/real-user-monitoring/',
    description: 'Real User Monitoring (RUM) giving end-to-end visibility into client application performance.',
    signatures: {
      globals: ['DD_RUM', 'DD_LOGS'],
      scripts: [/datadog-rum/i]
    }
  },
  {
    id: 'newrelic',
    name: 'New Relic Browser',
    category: 'Analytics',
    website: 'https://newrelic.com/products/browser-monitoring',
    description: 'Browser performance monitoring measuring frontend load times, JavaScript errors, and AJAX calls.',
    signatures: {
      globals: ['newrelic', 'NREUM'],
      scripts: [/nr-data\.net/i, /js-agent\.newrelic\.com/i]
    }
  },
  {
    id: 'logrocket',
    name: 'LogRocket',
    category: 'Analytics',
    website: 'https://logrocket.com',
    description: 'Frontend monitoring solution that records what users do on sites to reproduce bugs faster.',
    signatures: {
      globals: ['LogRocket', '_lr_loaded'],
      scripts: [/cdn\.logrocket\.io/i]
    }
  }
];
