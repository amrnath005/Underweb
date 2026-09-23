// src/ui/dashboard/dashboard.js
// Master controller for the Underweb Deep Intelligence Dashboard.

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
import { createMockSession } from '../../utils/mock-data.js';

let currentTabId = null;
let currentSession = null;
let graphRenderer = null;
let activeGraph = null;
let detectedTechs = [];
let catalogedApis = [];
let detectedTrackers = [];
let isRecordingClick = false;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Resolve Tab ID
  const urlParams = new URLSearchParams(window.location.search);
  const tabIdParam = urlParams.get('tabId');

  if (tabIdParam) {
    currentTabId = parseInt(tabIdParam, 10);
  } else if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) currentTabId = tab.id;
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

function setupActions() {
  const addListener = (id, evt, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, fn);
  };

  addListener('refreshBtn', 'click', loadSessionData);

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

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage && currentTabId) {
    try {
      const res = await chrome.runtime.sendMessage({
        action: 'GET_TAB_SESSION',
        tabId: currentTabId
      });
      if (res && res.success && res.data) {
        sessionData = res.data;
      }
    } catch (err) {
      console.warn('Chrome runtime message failed, defaulting to demo substrate:', err);
    }
  }

  // Fallback to rich mock session if running in localhost / standalone browser
  if (!sessionData) {
    sessionData = createMockSession();
  }

  currentSession = sessionData;

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
  catalogedApis = ApiDetector.catalogApis(currentSession.requests);
  detectedTrackers = TrackerDetector.detect(currentSession.requests);

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
    renderPrivacyTab(cookies || []);
    renderSecurityTab(cookies || []);
  };

  if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.getAll && currentSession.url) {
    chrome.cookies.getAll({ url: currentSession.url }, handleCookies);
  } else {
    handleCookies(currentSession.mockCookies || []);
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
    console.error('Failed to load session:', err);
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
    card.innerHTML = `
      <div class="tech-card-header">
        <span class="tech-card-name">${tech.name}</span>
        <span class="badge ${tech.confidence === 'HIGH' ? 'badge-green' : 'badge-amber'}">${tech.confidence}</span>
      </div>
      <div class="tech-card-desc">${tech.explanation}</div>
      <div class="tech-card-footer">
        <span class="badge badge-neutral">${tech.category}</span>
        <span class="confidence">View evidence &rarr;</span>
      </div>
    `;

    card.addEventListener('click', () => showEvidenceModal(tech));
    container.appendChild(card);
  });
}

function showEvidenceModal(tech) {
  document.getElementById('modalTechTitle').textContent = `${tech.name} — Evidence & Signals`;
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <div><strong>Category:</strong> ${tech.category}</div>
    <div><strong>Status:</strong> ${tech.status} (Confidence: ${tech.confidence}, Score: ${tech.score})</div>
    <div><strong>Explanation:</strong> ${tech.explanation}</div>
    <div style="margin-top: 10px;"><strong>Observed Signals (${tech.signals.length}):</strong></div>
    <ul class="signals-list" style="margin-top: 6px;">
      ${tech.signals.map(s => `<li><code>[${s.type}]</code> <strong>${s.key}:</strong> ${s.description}</li>`).join('')}
    </ul>
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
  const circle = document.getElementById('securityScoreCircle');
  if (circle) {
    circle.textContent = sec.grade;
    circle.className = `score-circle ${sec.grade === 'A' ? 'border-emerald' : 'border-amber'}`;
  }

  const scoreText = document.getElementById('securityScoreText');
  if (scoreText) scoreText.textContent = `Security Posture: Grade ${sec.grade} (Score: ${sec.score}/100)`;
  const ovGrade = document.getElementById('ovSecurityGrade');
  if (ovGrade) ovGrade.textContent = sec.grade;

  const findingsList = document.getElementById('securityFindingsList');
  if (findingsList) {
    findingsList.innerHTML = '';
    sec.findings.forEach(f => {
      findingsList.innerHTML += `
        <div class="finding-item">
          <div class="finding-header">
            <span class="finding-title">${f.title}</span>
            <span class="badge ${f.severity === 'HIGH' || f.severity === 'CRITICAL' ? 'badge-rose' : 'badge-amber'}">${f.severity}</span>
          </div>
          <div class="finding-desc">${f.description}</div>
        </div>
      `;
    });
  }
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
