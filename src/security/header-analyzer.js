// src/security/header-analyzer.js
// Analyzes HTTP security headers: CSP, HSTS, X-Frame-Options, Referrer-Policy, COOP, COEP, CORP.

import { Parsers } from '../utils/parsers.js';

export class HeaderAnalyzer {
  /**
   * Audit security headers.
   * @param {Record<string, string>|Array<{name: string, value: string}>} rawHeaders
   * @returns {object} Security headers audit
   */
  static analyze(rawHeaders) {
    const headers = Parsers.normalizeHeaders(rawHeaders);
    const findings = [];

    // 1. Content Security Policy (CSP)
    const cspRaw = headers.get('content-security-policy');
    let cspStatus = 'MISSING';
    const cspDirectives = cspRaw ? Parsers.parseCsp(cspRaw) : new Map();

    if (cspRaw) {
      cspStatus = 'CONFIGURED';
      const scriptSrc = cspDirectives.get('script-src') || cspDirectives.get('default-src') || [];
      const hasUnsafeInline = scriptSrc.includes("'unsafe-inline'");
      const hasUnsafeEval = scriptSrc.includes("'unsafe-eval'");

      if (hasUnsafeInline) {
        findings.push({
          header: 'Content-Security-Policy',
          severity: 'MEDIUM',
          title: "CSP contains 'unsafe-inline'",
          description: "Allows execution of inline scripts and event handlers, weakening XSS protection."
        });
      }
      if (hasUnsafeEval) {
        findings.push({
          header: 'Content-Security-Policy',
          severity: 'LOW',
          title: "CSP contains 'unsafe-eval'",
          description: "Allows eval() and Function() string compilation in scripts."
        });
      }
      if (!cspDirectives.has('frame-ancestors') && !headers.has('x-frame-options')) {
        findings.push({
          header: 'Content-Security-Policy',
          severity: 'MEDIUM',
          title: 'Missing frame-ancestors directive',
          description: 'Leaves site vulnerable to clickjacking unless protected by X-Frame-Options.'
        });
      }
    } else {
      findings.push({
        header: 'Content-Security-Policy',
        severity: 'HIGH',
        title: 'Missing Content-Security-Policy Header',
        description: 'Site lacks CSP defense-in-depth against Cross-Site Scripting (XSS) and data injection.'
      });
    }

    // 2. Strict-Transport-Security (HSTS)
    const hstsRaw = headers.get('strict-transport-security');
    let hstsInfo = null;
    if (hstsRaw) {
      hstsInfo = Parsers.parseHsts(hstsRaw);
      if (hstsInfo.maxAge < 10368000) {
        findings.push({
          header: 'Strict-Transport-Security',
          severity: 'LOW',
          title: 'HSTS max-age is under recommended duration',
          description: `Current max-age is ${hstsInfo.maxAge}s. Recommended minimum is 1 year (31536000s).`
        });
      }
    } else {
      findings.push({
        header: 'Strict-Transport-Security',
        severity: 'HIGH',
        title: 'Missing HSTS Header',
        description: 'Site does not enforce browser HTTPS upgrade, risking SSL stripping attacks on public Wi-Fi.'
      });
    }

    // 3. X-Frame-Options
    const xfo = headers.get('x-frame-options');
    if (!xfo && !cspDirectives.has('frame-ancestors')) {
      findings.push({
        header: 'X-Frame-Options',
        severity: 'MEDIUM',
        title: 'Missing X-Frame-Options Header',
        description: 'Page can be embedded in malicious iframes, exposing visitors to clickjacking attacks.'
      });
    }

    // 4. X-Content-Type-Options
    const xcto = headers.get('x-content-type-options');
    if (!xcto || xcto.toLowerCase() !== 'nosniff') {
      findings.push({
        header: 'X-Content-Type-Options',
        severity: 'LOW',
        title: "Missing 'nosniff' directive",
        description: 'Browser may MIME-sniff response types away from declared Content-Type.'
      });
    }

    // 5. Referrer-Policy
    const refPolicy = headers.get('referrer-policy');

    // 6. Cross-Origin Isolation (COOP, COEP, CORP)
    const coop = headers.get('cross-origin-opener-policy');
    const coep = headers.get('cross-origin-embedder-policy');
    const corp = headers.get('cross-origin-resource-policy');

    return {
      headersPresent: Array.from(headers.keys()),
      csp: {
        raw: cspRaw,
        status: cspStatus,
        directivesCount: cspDirectives.size,
        directives: Object.fromEntries(cspDirectives)
      },
      hsts: hstsInfo,
      xFrameOptions: xfo,
      xContentTypeOptions: xcto,
      referrerPolicy: refPolicy,
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
