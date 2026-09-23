// src/algorithms/connected-components.js
// Identifies connected components and isolated subgraphs.

export class ConnectedComponents {
  /**
   * Find all connected components in the graph (undirected projection).
   * @param {import('../architecture/graph.js').DirectedGraph} graph
   * @returns {Array<string[]>} Array of component node arrays
   */
  static findComponents(graph) {
    const visited = new Set();
    const components = [];

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        const component = [];
        const queue = [nodeId];
        visited.add(nodeId);

        while (queue.length > 0) {
          const current = queue.shift();
          component.push(current);

          // Check both in and out neighbors
          const allNeighbors = [
            ...graph.getOutNeighbors(current),
            ...graph.getInNeighbors(current)
          ];

          for (const neighbor of allNeighbors) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }

        components.push(component);
      }
    }

    // Sort components by size descending
    return components.sort((a, b) => b.length - a.length);
  }
}
