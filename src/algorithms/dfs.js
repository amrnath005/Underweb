// src/algorithms/dfs.js
// Depth-First Search (DFS) graph traversal and cycle detection.

export class DepthFirstSearch {
  /**
   * Traverse graph from startNodeId in depth-first order.
   * @param {import('../architecture/graph.js').DirectedGraph} graph
   * @param {string} startNodeId
   * @returns {{ visitedOrder: string[], hasCycle: boolean }}
   */
  static traverse(graph, startNodeId) {
    const visited = new Set();
    const recursionStack = new Set();
    const visitedOrder = [];
    let hasCycle = false;

    function dfs(nodeId) {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      visitedOrder.push(nodeId);

      const neighbors = graph.getOutNeighbors(nodeId);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          hasCycle = true;
        }
      }

      recursionStack.delete(nodeId);
    }

    if (graph.nodes.has(startNodeId)) {
      dfs(startNodeId);
    }

    return { visitedOrder, hasCycle };
  }
}
