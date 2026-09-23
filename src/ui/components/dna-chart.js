// src/ui/components/dna-chart.js
// Visualizes multi-dimensional Website DNA complexity radar using HTML5 Canvas.
// Minimal, clean, responsive to theme.

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
    const radius = Math.min(width, height) * 0.36;

    ctx.clearRect(0, 0, width, height);

    const axes = [
      { key: 'frontend', label: 'Frontend' },
      { key: 'network', label: 'Network' },
      { key: 'thirdParty', label: '3rd Party' },
      { key: 'api', label: 'APIs' },
      { key: 'infra', label: 'Infra' },
      { key: 'privacy', label: 'Privacy' }
    ];

    const numAxes = axes.length;
    const angleStep = (Math.PI * 2) / numAxes;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#27272a' : '#e4e4e7';
    const textColor = isDark ? '#a1a1aa' : '#71717a';
    const accentFill = isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.12)';
    const accentStroke = isDark ? '#f59e0b' : '#d97706';
    const pointBg = isDark ? '#09090b' : '#ffffff';

    // 1. Draw concentric background rings
    ctx.strokeStyle = gridColor;
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
    ctx.font = '500 10px Inter, -apple-system, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Axis labels
      const labelX = cx + Math.cos(angle) * (radius + 20);
      const labelY = cy + Math.sin(angle) * (radius + 14);
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

      ctx.fillStyle = accentFill;
      ctx.fill();

      ctx.strokeStyle = accentStroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw point markers
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = accentStroke;
        ctx.fill();
        ctx.strokeStyle = pointBg;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
}
