// src/privacy/privacy-analyzer.js
// Synthesizes cookie audits, storage metrics, browser API usage, and trackers into an overarching privacy posture.

import { CookieAnalyzer } from './cookie-analyzer.js';
import { StorageAnalyzer } from './storage-analyzer.js';
import { BrowserApiAnalyzer } from './browser-api-analyzer.js';
import { TrackerDetector } from './tracker-detector.js';

export class PrivacyAnalyzer {
  /**
   * Produce comprehensive privacy intelligence report.
   * @param {object} sessionSnapshot
   * @param {Array<object>} rawCookies
   * @returns {object} Privacy Profile
   */
  static analyze(sessionSnapshot, rawCookies = []) {
    const { primaryApex, requests = [], runtime = {} } = sessionSnapshot;

    const cookieReport = CookieAnalyzer.analyze(rawCookies, primaryApex);
    const storageReport = StorageAnalyzer.analyze(runtime.storage);
    const apiReport = BrowserApiAnalyzer.analyze(runtime.permissions);
    const trackerReport = TrackerDetector.detect(requests);

    // Compute Privacy Surface Score (100 = minimal privacy exposure, <50 = heavy tracking)
    let score = 100;
    score -= Math.min(30, trackerReport.length * 6);
    score -= Math.min(20, cookieReport.thirdParty * 3);
    score -= Math.min(15, cookieReport.issues.length * 4);
    score -= Math.min(15, apiReport.grantedCount * 5);
    score = Math.max(10, Math.min(100, score));

    return {
      score,
      rating: score >= 80 ? 'EXCELLENT' : score >= 60 ? 'MODERATE' : 'INVASIVE',
      trackers: trackerReport,
      trackerCount: trackerReport.length,
      cookies: cookieReport,
      storage: storageReport,
      browserApis: apiReport,
      summary: {
        totalTrackers: trackerReport.length,
        thirdPartyCookies: cookieReport.thirdParty,
        privacyScore: score
      }
    };
  }
}
