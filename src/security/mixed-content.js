// src/security/mixed-content.js
// Identifies insecure plaintext HTTP resources loaded within HTTPS contexts.

export class MixedContentDetector {
  /**
   * Scan network requests for insecure HTTP resources on HTTPS pages.
   * @param {Array<object>} requests
   * @param {boolean} isHttps
   * @returns {Array<object>} Insecure requests
   */
  static detect(requests, isHttps) {
    if (!isHttps || !requests) return [];

    const mixed = [];
    for (const req of requests) {
      if (req.url && req.url.startsWith('http://')) {
        mixed.push({
          url: req.url,
          type: req.type || 'other',
          method: req.method || 'GET',
          initiator: req.initiator || '',
          risk: (req.type === 'script' || req.type === 'stylesheet') ? 'ACTIVE_BLOCKABLE' : 'PASSIVE_DISPLAYABLE'
        });
      }
    }
    return mixed;
  }
}
