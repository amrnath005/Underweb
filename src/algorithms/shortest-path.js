// src/algorithms/shortest-path.js
// Shortest path discovery using Dijkstra / BFS for unweighted/weighted directed graphs.

export class ShortestPath {
  /**
   * Find the shortest path between sourceId and targetId.
   * @param {import('../architecture/graph.js').DirectedGraph} graph
   * @param {string} sourceId
   * @param {string} targetId
   * @returns {{ found: boolean, distance: number, path: string[] }}
   */
  static findPath(graph, sourceId, targetId) {
    if (!graph.nodes.has(sourceId) || !graph.nodes.has(targetId)) {
      return { found: false, distance: Infinity, path: [] };
    }

    if (sourceId === targetId) {
      return { found: true, distance: 0, path: [sourceId] };
    }

    const distances = new Map();
    const previous = new Map();
    const queue = [sourceId];

    distances.set(sourceId, 0);

    while (queue.length > 0) {
      const current = queue.shift();
      const currentDist = distances.get(current);

      if (current === targetId) {
        // Reconstruct path
        const path = [];
        let curr = targetId;
        while (curr) {
          path.unshift(curr);
          curr = previous.get(curr);
        }
        return { found: true, distance: currentDist, path };
      }

      for (const neighbor of graph.getOutNeighbors(current)) {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, currentDist + 1);
          previous.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    return { found: false, distance: Infinity, path: [] };
  }
}
