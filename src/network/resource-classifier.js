// src/network/resource-classifier.js
// Classifies network requests into granular functional categories.

import { UrlUtils } from '../utils/url-utils.js';

export const RESOURCE_CATEGORIES = {
  DOCUMENT: 'DOCUMENT',
  SCRIPT: 'SCRIPT',
  STYLESHEET: 'STYLESHEET',
  IMAGE: 'IMAGE',
  FONT: 'FONT',
  XHR: 'XHR',
  FETCH: 'FETCH',
  MEDIA: 'MEDIA',
  WEBSOCKET: 'WEBSOCKET',
  API: 'API',
  TRACKER: 'TRACKER',
  ANALYTICS: 'ANALYTICS',
  AD: 'AD',
  CDN: 'CDN',
  PAYMENT: 'PAYMENT',
  AUTHENTICATION: 'AUTHENTICATION',
  UNKNOWN: 'UNKNOWN'
};

// Known domain / URL patterns for specialized categories
const PATTERNS = {
  ANALYTICS: [
    /google-analytics\.com/,
    /googletagmanager\.com/,
    /analytics\.google\.com/,
    /mixpanel\.com/,
    /hotjar\.com/,
    /clarity\.ms/,
    /segment\.io/,
    /segment\.com/,
    /amplitude\.com/,
    /heap\.io/,
    /newrelic\.com/,
    /sentry\.io/,
    /datadoghq\.com/
  ],
  AD: [
    /doubleclick\.net/,
    /googlesyndication\.com/,
    /adnxs\.com/,
    /criteo\.com/,
    /pubmatic\.com/,
    /rubiconproject\.com/,
    /taboola\.com/,
    /outbrain\.com/,
    /amazon-adsystem\.com/
  ],
  PAYMENT: [
    /stripe\.com/,
    /paypal\.com/,
    /braintreegateway\.com/,
    /razorpay\.com/,
    /adyen\.com/,
    /checkout\.com/,
    /squareupsandbox\.com/,
    /squareup\.com/
  ],
  AUTH: [
    /auth0\.com/,
    /okta\.com/,
    /clerk\.dev/,
    /firebaseauth\.googleapis\.com/,
    /identitytoolkit\.googleapis\.com/,
    /\/oauth\//,
    /\/login/,
    /\/signin/,
    /\/token/,
    /\/session/
  ],
  API: [
    /\/api\//,
    /\/graphql/,
    /\/gql/,
    /\/v\d+\//,
    /\/rest\//,
    /\/rpc\//,
    /\/trpc\//,
    /\/services\//,
    /\/endpoints\//
  ]
};

export class ResourceClassifier {
  /**
   * Classify a network request based on all available metadata.
   * @param {object} req - Request object with url, type, method, headers, etc.
   * @returns {string} One of RESOURCE_CATEGORIES
   */
  static classify(req) {
    if (!req || !req.url) return RESOURCE_CATEGORIES.UNKNOWN;
    const url = req.url.toLowerCase();
    const type = (req.type || '').toLowerCase();

    // 1. WebSocket check
    if (type === 'websocket' || url.startsWith('ws://') || url.startsWith('wss://')) {
      return RESOURCE_CATEGORIES.WEBSOCKET;
    }

    // 2. High-priority specialized domain patterns (Ad, Analytics, Payment, Auth)
    for (const pat of PATTERNS.AD) {
      if (pat.test(url)) return RESOURCE_CATEGORIES.AD;
    }
    for (const pat of PATTERNS.ANALYTICS) {
      if (pat.test(url)) return RESOURCE_CATEGORIES.ANALYTICS;
    }
    for (const pat of PATTERNS.PAYMENT) {
      if (pat.test(url)) return RESOURCE_CATEGORIES.PAYMENT;
    }
    for (const pat of PATTERNS.AUTH) {
      if (pat.test(url)) return RESOURCE_CATEGORIES.AUTHENTICATION;
    }

    // 3. API endpoint patterns (XHR / Fetch / GraphQL / REST)
    for (const pat of PATTERNS.API) {
      if (pat.test(url)) return RESOURCE_CATEGORIES.API;
    }

    // 4. Chrome webRequest type matching
    if (type === 'main_frame' || type === 'sub_frame') {
      return RESOURCE_CATEGORIES.DOCUMENT;
    }
    if (type === 'script') {
      return RESOURCE_CATEGORIES.SCRIPT;
    }
    if (type === 'stylesheet') {
      return RESOURCE_CATEGORIES.STYLESHEET;
    }
    if (type === 'image') {
      return RESOURCE_CATEGORIES.IMAGE;
    }
    if (type === 'font') {
      return RESOURCE_CATEGORIES.FONT;
    }
    if (type === 'media') {
      return RESOURCE_CATEGORIES.MEDIA;
    }
    if (type === 'xmlhttprequest') {
      return RESOURCE_CATEGORIES.XHR;
    }

    // 5. File extension fallback
    const ext = UrlUtils.getExtension(url);
    if (['js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx'].includes(ext)) {
      return RESOURCE_CATEGORIES.SCRIPT;
    }
    if (['css', 'scss', 'less'].includes(ext)) {
      return RESOURCE_CATEGORIES.STYLESHEET;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif', 'ico'].includes(ext)) {
      return RESOURCE_CATEGORIES.IMAGE;
    }
    if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext)) {
      return RESOURCE_CATEGORIES.FONT;
    }
    if (['mp4', 'webm', 'ogg', 'mp3', 'wav', 'flac'].includes(ext)) {
      return RESOURCE_CATEGORIES.MEDIA;
    }
    if (['json'].includes(ext)) {
      return RESOURCE_CATEGORIES.API;
    }

    return RESOURCE_CATEGORIES.UNKNOWN;
  }
}
