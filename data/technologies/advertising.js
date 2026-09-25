// data/technologies/advertising.js
// Signatures for ad networks, header bidding platforms, and exchange integrations.

export const ADVERTISING_TECHNOLOGIES = [
  {
    id: 'google-ads',
    name: 'Google Ads',
    category: 'Advertising',
    website: 'https://ads.google.com',
    description: 'Online advertising platform developed by Google for sponsored search and display.',
    signatures: {
      scripts: [/googleadservices\.com\/pagead\/conversion/i, /www\.googletagmanager\.com\/gtag\/js\?id=AW-/i],
      cookies: [/^_gcl_aw$/i, /^_gcl_dc$/i]
    }
  },
  {
    id: 'google-adsense',
    name: 'Google AdSense',
    category: 'Advertising',
    website: 'https://adsense.google.com',
    description: 'Monetization platform delivering contextual ads on publisher websites.',
    signatures: {
      globals: ['adsbygoogle'],
      dom: ['ins.adsbygoogle'],
      scripts: [/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i]
    }
  },
  {
    id: 'google-ad-manager',
    name: 'Google Ad Manager (DFP)',
    category: 'Advertising',
    website: 'https://admanager.google.com',
    description: 'Ad management platform for publishers to manage and serve direct and programmatic ads.',
    signatures: {
      globals: ['googletag'],
      scripts: [/securepubads\.g\.doubleclick\.net\/tag\/js\/gpt\.js/i]
    }
  },
  {
    id: 'amazon-ads',
    name: 'Amazon Advertising',
    category: 'Advertising',
    website: 'https://advertising.amazon.com',
    description: 'Programmatic and display advertising platform across Amazon properties.',
    signatures: {
      globals: ['apstag'],
      scripts: [/c\.amazon-adsystem\.com\/aax2\/apstag\.js/i]
    }
  },
  {
    id: 'criteo',
    name: 'Criteo',
    category: 'Advertising',
    website: 'https://www.criteo.com',
    description: 'Commerce media platform providing personalized retargeting display ads.',
    signatures: {
      globals: ['criteo_q'],
      scripts: [/static\.criteo\.net\/js\/ld\/ld\.js/i]
    }
  },
  {
    id: 'prebid',
    name: 'Prebid.js',
    category: 'Advertising',
    website: 'https://prebid.org',
    description: 'Free and open-source header bidding suite for publishers.',
    signatures: {
      globals: ['pbjs'],
      scripts: [/prebid(?:\.min)?\.js/i]
    }
  },
  {
    id: 'taboola',
    name: 'Taboola',
    category: 'Advertising',
    website: 'https://www.taboola.com',
    description: 'Content discovery and native advertising platform for publishers.',
    signatures: {
      globals: ['_taboola'],
      scripts: [/cdn\.taboola\.com\/libtrc\//i]
    }
  },
  {
    id: 'outbrain',
    name: 'Outbrain',
    category: 'Advertising',
    website: 'https://www.outbrain.com',
    description: 'Web recommendation and native advertising feed provider.',
    signatures: {
      globals: ['OBR'],
      scripts: [/widgets\.outbrain\.com\/outbrain\.js/i]
    }
  }
];
