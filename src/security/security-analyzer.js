// src/security/security-analyzer.js
// Comprehensive security posture auditor and vulnerability heuristic evaluator.

import { HeaderAnalyzer } from './header-analyzer.js';
import { MixedContentDetector } from './mixed-content.js';
import { CorsAnalyzer } from './cors-analyzer.js';

export class SecurityAnalyzer {
  /**
   * Produce comprehensive security audit.
   * @param {object} sessionSnapshot
   * @param {Array<object>} rawCookies
   * @returns {object} Security Profile
   */
  static analyze(sessionSnapshot, rawCookies = []) {
    const { security = {}, requests = [] } = sessionSnapshot;
    const isHttps = !!security.isHttps;
    const rawHeaders = security.headers || {};

    const headerReport = HeaderAnalyzer.analyze(rawHeaders);
    const mixedReport = MixedContentDetector.detect(requests, isHttps);
    const corsReport = CorsAnalyzer.analyze(rawHeaders);

    const allFindings = [...headerReport.findings, ...corsReport.issues];

    if (!isHttps) {
      allFindings.unshift({
        header: 'Transport',
        severity: 'CRITICAL',
        title: 'Plaintext Unencrypted HTTP Connection',
        description: 'Communication is transmitted unencrypted, exposing all traffic to network eavesdropping and tampering.'
      });
    }

    if (mixedReport.length > 0) {
      allFindings.push({
        header: 'Mixed Content',
        severity: 'HIGH',
        title: `${mixedReport.length} Mixed Content Subresources Detected`,
        description: 'Page requested unencrypted HTTP assets despite loading over an HTTPS connection.'
      });
    }

    // Security Score (0 to 100)
    let score = 100;
    if (!isHttps) score -= 40;
    allFindings.forEach(f => {
      if (f.severity === 'CRITICAL') score -= 25;
      else if (f.severity === 'HIGH') score -= 15;
      else if (f.severity === 'MEDIUM') score -= 8;
      else if (f.severity === 'LOW') score -= 4;
    });
    score = Math.max(10, Math.min(100, score));

    return {
      score,
      grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'F',
      isHttps,
      headers: headerReport,
      mixedContent: mixedReport,
      cors: corsReport,
      findings: allFindings,
      totalFindings: allFindings.length
    };
  }
}
