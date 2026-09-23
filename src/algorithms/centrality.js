// src/algorithms/centrality.js
// Degree Centrality and Betweenness Centrality (Brandes' Algorithm).

export class Centrality {
  /**
   * Compute in-degree, out-degree, and total degree centrality for all nodes.
   * @param {import('../architecture/graph.js').DirectedGraph} graph
   * @returns {Map<string, { inDegree: number, outDegree: number, totalDegree: number }>}
   */
  static degreeCentrality(graph) {
    const results = new Map();
    for (const id of graph.nodes.keys()) {
      const inDegree = graph.getInDegree(id);
      const outDegree = graph.getOutDegree(id);
      results.set(id, {
        inDegree,
        outDegree,
        totalDegree: inDegree + outDegree
      });
    }
    return results;
  }

  /**
   * Compute Betweenness Centrality using Brandes' Algorithm (O(V*E)).
   * Identifies bridge nodes through which the most shortest paths pass.
   * @param {import('../architecture/graph.js').DirectedGraph} graph
   * @returns {Map<string, number>}
   */
  static betweennessCentrality(graph) {
    const cb = new Map();
    const nodeIds = Array.from(graph.nodes.keys());
    for (const v of nodeIds) {
      cb.set(v, 0);
    }

    for (const s of nodeIds) {
      const stack = [];
      const pred = new Map();
      const sigma = new Map();
      const dist = new Map();

      for (const w of nodeIds) {
        pred.set(w, []);
        sigma.set(w, 0);
        dist.set(w, -1);
      }

      sigma.set(s, 1);
      dist.set(s, 0);

      const queue = [s];

      while (queue.length > 0) {
        const v = queue.shift();
        stack.push(v);

        for (const w of graph.getOutNeighbors(v)) {
          // w found for the first time?
          if (dist.get(w) < 0) {
            dist.set(w, dist.get(v) + 1);
            queue.push(w);
          }
          // shortest path to w via v?
          if (dist.get(w) === dist.get(v) + 1) {
            sigma.set(w, sigma.get(w) + sigma.get(v));
            pred.get(w).push(v);
          }
        }
      }

      const delta = new Map();
      for (const v of nodeIds) {
        delta.set(v, 0);
      }

      while (stack.length > 0) {
        const w = stack.pop();
        for (const v of pred.get(w)) {
          const c = (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w));
          delta.set(v, delta.get(v) + c);
        }
        if (w !== s) {
          cb.set(w, cb.get(w) + delta.get(w));
        }
      }
    }

    // Round values
    for (const [key, val] of cb.entries()) {
      cb.set(key, Math.round(val * 100) / 100);
    }

    return cb;
  }
}
