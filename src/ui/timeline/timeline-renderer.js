// src/ui/timeline/timeline-renderer.js
// Renders network waterfalls and interactive "What Happens When I Click" causal timelines.

import { TimeUtils } from '../../utils/time-utils.js';

export class TimelineRenderer {
  /**
   * Render network waterfall timeline inside a container element.
   * @param {HTMLElement} container
   * @param {Array<object>} timelineItems
   */
  static renderWaterfall(container, timelineItems) {
    if (!container) return;
    container.innerHTML = '';

    if (!timelineItems || timelineItems.length === 0) {
      container.innerHTML = '<div class="empty-state">No network requests captured yet.</div>';
      return;
    }

    const header = document.createElement('div');
    header.className = 'waterfall-header';
    header.innerHTML = `
      <div class="col-resource">Resource & Endpoint</div>
      <div class="col-type">Type</div>
      <div class="col-status">Status</div>
      <div class="col-size">Size</div>
      <div class="col-waterfall">Waterfall Timeline</div>
    `;
    container.appendChild(header);

    const list = document.createElement('div');
    list.className = 'waterfall-list';

    timelineItems.forEach(item => {
      const row = document.createElement('div');
      row.className = 'waterfall-row';

      const statusClass = item.status >= 200 && item.status < 300 ? 'status-ok' : item.status >= 400 ? 'status-err' : 'status-other';

      row.innerHTML = `
        <div class="col-resource" title="${item.url}">
          <span class="method-tag method-${(item.method || 'GET').toLowerCase()}">${item.method || 'GET'}</span>
          <span class="url-text">${item.host}${item.pathname || item.url}</span>
        </div>
        <div class="col-type"><span class="badge badge-slate">${item.category}</span></div>
        <div class="col-status ${statusClass}">${item.status || '...'}</div>
        <div class="col-size">${TimeUtils.formatBytes(item.size)}</div>
        <div class="col-waterfall">
          <div class="waterfall-bar-track">
            <div class="waterfall-bar" style="left: ${item.offsetPercent}%; width: ${item.widthPercent}%;">
              <span class="waterfall-bar-label">${TimeUtils.formatDuration(item.durationMs)}</span>
            </div>
          </div>
        </div>
      `;
      list.appendChild(row);
    });

    container.appendChild(list);
  }

  /**
   * Render "What Happens When I Click" interactive causal timeline.
   * @param {HTMLElement} container
   * @param {Array<object>} interactionEvents
   */
  static renderClickSequence(container, interactionEvents) {
    if (!container) return;
    container.innerHTML = '';

    if (!interactionEvents || interactionEvents.length === 0) {
      container.innerHTML = `
        <div class="click-empty-guide">
          <div class="guide-title">Investigation Mode Idle</div>
          <p>Click "Start Investigation" above, then click any element or button on the target website to record the causal chain of events.</p>
        </div>
      `;
      return;
    }

    const flow = document.createElement('div');
    flow.className = 'click-flow-timeline';

    interactionEvents.forEach((ev, idx) => {
      const step = document.createElement('div');
      step.className = 'click-flow-step';

      let icon = '⚡';
      let title = 'Event';
      let detail = '';
      let badgeClass = 'badge-slate';

      if (ev.type === 'CLICK') {
        icon = '🖱️';
        title = `User Click: <${ev.target.tagName.toLowerCase()}>`;
        detail = ev.target.text ? `"${ev.target.text}"` : (ev.target.id ? `#${ev.target.id}` : ev.target.className);
        badgeClass = 'badge-cyan';
      } else if (ev.type === 'DOM_MUTATION') {
        icon = '🔄';
        title = 'DOM Subtree Mutation';
        detail = ev.detail || 'Elements modified';
        badgeClass = 'badge-purple';
      } else if (ev.type === 'FETCH' || ev.type === 'XHR' || ev.type === 'API') {
        icon = '🌐';
        title = `API Call: ${ev.method || 'GET'} ${ev.url}`;
        detail = ev.status ? `Returned HTTP ${ev.status} in ${ev.duration || 0}ms` : 'In flight';
        badgeClass = 'badge-emerald';
      } else if (ev.type === 'STORAGE') {
        icon = '💾';
        title = 'Client Storage Update';
        detail = ev.key ? `Key: ${ev.key}` : 'Storage modified';
        badgeClass = 'badge-amber';
      }

      step.innerHTML = `
        <div class="step-marker">${icon}</div>
        <div class="step-card">
          <div class="step-header">
            <span class="step-title">${title}</span>
            <span class="badge ${badgeClass}">Step ${idx + 1}</span>
          </div>
          <div class="step-detail">${detail}</div>
        </div>
      `;

      flow.appendChild(step);
    });

    container.appendChild(flow);
  }
}
