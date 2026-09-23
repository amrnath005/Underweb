// src/ui/graph/graph-renderer.js
// Interactive HTML5 Canvas force-directed graph renderer with physics simulation,
// zoom, pan, node drag, search, filtering, and path highlighting.
// Styled in Underweb's Electric Cobalt & Scorpion theme.

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

    // Transform State (Pan & Zoom)
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

    // Physics Simulation Parameters
    this.alpha = 1.0;
    this.alphaMin = 0.001;
    this.alphaDecay = 0.02;
    this.repulsion = 420;
    this.springLength = 90;
    this.springStrength = 0.06;
    this.centerGravity = 0.02;

    this.onNodeSelect = options.onNodeSelect || null;
    this.bindEvents();
    this.startLoop();
  }

  setData(graphJson) {
    this.nodes = (graphJson.nodes || []).map(n => ({
      ...n,
      x: (Math.random() - 0.5) * 320,
      y: (Math.random() - 0.5) * 320,
      vx: 0,
      vy: 0,
      radius: n.radius || (n.type === 'WEBSITE' ? 24 : n.type === 'API' ? 14 : 16)
    }));

    this.nodeMap = new Map(this.nodes.map(n => [n.id, n]));

    this.links = (graphJson.links || []).map(l => ({
      ...l,
      sourceNode: this.nodeMap.get(typeof l.source === 'object' ? l.source.id : l.source),
      targetNode: this.nodeMap.get(typeof l.target === 'object' ? l.target.id : l.target)
    })).filter(l => l.sourceNode && l.targetNode);

    this.alpha = 1.0;
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

  findNodeAt(worldX, worldY) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (this.filterType !== 'ALL' && node.type !== this.filterType && node.type !== 'WEBSITE') {
        continue;
      }
      const dx = node.x - worldX;
      const dy = node.y - worldY;
      if (dx * dx + dy * dy <= node.radius * node.radius) {
        return node;
      }
    }
    return null;
  }

  onMouseDown(e) {
    const coords = this.toWorldCoords(e.clientX, e.clientY);
    const clicked = this.findNodeAt(coords.x, coords.y);

    if (clicked) {
      this.draggedNode = clicked;
      this.selectedNode = clicked;
      this.alpha = 0.5;
      if (this.onNodeSelect) this.onNodeSelect(clicked);
    } else {
      this.isPanning = true;
      this.panStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
      this.selectedNode = null;
      if (this.onNodeSelect) this.onNodeSelect(null);
    }
  }

  onMouseMove(e) {
    if (this.draggedNode) {
      const coords = this.toWorldCoords(e.clientX, e.clientY);
      this.draggedNode.x = coords.x;
      this.draggedNode.y = coords.y;
      this.alpha = 0.3;
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
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.2, Math.min(3.5, this.transform.scale * zoomFactor));

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    this.transform.x = mouseX - (mouseX - this.transform.x) * (newScale / this.transform.scale);
    this.transform.y = mouseY - (mouseY - this.transform.y) * (newScale / this.transform.scale);
    this.transform.scale = newScale;
  }

  tickPhysics() {
    if (this.alpha < this.alphaMin) return;

    for (let i = 0; i < this.nodes.length; i++) {
      const n1 = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n2 = this.nodes[j];
        const dx = n2.x - n1.x || 1;
        const dy = n2.y - n1.y || 1;
        const distSq = Math.max(25, dx * dx + dy * dy);
        const dist = Math.sqrt(distSq);
        const force = (this.repulsion / distSq) * this.alpha;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        n1.vx -= fx;
        n1.vy -= fy;
        n2.vx += fx;
        n2.vy += fy;
      }
    }

    for (const link of this.links) {
      const s = link.sourceNode;
      const t = link.targetNode;
      const dx = t.x - s.x || 1;
      const dy = t.y - s.y || 1;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - this.springLength) * this.springStrength * this.alpha;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      s.vx += fx;
      s.vy += fy;
      t.vx -= fx;
      t.vy -= fy;
    }

    for (const node of this.nodes) {
      if (node === this.draggedNode) continue;
      node.vx -= node.x * this.centerGravity * this.alpha;
      node.vy -= node.y * this.centerGravity * this.alpha;

      node.vx *= 0.82;
      node.vy *= 0.82;

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

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);

      if (isPathHighlighted) {
        ctx.strokeStyle = isDark ? '#F59E0B' : '#B45309';
        ctx.lineWidth = 2.5;
      } else if (this.selectedNode && (s === this.selectedNode || t === this.selectedNode)) {
        ctx.strokeStyle = isDark ? '#34D399' : '#059669';
        ctx.lineWidth = 1.8;
      } else {
        ctx.strokeStyle = isDark ? '#27272A' : '#E4E4E7';
        ctx.lineWidth = 1;
      }
      ctx.stroke();

      // Relation badge on midpoint if highlighted or selected
      if (this.transform.scale > 0.85 && (isPathHighlighted || (this.selectedNode && (s === this.selectedNode || t === this.selectedNode)))) {
        const mx = (s.x + t.x) / 2;
        const my = (s.y + t.y) / 2;
        ctx.fillStyle = isDark ? '#18181B' : '#FFFFFF';
        ctx.font = '500 9px "JetBrains Mono", monospace';
        const labelText = link.relation || '';
        const tw = ctx.measureText(labelText).width;
        ctx.fillRect(mx - tw / 2 - 4, my - 7, tw + 8, 14);
        ctx.strokeStyle = isDark ? '#3F3F46' : '#E4E4E7';
        ctx.strokeRect(mx - tw / 2 - 4, my - 7, tw + 8, 14);
        ctx.fillStyle = isPathHighlighted ? (isDark ? '#F59E0B' : '#B45309') : (isDark ? '#A1A1AA' : '#52525B');
        ctx.fillText(labelText, mx - tw / 2, my + 3);
      }
    }

    // 2. Draw Nodes
    for (const node of this.nodes) {
      const isFiltered = this.filterType !== 'ALL' && node.type !== this.filterType && node.type !== 'WEBSITE';
      const isSelected = (node === this.selectedNode);
      const isHovered = (node === this.hoveredNode);
      const isPath = this.highlightPath.includes(node.id);

      const radius = node.radius + (isSelected ? 3 : 0);

      // Circle Fill
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      // Clean Modern Palette
      let fillColor = isDark ? '#27272A' : '#F4F4F5';
      if (node.type === 'WEBSITE')             fillColor = isDark ? '#FAFAFA' : '#09090B';
      else if (node.type === 'FRAMEWORK')      fillColor = isDark ? '#3B82F6' : '#2563EB';
      else if (node.type === 'LIBRARY')        fillColor = isDark ? '#60A5FA' : '#3B82F6';
      else if (node.type === 'API')            fillColor = isDark ? '#34D399' : '#059669';
      else if (node.type === 'CDN')            fillColor = isDark ? '#A78BFA' : '#7C3AED';
      else if (node.type === 'HOST')           fillColor = isDark ? '#64748B' : '#475569';
      else if (node.type === 'TRACKER')        fillColor = isDark ? '#F87171' : '#DC2626';
      else if (node.type === 'FIRST_PARTY_DOMAIN') fillColor = isDark ? '#F59E0B' : '#B45309';
      else if (node.type === 'THIRD_PARTY_DOMAIN') fillColor = isDark ? '#3F3F46' : '#E4E4E7';

      if (isFiltered) {
        ctx.fillStyle = isDark ? 'rgba(39, 39, 42, 0.3)' : 'rgba(244, 244, 245, 0.3)';
        ctx.strokeStyle = isDark ? 'rgba(63, 63, 70, 0.2)' : 'rgba(228, 228, 231, 0.2)';
      } else {
        ctx.fillStyle = fillColor;
        const strokeBase = isDark ? '#3F3F46' : '#D4D4D8';
        ctx.strokeStyle = isSelected ? (isDark ? '#F59E0B' : '#B45309') : isPath ? (isDark ? '#F59E0B' : '#B45309') : strokeBase;
      }

      ctx.lineWidth = isSelected || isPath ? 2 : 1;
      ctx.fill();
      ctx.stroke();

      // Node Label
      if (!isFiltered || isSelected || isHovered) {
        ctx.font = `${node.type === 'WEBSITE' ? '600 11px' : '400 10px'} "Inter", sans-serif`;
        ctx.fillStyle = isSelected ? (isDark ? '#F59E0B' : '#B45309') : (isDark ? '#FAFAFA' : '#09090B');
        ctx.textAlign = 'center';
        ctx.fillText(node.label || node.id, node.x, node.y + radius + 12);
      }
    }

    ctx.restore();
  }
}
