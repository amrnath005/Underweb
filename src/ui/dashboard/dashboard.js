// Apply saved theme immediately
(function initTheme() {
  const saved = localStorage.getItem('uw-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

import { FingerprintEngine } from '../../detection/fingerprint-engine.js';
import { CdnDetector } from '../../infrastructure/cdn-detector.js';
import { HostingDetector } from '../../infrastructure/hosting-detector.js';
import { InfrastructureGraph } from '../../infrastructure/infrastructure-graph.js';
import { ArchitectureInferenceEngine } from '../../architecture/inference-engine.js';
import { GraphBuilder } from '../../architecture/graph-builder.js';
import { GraphRenderer } from '../graph/graph-renderer.js';
import { ShortestPath } from '../../algorithms/shortest-path.js';
import { Centrality } from '../../algorithms/centrality.js';
import { WebsiteDnaChart } from '../components/dna-chart.js';
import { RequestTimeline } from '../../network/request-timeline.js';
import { TimelineRenderer } from '../timeline/timeline-renderer.js';
import { ApiDetector } from '../../network/api-detector.js';
import { TrackerDetector } from '../../privacy/tracker-detector.js';
import { PrivacyAnalyzer } from '../../privacy/privacy-analyzer.js';
import { SecurityAnalyzer } from '../../security/security-analyzer.js';
import { KNOWLEDGE_BASE } from '../../../data/providers.js';
import { StorageManager } from '../../storage/indexeddb.js';
import { TimeUtils } from '../../utils/time-utils.js';
import { GraphExporter } from '../../architecture/graph-exporter.js';
import { DEMO_SNAPSHOTS } from '../../../data/demo-snapshots.js';

let currentTabId = null;
let currentSession = null;
let graphRenderer = null;
let activeGraph = null;
let detectedTechs = [];
let catalogedApis = [];
let detectedTrackers = [];
let isRecordingClick = false;

function createEmptySession(tabId, url = '', title = '') {
  let host = '';
  let apex = '';
  if (url) {
    try {
      const u = new URL(url);
      host = u.hostname;
      const parts = host.split('.');
      apex = parts.length > 2 ? parts.slice(-2).join('.') : host;
    } catch {}
  }

  return {
    tabId: tabId || 0,
    url: url || '',
    title: title || (host ? host : 'Awaiting Target Tab'),
    favicon: '',
    startTime: Date.now(),
    primaryDomain: host || 'Ready to Inspect',
    primaryApex: apex || '',
    stats: {
      totalRequests: 0,
      totalBytes: 0,
      firstPartyCount: 0,
      thirdPartyCount: 0,
      apiCount: 0,
      scriptCount: 0,
      stylesheetCount: 0,
      imageCount: 0,
      fontCount: 0,
      trackerCount: 0,
      websocketCount: 0
    },
    domainsCount: host ? 1 : 0,
    firstPartyDomainsCount: host ? 1 : 0,
    thirdPartyDomainsCount: 0,
    ipAddresses: [],
    protocols: [],
    domains: host ? [host] : [],
    thirdPartyDomains: [],
    firstPartyDomains: host ? [host] : [],
    requests: [],
    runtime: {
      globals: [],
      frameworks: [],
      libraries: [],
      apis: [],
      storage: {
        localStorageCount: 0,
        localStorageKeys: [],
        sessionStorageCount: 0,
        indexedDbDatabases: [],
        cookies: []
      },
      permissions: {},
      domMetrics: {}
    },
    security: {
      isHttps: url ? url.startsWith('https://') : false,
      headers: {},
      csp: null,
      hsts: null,
      cors: {}
    },
    interactionLogs: []
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Resolve Target Tab ID
  const urlParams = new URLSearchParams(window.location.search);
  const tabIdParam = urlParams.get('tabId');

  if (tabIdParam) {
    currentTabId = parseInt(tabIdParam, 10);
  } else if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    try {
      // Find the most recent active web tab in the current window (skip extension pages)
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const webTab = tabs.find(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
      if (webTab) currentTabId = webTab.id;
    } catch {}
  }

  // 2. Initialize Navigation
  setupNavigation();

  // 3. Initialize Graph Canvas
  const canvas = document.getElementById('architectureCanvas');
  if (canvas) {
    graphRenderer = new GraphRenderer(canvas, {
      onNodeSelect: handleNodeSelect
    });
  }

  // 4. Setup Event Listeners
  setupActions();

  // 5. Initial Data Load
  await loadSessionData();
});

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
      });
      const targetPanel = document.getElementById(tabId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      // If switching to architecture canvas, resize and warm up physics
      if (tabId === 'tab-architecture' && graphRenderer) {
        graphRenderer.alpha = 0.8;
      }
    });
  });
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (!icon) return;
  if (theme === 'dark') {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  } else {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  }
}

