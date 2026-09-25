// src/security/mixed-content.js
// Identifies and classifies insecure plaintext HTTP resources loaded within HTTPS contexts.
// Strictly separates ACTIVE mixed content (executable) from PASSIVE mixed content (displayable).

import { DomainUtils } from '../utils/domain-utils.js';

export const MIXED_CONTENT_TYPES = {
  ACTIVE: 'ACTIVE_MIXED_CONTENT',
  PASSIVE: 'PASSIVE_MIXED_CONTENT'
};

const ACTIVE_RESOURCE_TYPES = new Set([
  'script',
  'stylesheet',
  'sub_frame',
  'object',
  'xmlhttprequest',
  'fetch',
  'ping',
  'beacon',
  'websocket'
]);

export class MixedContentDetector {
  /**
   * Scan network requests for insecure HTTP resources on HTTPS pages.
   * @param {Array<object>} requests
   * @param {boolean} isHttps
   * @param {string} [primaryDomain]
   * @returns {Array<object>} Detailed mixed content findings
   */
  static detect(requests, isHttps, primaryDomain = '') {
    if (!isHttps || !requests || !Array.isArray(requests)) {
      return [];
    }

    const mixed = [];
    const seenUrls = new Set();

    for (const req of requests) {
      if (!req || !req.url || !req.url.startsWith('http://')) {
        continue;
      }
      if (seenUrls.has(req.url)) {
        continue;
      }
      seenUrls.add(req.url);

      const resourceType = (req.type || req.category || 'other').toLowerCase();
      const isActive = ACTIVE_RESOURCE_TYPES.has(resourceType);
      const isFirstParty = primaryDomain ? DomainUtils.isFirstParty(req.url, primaryDomain) : true;

      mixed.push({
        type: isActive ? MIXED_CONTENT_TYPES.ACTIVE : MIXED_CONTENT_TYPES.PASSIVE,
        pageProtocol: 'https:',
        resourceProtocol: 'http:',
        resourceType,
        url: req.url,
        firstParty: isFirstParty,
        severity: isActive ? 'HIGH' : 'LOW',
        scoreImpact: isActive ? -8 : -2,
        title: isActive
          ? `Active Mixed Content (${resourceType.toUpperCase()} over HTTP)`
          : `Passive Mixed Content (${resourceType.toUpperCase()} over HTTP)`,
        evidence: `Insecure HTTP resource requested by HTTPS origin: ${req.url.slice(0, 90)}`,
        description: isActive
          ? `Active mixed content (${resourceType}) can be intercepted or modified by network attackers, allowing arbitrary code execution in the context of the page.`
          : `Passive mixed content (${resourceType}) allows network eavesdroppers to monitor or replace displayable assets.`
      });
    }

    return mixed;
  }
}
