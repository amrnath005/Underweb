// src/architecture/graph-builder.js
// Assembles complete Website Architecture Directed Graph from session telemetry.

import { DirectedGraph } from './graph.js';
import { UrlUtils } from '../utils/url-utils.js';

export class GraphBuilder {
  /**
   * Build complete architecture directed graph from session telemetry.
   * @param {object} sessionSnapshot
   * @param {Array<object>} detectedTechnologies
   * @param {Array<object>} apis
   * @param {Array<object>} trackers
   * @param {object} cdnInfo
   * @param {object} hostInfo
   * @returns {DirectedGraph}
   */
  static build(sessionSnapshot, detectedTechnologies = [], apis = [], trackers = [], cdnInfo = {}, hostInfo = {}) {
    const graph = new DirectedGraph();
    const rootDomain = sessionSnapshot.primaryDomain || 'Website';

    // 1. Root Website Node
    graph.addNode(rootDomain, rootDomain, 'WEBSITE', {
      isRoot: true,
      url: sessionSnapshot.url,
      totalRequests: sessionSnapshot.stats.totalRequests
    });

    // 2. Frameworks & Technologies (USES)
    for (const tech of detectedTechnologies) {
      const type = (tech.category === 'FRAMEWORK' || tech.category === 'META_FRAMEWORK') ? 'FRAMEWORK' : 'LIBRARY';
      graph.addNode(tech.name, tech.name, type, {
        category: tech.category,
        confidence: tech.confidence,
        status: tech.status
      });
      graph.addEdge(rootDomain, tech.name, 'USES', 2);
    }

    // 3. CDN & Cloud Infrastructure (DELIVERED_BY / HOSTED_BY)
    if (cdnInfo && cdnInfo.detected && cdnInfo.provider) {
      const cdnNodeId = `CDN: ${cdnInfo.provider}`;
      graph.addNode(cdnNodeId, cdnInfo.provider, 'CDN', {
        pop: cdnInfo.pop,
        cacheStatus: cdnInfo.cacheStatus
      });
      graph.addEdge(rootDomain, cdnNodeId, 'DELIVERED_BY', 3);
    }

    if (hostInfo && (hostInfo.hostingProvider || hostInfo.webServer)) {
      const hostLabel = hostInfo.hostingProvider || hostInfo.webServer;
      const hostNodeId = `HOST: ${hostLabel}`;
      graph.addNode(hostNodeId, hostLabel, 'HOST', {
        isMasked: hostInfo.isOriginMasked
      });
      graph.addEdge(rootDomain, hostNodeId, 'HOSTED_BY', 2);
    }

    // 4. API Endpoints (CALLS)
    for (const api of apis.slice(0, 15)) { // Limit to 15 key endpoints to keep graph clean
      const apiNodeId = `API: ${api.key}`;
      graph.addNode(apiNodeId, `${api.method} ${api.path}`, 'API', {
        apiType: api.apiType,
        host: api.host,
        status: api.status,
        callCount: api.callCount
      });
      graph.addEdge(rootDomain, apiNodeId, 'CALLS', api.callCount || 1);
    }

    // 5. Connected Domains (CONNECTS_TO)
    const domains = sessionSnapshot.domains || [];
    for (const domain of domains) {
      if (domain === rootDomain) continue;
      const isThird = !sessionSnapshot.firstPartyDomains.includes(domain);
      const domainType = isThird ? 'THIRD_PARTY_DOMAIN' : 'FIRST_PARTY_DOMAIN';

      graph.addNode(domain, domain, domainType, {
        isFirstParty: !isThird
      });
      graph.addEdge(rootDomain, domain, 'CONNECTS_TO', 1);
    }

    // 6. Trackers (TRACKS)
    for (const tr of trackers) {
      const trackerNodeId = `TRACKER: ${tr.name}`;
      graph.addNode(trackerNodeId, tr.name, 'TRACKER', {
        trackerCategory: tr.category,
        requestCount: tr.requestCount
      });
      graph.addEdge(trackerNodeId, rootDomain, 'TRACKS', tr.requestCount || 1);
    }

    return graph;
  }
}
