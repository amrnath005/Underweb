// src/security/header-analyzer.js
// Analyzes HTTP security headers on the MAIN DOCUMENT response.
// Implements unified Clickjacking evaluation (X-Frame-Options + CSP frame-ancestors),
// HSTS lifespan validation, CSP Report-Only recognition, and evidence-grounded scoring.

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
          category: 'HEADERS',
          header: 'Content-Security-Policy',
          severity: 'MEDIUM',
          scoreImpact: -3,
          isMainDocument: true,
          title: "CSP contains 'unsafe-inline'",
          observedValue: "'unsafe-inline' in script-src/default-src",
          expectedCondition: "Strict script-src without 'unsafe-inline' (use nonces or hashes)",
          evidenceSource: 'Main Document Header',
          description: "Allows execution of inline scripts and event handlers, weakening defense against Cross-Site Scripting (XSS)."
        });
      }

      if (hasUnsafeEval) {
        findings.push({
          category: 'HEADERS',
          header: 'Content-Security-Policy',
          severity: 'LOW',
          scoreImpact: -2,
          isMainDocument: true,
          title: "CSP contains 'unsafe-eval'",
          observedValue: "'unsafe-eval' in script-src/default-src",
          expectedCondition: "Absence of 'unsafe-eval'",
          evidenceSource: 'Main Document Header',
          description: "Allows eval() and Function() string compilation, which can facilitate script injection."
        });
      }
    } else if (hasObservedHeaders) {
      findings.push({
        category: 'HEADERS',
        header: 'Content-Security-Policy',
        severity: 'HIGH',
        scoreImpact: -8,
        isMainDocument: true,
        title: 'Missing Content-Security-Policy Header',
        observedValue: 'Header not returned on main document',
        expectedCondition: "Content-Security-Policy: default-src 'self' ...",
        evidenceSource: 'Main Document Response',
        description: 'Site lacks CSP defense-in-depth against Cross-Site Scripting (XSS) and arbitrary content injection.'
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
            category: 'HEADERS',
            header: 'Strict-Transport-Security',
            severity: 'LOW',
            scoreImpact: -2,
            isMainDocument: true,
            title: 'HSTS max-age is under recommended duration',
            observedValue: `max-age=${hstsInfo.maxAge}s`,
            expectedCondition: 'max-age >= 31536000s (1 year) with includeSubDomains',
            evidenceSource: 'Main Document Header',
            description: `Current max-age is ${Math.round(hstsInfo.maxAge / 86400)} days. Recommended minimum is 1 year (31536000s).`
          });
        }
      } else if (hasObservedHeaders) {
        hstsStatus = 'MISSING';
        findings.push({
          category: 'HEADERS',
          header: 'Strict-Transport-Security',
          severity: 'HIGH',
          scoreImpact: -8,
          isMainDocument: true,
          title: 'Missing HSTS Header on HTTPS Origin',
          observedValue: 'Strict-Transport-Security header absent',
          expectedCondition: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
          evidenceSource: 'Main Document Response',
          description: 'Browser is not instructed to strictly enforce HTTPS, allowing SSL stripping risks on first contact or untrusted Wi-Fi.'
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
        category: 'HEADERS',
        header: 'Clickjacking Protection',
        severity: 'MEDIUM',
        scoreImpact: -5,
        isMainDocument: true,
        title: 'Missing Clickjacking Protection',
        observedValue: 'Neither X-Frame-Options nor CSP frame-ancestors observed',
        expectedCondition: "Content-Security-Policy: frame-ancestors 'none' (or 'self') OR X-Frame-Options: DENY",
        evidenceSource: 'Main Document Response',
        description: 'Document does not restrict iframe embedding, leaving users susceptible to UI redressing and clickjacking.'
      });
    }

    // 4. X-Content-Type-Options (MIME Sniffing)
    const xcto = headers.get('x-content-type-options');
    let xctoStatus = 'MISSING';
    if (xcto && xcto.toLowerCase().trim() === 'nosniff') {
      xctoStatus = 'CONFIGURED';
    } else if (hasObservedHeaders) {
      findings.push({
        category: 'HEADERS',
        header: 'X-Content-Type-Options',
        severity: 'LOW',
        scoreImpact: -3,
        isMainDocument: true,
        title: "Missing 'nosniff' directive",
        observedValue: xcto ? `"${xcto}"` : 'Header absent',
        expectedCondition: 'X-Content-Type-Options: nosniff',
        evidenceSource: 'Main Document Response',
        description: 'Browser may attempt to MIME-sniff response content away from the declared Content-Type header.'
      });
    }

    // 5. Referrer-Policy
    const refPolicy = headers.get('referrer-policy');
    let refStatus = refPolicy ? 'CONFIGURED' : 'DEFAULT';
    if (!refPolicy && hasObservedHeaders) {
      findings.push({
        category: 'HEADERS',
        header: 'Referrer-Policy',
        severity: 'LOW',
        scoreImpact: -2,
        isMainDocument: true,
        title: 'Missing Explicit Referrer-Policy',
        observedValue: 'Header absent (browser default)',
        expectedCondition: 'Referrer-Policy: strict-origin-when-cross-origin',
        evidenceSource: 'Main Document Response',
        description: 'Full URL paths and query parameters may leak in HTTP Referer headers during cross-origin navigation.'
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