function setupActions() {
  const addListener = (id, evt, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, fn);
  };

  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    updateThemeIcon(document.documentElement.getAttribute('data-theme') || 'light');
    themeBtn.addEventListener('click', () => {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', next);
      localStorage.setItem('uw-theme', next);
      updateThemeIcon(next);
    });
  }

  const drawer = document.getElementById('nodeInspectorDrawer');
  const closeDrawer = document.getElementById('closeDrawerBtn');
  if (closeDrawer && drawer) {
    closeDrawer.addEventListener('click', () => drawer.classList.remove('visible'));
  }

  addListener('refreshBtn', 'click', async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.reload && currentTabId) {
      try {
        await chrome.tabs.reload(currentTabId);
      } catch {}
      setTimeout(loadSessionData, 900);
    } else {
      await loadSessionData();
    }
  });

  // Graph Algorithm buttons
  addListener('btnRunDijkstra', 'click', () => {
    if (!activeGraph) return;
    const trackerNode = activeGraph.nodes.get(Array.from(activeGraph.nodes.keys()).find(k => k.startsWith('TRACKER:')));
    const rootDomain = currentSession.primaryDomain;
    if (trackerNode && rootDomain) {
      const pathResult = ShortestPath.findPath(activeGraph, trackerNode.id, rootDomain);
      if (pathResult.found) {
        graphRenderer.highlightRoute(pathResult.path);
        alert(`Shortest Path Found (${pathResult.distance} hops):\n${pathResult.path.join(' -> ')}`);
      } else {
        alert('No direct path found to tracker.');
      }
    } else {
      alert('No active tracker node in current architecture graph.');
    }
  });

  addListener('btnRunCentrality', 'click', () => {
    if (!activeGraph) return;
    const betweenness = Centrality.betweennessCentrality(activeGraph);
    const sorted = Array.from(betweenness.entries()).sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5).map(([id, val]) => `${id}: score ${val}`).join('\n');
    alert(`Top 5 Centrality Bridges (Betweenness Score):\n\n${top5}`);
  });

  addListener('btnResetGraph', 'click', () => {
    if (graphRenderer) {
      graphRenderer.highlightRoute([]);
      graphRenderer.transform = { x: 450, y: 260, scale: 1.0 };
      graphRenderer.alpha = 0.8;
    }
  });

  addListener('btnFitGraph', 'click', () => {
    if (graphRenderer) graphRenderer.fitToScreen();
  });

  addListener('btnExportMermaid', 'click', () => {
    if (!activeGraph) return;
    const mermaidCode = GraphExporter.toMermaid(activeGraph, { direction: 'TD' });
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(mermaidCode).then(() => {
        const btn = document.getElementById('btnExportMermaid');
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = orig; }, 1800);
        }
      }).catch(() => {});
    }
    downloadBlob(mermaidCode, `underweb-architecture-${currentSession?.primaryDomain || 'graph'}.mmd`, 'text/vnd.mermaid');
  });

  addListener('btnExportSvg', 'click', () => {
    if (!activeGraph) return;
    const svgCode = GraphExporter.toSvg(activeGraph);
    downloadBlob(svgCode, `underweb-architecture-${currentSession?.primaryDomain || 'graph'}.svg`, 'image/svg+xml');
  });

  addListener('btnZoomIn', 'click', () => {
    if (graphRenderer) graphRenderer.zoomIn();
  });

  addListener('btnZoomOut', 'click', () => {
    if (graphRenderer) graphRenderer.zoomOut();
  });

  // Drawer close
  addListener('closeDrawerBtn', 'click', () => {
    const drawer = document.getElementById('nodeInspectorDrawer');
    if (drawer) drawer.classList.remove('visible');
    if (graphRenderer) graphRenderer.selectedNode = null;
  });

  // Modal close
  addListener('closeModalBtn', 'click', () => {
    const modal = document.getElementById('evidenceModal');
    if (modal) modal.classList.remove('active');
  });

  const modalEl = document.getElementById('evidenceModal');
  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) modalEl.classList.remove('active');
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('evidenceModal');
      if (modal) modal.classList.remove('active');
    }
  });

  // Investigator Controls
  const toggleBtn = document.getElementById('toggleInvestigatorBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', async () => {
      isRecordingClick = !isRecordingClick;
      toggleBtn.textContent = isRecordingClick ? 'Stop Recording' : 'Start Recording';
      toggleBtn.className = isRecordingClick ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm';

      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          await chrome.runtime.sendMessage({
            action: 'TOGGLE_CLICK_RECORDER',
            tabId: currentTabId,
            enabled: isRecordingClick,
            clearPrevious: false
          });
        } catch {}
      }
    });
  }

  addListener('clearInvestigatorBtn', 'click', () => {
    if (currentSession) currentSession.interactionLogs = [];
    const container = document.getElementById('clickTimelineContainer');
    if (container) TimelineRenderer.renderClickSequence(container, []);
  });

  // Search & Filter
  addListener('learnSearchInput', 'input', (e) => {
    renderLearnTab(e.target.value.toLowerCase().trim());
  });

  addListener('networkSearchInput', 'input', filterNetworkTable);
  addListener('networkCategoryFilter', 'change', filterNetworkTable);

  // Export Buttons
  addListener('exportJsonBtn', 'click', exportJson);
  addListener('exportMdBtn', 'click', exportMarkdown);
  addListener('exportCsvBtn', 'click', exportCsv);
  addListener('exportDropdownBtn', 'click', exportMarkdown);
}

async function loadSessionData() {
  try {
    let sessionData = null;

    // 1. Direct read from chrome.storage.session (survives service worker sleep/wake)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session && currentTabId) {
      try {
        const stored = await chrome.storage.session.get([`session_${currentTabId}`]);
        if (stored && stored[`session_${currentTabId}`]) {
          sessionData = stored[`session_${currentTabId}`];
        }
      } catch {}
    }

    // 2. Query Background Service Worker via message
    if (!sessionData && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage && currentTabId) {
      try {
        const res = await chrome.runtime.sendMessage({
          action: 'GET_TAB_SESSION',
          tabId: currentTabId
        });
        if (res && res.success && res.data) {
          sessionData = res.data;
        }
      } catch (err) {
        console.warn('Background service query:', err);
      }
    }

    // 3. If no session recorded yet, query Chrome tab for real URL and title
    if (!sessionData && typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.get && currentTabId) {
      try {
        const tabInfo = await chrome.tabs.get(currentTabId);
        if (tabInfo && tabInfo.url) {
          sessionData = createEmptySession(currentTabId, tabInfo.url, tabInfo.title);
        }
      } catch {}
    }

    // 4. Check for Web Playground / GitHub Pages mode
    const isWebPlayground = typeof chrome === 'undefined' || !chrome.tabs || (new URLSearchParams(window.location.search)).has('demo');
    const demoPicker = document.getElementById('demoPickerWrap');
    const demoSelect = document.getElementById('demoSnapshotSelect');

    if (isWebPlayground && demoPicker && demoSelect) {
      demoPicker.style.display = 'flex';
      const urlParams = new URLSearchParams(window.location.search);
      const chosen = urlParams.get('sample') || demoSelect.value || 'shopify';
      demoSelect.value = chosen;
      if (DEMO_SNAPSHOTS[chosen]) {
        sessionData = DEMO_SNAPSHOTS[chosen];
      }

      if (!demoSelect.hasAttribute('data-wired')) {
        demoSelect.setAttribute('data-wired', 'true');
        demoSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          if (DEMO_SNAPSHOTS[val]) {
            currentSession = DEMO_SNAPSHOTS[val];
            renderCurrentSession();
          }
        });
      }
    }

    // 5. Default to clean empty readiness session (NO MOCK DATA)
    if (!sessionData) {
      sessionData = createEmptySession(currentTabId);
    }

    currentSession = sessionData;
    renderCurrentSession();
  } catch (err) {
    console.error('Error loading session data:', err);
  }
}

