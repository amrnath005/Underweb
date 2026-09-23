// src/network/response-analyzer.js
// Inspects HTTP response headers for caching, compression, edge proxies, and server signatures.

import { Parsers } from '../utils/parsers.js';

export class ResponseAnalyzer {
  /**
   * Analyze response headers object or array.
   * @param {Record<string, string>|Array<{name: string, value: string}>} rawHeaders
   * @returns {object}
   */
  static analyze(rawHeaders) {
    const headers = Parsers.normalizeHeaders(rawHeaders);

    const result = {
      server: headers.get('server') || null,
      via: headers.get('via') || null,
      contentEncoding: headers.get('content-encoding') || 'identity',
      contentType: headers.get('content-type') || '',
      contentLength: parseInt(headers.get('content-length') || '0', 10),

      // Caching
      cacheControl: headers.get('cache-control') || null,
      etag: headers.get('etag') || null,
      age: headers.get('age') ? parseInt(headers.get('age'), 10) : null,
      isCached: false,
      cacheStatus: headers.get('cf-cache-status') || headers.get('x-cache') || null,

      // Security
      hasCsp: headers.has('content-security-policy'),
      hasHsts: headers.has('strict-transport-security'),
      hasCors: headers.has('access-control-allow-origin'),
      corsOrigin: headers.get('access-control-allow-origin') || null,
      xFrameOptions: headers.get('x-frame-options') || null,
      xContentTypeOptions: headers.get('x-content-type-options') || null
    };

    // Cache determination
    if (result.cacheControl) {
      const cc = result.cacheControl.toLowerCase();
      if (cc.includes('no-store')) {
        result.cachingStrategy = 'NO_STORE';
      } else if (cc.includes('no-cache')) {
        result.cachingStrategy = 'VALIDATE';
      } else if (cc.includes('max-age')) {
        result.cachingStrategy = 'CACHED';
      }
    }
    if (result.cacheStatus && /hit/i.test(result.cacheStatus)) {
      result.isCached = true;
    }

    return result;
  }
}
