// src/security/header-analyzer.js
// Analyzes HTTP security headers on the MAIN DOCUMENT response.
// Implements unified Clickjacking evaluation (X-Frame-Options + CSP frame-ancestors),
// HSTS lifespan validation, CSP Report-Only recognition, and evidence-grounded scoring.
// Strictly adheres to the 7-property finding schema: title, severity, evidence, confidence,
// explanation, remediation, limitations. Distinguishes missing controls from exploit paths.

import { Parsers } from '../utils/parsers.js';

export class HeaderAnalyzer {
  /**
   * Audit security headers on the main document.
   * @param {Record<string, string>|Array<{name: string, value: string}>} rawHeaders
   * @param {boolean} [isHttps=true]
   * @param {Record<string, string>} [metaTags={}]
   * @returns {object} Security headers audit
   */
  static analyze(rawHeaders, isHttps = true, metaTags = {}) {
    const headers = Parsers.normalizeHeaders(rawHeaders);
    const hasObservedHeaders = headers.size > 0;
    const findings = [];

    // 1. Content Security Policy (CSP)
    const cspHeader = headers.get('content-security-policy');
    const cspReportOnly = headers.get('content-security-policy-report-only');
    const cspMeta = metaTags['content-security-policy'] || null;

    const cspRaw = cspHeader || cspReportOnly || cspMeta;
    let cspStatus = 'MISSING';
    const cspDirectives = cspRaw ? Parsers.parseCsp(cspRaw) : new Map();
    const hasFrameAncestors = cspDirectives.has('frame-ancestors');

    if (cspRaw) {
      cspStatus = cspHeader ? 'CONFIGURED' : (cspReportOnly ? 'REPORT_ONLY' : 'META_TAG');

      const scriptSrc = cspDirectives.get('script-src') || cspDirectives.get('default-src') || [];
      const hasUnsafeInline = scriptSrc.includes("'unsafe-inline'");
      const hasUnsafeEval = scriptSrc.includes("'unsafe-eval'");

      if (hasUnsafeInline) {
        findings.push({
          id: 'CSP_UNSAFE_INLINE',
          category: 'HEADERS',
          header: 'Content-Security-Policy',
          severity: 'MEDIUM',
          confidence: 'HIGH',
          scoreImpact: -3,
          scoreDeduction: 3,
          scoreExplanation: "Deducted 3 points from Headers category for 'unsafe-inline' in Content-Security-Policy script directives.",
          isMainDocument: true,
          title: "CSP contains 'unsafe-inline'",
          observedValue: "'unsafe-inline' in script-src/default-src",
          observed: "'unsafe-inline' in script-src/default-src",
          evidence: "'unsafe-inline' observed in Content-Security-Policy header",
          expectedCondition: "Strict script-src without 'unsafe-inline' (use nonces or hashes)",
          expected: "Strict script-src without 'unsafe-inline' (use nonces or hashes)",
          evidenceSource: 'Main Document Header',
          explanation: "Allows execution of inline scripts and event handlers, weakening defense-in-depth against Cross-Site Scripting (XSS).",
          description: "Allows execution of inline scripts and event handlers, weakening defense against Cross-Site Scripting (XSS).",
          remediation: "Replace 'unsafe-inline' with CSP nonces (nonce-...) or SHA-256 hashes for inline script blocks.",
          limitations: "Passive inspection evaluates declared CSP syntax; it does not prove the presence of an exploitable XSS vector.",
          findingType: 'POTENTIAL',
          isControlMissing: true,
          isConfirmedExploit: false
        });
      }

      if (hasUnsafeEval) {
        findings.push({
          id: 'CSP_UNSAFE_EVAL',
          category: 'HEADERS',
          header: 'Content-Security-Policy',
          severity: 'LOW',
          confidence: 'HIGH',
          scoreImpact: -2,
          scoreDeduction: 2,
          scoreExplanation: "Deducted 2 points from Headers category for 'unsafe-eval' in Content-Security-Policy directives.",
          isMainDocument: true,
          title: "CSP contains 'unsafe-eval'",
          observedValue: "'unsafe-eval' in script-src/default-src",
          observed: "'unsafe-eval' in script-src/default-src",
          evidence: "'unsafe-eval' observed in Content-Security-Policy header",
          expectedCondition: "Absence of 'unsafe-eval'",
          expected: "Absence of 'unsafe-eval'",
          evidenceSource: 'Main Document Header',
          explanation: "Allows eval() and Function() string-to-code compilation, which can facilitate code execution if unvalidated input is passed.",
          description: "Allows eval() and Function() string compilation, which can facilitate script injection.",
          remediation: "Refactor dynamic evaluation logic and remove 'unsafe-eval' from CSP directives.",
          limitations: "Passive analysis inspects header configuration only; it cannot determine whether eval() is invoked in client code paths.",
          findingType: 'POTENTIAL',
          isControlMissing: true,
          isConfirmedExploit: false
        });
      }
    } else if (hasObservedHeaders) {
      findings.push({
        id: 'MISSING_CSP',
        category: 'HEADERS',
        header: 'Content-Security-Policy',
        severity: 'HIGH',
        confidence: 'HIGH',
        scoreImpact: -8,
        scoreDeduction: 8,
        scoreExplanation: "Deducted 8 points from Headers category for absent Content-Security-Policy header.",
        isMainDocument: true,
        title: 'Missing Content-Security-Policy Header',
        observedValue: 'Header not returned on main document',
        observed: 'Header not returned on main document',
        evidence: 'Content-Security-Policy header absent on main document HTTP response',
        expectedCondition: "Content-Security-Policy: default-src 'self' ...",
        expected: "Content-Security-Policy: default-src 'self' ...",
        evidenceSource: 'Main Document Response',
        explanation: 'Site lacks CSP defense-in-depth against Cross-Site Scripting (XSS) and unauthorized resource injection.',
        description: 'Site lacks CSP defense-in-depth against Cross-Site Scripting (XSS) and arbitrary content injection.',
        remediation: "Deploy a Content-Security-Policy header (e.g. default-src 'self'; script-src 'self' 'nonce-...'; object-src 'none').",
        limitations: 'Absence of CSP represents a missing defense-in-depth control; it does not mean the application is vulnerable to XSS without an injection bug.',
        findingType: 'POTENTIAL',
        isControlMissing: true,
        isConfirmedExploit: false
      });
    }

    // 2. Strict-Transport-Security (HSTS) - Only evaluated on HTTPS
    const hstsRaw = headers.get('strict-transport-security');
    let hstsInfo = null;
    let hstsStatus = 'NOT_APPLICABLE';

    if (isHttps) {
      if (hstsRaw) {
        hstsInfo = Parsers.parseHsts(hstsRaw);
        if (hstsInfo.maxAge >= 10368000) {
          hstsStatus = 'CONFIGURED';
        } else {
          hstsStatus = 'WEAK';
          findings.push({
            id: 'WEAK_HSTS_MAX_AGE',
            category: 'HEADERS',
            header: 'Strict-Transport-Security',
            severity: 'LOW',
            confidence: 'HIGH',
            scoreImpact: -2,
            scoreDeduction: 2,
            scoreExplanation: "Deducted 2 points from Headers category for HSTS max-age duration below 1 year.",
            isMainDocument: true,
            title: 'HSTS max-age is under recommended duration',
            observedValue: `max-age=${hstsInfo.maxAge}s`,
            observed: `max-age=${hstsInfo.maxAge}s`,
            evidence: `Strict-Transport-Security header configured with max-age=${hstsInfo.maxAge}s`,
            expectedCondition: 'max-age >= 31536000s (1 year) with includeSubDomains',
            expected: 'max-age >= 31536000s (1 year) with includeSubDomains',
            evidenceSource: 'Main Document Header',
            explanation: `Current HSTS max-age is ${Math.round(hstsInfo.maxAge / 86400)} days. Recommended minimum is 1 year (31536000s) to guarantee persistent HTTPS enforcement.`,
            description: `Current max-age is ${Math.round(hstsInfo.maxAge / 86400)} days. Recommended minimum is 1 year (31536000s).`,
            remediation: 'Increase max-age to at least 31536000 and include includeSubDomains.',
            limitations: 'HSTS is actively enforced during the declared duration window; the risk is expiration if users revisit after that duration.',
            findingType: 'POTENTIAL',
            isControlMissing: true,
            isConfirmedExploit: false
          });
        }
      } else if (hasObservedHeaders) {
        hstsStatus = 'MISSING';
        findings.push({
          id: 'MISSING_HSTS',
          category: 'HEADERS',
          header: 'Strict-Transport-Security',
          severity: 'HIGH',
          confidence: 'HIGH',
          scoreImpact: -8,
          scoreDeduction: 8,
          scoreExplanation: "Deducted 8 points from Headers category for missing HSTS on HTTPS origin.",
          isMainDocument: true,
          title: 'Missing HSTS Header on HTTPS Origin',
          observedValue: 'Strict-Transport-Security header absent',
          observed: 'Strict-Transport-Security header absent',
          evidence: 'Strict-Transport-Security header absent on main document response over HTTPS',
          expectedCondition: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
          expected: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
          evidenceSource: 'Main Document Response',
          explanation: 'Browser is not instructed to strictly enforce HTTPS, allowing SSL stripping risks on first contact or untrusted networks.',
          description: 'Browser is not instructed to strictly enforce HTTPS, allowing SSL stripping risks on first contact or untrusted Wi-Fi.',
          remediation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains; preload to server configuration.',
          limitations: 'HSTS protects against protocol downgrade on subsequent visits; current session was conducted over HTTPS.',
          findingType: 'POTENTIAL',
          isControlMissing: true,
          isConfirmedExploit: false
        });
      }
    }

    // 3. Clickjacking Protection (X-Frame-Options OR CSP frame-ancestors)
    const xfo = headers.get('x-frame-options');
    let clickjackingProtection = 'NONE';
    let clickjackingSource = '';

    if (hasFrameAncestors) {
      clickjackingProtection = 'CONFIGURED';
      clickjackingSource = "CSP frame-ancestors directive";
    } else if (xfo && /^(?:DENY|SAMEORIGIN)/i.test(xfo.trim())) {
      clickjackingProtection = 'CONFIGURED';
      clickjackingSource = `X-Frame-Options: ${xfo}`;
    } else if (hasObservedHeaders) {
      findings.push({
        id: 'MISSING_CLICKJACKING_DEFENSE',
        category: 'HEADERS',
        header: 'Clickjacking Protection',
        severity: 'MEDIUM',
        confidence: 'HIGH',
        scoreImpact: -5,
        scoreDeduction: 5,
        scoreExplanation: "Deducted 5 points from Headers category for absent framing restrictions (CSP frame-ancestors or X-Frame-Options).",
        isMainDocument: true,
        title: 'Missing Clickjacking Protection',
        observedValue: 'Neither X-Frame-Options nor CSP frame-ancestors observed',
        observed: 'Neither X-Frame-Options nor CSP frame-ancestors observed',
        evidence: 'Neither Content-Security-Policy frame-ancestors nor X-Frame-Options present in main document response',
        expectedCondition: "Content-Security-Policy: frame-ancestors 'none' (or 'self') OR X-Frame-Options: DENY",
        expected: "Content-Security-Policy: frame-ancestors 'none' (or 'self') OR X-Frame-Options: DENY",
        evidenceSource: 'Main Document Response',
        explanation: 'Document does not restrict iframe embedding, leaving users susceptible to UI redressing and clickjacking.',
        description: 'Document does not restrict iframe embedding, leaving users susceptible to UI redressing and clickjacking.',
        remediation: "Add Content-Security-Policy: frame-ancestors 'self' (or 'none'), or X-Frame-Options: SAMEORIGIN.",
        limitations: 'Absence of framing controls creates risk only if the page performs sensitive state changes and lacks SameSite cookies or framing protection scripts.',
        findingType: 'POTENTIAL',
        isControlMissing: true,
        isConfirmedExploit: false
      });
    }

    // 4. X-Content-Type-Options (MIME Sniffing)
    const xcto = headers.get('x-content-type-options');
    let xctoStatus = 'MISSING';
    if (xcto && xcto.toLowerCase().trim() === 'nosniff') {
      xctoStatus = 'CONFIGURED';
    } else if (hasObservedHeaders) {
      findings.push({
        id: 'MISSING_XCTO',
        category: 'HEADERS',
        header: 'X-Content-Type-Options',
        severity: 'LOW',
        confidence: 'HIGH',
        scoreImpact: -3,
        scoreDeduction: 3,
        scoreExplanation: "Deducted 3 points from Headers category for missing X-Content-Type-Options: nosniff.",
        isMainDocument: true,
        title: "Missing 'nosniff' directive",
        observedValue: xcto ? `"${xcto}"` : 'Header absent',
        observed: xcto ? `"${xcto}"` : 'Header absent',
        evidence: xcto ? `X-Content-Type-Options: "${xcto}" does not equal "nosniff"` : 'X-Content-Type-Options header absent',
        expectedCondition: 'X-Content-Type-Options: nosniff',
        expected: 'X-Content-Type-Options: nosniff',
        evidenceSource: 'Main Document Response',
        explanation: 'Browser may attempt to MIME-sniff response content away from the declared Content-Type header, potentially interpreting non-executable types as scripts.',
        description: 'Browser may attempt to MIME-sniff response content away from the declared Content-Type header.',
        remediation: 'Configure server to return X-Content-Type-Options: nosniff on all HTTP responses.',
        limitations: 'Modern browsers enforce strict MIME type checking on scripts and stylesheets regardless; nosniff primarily protects user-uploaded media and older clients.',
        findingType: 'POTENTIAL',
        isControlMissing: true,
        isConfirmedExploit: false
      });
    }

    // 5. Referrer-Policy
    const refPolicy = headers.get('referrer-policy');
    let refStatus = refPolicy ? 'CONFIGURED' : 'DEFAULT';
    if (!refPolicy && hasObservedHeaders) {
      findings.push({
        id: 'MISSING_REFERRER_POLICY',
        category: 'HEADERS',
        header: 'Referrer-Policy',
        severity: 'LOW',
        confidence: 'HIGH',
        scoreImpact: -2,
        scoreDeduction: 2,
        scoreExplanation: "Deducted 2 points from Headers category for absent explicit Referrer-Policy header.",
        isMainDocument: true,
        title: 'Missing Explicit Referrer-Policy',
        observedValue: 'Header absent (browser default)',
        observed: 'Header absent (browser default)',
        evidence: 'Referrer-Policy header absent on main document response',
        expectedCondition: 'Referrer-Policy: strict-origin-when-cross-origin',
        expected: 'Referrer-Policy: strict-origin-when-cross-origin',
        evidenceSource: 'Main Document Response',
        explanation: 'Full URL paths and query parameters may leak in HTTP Referer headers during cross-origin navigation if browser defaults are overridden.',
        description: 'Full URL paths and query parameters may leak in HTTP Referer headers during cross-origin navigation.',
        remediation: 'Add Referrer-Policy: strict-origin-when-cross-origin to HTTP response headers.',
        limitations: 'Modern Chromium and Gecko engines default to strict-origin-when-cross-origin; missing header is a consistency gap across diverse clients.',
        findingType: 'POTENTIAL',
        isControlMissing: true,
        isConfirmedExploit: false
      });
    } else if (refPolicy && (refPolicy.includes('unsafe-url') || refPolicy.includes('no-referrer-when-downgrade'))) {
      findings.push({
        id: 'WEAK_REFERRER_POLICY',
        category: 'HEADERS',
        header: 'Referrer-Policy',
        severity: 'LOW',
        confidence: 'HIGH',
        scoreImpact: -2,
        scoreDeduction: 2,
        scoreExplanation: `Deducted 2 points for weakly configured Referrer-Policy: ${refPolicy}.`,
        isMainDocument: true,
        title: 'Weakly Configured Referrer-Policy',
        observedValue: refPolicy,
        observed: refPolicy,
        evidence: `Referrer-Policy is configured as "${refPolicy}"`,
        expectedCondition: 'Referrer-Policy: strict-origin-when-cross-origin',
        expected: 'Referrer-Policy: strict-origin-when-cross-origin',
        evidenceSource: 'Main Document Header',
        explanation: `Using "${refPolicy}" transmits complete URL paths and query strings across third-party requests, potentially leaking sensitive parameters.`,
        description: `Using "${refPolicy}" transmits complete URL paths and query strings across third-party requests.`,
        remediation: 'Change Referrer-Policy to strict-origin-when-cross-origin or no-referrer.',
        limitations: 'Only impacts outbound requests initiated from this origin.',
        findingType: 'POTENTIAL',
        isControlMissing: true,
        isConfirmedExploit: false
      });
    }

    // 6. Permissions-Policy
    const permissionsPolicy = headers.get('permissions-policy') || headers.get('feature-policy');

    // 7. Cross-Origin Isolation (COOP, COEP, CORP)
    const coop = headers.get('cross-origin-opener-policy');
    const coep = headers.get('cross-origin-embedder-policy');
    const corp = headers.get('cross-origin-resource-policy');

    return {
      hasObservedHeaders,
      headersPresent: Array.from(headers.keys()),
      csp: {
        raw: cspRaw,
        status: cspStatus,
        directivesCount: cspDirectives.size,
        directives: Object.fromEntries(cspDirectives),
        hasFrameAncestors
      },
      hsts: {
        status: hstsStatus,
        raw: hstsRaw,
        info: hstsInfo
      },
      clickjacking: {
        status: clickjackingProtection,
        protected: clickjackingProtection === 'CONFIGURED',
        source: clickjackingSource,
        mechanism: clickjackingSource,
        xFrameOptions: xfo
      },
      xContentTypeOptions: {
        status: xctoStatus,
        raw: xcto
      },
      referrerPolicy: {
        status: refStatus,
        raw: refPolicy
      },
      permissionsPolicy: {
        raw: permissionsPolicy,
        isConfigured: !!permissionsPolicy
      },
      crossOriginIsolation: {
        coop,
        coep,
        corp,
        isIsolated: !!(coop && coep)
      },
      findings
    };
  }
}