function renderCurrentSession() {
  if (!currentSession) return;
  try {

  // Header info
  if (currentSession.url) {
    try {
      const u = new URL(currentSession.url);
      document.getElementById('targetProtocol').textContent = u.protocol + '//';
      document.getElementById('targetHostname').textContent = u.hostname + (u.pathname !== '/' ? u.pathname : '');
    } catch {
      document.getElementById('targetHostname').textContent = currentSession.url;
    }
  }

  // 1. Run Technology Fingerprinting
  detectedTechs = FingerprintEngine.detect(currentSession);

  // 2. Catalogs APIs & Trackers
  catalogedApis = ApiDetector.catalogApis(
    currentSession.requests || [],
    currentSession.runtime ? currentSession.runtime.apis : []
  );
  detectedTrackers = TrackerDetector.detect(currentSession.requests || []);

  // 3. Infrastructure
  const headers = currentSession.security.headers || {};
  const cdnInfo = CdnDetector.detect(headers);
  const hostInfo = HostingDetector.detect(headers);

  // 4. Inferred Architecture
  const inferredArch = ArchitectureInferenceEngine.infer(currentSession, detectedTechs, catalogedApis);
  renderInferredArchitecture(inferredArch);

  // 5. Render Overview & DNA Chart
  renderOverview();

  // 6. Render Tech Stack
  renderStackTab();

  // 7. Render Network Waterfall
  renderNetworkTab();

  // 8. Build & Render Architecture Graph
  activeGraph = GraphBuilder.build(
    currentSession,
    detectedTechs,
    catalogedApis,
    detectedTrackers,
    cdnInfo,
    hostInfo
  );
  if (graphRenderer && activeGraph) {
    graphRenderer.setData(activeGraph.toJSON());
  }

  // 9. Render Infrastructure
  renderInfrastructureTab(cdnInfo, hostInfo);

  // 10. Render Privacy & Security
  const handleCookies = (cookies) => {
    if (cookies && cookies.length > 0) {
      detectedTechs = FingerprintEngine.detect(currentSession, cookies);
      renderStackTab();
    }
    renderPrivacyTab(cookies || []);
    renderSecurityTab(cookies || []);
  };

  const runtimeCookies = (currentSession.runtime && currentSession.runtime.storage && currentSession.runtime.storage.cookies) || [];

  if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.getAll && currentSession.url && currentSession.url.startsWith('http')) {
    chrome.cookies.getAll({ url: currentSession.url }, (urlCookies = []) => {
      const cookieMap = new Map();
      (urlCookies || []).forEach(c => cookieMap.set(`${c.domain}|${c.name}|${c.path}`, c));

      // Query Apex domain cookies if available
      if (currentSession.primaryApex) {
        chrome.cookies.getAll({ domain: currentSession.primaryApex }, (apexCookies = []) => {
          (apexCookies || []).forEach(c => cookieMap.set(`${c.domain}|${c.name}|${c.path}`, c));

          // Query up to 4 major connected third-party domains
          const extraDomains = (currentSession.thirdPartyDomains || []).slice(0, 4);
          let pending = extraDomains.length;
          if (pending === 0) {
            handleCookies(Array.from(cookieMap.values()));
          } else {
            extraDomains.forEach(domain => {
              chrome.cookies.getAll({ domain }, (thirdPartyCookies = []) => {
                (thirdPartyCookies || []).forEach(c => cookieMap.set(`${c.domain}|${c.name}|${c.path}`, c));
                pending--;
                if (pending === 0) {
                  handleCookies(Array.from(cookieMap.values()));
                }
              });
            });
          }
        });
      } else {
        handleCookies(Array.from(cookieMap.values()));
      }
    });
  } else {
    handleCookies(runtimeCookies);
  }

  // 11. Render APIs
  renderApisTab();

  // 12. Render Click Investigator
  TimelineRenderer.renderClickSequence(
    document.getElementById('clickTimelineContainer'),
    currentSession.interactionLogs || []
  );

  // 13. Render Learn
  renderLearnTab();

  // 14. Save snapshot in local IndexedDB
  StorageManager.saveSession(currentSession);
  renderHistoryTab();

  } catch (err) {
    console.error('Failed to render session:', err);
  }
}

