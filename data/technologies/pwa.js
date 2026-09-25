// data/technologies/pwa.js
// Signatures for Progressive Web App capabilities, manifest, and offline readiness.

export const PWA_TECHNOLOGIES = [
  {
    id: 'pwa',
    name: 'Progressive Web App (PWA)',
    category: 'PWA',
    website: 'https://web.dev/explore/progressive-web-apps',
    description: 'Web application leveraging modern web capabilities to deliver app-like user experiences.',
    signatures: {
      pwaSignals: ['manifest', 'serviceWorker', 'themeColor'],
      dom: ['link[rel="manifest"]', 'meta[name="theme-color"]', 'meta[name="apple-mobile-web-app-capable"]']
    }
  },
  {
    id: 'web-app-manifest',
    name: 'Web App Manifest',
    category: 'PWA',
    website: 'https://developer.mozilla.org/en-US/docs/Web/Manifest',
    description: 'JSON file providing information about browser application icon, name, display mode, and orientation.',
    signatures: {
      dom: ['link[rel="manifest"]'],
      apis: [/manifest\.json(?:\?|$)/i, /manifest\.webmanifest(?:\?|$)/i]
    }
  }
];
