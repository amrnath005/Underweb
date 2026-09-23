// src/algorithms/dependency-depth.js
// Calculates maximum and average dependency depth from root.

export class DependencyDepth {
  /**
   * Compute maximum and average dependency depth from a designated root node.
   * @param {import('../architecture/graph.js').DirectedGraph} graph
   * @param {string} rootNodeId
   * @returns {{ maxDepth: number, avgDepth: number, depthMap: Map<string, number> }}
   */
  static compute(graph, rootNodeId) {
    const depthMap = new Map();
    if (!graph.nodes.has(rootNodeId)) {
      return { maxDepth: 0, avgDepth: 0, depthMap };
    }

    const queue = [{ id: rootNodeId, depth: 0 }];
    depthMap.set(rootNodeId, 0);

    let maxDepth = 0;
    let totalDepth = 0;

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (depth > maxDepth) maxDepth = depth;
      totalDepth += depth;

      for (const neighbor of graph.getOutNeighbors(id)) {
        if (!depthMap.has(neighbor)) {
          depthMap.set(neighbor, depth + 1);
          queue.push({ id: neighbor, depth: depth + 1 });
        }
      }
    }

    const avgDepth = depthMap.size > 0 ? parseFloat((totalDepth / depthMap.size).toFixed(2)) : 0;
    return { maxDepth, avgDepth, depthMap };
  }
}
