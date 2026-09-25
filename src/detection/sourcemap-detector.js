// src/detection/sourcemap-detector.js
// Passively detects production source maps and internal code structure exposure.

export class SourcemapDetector {
  /**
   * Detect exposed source maps in network requests and headers.
   * @param {Array<object>} requests
   * @returns {Array<object>}
   */
  static detect(requests = []) {
    const findings = [];
    const sourceMapUrls = [];

    for (const req of requests) {
      const url = req.url || '';
      const headers = req.responseHeaders || {};
      const sourceMapHeader = headers['sourcemap'] || headers['x-sourcemap'];

      // Check .map extension or SourceMap header
      if (url.toLowerCase().endsWith('.map') || url.includes('.js.map') || url.includes('.css.map')) {
        sourceMapUrls.push({ url, originUrl: url.replace(/\.map$/, '') });
      } else if (sourceMapHeader) {
        sourceMapUrls.push({ url: sourceMapHeader, originUrl: url });
      }
    }

    if (sourceMapUrls.length > 0) {
      findings.push({
        id: 'EXPOSED_PRODUCTION_SOURCEMAP',
        category: 'SECURITY',
        header: 'Source Maps',
        severity: 'INFO',
        title: 'Production Source Maps Exposed',
        affectedUrl: sourceMapUrls[0].url,
        resourceScope: 'SUBRESOURCE',
        partyScope: 'FIRST_PARTY',
        isMainDocument: false,
        isFirstParty: true,
        count: sourceMapUrls.length,
        scoreImpact: 0,
        scoreDeduction: 0,
        observed: `${sourceMapUrls.length} source map artifact(s) observed via network requests/headers`,
        expected: 'Source maps omitted or protected behind private developer authentication in production',
        description: `Website loads or declares production JavaScript source maps (${sourceMapUrls.length} detected). Source maps reveal internal TypeScript/ES6 code structures, file paths, and unminified logic to potential attackers.`,
        remediation: 'Upload source maps privately to your error monitoring service (Sentry, Datadog) rather than hosting them publicly in the production root.'
      });
    }

    return findings;
  }
}
