// src/algorithms/bfs.js
// Breadth-First Search (BFS) graph traversal and reachability analyzer.

export class BreadthFirstSearch {
  /**
   * Traverse graph from startNodeId in breadth-first order.
   * @param {import('../architecture/graph.js').DirectedGraph} graph
   * @param {string} startNodeId
   * @returns {{ visitedOrder: string[], distances: Map<string, number>, parentMap: Map<string, string|null> }}
   */
  static traverse(graph, startNodeId) {
    const visitedOrder = [];
    const distances = new Map();
    const parentMap = new Map();
    const queue = [];

    if (!graph.nodes.has(startNodeId)) {
      return { visitedOrder, distances, parentMap };
    }

    queue.push(startNodeId);
    distances.set(startNodeId, 0);
    parentMap.set(startNodeId, null);

    while (queue.length > 0) {
      const current = queue.shift();
      visitedOrder.push(current);
      const currentDist = distances.get(current);

      const neighbors = graph.getOutNeighbors(current);
      for (const neighbor of neighbors) {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, currentDist + 1);
          parentMap.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    return { visitedOrder, distances, parentMap };
  }
}
