// src/privacy/tracker-detector.js
// Identifies third-party trackers, behavioral telemetry, and advertising networks.

import { UrlUtils } from '../utils/url-utils.js';

const TRACKER_REGISTRY = [
  { name: 'Google Ads / DoubleClick', category: 'ADVERTISING', pattern: /doubleclick\.net|googleadservices\.com|googlesyndication\.com/ },
  { name: 'Meta Pixel & Tracking', category: 'SOCIAL_TRACKER', pattern: /connect\.facebook\.net|facebook\.com\/tr/ },
  { name: 'Criteo Retargeting', category: 'ADVERTISING', pattern: /criteo\.com|criteo\.net/ },
  { name: 'TikTok Pixel', category: 'SOCIAL_TRACKER', pattern: /analytics\.tiktok\.com/ },
  { name: 'Twitter / X Analytics', category: 'SOCIAL_TRACKER', pattern: /static\.ads-twitter\.com|t\.co/ },
  { name: 'LinkedIn Insight Tag', category: 'SOCIAL_TRACKER', pattern: /snap\.licdn\.com/ },
  { name: 'Pinterest Tag', category: 'SOCIAL_TRACKER', pattern: /ct\.pinterest\.com/ },
  { name: 'Amazon AdSystem', category: 'ADVERTISING', pattern: /amazon-adsystem\.com/ },
  { name: 'Taboola Native Ads', category: 'CONTENT_RECOMMENDATION', pattern: /taboola\.com/ },
  { name: 'Outbrain Recommendation', category: 'CONTENT_RECOMMENDATION', pattern: /outbrain\.com/ },
  { name: 'The Trade Desk', category: 'AD_EXCHANGE', pattern: /adsrvr\.org/ },
  { name: 'Hotjar Behavioral Tracking', category: 'SESSION_REPLAY', pattern: /hotjar\.com/ },
  { name: 'Microsoft Clarity Replay', category: 'SESSION_REPLAY', pattern: /clarity\.ms/ },
  { name: 'AppsFlyer Attribution', category: 'ATTRIBUTION', pattern: /appsflyer\.com/ }
];

export class TrackerDetector {
  /**
   * Scan network requests and return detected trackers.
   * @param {Array<object>} requests
   * @returns {Array<object>} Detected trackers
   */
  static detect(requests) {
    const detected = new Map();

    for (const req of requests) {
      const url = req.url || '';
      for (const tracker of TRACKER_REGISTRY) {
        if (tracker.pattern.test(url)) {
          if (!detected.has(tracker.name)) {
            detected.set(tracker.name, {
              name: tracker.name,
              category: tracker.category,
              requestCount: 0,
              domains: new Set(),
              sampleUrl: url
            });
          }
          const item = detected.get(tracker.name);
          item.requestCount++;
          const host = req.host || UrlUtils.getHostname(url);
          if (host) item.domains.add(host);
        }
      }
    }

    return Array.from(detected.values()).map(t => ({
      ...t,
      domains: Array.from(t.domains)
    }));
  }
}
