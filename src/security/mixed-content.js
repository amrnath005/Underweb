// src/security/mixed-content.js
// Identifies and classifies insecure plaintext HTTP resources loaded within HTTPS contexts.
// Strictly separates ACTIVE mixed content (executable) from PASSIVE mixed content (displayable).
// Adheres strictly to the 7-property finding schema.

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

      const scoreImpact = isActive ? -8 : -2;
      const scoreDeduction = isActive ? 8 : 2;

      mixed.push({
        id: isActive ? `ACTIVE_MIXED_CONTENT_${resourceType.toUpperCase()}` : `PASSIVE_MIXED_CONTENT_${resourceType.toUpperCase()}`,
        type: isActive ? MIXED_CONTENT_TYPES.ACTIVE : MIXED_CONTENT_TYPES.PASSIVE,
        category: 'MIXED_CONTENT',
        pageProtocol: 'https:',
        resourceProtocol: 'http:',
        resourceType,
        url: req.url,
        affectedUrl: req.url,
        firstParty: isFirstParty,
        isFirstParty,
        resourceScope: 'SUBRESOURCE',
        partyScope: isFirstParty ? 'FIRST_PARTY' : 'THIRD_PARTY',
        severity: isActive ? 'HIGH' : 'LOW',
        confidence: 'HIGH',
        scoreImpact,
        scoreDeduction,
        scoreExplanation: isActive
          ? `Deducted 8 points from Mixed Content category for active executable ${resourceType} requested over HTTP.`
          : `Deducted 2 points from Mixed Content category for passive display asset requested over HTTP.`,
        title: isActive
          ? `Active Mixed Content (${resourceType.toUpperCase()} over HTTP)`
          : `Passive Mixed Content (${resourceType.toUpperCase()} over HTTP)`,
        evidence: `Insecure HTTP resource requested by HTTPS origin: ${req.url.slice(0, 90)}`,
        observed: req.url,
        expected: 'https://',
        explanation: isActive
          ? `Active mixed content (${resourceType}) requested over unencrypted HTTP can be intercepted and altered by network adversaries, enabling arbitrary script execution in the page context.`
          : `Passive mixed content (${resourceType}) requested over unencrypted HTTP allows network eavesdroppers to monitor user interactions or replace visual media.`,
        description: isActive
          ? `Active mixed content (${resourceType}) can be intercepted or modified by network attackers, allowing arbitrary code execution in the context of the page.`
          : `Passive mixed content (${resourceType}) allows network eavesdroppers to monitor or replace displayable assets.`,
        remediation: `Update the resource URL from "${req.url.slice(0, 60)}..." to an encrypted https:// URL, or host the asset locally.`,
        limitations: isActive
          ? 'Modern desktop browsers automatically block active mixed content by default; vulnerability is acute in permissive clients or mobile webviews.'
          : 'Passive mixed content is loaded with a warning in modern browsers without executing code; it degrades transport integrity rather than granting direct DOM control.',
        findingType: isActive ? 'CONFIRMED' : 'POTENTIAL',
        isControlMissing: false,
        isConfirmedExploit: isActive
      });
    }

    return mixed;
  }
}
