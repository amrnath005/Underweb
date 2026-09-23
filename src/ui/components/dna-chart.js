// src/ui/components/dna-chart.js
// Visualizes multi-dimensional Website DNA complexity radar using HTML5 Canvas.
// Styled in Underweb's Electric Cobalt & Cyan Stinger theme.

export class WebsiteDnaChart {
  /**
   * Render Website DNA radar onto an HTML5 Canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {{ frontend: number, network: number, thirdParty: number, api: number, infra: number, privacy: number }} metrics - Values 0 to 100
   */
  static render(canvas, metrics) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.38;

    ctx.clearRect(0, 0, width, height);

    const axes = [
      { key: 'frontend', label: 'FRONTEND' },
      { key: 'network', label: 'NETWORK' },
      { key: 'thirdParty', label: '3RD PARTY' },
      { key: 'api', label: 'APIs' },
      { key: 'infra', label: 'INFRA' },
      { key: 'privacy', label: 'PRIVACY' }
    ];

    const numAxes = axes.length;
    const angleStep = (Math.PI * 2) / numAxes;

    // 1. Draw concentric background rings (Electric grid)
    ctx.strokeStyle = '#162456';
    ctx.lineWidth = 1;
    for (let r = 0.25; r <= 1.0; r += 0.25) {
      ctx.beginPath();
      for (let i = 0; i < numAxes; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = cx + Math.cos(angle) * (radius * r);
        const y = cy + Math.sin(angle) * (radius * r);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 2. Draw axis lines and labels
    ctx.font = '10px "Space Mono", monospace';
    ctx.fillStyle = '#9bb0dc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.strokeStyle = '#223780';
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Axis labels
      const labelX = cx + Math.cos(angle) * (radius + 24);
      const labelY = cy + Math.sin(angle) * (radius + 16);
      ctx.fillText(axes[i].label, labelX, labelY);
    }

    // 3. Draw data polygon
    const points = [];
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const rawVal = metrics[axes[i].key] || 20;
      const normalized = Math.max(0.12, Math.min(1.0, rawVal / 100));
      const px = cx + Math.cos(angle) * (radius * normalized);
      const py = cy + Math.sin(angle) * (radius * normalized);
      points.push({ x: px, y: py });
    }

    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();

      // Fill Electric Cobalt gradient
      ctx.fillStyle = 'rgba(0, 34, 255, 0.45)';
      ctx.fill();

      // Stroke Neon Cyan Stinger outline
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw point markers
      ctx.fillStyle = '#ffffff';
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
}
