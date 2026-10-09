// src/security/security-analyzer.js
// Evidence-grounded security posture auditor and defensive vulnerability evaluator.
// Strictly separates Main Document security from subresources and third parties.
// Implements category-weighted scoring (100 pts), avoids double-counting, enforces passive boundaries,
// and adheres strictly to the 7-property finding schema with clear distinctions between missing controls and exploit paths.

import { HeaderAnalyzer } from './header-analyzer.js';
import { MixedContentDetector, MIXED_CONTENT_TYPES } from './mixed-content.js';
import { CorsAnalyzer } from './cors-analyzer.js';
import { CookieAnalyzer } from '../privacy/cookie-analyzer.js';
import { SourcemapDetector } from '../detection/sourcemap-detector.js';
import { LeakDetector } from './leak-detector.js';
import { RouteHarvester } from './route-harvester.js';
import { JwtAuditor } from './jwt-auditor.js';
import { SourceTreeReconstructor } from './source-tree-reconstructor.js';
import { UrlUtils } from '../utils/url-utils.js';
import { DependencyAuditor } from './dependency-auditor.js';
import { BoundaryEnforcer } from './boundary-enforcer.js';
import { FingerprintEngine } from '../detection/fingerprint-engine.js';

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

    rawCookies = Array.isArray(rawCookies) ? rawCookies : [];

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
        confidence: 'HIGH',
        scoreImpact: -25,
        scoreDeduction: 25,
        scoreExplanation: 'Deducted 25 points (entire transport score) for unencrypted plaintext HTTP main document.',
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
        evidence: 'Main document transmitted via plaintext unencrypted HTTP (http://)',
        evidenceSource: 'Main Document URL Protocol',
        explanation: 'The main document was transmitted over plaintext unencrypted HTTP. All requests, cookies, and page content are exposed to eavesdropping and manipulation by on-path adversaries.',
        description: 'The main document was transmitted over plaintext unencrypted HTTP. All requests, cookies, and content are exposed to network eavesdropping and tampering.',
        remediation: 'Enforce HTTPS on all requests by redirecting HTTP traffic (HTTP 301) to HTTPS and provisioning a TLS certificate.',
        limitations: 'Direct observation confirms the unencrypted protocol for this session.',
        findingType: 'CONFIRMED',
        isControlMissing: true,
        isConfirmedExploit: true
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
        // Diminishing returns on passive mixed content to avoid double-counting
        if (passiveMixedCount === 1) {
          mixedScore -= 2;
        } else if (passiveMixedCount <= 3) {
          mixedScore -= 1;
        }
      }
      allFindings.push({
        ...m,
        category: 'MIXED_CONTENT',
        header: 'Mixed Content',
        isMainDocument: false,
        isFirstParty: m.firstParty,
        affectedUrl: m.url,
        resourceType: m.resourceType,
        observedValue: m.url,
        expectedCondition: 'https://',
        evidenceSource: 'Network Telemetry Subresource'
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
          id: 'INSECURE_COOKIES_MISSING_SECURE',
          category: 'COOKIES',
          header: 'Cookie Hygiene',
          severity: insecureCookies.length > 3 ? 'HIGH' : 'MEDIUM',
          confidence: 'HIGH',
          scoreImpact: -deduction,
          scoreDeduction: deduction,
          scoreExplanation: `Deducted ${deduction} points from Cookie category for ${insecureCookies.length} cookie(s) missing Secure attribute.`,
          isMainDocument: false,
          isFirstParty: true,
          affectedUrl: primaryDomain,
          resourceType: 'cookie',
          title: `${insecureCookies.length} Cookie${insecureCookies.length > 1 ? 's' : ''} Missing Secure Flag on HTTPS`,
          observedValue: insecureCookies.slice(0, 3).map(c => c.name).join(', ') + (insecureCookies.length > 3 ? '...' : ''),
          observed: insecureCookies.slice(0, 3).map(c => c.name).join(', '),
          evidence: `Cookies without Secure flag: ${insecureCookies.map(c => c.name).join(', ')}`,
          expectedCondition: 'Secure; SameSite=Lax (or Strict)',
          expected: 'Secure; SameSite=Lax',
          evidenceSource: 'Browser Cookie Store',
          explanation: 'Cookies without the Secure attribute can be transmitted over plaintext HTTP or during mixed-content interactions.',
          description: 'Cookies missing the Secure flag can be leaked over plaintext HTTP requests or during mixed-content interactions.',
          remediation: 'Set the Secure flag on all cookies issued over HTTPS.',
          limitations: 'Evaluates cookie jar attributes observable in the browser; does not inspect third-party tracking cookies.',
          findingType: 'POTENTIAL',
          isControlMissing: true,
          isConfirmedExploit: false
        });
      }

      // Check sensitive cookies missing HttpOnly
      const sensitiveMissingHttpOnly = rawCookies.filter(c => !c.httpOnly && /token|auth|sess|key/i.test(c.name));
      if (sensitiveMissingHttpOnly.length > 0) {
        cookieScore -= 4;
        allFindings.push({
          id: 'SENSITIVE_COOKIES_MISSING_HTTPONLY',
          category: 'COOKIES',
          header: 'Cookie Hygiene',
          severity: 'MEDIUM',
          confidence: 'HIGH',
          scoreImpact: -4,
          scoreDeduction: 4,
          scoreExplanation: 'Deducted 4 points from Cookie category for sensitive session cookies missing HttpOnly flag.',
          isMainDocument: false,
          isFirstParty: true,
          affectedUrl: primaryDomain,
          resourceType: 'cookie',
          title: 'Sensitive Session/Auth Cookies Accessible via JavaScript (Missing HttpOnly)',
          observedValue: sensitiveMissingHttpOnly.map(c => c.name).join(', '),
          observed: sensitiveMissingHttpOnly.map(c => c.name).join(', '),
          evidence: `Sensitive cookies missing HttpOnly: ${sensitiveMissingHttpOnly.map(c => c.name).join(', ')}`,
          expectedCondition: 'HttpOnly flag set on authentication tokens',
          expected: 'HttpOnly flag set on authentication tokens',
          evidenceSource: 'Browser Cookie Store',
          explanation: 'Session identifiers without the HttpOnly attribute can be read by JavaScript, allowing exfiltration if an XSS vulnerability exists.',
          description: 'Session identifiers without the HttpOnly attribute can be exfiltrated by malicious scripts in the event of an XSS vulnerability.',
          remediation: 'Mark authentication and session cookies with the HttpOnly flag on the server.',
          limitations: 'HttpOnly prevents client-side script access; it does not protect against network interception if Secure is also omitted.',
          findingType: 'POTENTIAL',
          isControlMissing: true,
          isConfirmedExploit: false
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
          id: 'INSECURE_CORS_WILDCARD_CREDENTIALS',
          category: 'CORS',
          header: 'CORS Configuration',
          severity: iss.severity,
          confidence: 'HIGH',
          scoreImpact: -6,
          scoreDeduction: 6,
          scoreExplanation: 'Deducted 6 points from Isolation category for insecure wildcard CORS origin with credentials.',
          isMainDocument: true,
          isFirstParty: true,
          affectedUrl: mainUrl,
          resourceType: 'headers',
          title: iss.title,
          observedValue: 'Access-Control-Allow-Origin: * with Credentials',
          observed: 'Access-Control-Allow-Origin: * with Credentials',
          evidence: 'Access-Control-Allow-Origin: * returned alongside Access-Control-Allow-Credentials: true',
          expectedCondition: 'Explicit non-wildcard origin when credentials are supported',
          expected: 'Explicit non-wildcard origin when credentials are supported',
          evidenceSource: 'Main Document Headers',
          explanation: iss.description,
          description: iss.description,
          remediation: 'Never use wildcard (*) for Access-Control-Allow-Origin when allowing credentials. Echo specific trusted origin dynamically.',
          limitations: 'Evaluates HTTP headers on observable responses.',
          findingType: 'CONFIRMED',
          isControlMissing: false,
          isConfirmedExploit: false
        });
      });
    }
    isolationScore = Math.max(0, Math.min(15, isolationScore));

    // -------------------------------------------------------------
    // CATEGORY 6: Code Exposure & Source Maps (Informational)
    // -------------------------------------------------------------
    const sourcemapFindings = SourcemapDetector.detect(requests);
    sourcemapFindings.forEach(f => {
      allFindings.push({
        ...f,
        confidence: 'HIGH',
        evidence: f.observed || `${f.count} sourcemap reference(s) found`,
        remediation: 'Disable production source map emission or restrict access via authenticated routes.',
        limitations: 'Source maps assist code review and reverse-engineering, but do not directly compromise security on their own.',
        findingType: 'INFORMATIONAL',
        isControlMissing: false,
        isConfirmedExploit: false,
        scoreDeduction: 0,
        scoreImpact: 0,
        scoreExplanation: 'Informational finding: Source map disclosure does not reduce security posture score.'
      });
    });

    // -------------------------------------------------------------
    // CATEGORY 7: In-Flight Database Leaks, Secrets & Error Traces
    // -------------------------------------------------------------
    const leaks = LeakDetector.detect(sessionSnapshot);
    leaks.forEach(leak => {
      const tagged = BoundaryEnforcer.tagPassiveFinding(leak);
      const deduction = leak.severity === 'CRITICAL' ? 15 : leak.severity === 'HIGH' ? 10 : 5;
      allFindings.push({
        ...tagged,
        category: 'LEAKS',
        header: 'Leaked Credentials & Data',
        isMainDocument: false,
        isFirstParty: true,
        scoreImpact: -deduction,
        scoreDeduction: deduction,
        scoreExplanation: `Deducted ${deduction} points for ${leak.severity} credential/data exposure in client-facing telemetry.`
      });
    });

    const criticalLeaks = leaks.filter(l => l.severity === 'CRITICAL');
    const highLeaks = leaks.filter(l => l.severity === 'HIGH');

    // -------------------------------------------------------------
    // CATEGORY 8: Route & Attack Surface Harvesting
    // -------------------------------------------------------------
    const routeReport = RouteHarvester.harvest(sessionSnapshot);
    routeReport.findings.forEach(f => {
      allFindings.push({
        ...f,
        header: 'Attack Surface',
        isMainDocument: false,
        isFirstParty: true,
        scoreImpact: 0,
        scoreDeduction: 0,
        confidence: 'HIGH',
        evidence: `${f.count || f.routes?.length || 1} route(s) observed in client bundle`,
        remediation: 'Restrict administrative and debugging actuator routes behind authenticated API gateways.',
        limitations: 'Routes were harvested from client-side bundles; active authorization was not tested.',
        findingType: 'INFORMATIONAL',
        isControlMissing: false,
        isConfirmedExploit: false,
        scoreExplanation: 'Informational reconnaissance: Discovered routes do not reduce score unless vulnerabilities exist.'
      });
    });

    // -------------------------------------------------------------
    // CATEGORY 9: Client JWT Token & Cryptographic Auditing
    // -------------------------------------------------------------
    const jwtReport = JwtAuditor.audit(sessionSnapshot, rawCookies);
    jwtReport.findings.forEach(f => {
      const deduction = f.severity === 'CRITICAL' ? 15 : (f.severity === 'HIGH' ? 10 : 2);
      allFindings.push({
        ...f,
        header: 'Authentication & Tokens',
        isMainDocument: false,
        isFirstParty: true,
        confidence: 'HIGH',
        evidence: f.tokenSnippet || f.title,
        remediation: 'Ensure tokens are signed with robust cryptographic algorithms (RS256, ES256, HS256) and expired tokens are discarded.',
        limitations: 'Passively observed in client storage and transit headers.',
        findingType: f.severity === 'CRITICAL' ? 'CONFIRMED' : 'POTENTIAL',
        isControlMissing: f.severity !== 'CRITICAL',
        isConfirmedExploit: f.severity === 'CRITICAL',
        scoreImpact: -deduction,
        scoreDeduction: deduction,
        scoreExplanation: `Deducted ${deduction} points for ${f.severity} JWT token risk.`
      });
    });

    // -------------------------------------------------------------
    // CATEGORY 10: Source Map Project Tree Reconstruction
    // -------------------------------------------------------------
    let sourceTree = null;
    const rawSources = sessionSnapshot.sourceMapSources || [];
    if (rawSources.length > 0) {
      sourceTree = SourceTreeReconstructor.reconstruct(rawSources);
    }

    // -------------------------------------------------------------
    // CATEGORY 11: Outdated Client-Side Dependencies
    // -------------------------------------------------------------
    let detectedTechs = [];
    try {
      detectedTechs = FingerprintEngine.detect(sessionSnapshot, rawCookies);
    } catch {}

    const dependencyFindings = DependencyAuditor.audit(detectedTechs);
    let dependencyDeductions = 0;
    dependencyFindings.forEach(df => {
      dependencyDeductions += df.scoreDeduction;
      allFindings.push(df);
    });

    // -------------------------------------------------------------
    // TOTAL SCORE & GRADE RESOLUTION (Documented Scoring Model)
    // -------------------------------------------------------------
    // Total is calculated strictly from observed categories without arbitrary defaults.
    // Base 100 points distributed across Transport (25), Headers (30), Mixed Content (15),
    // Cookies (15), Isolation (15), with bounded dependency deductions (max 10).
    const rawCategoryTotal = transportScore + headersScore + mixedScore + cookieScore + isolationScore;
    const boundedDependencyPenalty = Math.min(10, dependencyDeductions);
    const totalScore = Math.max(0, Math.round(rawCategoryTotal - boundedDependencyPenalty));
    const boundedScore = Math.max(0, Math.min(100, totalScore));

    let grade = 'F';
    if (boundedScore >= 85) grade = 'A';
    else if (boundedScore >= 70) grade = 'B';
    else if (boundedScore >= 50) grade = 'C';
    else if (boundedScore >= 30) grade = 'D';
    else grade = 'F';

    // Meaningful, evidence-driven posture summary
    let postureSummary = 'Security Posture: Excellent';
    if (criticalLeaks.length > 0) {
      postureSummary = `Security Posture: Critical Risk (${criticalLeaks.length} Critical Secret/DB Leak${criticalLeaks.length > 1 ? 's' : ''})`;
    } else if (state === SECURITY_STATES.PARTIALLY_ASSESSED) {
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
      dependencyScore: Math.max(0, 10 - boundedDependencyPenalty),
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

    // Standardized finding formatting conforming strictly to the 7-property contract:
    // title, severity, evidence, confidence, explanation, remediation, limitations.
    const standardizedFindings = allFindings.map(f => {
      const sev = f.severity || 'LOW';
      const id = f.id || f.header || (f.title ? f.title.replace(/\s+/g, '_').toUpperCase() : 'SECURITY_FINDING');
      const deduction = f.scoreDeduction !== undefined ? f.scoreDeduction : Math.abs(f.scoreImpact || 0);
      const observed = f.observed !== undefined ? f.observed : (f.observedValue || f.evidence || 'Observed telemetry');
      const expected = f.expected !== undefined ? f.expected : (f.expectedCondition || 'Secure baseline configuration');
      const explanation = f.explanation || f.description || 'Observed defensive security finding.';
      const remediation = f.remediation || 'Review configuration and implement defensive controls.';
      const limitations = f.limitations || 'Passive observation evaluates client-visible artifacts; does not verify active exploitability.';
      const confidence = f.confidence || (sev === 'CRITICAL' || sev === 'HIGH' ? 'HIGH' : 'MEDIUM');
      const findingType = f.findingType || (sev === 'CRITICAL' ? 'CONFIRMED' : 'POTENTIAL');
      const isControlMissing = f.isControlMissing !== undefined ? f.isControlMissing : (f.category === 'HEADERS' || f.category === 'COOKIES');
      const isConfirmedExploit = f.isConfirmedExploit !== undefined ? f.isConfirmedExploit : (f.category === 'LEAKS' || id === 'PLAINTEXT_HTTP');

      return {
        ...f,
        id,
        title: f.title || id,
        severity: sev,
        evidence: f.evidence || observed,
        observed,
        expected,
        confidence,
        explanation,
        description: explanation,
        remediation,
        limitations,
        findingType,
        isControlMissing,
        isConfirmedExploit,
        scoreDeduction: deduction,
        scoreExplanation: f.scoreExplanation || `Deducted ${deduction} points from security posture score for ${f.title || id}.`,
        resourceScope: f.resourceScope || (f.isMainDocument ? 'MAIN_DOCUMENT' : 'SUBRESOURCE'),
        partyScope: f.partyScope || (f.isFirstParty ? 'FIRST_PARTY' : 'THIRD_PARTY')
      };
    });

    const confirmedFindings = standardizedFindings.filter(f => f.findingType === 'CONFIRMED' || f.isConfirmedExploit);
    const potentialFindings = standardizedFindings.filter(f => f.findingType === 'POTENTIAL' || f.isControlMissing);
    const informationalFindings = standardizedFindings.filter(f => f.severity === 'INFO' || f.findingType === 'INFORMATIONAL');

    return {
      state,
      assessmentState: state,
      score: boundedScore,
      scoreDisplay: `${boundedScore} / 100`,
      grade,
      isHttps,
      mainUrl,
      mainProtocol,
      postureSummary,
      summary: categorySummary,
      baseline: baselineSummary,
      disclaimer: 'Underweb performs passive defensive security analysis. Passive observations identify missing controls and exposed configurations; they do not equate to a complete penetration test.',
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
      leaks,
      leakStats: {
        total: leaks.length,
        critical: criticalLeaks.length,
        high: highLeaks.length,
        hasLeaks: leaks.length > 0
      },
      routes: routeReport.routes,
      routeStats: routeReport.stats,
      tokens: jwtReport.tokens,
      sourceTree,
      dependencies: dependencyFindings,
      findings: standardizedFindings,
      findingStats: {
        confirmedCount: confirmedFindings.length,
        potentialCount: potentialFindings.length,
        infoCount: informationalFindings.length,
        unknownCount: 0
      },
      totalFindings: standardizedFindings.length
    };
  }

  static _createInsufficientReport() {
    return {
      state: SECURITY_STATES.INSUFFICIENT_EVIDENCE,
      assessmentState: SECURITY_STATES.INSUFFICIENT_EVIDENCE,
      score: null,
      scoreDisplay: 'Not enough data',
      grade: 'N/A',
      isHttps: false,
      mainUrl: '',
      mainProtocol: '',
      postureSummary: 'Security Posture: Not enough data (Insufficient Telemetry)',
      disclaimer: 'Passive observation requires observed network telemetry and response headers. No telemetry has been recorded yet.',
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
      leaks: [],
      leakStats: { total: 0, critical: 0, high: 0, hasLeaks: false },
      routes: [],
      routeStats: { total: 0, adminCount: 0, authCount: 0, paymentCount: 0, debugCount: 0, apiCount: 0, publicCount: 0 },
      tokens: [],
      sourceTree: null,
      dependencies: [],
      findings: [],
      findingStats: { confirmedCount: 0, potentialCount: 0, infoCount: 0, unknownCount: 0 },
      totalFindings: 0
    };
  }
}
