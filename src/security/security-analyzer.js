// src/security/security-analyzer.js
// Evidence-grounded security posture auditor and vulnerability evaluator.
// Strictly separates Main Document security from subresources and third parties.
// Implements category-weighted scoring (100 pts) and assessment states (ASSESSED, PARTIALLY_ASSESSED, INSUFFICIENT_EVIDENCE).

import { HeaderAnalyzer } from './header-analyzer.js';
import { MixedContentDetector, MIXED_CONTENT_TYPES } from './mixed-content.js';
import { CorsAnalyzer } from './cors-analyzer.js';
import { CookieAnalyzer } from '../privacy/cookie-analyzer.js';
import { UrlUtils } from '../utils/url-utils.js';

export const SECURITY_STATES = {
  ASSESSED: 'ASSESSED',
  PARTIALLY_ASSESSED: 'PARTIALLY_ASSESSED',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE'
};

export class SecurityAnalyzer {
  /**
   * Produce comprehensive, evidence-grounded security audit.
   * @param {object} sessionSnapshot
   * @param {Array<object>} [rawCookies=[]]
   * @returns {object} Security Profile
   */
  static analyze(sessionSnapshot, rawCookies = []) {
    if (!sessionSnapshot) {
      return this._createInsufficientReport();
    }

    const {
      url = '',
      security = {},
      requests = [],
      primaryDomain = '',
      primaryApex = '',
      runtime = {}
    } = sessionSnapshot;

    // 1. Resolve Main Document URL & Protocol
    let mainUrl = url;
    let mainReq = requests.find(r => r.type === 'main_frame') || null;
    if (!mainUrl && mainReq && mainReq.url) {
      mainUrl = mainReq.url;
    }

    let mainProtocol = '';
    if (mainUrl) {
      try {
        mainProtocol = new URL(mainUrl).protocol;
      } catch {}
    }
    if (!mainProtocol && security.isHttps) {
      mainProtocol = 'https:';
    }

    // Determine HTTPS status of the MAIN DOCUMENT
    const isHttps = mainProtocol === 'https:' || (security.isHttps && mainProtocol !== 'http:');
    const isExplicitHttp = mainProtocol === 'http:';

    // 2. Resolve Main Document Response Headers
    let rawHeaders = security.headers && Object.keys(security.headers).length > 0
      ? security.headers
      : (mainReq && mainReq.responseHeaders ? mainReq.responseHeaders : {});

    const hasMainHeaders = Object.keys(rawHeaders).length > 0;

    // 3. Determine Assessment State
    let state = SECURITY_STATES.ASSESSED;
    if (!mainUrl && (!requests || requests.length === 0)) {
      state = SECURITY_STATES.INSUFFICIENT_EVIDENCE;
      return this._createInsufficientReport();
    } else if (!hasMainHeaders) {
      state = SECURITY_STATES.PARTIALLY_ASSESSED;
    }

    // 4. Run Specialized Analyzers
    const metaTags = runtime.domMetrics?.metaTags || {};
    const headerReport = HeaderAnalyzer.analyze(rawHeaders, isHttps, metaTags);
    const mixedReport = MixedContentDetector.detect(requests, isHttps, primaryDomain);
    const corsReport = CorsAnalyzer.analyze(rawHeaders);
    const cookieReport = CookieAnalyzer.analyze(rawCookies, primaryApex);

    const allFindings = [];

    // -------------------------------------------------------------
    // CATEGORY 1: Transport Security (Max 25 pts)
    // -------------------------------------------------------------
    let transportScore = 25;
    if (isExplicitHttp || (!isHttps && mainUrl)) {
      transportScore = 0;
      allFindings.push({
        id: 'PLAINTEXT_HTTP',
        category: 'TRANSPORT',
        header: 'Transport Security',
        severity: 'CRITICAL',
        scoreImpact: -25,
        scoreDeduction: 25,
        isMainDocument: true,
        resourceScope: 'MAIN_DOCUMENT',
        isFirstParty: true,
        partyScope: 'FIRST_PARTY',
        affectedUrl: mainUrl || primaryDomain,
        resourceType: 'main_frame',
        title: 'Plaintext Unencrypted HTTP Connection',
        observedValue: 'http://',
        observed: 'http://',
        expectedCondition: 'https:// with TLS 1.3/1.2',
        expected: 'https:// with TLS 1.3/1.2',
        evidenceSource: 'Main Document URL Protocol',
        description: 'The main document was transmitted over plaintext unencrypted HTTP. All requests, cookies, and content are exposed to network eavesdropping and tampering.'
      });
    }

    // -------------------------------------------------------------
    // CATEGORY 2: Security Headers (Max 30 pts)
    // -------------------------------------------------------------
    let headersScore = 30;
    if (hasMainHeaders) {
      headerReport.findings.forEach(f => {
        headersScore += f.scoreImpact;
        allFindings.push({
          ...f,
          affectedUrl: mainUrl,
          resourceType: 'main_frame',
          isFirstParty: true
        });
      });
      headersScore = Math.max(0, Math.min(30, headersScore));
    } else {
      // If headers were not captured in this service worker session, we do not deduct points
      headersScore = 30;
    }

    // -------------------------------------------------------------
    // CATEGORY 3: Mixed Content (Max 15 pts)
    // -------------------------------------------------------------
    let mixedScore = 15;
    let activeMixedCount = 0;
    let passiveMixedCount = 0;

    mixedReport.forEach(m => {
      if (m.type === MIXED_CONTENT_TYPES.ACTIVE) {
        activeMixedCount++;
        mixedScore -= 8;
      } else {
        passiveMixedCount++;
        mixedScore -= 2;
      }
      allFindings.push({
        category: 'MIXED_CONTENT',
        header: 'Mixed Content',
        severity: m.severity,
        scoreImpact: m.scoreImpact,
        isMainDocument: false,
        isFirstParty: m.firstParty,
        affectedUrl: m.url,
        resourceType: m.resourceType,
        title: m.title,
        observedValue: m.url,
        expectedCondition: 'https://',
        evidenceSource: 'Network Telemetry Subresource',
        description: m.description
      });
    });
    mixedScore = Math.max(0, Math.min(15, mixedScore));

    // -------------------------------------------------------------
    // CATEGORY 4: Cookie Security (Max 15 pts)
    // -------------------------------------------------------------
    let cookieScore = 15;
    if (rawCookies && rawCookies.length > 0 && isHttps) {
      const insecureCookies = rawCookies.filter(c => !c.secure);
      if (insecureCookies.length > 0) {
        const deduction = Math.min(10, insecureCookies.length * 3);
        cookieScore -= deduction;
        allFindings.push({
          category: 'COOKIES',
          header: 'Cookie Hygiene',
          severity: insecureCookies.length > 3 ? 'HIGH' : 'MEDIUM',
          scoreImpact: -deduction,
          isMainDocument: false,
          isFirstParty: true,
          affectedUrl: primaryDomain,
          resourceType: 'cookie',
          title: `${insecureCookies.length} Cookie${insecureCookies.length > 1 ? 's' : ''} Missing Secure Flag on HTTPS`,
          observedValue: insecureCookies.slice(0, 3).map(c => c.name).join(', ') + (insecureCookies.length > 3 ? '...' : ''),
          expectedCondition: 'Secure; SameSite=Lax (or Strict)',
          evidenceSource: 'Browser Cookie Store',
          description: 'Cookies missing the Secure flag can be leaked over plaintext HTTP requests or during mixed-content interactions.'
        });
      }

      // Check sensitive cookies missing HttpOnly
      const sensitiveMissingHttpOnly = rawCookies.filter(c => !c.httpOnly && /token|auth|sess|key/i.test(c.name));
      if (sensitiveMissingHttpOnly.length > 0) {
        cookieScore -= 4;
        allFindings.push({
          category: 'COOKIES',
          header: 'Cookie Hygiene',
          severity: 'MEDIUM',
          scoreImpact: -4,
          isMainDocument: false,
          isFirstParty: true,
          affectedUrl: primaryDomain,
          resourceType: 'cookie',
          title: 'Sensitive Session/Auth Cookies Accessible via JavaScript (Missing HttpOnly)',
          observedValue: sensitiveMissingHttpOnly.map(c => c.name).join(', '),
          expectedCondition: 'HttpOnly flag set on authentication tokens',
          evidenceSource: 'Browser Cookie Store',
          description: 'Session identifiers without the HttpOnly attribute can be exfiltrated by malicious scripts in the event of an XSS vulnerability.'
        });
      }
    }
    cookieScore = Math.max(0, Math.min(15, cookieScore));

    // -------------------------------------------------------------
    // CATEGORY 5: Origin Isolation & Policy Integrity (Max 15 pts)
    // -------------------------------------------------------------
    let isolationScore = 15;
    if (corsReport.issues && corsReport.issues.length > 0) {
      corsReport.issues.forEach(iss => {
        isolationScore -= 6;
        allFindings.push({
          category: 'CORS',
          header: 'CORS Configuration',
          severity: iss.severity,
          scoreImpact: -6,
          isMainDocument: true,
          isFirstParty: true,
          affectedUrl: mainUrl,
          resourceType: 'headers',
          title: iss.title,
          observedValue: 'Access-Control-Allow-Origin: * with Credentials',
          expectedCondition: 'Explicit non-wildcard origin when credentials are supported',
          evidenceSource: 'Main Document Headers',
          description: iss.description
        });
      });
    }
    isolationScore = Math.max(0, Math.min(15, isolationScore));

    // -------------------------------------------------------------
    // TOTAL SCORE & GRADE RESOLUTION
    // -------------------------------------------------------------
    const totalScore = Math.round(transportScore + headersScore + mixedScore + cookieScore + isolationScore);
    const boundedScore = Math.max(0, Math.min(100, totalScore));

    let grade = 'F';
    if (boundedScore >= 85) grade = 'A';
    else if (boundedScore >= 70) grade = 'B';
    else if (boundedScore >= 50) grade = 'C';
    else if (boundedScore >= 30) grade = 'D';
    else grade = 'F';

    // Student-friendly explanation
    let postureSummary = 'Security Posture: Excellent';
    if (state === SECURITY_STATES.PARTIALLY_ASSESSED) {
      postureSummary = 'Security Posture: Partially Assessed (Awaiting Document Headers)';
    } else if (grade === 'A') {
      postureSummary = 'Security Posture: Excellent (Defense-in-depth active)';
    } else if (grade === 'B') {
      postureSummary = 'Security Posture: Good (Solid baseline with minor recommendations)';
    } else if (grade === 'C') {
      postureSummary = 'Security Posture: Moderate Risk (Key defensive headers absent)';
    } else if (grade === 'D') {
      postureSummary = 'Security Posture: High Risk (Significant defensive omissions or active mixed content)';
    } else {
      postureSummary = 'Security Posture: Critical Risk (Insecure plaintext transport or critical defects)';
    }

    const categorySummary = {
      transportScore,
      headerScore: headersScore,
      mixedContentScore: mixedScore,
      cookieScore,
      isolationScore,
      totalDeductions: 100 - boundedScore
    };

    const baselineSummary = {
      isHttps,
      cspActive: !!(headerReport && headerReport.csp && headerReport.csp.present),
      hstsActive: !!(headerReport && headerReport.hsts && headerReport.hsts.present),
      clickjackingProtected: !!(headerReport && headerReport.clickjacking && headerReport.clickjacking.protected),
      nosniffActive: !!(headerReport && headerReport.xcto && headerReport.xcto.present),
      referrerPolicyActive: headerReport && headerReport.referrerPolicy ? headerReport.referrerPolicy.policy : null
    };

    return {
      state,
      assessmentState: state,
      score: boundedScore,
      grade,
      isHttps,
      mainUrl,
      mainProtocol,
      postureSummary,
      summary: categorySummary,
      baseline: baselineSummary,
      categories: {
        transport: { score: transportScore, max: 25, status: isHttps ? 'PASS' : 'FAIL' },
        headers: { score: headersScore, max: 30, status: hasMainHeaders ? (headersScore >= 20 ? 'PASS' : 'WARN') : 'AWAITING_TELEMETRY' },
        mixedContent: { score: mixedScore, max: 15, status: activeMixedCount === 0 && passiveMixedCount === 0 ? 'PASS' : 'WARN', activeCount: activeMixedCount, passiveCount: passiveMixedCount },
        cookies: { score: cookieScore, max: 15, status: cookieScore >= 12 ? 'PASS' : 'WARN', totalCookies: rawCookies.length },
        isolation: { score: isolationScore, max: 15, status: isolationScore >= 12 ? 'PASS' : 'WARN' }
      },
      headers: headerReport,
      mixedContent: mixedReport,
      cors: corsReport,
      cookies: cookieReport,
      findings: allFindings.map(f => ({
        ...f,
        id: f.id || f.header || (f.title ? f.title.replace(/\s+/g, '_').toUpperCase() : 'SECURITY_FINDING'),
        scoreDeduction: f.scoreDeduction !== undefined ? f.scoreDeduction : Math.abs(f.scoreImpact || 0),
        observed: f.observed !== undefined ? f.observed : f.observedValue,
        expected: f.expected !== undefined ? f.expected : f.expectedCondition,
        resourceScope: f.resourceScope || (f.isMainDocument ? 'MAIN_DOCUMENT' : 'SUBRESOURCE'),
        partyScope: f.partyScope || (f.isFirstParty ? 'FIRST_PARTY' : 'THIRD_PARTY')
      })),
      totalFindings: allFindings.length
    };
  }