function renderOverview() {
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setTxt('ovTotalReqs', currentSession.stats.totalRequests || 0);
  setTxt('ovDomains', currentSession.domainsCount || 0);
  setTxt('ovThirdParty', currentSession.stats.thirdPartyCount || 0);
  setTxt('ovTechs', detectedTechs.length);

  // Render Website DNA Radar
  const canvas = document.getElementById('dnaCanvas');
  if (canvas) {
    const metrics = {
      frontend: Math.min(100, detectedTechs.length * 16),
      network: Math.min(100, (currentSession.stats.totalRequests / 120) * 100),
      thirdParty: Math.min(100, (currentSession.stats.thirdPartyCount / 20) * 100),
      api: Math.min(100, catalogedApis.length * 20),
      infra: currentSession.security.headers && currentSession.security.headers['cf-ray'] ? 85 : 45,
      privacy: Math.min(100, detectedTrackers.length * 25)
    };
    WebsiteDnaChart.render(canvas, metrics);
  }
}

function renderInferredArchitecture(arch) {
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setTxt('inferredArchName', arch.archetype);
  setTxt('inferredArchExpl', arch.explanation);
  const list = document.getElementById('archSignalsList');
  if (list) {
    list.innerHTML = '';
    arch.signals.forEach(sig => {
      const li = document.createElement('li');
      li.textContent = sig;
      list.appendChild(li);
    });
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderStackTab() {
  const container = document.getElementById('techStackGrid');
  container.innerHTML = '';

  if (detectedTechs.length === 0) {
    container.innerHTML = '<div class="empty-state">No known technology signatures detected yet.</div>';
    return;
  }

  detectedTechs.forEach(tech => {
    const card = document.createElement('div');
    card.className = 'tech-card';
    const confClass = tech.confidence === 'HIGH' ? 'badge-green' : (tech.confidence === 'MEDIUM' ? 'badge-amber' : 'badge-neutral');
    const statusClass = tech.status === 'OBSERVED' ? 'badge-green' : 'badge-cyan';
    const roleBadge = tech.role ? `<span class="badge badge-neutral" style="font-size:10px;">${escapeHtml(tech.role)}</span>` : '';

    card.innerHTML = `
      <div class="tech-card-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="tech-card-name">${escapeHtml(tech.name)}</span>
          ${roleBadge}
        </div>
        <div style="display: flex; gap: 4px;">
          <span class="badge ${statusClass}">${escapeHtml(tech.status)}</span>
          <span class="badge ${confClass}">${escapeHtml(tech.confidence)} (${tech.score}%)</span>
        </div>
      </div>
      <div class="tech-card-desc">${escapeHtml(tech.explanation)}</div>
      <div class="tech-card-footer">
        <span class="badge badge-neutral">${escapeHtml(tech.category)}</span>
        <span class="confidence">${tech.signals.length} signal${tech.signals.length > 1 ? 's' : ''} &bull; View evidence &rarr;</span>
      </div>
    `;

    card.addEventListener('click', () => showEvidenceModal(tech));
    container.appendChild(card);
  });
}

function showEvidenceModal(tech) {
  document.getElementById('modalTechTitle').textContent = `${tech.name} — Evidence & Signals`;
  const body = document.getElementById('modalBody');
  const confClass = tech.confidence === 'HIGH' ? 'badge-green' : (tech.confidence === 'MEDIUM' ? 'badge-amber' : 'badge-neutral');
  const statusClass = tech.status === 'OBSERVED' ? 'badge-green' : 'badge-cyan';

  body.innerHTML = `
    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; align-items: center;">
      <span class="badge ${statusClass}">${escapeHtml(tech.status)}</span>
      <span class="badge ${confClass}">${escapeHtml(tech.confidence)} Confidence</span>
      <span class="badge badge-neutral">Score: ${tech.score}%</span>
      <span class="badge badge-neutral">${escapeHtml(tech.category)}</span>
      ${tech.role ? `<span class="badge badge-neutral">Role: ${escapeHtml(tech.role)}</span>` : ''}
    </div>
    ${tech.description ? `<p style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 10px;">${escapeHtml(tech.description)}</p>` : ''}
    ${tech.website ? `<div style="margin-bottom: 12px; font-size: 12px;"><a href="${escapeHtml(tech.website)}" target="_blank" rel="noopener" style="color: var(--color-primary); text-decoration: underline;">Official Documentation &rarr;</a></div>` : ''}
    <div style="margin-top: 14px; font-weight: 600; font-size: 13px;">Observed Evidence (${tech.signals.length} signal${tech.signals.length > 1 ? 's' : ''}):</div>
    <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">
      ${tech.signals.map(s => `
        <div style="padding: 8px 12px; background: var(--color-bg-secondary); border-radius: 6px; font-size: 12px; border: 1px solid var(--color-border);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <code>[${escapeHtml(s.type)}]</code>
            <span class="badge ${s.strength === 'HIGH' ? 'badge-green' : (s.strength === 'MEDIUM' ? 'badge-amber' : 'badge-neutral')}" style="font-size: 10px;">${escapeHtml(s.strength || 'SIGNAL')}</span>
          </div>
          <div style="color: var(--color-text-primary); font-weight: 500;">${escapeHtml(s.description)}</div>
          <div style="font-size: 11px; color: var(--color-text-muted); margin-top: 2px;">Source: ${escapeHtml(s.source || 'browser telemetry')} &bull; Key: <code>${escapeHtml(s.key)}</code></div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('evidenceModal').classList.add('active');
}

function renderNetworkTab() {
  const timelineData = RequestTimeline.generateTimeline(currentSession.requests);

  // Render First Contact Sequence
  const fcContainer = document.getElementById('firstContactList');
  fcContainer.innerHTML = '';
  timelineData.firstContact.forEach(item => {
    const step = document.createElement('div');
    step.className = 'first-contact-step';
    step.innerHTML = `
      <span class="step-num">#${item.step} +${item.timeMs}ms</span>
      <span class="step-host" title="${item.url}">${item.host}</span>
      <span class="badge badge-slate">${item.category}</span>
    `;
    fcContainer.appendChild(step);
  });

  // Render Waterfall
  const wfContainer = document.getElementById('waterfallContainer');
  TimelineRenderer.renderWaterfall(wfContainer, timelineData.timeline);
}

function filterNetworkTable() {
  const query = document.getElementById('networkSearchInput').value.toLowerCase().trim();
  const category = document.getElementById('networkCategoryFilter').value;

  const filtered = currentSession.requests.filter(r => {
    const matchesQuery = !query || r.url.toLowerCase().includes(query) || (r.host && r.host.toLowerCase().includes(query));
    const matchesCategory = category === 'ALL' || r.category === category;
    return matchesQuery && matchesCategory;
  });

  const timelineData = RequestTimeline.generateTimeline(filtered);
  TimelineRenderer.renderWaterfall(document.getElementById('waterfallContainer'), timelineData.timeline);
}

function renderInfrastructureTab(cdnInfo, hostInfo) {
  const container = document.getElementById('infraPipelineContainer');
  if (!container) return;
  container.innerHTML = '';

  const primaryIp = currentSession.ipAddresses && currentSession.ipAddresses.length > 0 ? currentSession.ipAddresses[0] : '';
  const detectedFramework = detectedTechs.length > 0 ? detectedTechs[0].name : 'Web App';
  const steps = InfrastructureGraph.buildTopology(currentSession.primaryDomain, primaryIp, currentSession.security.headers || {}, detectedFramework);

  steps.forEach(step => {
    const card = document.createElement('div');
    card.className = 'infra-step-card';
    card.innerHTML = `
      <div class="step-layer-num">0${step.layer}</div>
      <div class="step-info-col">
        <span class="step-layer-title">${step.title}</span>
        <span class="step-layer-detail">${step.detail}</span>
      </div>
      <span class="badge badge-cyan">${step.badge}</span>
    `;
    container.appendChild(card);
  });
}

function renderPrivacyTab(cookies) {
  const privacy = PrivacyAnalyzer.analyze(currentSession, cookies);

  const badge = document.getElementById('cookieSummaryBadge');
  if (badge) badge.textContent = `${privacy.cookies.total} Total`;

  const cookieContainer = document.getElementById('cookieIssuesContainer');
  if (cookieContainer) {
    cookieContainer.innerHTML = '';
    if (privacy.cookies.issues.length === 0) {
      cookieContainer.innerHTML = '<div class="privacy-item">No cookie hygiene flags found. All cookies use Secure / SameSite flags.</div>';
    } else {
      privacy.cookies.issues.slice(0, 5).forEach(iss => {
        cookieContainer.innerHTML += `
          <div class="privacy-item">
            <span><strong>${iss.cookie}:</strong> ${iss.issue}</span>
            <span class="badge ${iss.severity === 'HIGH' ? 'badge-rose' : 'badge-amber'}">${iss.severity}</span>
          </div>
        `;
      });
    }
  }

  // Storage
  const storageContainer = document.getElementById('storageSummaryContainer');
  if (storageContainer) {
    storageContainer.innerHTML = `
      <div class="privacy-item"><span>LocalStorage Items</span><span class="badge badge-slate">${privacy.storage.localStorage.itemCount}</span></div>
      <div class="privacy-item"><span>SessionStorage Items</span><span class="badge badge-slate">${privacy.storage.sessionStorage.itemCount}</span></div>
      <div class="privacy-item"><span>IndexedDB Databases</span><span class="badge badge-slate">${privacy.storage.indexedDB.databaseCount}</span></div>
    `;
  }

  // Hardware Permissions
  const permContainer = document.getElementById('permissionsContainer');
  if (permContainer) {
    permContainer.innerHTML = '';
    privacy.browserApis.capabilities.forEach(cap => {
      permContainer.innerHTML += `
        <div class="privacy-item">
          <span>${cap.name}</span>
          <span class="badge ${cap.status === 'granted' ? 'badge-rose' : 'badge-slate'}">${cap.status}</span>
        </div>
      `;
    });
  }

  // Trackers
  const trContainer = document.getElementById('trackersContainer');
  if (trContainer) {
    trContainer.innerHTML = '';
    if (privacy.trackers.length === 0) {
      trContainer.innerHTML = '<div class="privacy-item">No third-party trackers detected.</div>';
    } else {
      privacy.trackers.forEach(tr => {
        trContainer.innerHTML += `
          <div class="privacy-item">
            <span>${tr.name} <span class="text-muted">(${tr.category})</span></span>
            <span class="badge badge-amber">${tr.requestCount} requests</span>
          </div>
        `;
      });
    }
  }
}

function renderSecurityTab(cookies) {
  const sec = SecurityAnalyzer.analyze(currentSession, cookies);

  // 1. Grade circle
  const circle = document.getElementById('securityScoreCircle');
  if (circle) {
    circle.textContent = sec.grade;
    let borderClass = 'border-emerald';
    if (sec.grade === 'B') borderClass = 'border-cyan';
    else if (sec.grade === 'C' || sec.grade === 'D') borderClass = 'border-amber';
    else if (sec.grade === 'F') borderClass = 'border-rose';
    circle.className = `score-circle ${borderClass}`;
  }

  // 2. Score text & badge
  const scoreText = document.getElementById('securityScoreText');
  if (scoreText) scoreText.textContent = `Security Posture: Grade ${sec.grade}`;

  const scoreBadge = document.getElementById('securityScoreBadge');
  if (scoreBadge) {
    scoreBadge.textContent = `${sec.score} / 100`;
    let badgeClass = 'badge-emerald';
    if (sec.score < 50) badgeClass = 'badge-rose';
    else if (sec.score < 70) badgeClass = 'badge-amber';
    else if (sec.score < 85) badgeClass = 'badge-cyan';
    scoreBadge.className = `badge ${badgeClass}`;
  }

  // 3. Subtext
  const subtext = document.getElementById('securityScoreSubtext');
  if (subtext) {
    if (sec.assessmentState === 'INSUFFICIENT_EVIDENCE') {
      subtext.textContent = 'Insufficient telemetry: Main document headers have not been observed yet. Refresh the target tab to capture response headers.';
    } else if (sec.assessmentState === 'PARTIALLY_ASSESSED') {
      subtext.textContent = 'Partially assessed: Main document response headers were not observed in this session (e.g. tab opened before extension loaded). Evaluated observable transport and subresources without unobserved header deductions.';
    } else if (sec.score >= 85) {
      subtext.textContent = 'Verified transport encryption and active origin defense policies.';
    } else if (sec.score >= 70) {
      subtext.textContent = 'Core transport security verified with minor policy recommendations.';
    } else {
      subtext.textContent = 'Attention needed: Security policies or transport protections require remediation.';
    }
  }

  // 4. Category score breakdown pills
  const pillsContainer = document.getElementById('securityCategoryPills');
  if (pillsContainer && sec.summary) {
    const s = sec.summary;
    const categories = [
      { name: 'Transport', score: s.transportScore, max: 25 },
      { name: 'Headers', score: s.headerScore, max: 30 },
      { name: 'Mixed Content', score: s.mixedContentScore, max: 15 },
      { name: 'Cookies', score: s.cookieScore, max: 15 },
      { name: 'Isolation', score: s.isolationScore, max: 15 }
    ];
    pillsContainer.innerHTML = categories.map(cat => {
      const pct = cat.score / cat.max;
      const bColor = pct >= 0.85 ? 'badge-emerald' : pct >= 0.6 ? 'badge-cyan' : pct >= 0.4 ? 'badge-amber' : 'badge-rose';
      return `<span class="badge ${bColor}" style="font-size: 11px; padding: 3px 8px;">${cat.name}: <strong>${cat.score}/${cat.max}</strong></span>`;
    }).join('');
  }

  // 5. Overview Tab Grade
  const ovGrade = document.getElementById('ovSecurityGrade');
  if (ovGrade) ovGrade.textContent = sec.grade;

  // 6. Telemetry State Badge
  const stateBadge = document.getElementById('securityTelemetryStateBadge');
  if (stateBadge) {
    stateBadge.textContent = sec.assessmentState;
    stateBadge.className = `badge ${sec.assessmentState === 'ASSESSED' ? 'badge-emerald' : sec.assessmentState === 'PARTIALLY_ASSESSED' ? 'badge-amber' : 'badge-neutral'}`;
  }

  // 7. Main Document Baseline Grid
  const baselineGrid = document.getElementById('securityBaselineGrid');
  if (baselineGrid && sec.baseline) {
    const b = sec.baseline;
    const isPartial = sec.assessmentState === 'PARTIALLY_ASSESSED';
    baselineGrid.innerHTML = `
      <div class="baseline-card ${b.isHttps ? 'pass' : 'fail'}">
        <span class="baseline-card-title">Transport Scheme</span>
        <span class="baseline-card-value">${b.isHttps ? 'HTTPS (Encrypted)' : 'HTTP (Plaintext)'}</span>
      </div>
      <div class="baseline-card ${b.cspActive ? 'pass' : (isPartial ? 'warning' : 'fail')}">
        <span class="baseline-card-title">Content Security Policy</span>
        <span class="baseline-card-value">${b.cspActive ? 'Enforced' : (isPartial ? 'Unobserved' : 'Not Configured')}</span>
      </div>
      <div class="baseline-card ${b.hstsActive ? 'pass' : (isPartial ? 'warning' : (b.isHttps ? 'fail' : 'warning'))}">
        <span class="baseline-card-title">HSTS (Transport Strictness)</span>
        <span class="baseline-card-value">${b.hstsActive ? 'Active' : (isPartial ? 'Unobserved' : (b.isHttps ? 'Missing' : 'N/A'))}</span>
      </div>
      <div class="baseline-card ${b.clickjackingProtected ? 'pass' : (isPartial ? 'warning' : 'fail')}">
        <span class="baseline-card-title">Clickjacking Defense</span>
        <span class="baseline-card-value">${b.clickjackingProtected ? 'Protected (CSP/XFO)' : (isPartial ? 'Unobserved' : 'Missing')}</span>
      </div>
      <div class="baseline-card ${b.nosniffActive ? 'pass' : (isPartial ? 'warning' : 'fail')}">
        <span class="baseline-card-title">MIME Sniffing (XCTO)</span>
        <span class="baseline-card-value">${b.nosniffActive ? 'nosniff Active' : (isPartial ? 'Unobserved' : 'Missing')}</span>
      </div>
      <div class="baseline-card ${b.referrerPolicyActive ? 'pass' : 'warning'}">
        <span class="baseline-card-title">Referrer Policy</span>
        <span class="baseline-card-value">${b.referrerPolicyActive || (isPartial ? 'Unobserved' : 'Browser Default')}</span>
      </div>
    `;
  }

  // 8. Findings Count Badge
  const findingsBadge = document.getElementById('securityFindingsCountBadge');
  if (findingsBadge) {
    findingsBadge.textContent = `${sec.findings.length} Finding${sec.findings.length === 1 ? '' : 's'}`;
    findingsBadge.className = `badge ${sec.findings.length === 0 ? 'badge-emerald' : 'badge-neutral'}`;
  }

  // 9. Findings List & Click-to-Inspect
  const findingsList = document.getElementById('securityFindingsList');
  if (findingsList) {
    findingsList.innerHTML = '';
    if (sec.findings.length === 0) {
      findingsList.innerHTML = '<div class="empty-state" style="padding: 24px;">No security vulnerabilities or mixed-content risks detected for this session.</div>';
    } else {
      sec.findings.forEach(f => {
        const item = document.createElement('div');
        item.className = 'finding-item';

        let sevBadge = 'badge-amber';
        if (f.severity === 'CRITICAL' || f.severity === 'HIGH') sevBadge = 'badge-rose';
        else if (f.severity === 'LOW') sevBadge = 'badge-cyan';
        else if (f.severity === 'INFO') sevBadge = 'badge-neutral';

        item.innerHTML = `
          <div class="finding-header">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="finding-title">${f.title}</span>
              <span class="badge ${sevBadge}">${f.severity}</span>
              <span class="badge badge-slate" style="font-size: 10px;">${f.category}</span>
              ${f.scoreDeduction > 0 ? `<span class="badge badge-rose" style="font-size: 10px;">-${f.scoreDeduction} pts</span>` : ''}
            </div>
            <span style="font-size: 11px; color: var(--accent); font-family: var(--font-mono);">Inspect &rarr;</span>
          </div>
          <div class="finding-desc">${f.description}</div>
          <div style="display: flex; gap: 12px; font-size: 10.5px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 4px;">
            <span>Scope: ${f.resourceScope || 'MAIN_DOCUMENT'}</span>
            <span>Party: ${f.partyScope || 'FIRST_PARTY'}</span>
            ${f.resourceType ? `<span>Type: ${f.resourceType}</span>` : ''}
          </div>
        `;
        item.addEventListener('click', () => showFindingModal(f));
        findingsList.appendChild(item);
      });
    }
  }
}

function showFindingModal(f) {
  const modal = document.getElementById('evidenceModal');
  const title = document.getElementById('modalTechTitle');
  const body = document.getElementById('modalBody');
  if (!modal || !title || !body) return;

  title.textContent = `Security Finding: ${f.title}`;

  let sevBadge = 'badge-amber';
  if (f.severity === 'CRITICAL' || f.severity === 'HIGH') sevBadge = 'badge-rose';
  else if (f.severity === 'LOW') sevBadge = 'badge-cyan';
  else if (f.severity === 'INFO') sevBadge = 'badge-neutral';

  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <span class="badge ${sevBadge}" style="font-size: 12px; font-weight: 700; padding: 4px 10px;">${f.severity}</span>
        <span class="badge badge-slate" style="font-size: 12px; padding: 4px 10px;">Category: ${f.category}</span>
        <span class="badge badge-cyan" style="font-size: 12px; padding: 4px 10px;">Scope: ${f.resourceScope || 'MAIN_DOCUMENT'}</span>
        <span class="badge badge-neutral" style="font-size: 12px; padding: 4px 10px;">Party: ${f.partyScope || 'FIRST_PARTY'}</span>
        ${f.scoreDeduction > 0 ? `<span class="badge badge-rose" style="font-size: 12px; padding: 4px 10px;">Score Impact: -${f.scoreDeduction} pts</span>` : '<span class="badge badge-emerald" style="font-size: 12px; padding: 4px 10px;">No score penalty</span>'}
      </div>

      <div>
        <div class="finding-field-label">Affected URL / Resource</div>
        <div class="finding-field-value">${f.affectedUrl || 'Main Document URL'}</div>
      </div>

      ${f.resourceType ? `
        <div>
          <div class="finding-field-label">Resource Type</div>
          <div class="finding-field-value">${f.resourceType}</div>
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <div class="finding-field-label">Observed Evidence</div>
          <div class="finding-field-value" style="color: #f43f5e;">${f.observed || 'None'}</div>
        </div>
        <div>
          <div class="finding-field-label">Expected Security Baseline</div>
          <div class="finding-field-value" style="color: #10b981;">${f.expected || 'Active'}</div>
        </div>
      </div>

      <div>
        <div class="finding-field-label">Technical Details & Risk Assessment</div>
        <div style="font-size: 12.5px; color: var(--text-primary); line-height: 1.5; background: var(--bg-muted); padding: 10px; border-radius: 4px;">
          ${f.description}
        </div>
      </div>

      ${f.remediation ? `
        <div>
          <div class="finding-field-label">Recommended Remediation</div>
          <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981; padding: 10px; border-radius: 4px;">
            ${f.remediation}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  modal.classList.add('active');
}

function renderApisTab() {
  const badge = document.getElementById('apiCountBadge');
  if (badge) badge.textContent = `${catalogedApis.length} Endpoints`;
  const container = document.getElementById('apiListContainer');
  if (!container) return;
  container.innerHTML = '';

  if (catalogedApis.length === 0) {
    container.innerHTML = '<div class="empty-state">No REST or GraphQL API transactions observed yet.</div>';
    return;
  }

  catalogedApis.forEach(api => {
    container.innerHTML += `
      <div class="api-item">
        <div>
          <span class="method-tag method-${api.method.toLowerCase()}">${api.method}</span>
          <span style="margin-left: 8px;">${api.path}</span>
        </div>
        <div>
          <span class="badge badge-slate">${api.apiType}</span>
          <span class="badge badge-cyan">${api.callCount} calls</span>
        </div>
      </div>
    `;
  });
}

function renderLearnTab(filterQuery = '') {
  const container = document.getElementById('learnGrid');
  container.innerHTML = '';

  for (const [id, entry] of Object.entries(KNOWLEDGE_BASE)) {
    if (filterQuery && !entry.name.toLowerCase().includes(filterQuery) && !entry.what.toLowerCase().includes(filterQuery)) {
      continue;
    }

    const card = document.createElement('div');
    card.className = 'learn-card';
    card.innerHTML = `
      <div class="learn-card-title">${entry.name}</div>
      <div class="learn-section">
        <span class="learn-section-label">WHAT</span>
        <span class="learn-section-text">${entry.what}</span>
      </div>
      <div class="learn-section">
        <span class="learn-section-label">WHY</span>
        <span class="learn-section-text">${entry.why}</span>
      </div>
      <div class="learn-section">
        <span class="learn-section-label">HOW</span>
        <span class="learn-section-text">${entry.how}</span>
      </div>
      <div class="learn-section">
        <span class="learn-section-label">EVIDENCE</span>
        <span class="learn-section-text">${entry.evidence}</span>
      </div>
      <div class="learn-section">
        <span class="learn-section-label">REAL-WORLD USE</span>
        <span class="learn-section-text">${entry.realWorldUse}</span>
      </div>
    `;
    container.appendChild(card);
  }
}

async function renderHistoryTab() {
  const sessions = await StorageManager.getAllSessions();
  const container = document.getElementById('historyTableContainer');
  if (container) {
    container.innerHTML = '';
    if (sessions.length === 0) {
      container.innerHTML = '<div class="empty-state">No historical snapshots saved yet.</div>';
    } else {
      sessions.forEach(s => {
        container.innerHTML += `
          <div class="privacy-item" style="margin-bottom: 6px;">
            <span><strong>${s.primaryDomain}</strong> (${new Date(s.startTime).toLocaleString()})</span>
            <span class="badge badge-cyan">${s.stats.totalRequests} reqs</span>
          </div>
        `;
      });
    }
  }

  const selectB = document.getElementById('compareSelectB');
  if (selectB) {
    selectB.innerHTML = '<option value="">Select a previously inspected site...</option>';
    sessions.forEach(s => {
      selectB.innerHTML += `<option value="${s.id}">${s.primaryDomain} (${new Date(s.startTime).toLocaleTimeString()})</option>`;
    });

    selectB.addEventListener('change', () => {
      const selected = sessions.find(s => s.id === parseInt(selectB.value, 10));
      const bMetrics = document.getElementById('siteBMetrics');
      if (selected && bMetrics) {
        bMetrics.innerHTML = `
          <div><strong>Domain:</strong> ${selected.primaryDomain}</div>
          <div><strong>Requests:</strong> ${selected.stats.totalRequests}</div>
          <div><strong>3rd Parties:</strong> ${selected.stats.thirdPartyCount}</div>
        `;
      }
    });
  }

  const aMetrics = document.getElementById('siteAMetrics');
  if (aMetrics && currentSession) {
    aMetrics.innerHTML = `
      <div><strong>Domain:</strong> ${currentSession.primaryDomain}</div>
      <div><strong>Requests:</strong> ${currentSession.stats.totalRequests}</div>
      <div><strong>3rd Parties:</strong> ${currentSession.stats.thirdPartyCount}</div>
    `;
  }
}

function handleNodeSelect(node) {
  const drawer = document.getElementById('nodeInspectorDrawer');
  const title = document.getElementById('drawerNodeTitle');
  const body = document.getElementById('drawerBody');

  if (!drawer) return;

  if (!node) {
    drawer.classList.remove('visible');
    return;
  }

  drawer.classList.add('visible');
  if (title) title.textContent = node.label || node.id;
  const inDeg = activeGraph ? activeGraph.getInDegree(node.id) : 0;
  const outDeg = activeGraph ? activeGraph.getOutDegree(node.id) : 0;

  if (body) {
    body.innerHTML = `
      <div style="margin-bottom: 8px;"><strong>Node Type:</strong> <span class="badge badge-crimson" style="margin-left: 4px;">${node.type}</span></div>
      <div style="margin-bottom: 4px;"><strong>In-Degree:</strong> ${inDeg} (Incoming dependencies)</div>
      <div style="margin-bottom: 12px;"><strong>Out-Degree:</strong> ${outDeg} (Outgoing dependencies)</div>
      <div><strong>Metadata:</strong></div>
      <pre style="background: var(--bg-well); color: var(--text-primary); border: 1px solid var(--border); padding: 8px; border-radius: var(--radius-xs); font-size: 11px; overflow-x: auto; font-family: var(--font-mono); margin-top: 6px;">${JSON.stringify(node.metadata || {}, null, 2)}</pre>
    `;
  }
}

// Multi-Format Export Functions
function exportJson() {
  const data = JSON.stringify({
    session: currentSession,
    detectedTechs,
    catalogedApis,
    detectedTrackers
  }, null, 2);
  downloadBlob(data, `underweb-${currentSession.primaryDomain || 'report'}.json`, 'application/json');
}

function exportMarkdown() {
  const md = `# Underweb Intelligence Report: ${currentSession.primaryDomain || 'Website'}
Generated: ${new Date().toISOString()}
Target URL: ${currentSession.url}

## Detected Technology Stack
${detectedTechs.map(t => `- **${t.name}** (${t.category}, ${t.confidence} confidence): ${t.explanation}`).join('\n')}

## Network Footprint
- Total Requests: ${currentSession.stats.totalRequests}
- Connected Domains: ${currentSession.domainsCount}
- Third-Party Domains: ${currentSession.stats.thirdPartyCount}

## API Endpoints
${catalogedApis.map(a => `- \`${a.method} ${a.path}\` (${a.apiType})`).join('\n')}
`;
  downloadBlob(md, `underweb-${currentSession.primaryDomain || 'report'}.md`, 'text/markdown');
}

function exportCsv() {
  const headers = ['URL', 'Method', 'Status', 'Category', 'Size (Bytes)', 'Duration (ms)'];
  const rows = currentSession.requests.map(r => [
    `"${r.url}"`,
    r.method,
    r.status || '',
    r.category,
    r.size || 0,
    r.duration || 0
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csv, `underweb-network-${currentSession.primaryDomain || 'export'}.csv`, 'text/csv');
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
