// data/technologies/cms.js
// Signatures for Content Management Systems and headless content platforms.

export const CMS_TECHNOLOGIES = [
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'CMS',
    website: 'https://wordpress.org',
    description: 'Free and open-source content management system written in PHP.',
    signatures: {
      globals: ['wp', '_wpemojiSettings', 'wpColorPicker'],
      dom: ['link[rel*="wp-content"]', 'link[href*="wp-includes"]'],
      scripts: [/\/wp-content\//i, /\/wp-includes\//i],
      headers: {
        'x-pingback': /\/xmlrpc\.php/i,
        'link': /wp-json/i
      },
      meta: [{ name: 'generator', content: /WordPress/i }]
    }
  },
  {
    id: 'drupal',
    name: 'Drupal',
    category: 'CMS',
    website: 'https://www.drupal.org',
    description: 'Open source content management platform supporting diverse websites.',
    signatures: {
      globals: ['Drupal', 'drupalSettings'],
      dom: ['script[data-drupal-selector]'],
      headers: {
        'x-drupal-cache': /.+/i,
        'x-generator': /Drupal/i
      },
      meta: [{ name: 'generator', content: /Drupal/i }]
    }
  },
  {
    id: 'joomla',
    name: 'Joomla',
    category: 'CMS',
    website: 'https://www.joomla.org',
    description: 'Open source CMS powering web applications and publishing.',
    signatures: {
      globals: ['Joomla'],
      scripts: [/\/media\/jui\//i, /\/media\/system\/js\//i],
      meta: [{ name: 'generator', content: /Joomla/i }]
    }
  },
  {
    id: 'ghost',
    name: 'Ghost',
    category: 'CMS',
    website: 'https://ghost.org',
    description: 'Independent technology platform for modern publishing and journalism.',
    signatures: {
      dom: ['meta[name="generator"][content*="Ghost"]'],
      meta: [{ name: 'generator', content: /Ghost/i }],
      scripts: [/\/public\/ghost-sdk/i]
    }
  },
  {
    id: 'webflow',
    name: 'Webflow',
    category: 'CMS',
    website: 'https://webflow.com',
    description: 'Visual web development platform for responsive websites.',
    signatures: {
      globals: ['Webflow'],
      dom: ['html[data-wf-page]', 'html[data-wf-site]'],
      scripts: [/webflow(?:\.[a-z0-9]+)?\.js/i],
      meta: [{ name: 'generator', content: /Webflow/i }]
    }
  },
  {
    id: 'wix',
    name: 'Wix',
    category: 'CMS',
    website: 'https://www.wix.com',
    description: 'Cloud-based web development platform.',
    signatures: {
      globals: ['wixBiSession', 'wixPerformanceMeasurements'],
      dom: ['#SITE_CONTAINER', 'meta[http-equiv="X-Wix-Renderer-Server"]'],
      meta: [{ name: 'generator', content: /Wix\.com Website Builder/i }]
    }
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    category: 'CMS',
    website: 'https://www.squarespace.com',
    description: 'All-in-one CMS and website building solution.',
    signatures: {
      globals: ['Static', 'Squarespace'],
      dom: ['html[id^="yui_"]', 'body[class*="squarespace"]'],
      scripts: [/squarespace/i]
    }
  },
  {
    id: 'contentful',
    name: 'Contentful',
    category: 'CMS',
    website: 'https://www.contentful.com',
    description: 'Composable content platform for digital experiences.',
    signatures: {
      scripts: [/contentful/i],
      apis: [/cdn\.contentful\.com/i]
    }
  },
  {
    id: 'sanity',
    name: 'Sanity',
    category: 'CMS',
    website: 'https://www.sanity.io',
    description: 'Platform for structured content that powers collaborative digital applications.',
    signatures: {
      apis: [/api\.sanity\.io/i, /cdn\.sanity\.io/i]
    }
  },
  {
    id: 'strapi',
    name: 'Strapi',
    category: 'CMS',
    website: 'https://strapi.io',
    description: 'Leading open-source headless CMS 100% JavaScript / TypeScript.',
    signatures: {
      globals: ['strapi'],
      headers: {
        'x-powered-by': /Strapi/i
      }
    }
  },
  {
    id: 'storyblok',
    name: 'Storyblok',
    category: 'CMS',
    website: 'https://www.storyblok.com',
    description: 'Headless CMS with a visual editor for developers and marketers.',
    signatures: {
      globals: ['storyblok'],
      apis: [/api\.storyblok\.com/i]
    }
  }
];
