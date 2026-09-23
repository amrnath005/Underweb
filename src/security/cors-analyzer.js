// src/security/cors-analyzer.js
// Analyzes Cross-Origin Resource Sharing (CORS) configurations.

import { Parsers } from '../utils/parsers.js';

export class CorsAnalyzer {
  /**
   * Audit CORS configuration from response headers.
   * @param {Record<string, string>|Array<{name: string, value: string}>} rawHeaders
   * @returns {object} CORS audit
   */
  static analyze(rawHeaders) {
    const headers = Parsers.normalizeHeaders(rawHeaders);
    const allowOrigin = headers.get('access-control-allow-origin');
    const allowCredentials = headers.get('access-control-allow-credentials');
    const allowMethods = headers.get('access-control-allow-methods');
    const allowHeaders = headers.get('access-control-allow-headers');

    const issues = [];
    if (allowOrigin === '*' && allowCredentials === 'true') {
      issues.push({
        severity: 'HIGH',
        title: 'Wildcard CORS with Credentials Allowed',
        description: 'Dangerous combination: allowing wildcard origin with credentials can expose private user session data.'
      });
    }

    return {
      isConfigured: !!allowOrigin,
      allowOrigin,
      allowCredentials: allowCredentials === 'true',
      allowMethods: allowMethods ? allowMethods.split(',').map(m => m.trim()) : [],
      allowHeaders: allowHeaders ? allowHeaders.split(',').map(h => h.trim()) : [],
      issues
    };
  }
}
