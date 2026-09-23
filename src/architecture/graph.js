// src/architecture/graph.js
// Directed Graph data structure with adjacency list and reverse adjacency tracking.

export class DirectedGraph {
  constructor() {
    /** @type {Map<string, { id: string, label: string, type: string, category: string, metadata: object }>} */
    this.nodes = new Map();

    /** @type {Map<string, Set<{ target: string, relation: string, weight: number, metadata: object }>>} */
    this.adjacency = new Map();

    /** @type {Map<string, Set<{ source: string, relation: string, weight: number }>>} */
    this.reverseAdjacency = new Map();
  }

  /**
   * Add a node to the graph if it doesn't already exist.
   * @param {string} id
   * @param {string} label
   * @param {string} type
   * @param {object} [metadata]
   */
  addNode(id, label, type, metadata = {}) {
    if (!id) return;
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        label: label || id,
        type: type || 'UNKNOWN',
        metadata
      });
      this.adjacency.set(id, new Set());
      this.reverseAdjacency.set(id, new Set());
    } else {
      // Merge metadata
      const existing = this.nodes.get(id);
      Object.assign(existing.metadata, metadata);
    }
  }

  /**
   * Add a directed edge from source to target.
   * @param {string} sourceId
   * @param {string} targetId
   * @param {string} relation - e.g. 'LOADS', 'CALLS', 'CONNECTS_TO', 'HOSTED_BY', 'DEPENDS_ON', 'TRACKS'
   * @param {number} [weight=1]
   * @param {object} [metadata]
   */
  addEdge(sourceId, targetId, relation = 'CONNECTS_TO', weight = 1, metadata = {}) {
    if (!sourceId || !targetId || sourceId === targetId) return;

    if (!this.nodes.has(sourceId)) {
      this.addNode(sourceId, sourceId, 'UNKNOWN');
    }
    if (!this.nodes.has(targetId)) {
      this.addNode(targetId, targetId, 'UNKNOWN');
    }

    const edges = this.adjacency.get(sourceId);
    let existingEdge = null;
    for (const edge of edges) {
      if (edge.target === targetId && edge.relation === relation) {
        existingEdge = edge;
        break;
      }
    }

    if (existingEdge) {
      existingEdge.weight += weight;
    } else {
      edges.add({ target: targetId, relation, weight, metadata });
      this.reverseAdjacency.get(targetId).add({ source: sourceId, relation, weight });
    }
  }

  getNode(id) {
    return this.nodes.get(id) || null;
  }

  getOutNeighbors(id) {
    const edges = this.adjacency.get(id);
    if (!edges) return [];
    return Array.from(edges).map(e => e.target);
  }

  getInNeighbors(id) {
    const edges = this.reverseAdjacency.get(id);
    if (!edges) return [];
    return Array.from(edges).map(e => e.source);
  }

  getOutDegree(id) {
    const edges = this.adjacency.get(id);
    return edges ? edges.size : 0;
  }

  getInDegree(id) {
    const edges = this.reverseAdjacency.get(id);
    return edges ? edges.size : 0;
  }

  toJSON() {
    const nodes = Array.from(this.nodes.values());
    const links = [];

    for (const [source, edgeSet] of this.adjacency.entries()) {
      for (const edge of edgeSet) {
        links.push({
          source,
          target: edge.target,
          relation: edge.relation,
          weight: edge.weight,
          metadata: edge.metadata
        });
      }
    }

    return { nodes, links };
  }
}