  static _createInsufficientReport() {
    return {
      state: SECURITY_STATES.INSUFFICIENT_EVIDENCE,
      assessmentState: SECURITY_STATES.INSUFFICIENT_EVIDENCE,
      score: null,
      grade: 'N/A',
      isHttps: false,
      mainUrl: '',
      mainProtocol: '',
      postureSummary: 'Security Posture: Evidence Insufficient',
      summary: {
        transportScore: 0,
        headerScore: 0,
        mixedContentScore: 0,
        cookieScore: 0,
        isolationScore: 0,
        totalDeductions: 0
      },
      baseline: {
        isHttps: false,
        cspActive: false,
        hstsActive: false,
        clickjackingProtected: false,
        nosniffActive: false,
        referrerPolicyActive: null
      },
      categories: {
        transport: { score: 0, max: 25, status: 'UNKNOWN' },
        headers: { score: 0, max: 30, status: 'UNKNOWN' },
        mixedContent: { score: 0, max: 15, status: 'UNKNOWN', activeCount: 0, passiveCount: 0 },
        cookies: { score: 0, max: 15, status: 'UNKNOWN', totalCookies: 0 },
        isolation: { score: 0, max: 15, status: 'UNKNOWN' }
      },
      headers: { hasObservedHeaders: false, findings: [] },
      mixedContent: [],
      cors: { issues: [] },
      cookies: { issues: [] },
      findings: [],
      totalFindings: 0
    };
  }
}
