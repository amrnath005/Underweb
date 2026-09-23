// src/infrastructure/infrastructure-graph.js
// Models the complete client-to-origin infrastructure topology path:
// Browser -> DNS -> Remote IP -> ASN -> Edge/CDN -> Origin Hosting -> Application.

import { AsnAnalyzer } from './asn-analyzer.js';
import { CdnDetector } from './cdn-detector.js';
import { HostingDetector } from './hosting-detector.js';

export class InfrastructureGraph {
  /**
   * Build the complete infrastructure pipeline model.
   * @param {string} domain - Hostname of target site
   * @param {string} remoteIp - Observed IP address
   * @param {Record<string, string>} headers - Main document response headers
   * @param {string} detectedFramework - e.g. 'Next.js' or 'WordPress'
   * @returns {Array<object>} Chain of infrastructure nodes
   */
  static buildTopology(domain, remoteIp, headers, detectedFramework = 'Web Application') {
    const asnInfo = AsnAnalyzer.lookup(remoteIp);
    const cdnInfo = CdnDetector.detect(headers);
    const hostInfo = HostingDetector.detect(headers);

    const steps = [
      {
        layer: 1,
        title: 'Client Browser',
        type: 'BROWSER',
        detail: 'User Browser Session',
        status: 'OBSERVED',
        badge: 'ACTIVE'
      },
      {
        layer: 2,
        title: 'Domain Resolution (DNS)',
        type: 'DNS',
        detail: domain || 'Unknown Host',
        status: 'RESOLVED',
        badge: 'DNS'
      },
      {
        layer: 3,
        title: 'Remote Socket IP',
        type: 'IP',
        detail: remoteIp || 'Direct socket not captured',
        status: remoteIp ? 'OBSERVED' : 'UNKNOWN',
        badge: remoteIp && remoteIp.includes(':') ? 'IPv6' : 'IPv4'
      },
      {
        layer: 4,
        title: 'Autonomous System (ASN)',
        type: 'ASN',
        detail: `${asnInfo.asn}: ${asnInfo.org}`,
        status: 'MAPPED',
        badge: asnInfo.type
      }
    ];

    // CDN / Edge Layer
    if (cdnInfo.detected) {
      steps.push({
        layer: 5,
        title: 'Edge Network / CDN',
        type: 'CDN',
        detail: `${cdnInfo.provider}${cdnInfo.pop ? ` (POP: ${cdnInfo.pop})` : ''}`,
        status: 'OBSERVED',
        badge: cdnInfo.cacheStatus || 'EDGE_PROXY'
      });
    }

    // Origin Hosting Server Layer
    if (hostInfo.hostingProvider || hostInfo.webServer) {
      steps.push({
        layer: 6,
        title: 'Origin Hosting',
        type: 'HOSTING',
        detail: hostInfo.hostingProvider || hostInfo.webServer,
        status: hostInfo.isOriginMasked ? 'INFERRED' : 'OBSERVED',
        badge: hostInfo.isOriginMasked ? 'BEHIND_CDN' : 'DIRECT_ORIGIN'
      });
    } else {
      steps.push({
        layer: 6,
        title: 'Origin Hosting',
        type: 'HOSTING',
        detail: cdnInfo.detected ? 'Origin IP/Host masked behind CDN reverse proxy' : 'Standard Web Host',
        status: 'MASKED_BY_CDN',
        badge: 'SHIELDED'
      });
    }

    // Application Layer
    steps.push({
      layer: 7,
      title: 'Application Runtime',
      type: 'APP',
      detail: detectedFramework,
      status: 'EXECUTING',
      badge: 'FRONTEND'
    });

    return steps;
  }
}
