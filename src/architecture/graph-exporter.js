// src/architecture/graph-exporter.js
// Exports DirectedGraph instances into standard Mermaid markdown and standalone SVG diagrams.

export class GraphExporter {
  /**
   * Export graph to GitHub-flavored Mermaid flowchart syntax.
   * @param {import('./graph.js').DirectedGraph} graph
   * @param {object} [options]
   * @param {'TD'|'LR'} [options.direction='TD']
   * @param {string} [options.title]
   * @returns {string}
   */
  static toMermaid(graph, options = {}) {
    if (!graph || !graph.nodes || graph.nodes.size === 0) {
      return 'flowchart TD\n  empty["Empty Architecture Graph"]';
    }

    const direction = options.direction || 'TD';
    const lines = [];

    lines.push(`flowchart ${direction}`);

    // Map graph node IDs to safe alphanumeric Mermaid identifiers
    const idMap = new Map();
    let counter = 0;
    for (const [id] of graph.nodes) {
      idMap.set(id, `node_${counter++}`);
    }

    // Group nodes by category / type
    const groups = new Map();
    for (const [id, node] of graph.nodes) {
      const type = node.type || 'UNKNOWN';
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type).push(node);
    }

    // Subgraphs for logical clustering
    for (const [type, nodes] of groups) {
      const groupTitle = type.replace(/_/g, ' ');
      lines.push(`  subgraph ${type} ["${groupTitle}"]`);
      for (const node of nodes) {
        const safeId = idMap.get(node.id);
        const escapedLabel = (node.label || node.id).replace(/["[\]()]/g, '');
        lines.push(`    ${safeId}["${escapedLabel}"]`);
      }
      lines.push('  end');
    }

    // Edges
    lines.push('');
    for (const [sourceId, edges] of graph.adjacency) {
      const safeSource = idMap.get(sourceId);
      for (const edge of edges) {
        const safeTarget = idMap.get(edge.target);
        if (safeSource && safeTarget) {
          const relation = edge.relation || 'CONNECTS_TO';
          lines.push(`  ${safeSource} -->|"${relation}"| ${safeTarget}`);
        }
      }
    }

    // Styling classes
    lines.push('');
    lines.push('  classDef origin fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ecfdf5;');
    lines.push('  classDef api fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#eff6ff;');
    lines.push('  classDef tracker fill:#881337,stroke:#f43f5e,stroke-width:2px,color:#fff1f2;');
    lines.push('  classDef cdn fill:#581c87,stroke:#a855f7,stroke-width:2px,color:#faf5ff;');
    lines.push('  classDef default fill:#1e293b,stroke:#64748b,stroke-width:1px,color:#f8fafc;');

    // Apply classes to nodes
    for (const [id, node] of graph.nodes) {
      const safeId = idMap.get(id);
      const type = (node.type || '').toUpperCase();
      if (type.includes('ROOT') || type.includes('ORIGIN') || type.includes('WEBSITE')) {
        lines.push(`  class ${safeId} origin;`);
      } else if (type.includes('API') || type.includes('GATEWAY') || type.includes('GRAPHQL')) {
        lines.push(`  class ${safeId} api;`);
      } else if (type.includes('TRACKER') || type.includes('ANALYTICS')) {
        lines.push(`  class ${safeId} tracker;`);
      } else if (type.includes('CDN') || type.includes('EDGE')) {
        lines.push(`  class ${safeId} cdn;`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Export graph to clean, vector SVG document.
   * @param {import('./graph.js').DirectedGraph} graph
   * @param {object} [options]
   * @returns {string}
   */
  static toSvg(graph, options = {}) {
    const nodes = Array.from(graph.nodes.values());
    if (nodes.length === 0) {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><text x="50" y="100" fill="#64748b">Empty Graph</text></svg>';
    }

    const width = options.width || 1000;
    const height = options.height || 600;
    const padding = 60;

    // Simple layout positioning: circle or multi-tier grid
    const positions = new Map();
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - padding;

    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      positions.set(node.id, { x, y });
    });

    const svgParts = [];
    svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`);
    svgParts.push(`
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
        </marker>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bgGrad)" />
    `);

    // Draw Edges
    svgParts.push('<g id="edges">');
    for (const [sourceId, edges] of graph.adjacency) {
      const srcPos = positions.get(sourceId);
      if (!srcPos) continue;
      for (const edge of edges) {
        const dstPos = positions.get(edge.target);
        if (!dstPos) continue;
        svgParts.push(`<line x1="${srcPos.x}" y1="${srcPos.y}" x2="${dstPos.x}" y2="${dstPos.y}" stroke="#475569" stroke-width="1.5" stroke-dasharray="3,3" marker-end="url(#arrow)" opacity="0.75" />`);
      }
    }
    svgParts.push('</g>');

    // Draw Nodes
    svgParts.push('<g id="nodes">');
    for (const node of nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;

      let fill = '#1e293b';
      let stroke = '#64748b';
      const type = (node.type || '').toUpperCase();
      if (type.includes('ROOT') || type.includes('ORIGIN') || type.includes('WEBSITE')) {
        fill = '#064e3b';
        stroke = '#10b981';
      } else if (type.includes('API') || type.includes('GATEWAY')) {
        fill = '#1e3a8a';
        stroke = '#3b82f6';
      } else if (type.includes('TRACKER') || type.includes('ANALYTICS')) {
        fill = '#881337';
        stroke = '#f43f5e';
      } else if (type.includes('CDN') || type.includes('EDGE')) {
        fill = '#581c87';
        stroke = '#a855f7';
      }

      svgParts.push(`
        <g class="node" transform="translate(${pos.x}, ${pos.y})">
          <circle r="18" fill="${fill}" stroke="${stroke}" stroke-width="2" />
          <text y="32" text-anchor="middle" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600">${escapeXml(node.label || node.id)}</text>
          <text y="45" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="9">${escapeXml(node.type || '')}</text>
        </g>
      `);
    }
    svgParts.push('</g>');

    // Title & Legend
    svgParts.push(`
      <text x="24" y="36" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700">Underweb Architecture Graph</text>
      <text x="24" y="54" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="11">Generated: ${new Date().toISOString()}</text>
    `);

    svgParts.push('</svg>');
    return svgParts.join('\n');
  }
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}
