// src/network/network-graph.js
// Constructs lightweight graph representations of network topologies and domain relationships.

export class NetworkGraph {
  /**
   * Build a network graph from domain profiles and requests.
   * @param {string} rootHost
   * @param {Map<string, object>} domainProfiles
   * @returns {{ nodes: Array<object>, links: Array<object> }}
   */
  static build(rootHost, domainProfiles) {
    const nodes = [];
    const links = [];
    const nodeIds = new Set();

    // 1. Root Node
    nodes.push({
      id: rootHost,
      label: rootHost,
      type: 'ROOT',
      isFirstParty: true,
      requestCount: 0,
      radius: 20,
      color: '#06b6d4'
    });
    nodeIds.add(rootHost);

    // 2. Domain Nodes
    for (const [host, profile] of domainProfiles.entries()) {
      if (host === rootHost) {
        nodes[0].requestCount = profile.requestCount;
        continue;
      }

      const isFirstParty = profile.isFirstParty;
      let color = isFirstParty ? '#38bdf8' : '#a855f7'; // First-party sky blue, Third-party purple
      if (profile.role === 'ANALYTICS') color = '#f59e0b';
      if (profile.role === 'API') color = '#10b981';

      nodes.push({
        id: host,
        label: host,
        type: profile.role,
        isFirstParty,
        requestCount: profile.requestCount,
        totalBytes: profile.totalBytes,
        radius: Math.min(24, Math.max(8, 8 + Math.log2(profile.requestCount + 1) * 3)),
        color
      });
      nodeIds.add(host);

      // Link from root to this domain
      links.push({
        source: rootHost,
        target: host,
        weight: profile.requestCount,
        label: `${profile.requestCount} reqs`
      });
    }

    return { nodes, links };
  }
}
