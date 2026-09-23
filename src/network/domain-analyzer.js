// src/network/domain-analyzer.js
// Domain relationship intelligence, third-party classification, and traffic volume aggregation.

import { DomainUtils } from '../utils/domain-utils.js';
import { UrlUtils } from '../utils/url-utils.js';

export class DomainAnalyzer {
  /**
   * Aggregate an array of requests into domain profiles.
   * @param {Array<object>} requests
   * @param {string} primaryOriginHost
   * @returns {Map<string, object>} domain -> profile
   */
  static analyzeDomains(requests, primaryOriginHost) {
    const domainProfiles = new Map();
    const primaryApex = DomainUtils.getApexDomain(primaryOriginHost);

    for (const req of requests) {
      const host = req.host || UrlUtils.getHostname(req.url);
      if (!host) continue;

      let profile = domainProfiles.get(host);
      if (!profile) {
        const apex = DomainUtils.getApexDomain(host);
        const isFirstParty = (apex === primaryApex && apex !== '');

        profile = {
          host,
          apex,
          isFirstParty,
          requestCount: 0,
          totalBytes: 0,
          categories: new Set(),
          protocols: new Set(),
          ips: new Set(),
          statusCodes: new Set(),
          role: DomainUtils.inferDomainRole(host)
        };
        domainProfiles.set(host, profile);
      }

      profile.requestCount++;
      if (req.size) profile.totalBytes += req.size;
      if (req.category) profile.categories.add(req.category);
      if (req.protocol) profile.protocols.add(req.protocol);
      if (req.ip) profile.ips.add(req.ip);
      if (req.status) profile.statusCodes.add(req.status);
    }

    // Convert sets to arrays for serialization
    const result = new Map();
    for (const [host, prof] of domainProfiles.entries()) {
      result.set(host, {
        ...prof,
        categories: Array.from(prof.categories),
        protocols: Array.from(prof.protocols),
        ips: Array.from(prof.ips),
        statusCodes: Array.from(prof.statusCodes)
      });
    }

    return result;
  }
}
