// src/ui/graph/graph-renderer.js
// High-performance force-directed topology graph with anti-overlap collision physics,
// magnetic hit-testing, concentric radial seeding, neighbor highlighting, and camera fit.

export class GraphRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} [options]
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = [];
    this.links = [];
    this.nodeMap = new Map();

    // Camera Transform (Pan & Zoom)
    this.transform = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      scale: 1.0
    };

    // Interaction State
    this.draggedNode = null;
    this.hoveredNode = null;
    this.selectedNode = null;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.highlightPath = [];
    this.filterType = 'ALL';
    this.mousePos = { x: 0, y: 0 };

    // Physics Simulation Parameters (Tuned for zero overlap and organic spreading)
    this.alpha = 1.0;
    this.alphaMin = 0.001;
    this.alphaDecay = 0.015;
    this.repulsion = 1400;         // Strong charge prevents clustering
    this.springLength = 150;       // Generous spacing for labels
    this.springStrength = 0.04;
    this.centerGravity = 0.015;
    this.collisionMargin = 42;     // Anti-overlap distance margin

    this.onNodeSelect = options.onNodeSelect || null;
    this.bindEvents();
    this.startLoop();
  }

  /**
   * Seed and initialize graph nodes with concentric ring distribution to prevent knots.
   */
  setData(graphJson) {
    const rawNodes = graphJson.nodes || [];
    const total = rawNodes.length;

    // Concentric ring classification for clean initial layout
    this.nodes = rawNodes.map((n, idx) => {
      let r = 200;
      let angle = (idx / Math.max(1, total)) * Math.PI * 2;

      if (n.type === 'WEBSITE') {
        r = 0; // Center
      } else if (n.type === 'FRAMEWORK' || n.type === 'FIRST_PARTY_DOMAIN') {
        r = 140;
      } else if (n.type === 'API' || n.type === 'LIBRARY') {
        r = 260;
      } else {
        r = 380; // CDNs, Trackers, Hosts
      }

      // Small angular jitter to break symmetry
      const jitter = (Math.random() - 0.5) * 0.4;
      const finalAngle = angle + jitter;

      return {
        ...n,
        x: Math.cos(finalAngle) * r,
        y: Math.sin(finalAngle) * r,
        vx: 0,
        vy: 0,
        radius: n.radius || (n.type === 'WEBSITE' ? 24 : n.type === 'API' ? 15 : 17)
      };
    });

    this.nodeMap = new Map(this.nodes.map(n => [n.id, n]));

    this.links = (graphJson.links || []).map(l => ({
      ...l,
      sourceNode: this.nodeMap.get(typeof l.source === 'object' ? l.source.id : l.source),
      targetNode: this.nodeMap.get(typeof l.target === 'object' ? l.target.id : l.target)
    })).filter(l => l.sourceNode && l.targetNode);

    this.alpha = 1.0;
    setTimeout(() => this.fitToScreen(), 350);
  }

  highlightRoute(path) {
    this.highlightPath = path || [];
  }

  setFilter(type) {
    this.filterType = type;
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.canvas.parentElement) {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight || 520;
      }
    });
  }

  toWorldCoords(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;
    return {
      x: (x - this.transform.x) / this.transform.scale,
      y: (y - this.transform.y) / this.transform.scale
    };
  }

  /**
   * Magnetic Hit-Testing: Generous click tolerance (node radius + margin)
   * Makes clicking small nodes effortless on high-DPI displays.
   */
  findNodeAt(worldX, worldY) {
    let closestNode = null;
    let closestDistSq = Infinity;

    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (this.filterType !== 'ALL' && node.type !== this.filterType && node.type !== 'WEBSITE') {
        continue;
      }

      const dx = node.x - worldX;
      const dy = node.y - worldY;
      const distSq = dx * dx + dy * dy;

      // Magnetic hit area: radius + generous tolerance in screen space
      const effectiveRadius = Math.max(node.radius + 14, 28);
      const hitRadiusSq = effectiveRadius * effectiveRadius;

      if (distSq <= hitRadiusSq && distSq < closestDistSq) {
        closestDistSq = distSq;
        closestNode = node;
      }
    }
    return closestNode;
  }

  onMouseDown(e) {
    const coords = this.toWorldCoords(e.clientX, e.clientY);
    const clicked = this.findNodeAt(coords.x, coords.y);

    if (clicked) {
      this.draggedNode = clicked;
      this.selectedNode = clicked;
      this.alpha = 0.4;
      if (this.onNodeSelect) this.onNodeSelect(clicked);
    } else {
      this.isPanning = true;
      this.panStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
      // Clicking empty space deselects
      this.selectedNode = null;
      if (this.onNodeSelect) this.onNodeSelect(null);
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (this.draggedNode) {
      const coords = this.toWorldCoords(e.clientX, e.clientY);
      this.draggedNode.x = coords.x;
      this.draggedNode.y = coords.y;
      this.draggedNode.vx = 0;
      this.draggedNode.vy = 0;
      this.alpha = Math.max(this.alpha, 0.25);
    } else if (this.isPanning) {
      this.transform.x = e.clientX - this.panStart.x;
      this.transform.y = e.clientY - this.panStart.y;
    } else {
      const coords = this.toWorldCoords(e.clientX, e.clientY);
      this.hoveredNode = this.findNodeAt(coords.x, coords.y);
      this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'default';
    }
  }

  onMouseUp() {
    this.draggedNode = null;
    this.isPanning = false;
  }

  onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newScale = Math.max(0.2, Math.min(3.5, this.transform.scale * zoomFactor));

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    this.transform.x = mouseX - (mouseX - this.transform.x) * (newScale / this.transform.scale);
    this.transform.y = mouseY - (mouseY - this.transform.y) * (newScale / this.transform.scale);
    this.transform.scale = newScale;
  }

  zoomIn() {
    const newScale = Math.min(3.5, this.transform.scale * 1.25);
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    this.transform.x = cx - (cx - this.transform.x) * (newScale / this.transform.scale);
    this.transform.y = cy - (cy - this.transform.y) * (newScale / this.transform.scale);
    this.transform.scale = newScale;
  }

  zoomOut() {
    const newScale = Math.max(0.2, this.transform.scale * 0.8);
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    this.transform.x = cx - (cx - this.transform.x) * (newScale / this.transform.scale);
    this.transform.y = cy - (cy - this.transform.y) * (newScale / this.transform.scale);
    this.transform.scale = newScale;
  }

  resetView() {
    this.transform = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      scale: 1.0
    };
    this.alpha = 0.6;
  }

  /**
   * Automatically fit all nodes perfectly centered inside the visible canvas.
   */
  fitToScreen() {
    if (this.nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const node of this.nodes) {
      if (node.x < minX) minX = node.x;
      if (node.x > maxX) maxX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.y > maxY) maxY = node.y;
    }

    const padding = 80;
    const graphWidth = Math.max(100, (maxX - minX) + padding * 2);
    const graphHeight = Math.max(100, (maxY - minY) + padding * 2);

    const scaleX = this.canvas.width / graphWidth;
    const scaleY = this.canvas.height / graphHeight;
    const fitScale = Math.max(0.35, Math.min(1.4, Math.min(scaleX, scaleY)));

    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;

    this.transform.scale = fitScale;
    this.transform.x = (this.canvas.width / 2) - graphCenterX * fitScale;
    this.transform.y = (this.canvas.height / 2) - graphCenterY * fitScale;
  }

  /**
   * Physics Engine:
   * 1. Electrostatic repulsion (inverse-square with minimum clamp)
   * 2. Hooke's spring forces along links
   * 3. HARD COLLISION RESOLUTION (Zero overlapping circles)
   * 4. Center-of-gravity stabilization
   */
  tickPhysics() {
    if (this.alpha < this.alphaMin) return;

    // 1. Repulsion force between every pair
    for (let i = 0; i < this.nodes.length; i++) {
      const n1 = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n2 = this.nodes[j];
        let dx = n2.x - n1.x;
        let dy = n2.y - n1.y;

        if (dx === 0 && dy === 0) {
          dx = (Math.random() - 0.5) * 2;
          dy = (Math.random() - 0.5) * 2;
        }

        const distSq = Math.max(16, dx * dx + dy * dy);
        const dist = Math.sqrt(distSq);

        // Standard Coulomb force
        const force = (this.repulsion / distSq) * this.alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        n1.vx -= fx;
        n1.vy -= fy;
        n2.vx += fx;
        n2.vy += fy;

        // HARD ANTI-OVERLAP COLLISION CONSTRAINT
        const minDistance = n1.radius + n2.radius + this.collisionMargin;
        if (dist < minDistance) {
          const overlap = (minDistance - dist) * 0.55;
          const ox = (dx / dist) * overlap;
          const oy = (dy / dist) * overlap;

          if (n1 !== this.draggedNode) {
            n1.x -= ox;
            n1.y -= oy;
          }
          if (n2 !== this.draggedNode) {
            n2.x += ox;
            n2.y += oy;
          }
        }
      }
    }

    // 2. Spring force along directed edges
    for (const link of this.links) {
      const s = link.sourceNode;
      const t = link.targetNode;
      const dx = t.x - s.x || 1;
      const dy = t.y - s.y || 1;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - this.springLength) * this.springStrength * this.alpha;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (s !== this.draggedNode) {
        s.vx += fx;
        s.vy += fy;
      }
      if (t !== this.draggedNode) {
        t.vx -= fx;
        t.vy -= fy;
      }
    }

    // 3. Center gravity & velocity dampening
    for (const node of this.nodes) {
      if (node === this.draggedNode) continue;
      node.vx -= node.x * this.centerGravity * this.alpha;
      node.vy -= node.y * this.centerGravity * this.alpha;

      node.vx *= 0.78; // Gentle damping
      node.vy *= 0.78;

      node.x += node.vx;
      node.y += node.vy;
    }

    this.alpha *= (1 - this.alphaDecay);
  }

  startLoop() {
    const loop = () => {
      this.tickPhysics();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Find connected neighbors of active/hovered node
    const activeFocusNode = this.hoveredNode || this.selectedNode;
    const connectedNodeIds = new Set();
    if (activeFocusNode) {
      connectedNodeIds.add(activeFocusNode.id);
      for (const l of this.links) {
        if (l.sourceNode.id === activeFocusNode.id) connectedNodeIds.add(l.targetNode.id);
        if (l.targetNode.id === activeFocusNode.id) connectedNodeIds.add(l.sourceNode.id);
      }
    }

    ctx.save();
    ctx.translate(this.transform.x, this.transform.y);
    ctx.scale(this.transform.scale, this.transform.scale);

    // 1. Draw Links
    for (const link of this.links) {
      const s = link.sourceNode;
      const t = link.targetNode;

      const isPathHighlighted = this.highlightPath.length > 1 &&
        this.highlightPath.includes(s.id) &&
        this.highlightPath.includes(t.id);

      const isConnectedToFocus = activeFocusNode && (s.id === activeFocusNode.id || t.id === activeFocusNode.id);

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);

      if (isPathHighlighted) {
        ctx.strokeStyle = isDark ? '#E11D48' : '#DC2626';
        ctx.lineWidth = 3;
      } else if (isConnectedToFocus) {
        ctx.strokeStyle = isDark ? '#F43F5E' : '#D92338';
        ctx.lineWidth = 2.2;
      } else if (activeFocusNode) {
        ctx.strokeStyle = isDark ? 'rgba(30, 35, 48, 0.3)' : 'rgba(223, 221, 213, 0.4)';
        ctx.lineWidth = 0.8;
      } else {
        ctx.strokeStyle = isDark ? '#1E2330' : '#DFDDD5';
        ctx.lineWidth = 1.2;
      }
      ctx.stroke();

      // Relation badge on midpoint if highlighted, selected, or hovered
      if ((isPathHighlighted || isConnectedToFocus) && this.transform.scale > 0.65) {
        const mx = (s.x + t.x) / 2;
        const my = (s.y + t.y) / 2;
        ctx.fillStyle = isDark ? '#0F1117' : '#FCFAF7';
        ctx.font = '600 9px "JetBrains Mono", monospace';
        const labelText = link.relation || '';
        const tw = ctx.measureText(labelText).width;
        ctx.fillRect(mx - tw / 2 - 4, my - 7, tw + 8, 14);
        ctx.strokeStyle = isDark ? '#2D3548' : '#C8C5BB';
        ctx.strokeRect(mx - tw / 2 - 4, my - 7, tw + 8, 14);
        ctx.fillStyle = isPathHighlighted ? (isDark ? '#E11D48' : '#DC2626') : (isDark ? '#F1F5F9' : '#121316');
        ctx.fillText(labelText, mx - tw / 2, my + 3);
      }
    }

    // 2. Draw Nodes
    for (const node of this.nodes) {
      const isFiltered = this.filterType !== 'ALL' && node.type !== this.filterType && node.type !== 'WEBSITE';
      const isSelected = (node === this.selectedNode);
      const isHovered = (node === this.hoveredNode);
      const isPath = this.highlightPath.includes(node.id);
      const isConnected = !activeFocusNode || connectedNodeIds.has(node.id);

      const radius = node.radius + (isSelected ? 4 : isHovered ? 2 : 0);

      // Magnetic Glow Aura on Hover / Selection
      if (isHovered || isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(225, 29, 72, 0.22)' : 'rgba(217, 35, 56, 0.16)';
        ctx.fill();
      }

      // Circle Fill
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      // Node Colors
      let fillColor = isDark ? '#1C202C' : '#EBE9E2';
      if (node.type === 'WEBSITE')             fillColor = isDark ? '#F1F5F9' : '#121316';
      else if (node.type === 'FRAMEWORK')      fillColor = isDark ? '#38BDF8' : '#1D4ED8';
      else if (node.type === 'LIBRARY')        fillColor = isDark ? '#60A5FA' : '#2563EB';
      else if (node.type === 'API')            fillColor = isDark ? '#22C55E' : '#15803D';
      else if (node.type === 'CDN')            fillColor = isDark ? '#A855F7' : '#7E22CE';
      else if (node.type === 'HOST')           fillColor = isDark ? '#64748B' : '#475569';
      else if (node.type === 'TRACKER')        fillColor = isDark ? '#F87171' : '#DC2626';
      else if (node.type === 'FIRST_PARTY_DOMAIN') fillColor = isDark ? '#E11D48' : '#D92338';
      else if (node.type === 'THIRD_PARTY_DOMAIN') fillColor = isDark ? '#2D3548' : '#DFDDD5';

      if (isFiltered || !isConnected) {
        ctx.fillStyle = isDark ? 'rgba(21, 24, 33, 0.25)' : 'rgba(235, 233, 226, 0.35)';
        ctx.strokeStyle = isDark ? 'rgba(45, 53, 72, 0.2)' : 'rgba(200, 197, 187, 0.3)';
      } else {
        ctx.fillStyle = fillColor;
        const strokeBase = isDark ? '#2D3548' : '#C8C5BB';
        ctx.strokeStyle = (isSelected || isHovered || isPath) ? (isDark ? '#E11D48' : '#D92338') : strokeBase;
      }

      ctx.lineWidth = isSelected || isHovered || isPath ? 2.5 : 1.2;
      ctx.fill();
      ctx.stroke();

      // Node Typography Label
      if (!isFiltered) {
        const isDimmed = activeFocusNode && !isConnected;
        ctx.font = `${node.type === 'WEBSITE' ? '700 11.5px' : '500 10.5px'} "Space Grotesk", sans-serif`;
        ctx.fillStyle = isDimmed
          ? (isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(140, 142, 153, 0.35)')
          : (isSelected || isHovered)
            ? (isDark ? '#E11D48' : '#D92338')
            : (isDark ? '#F1F5F9' : '#121316');
        ctx.textAlign = 'center';
        ctx.fillText(node.label || node.id, node.x, node.y + radius + 13);
      }
    }

    ctx.restore();
  }
}
