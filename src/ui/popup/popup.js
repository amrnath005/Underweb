// src/ui/popup/popup.js
// Logic for Underweb's quick popup interface.

function createEmptySession(tabId, url = '', title = '') {
  let host = '';
  if (url) {
    try {
      host = new URL(url).hostname;
    } catch {}
  }
  return {
    tabId: tabId || 0,
    url: url || '',
    title: title || (host || 'Active Tab'),
    startTime: Date.now(),
    primaryDomain: host || 'No active tab',
    stats: {
      totalRequests: 0,
      totalBytes: 0,
      firstPartyCount: 0,
      thirdPartyCount: 0,
      apiCount: 0
    },
    domainsCount: host ? 1 : 0,
    protocols: [],
    runtime: {
      frameworks: [],
      globals: [],
      apis: [],
      domMetrics: { frameworkMarkers: [] },
      storage: { localStorageCount: 0, cookies: [] }
    },
    security: {
      isHttps: url ? url.startsWith('https://') : false,
      headers: {}
    }
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const protocolBadge = document.getElementById('protocolBadge');
  const siteProtocol = document.getElementById('siteProtocol');
  const siteHostname = document.getElementById('siteHostname');
  const securityBadge = document.getElementById('securityBadge');

  const totalRequests = document.getElementById('totalRequests');
  const domainsCount = document.getElementById('domainsCount');
  const thirdPartyCount = document.getElementById('thirdPartyCount');
  const apiCount = document.getElementById('apiCount');

  const techBadgesContainer = document.getElementById('techBadgesContainer');
  const techCountBadge = document.getElementById('techCountBadge');
  const infraBadgesContainer = document.getElementById('infraBadgesContainer');
  const cookieMetric = document.getElementById('cookieMetric');
  const storageMetric = document.getElementById('storageMetric');

  const openDashboardBtn = document.getElementById('openDashboardBtn');

  let activeTab = null;
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      activeTab = tab;
    } catch {}
  }

  // Open Dashboard handler
  openDashboardBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      const dashboardUrl = chrome.runtime.getURL(`src/ui/dashboard/dashboard.html${activeTab ? `?tabId=${activeTab.id}` : ''}`);
      chrome.tabs.create({ url: dashboardUrl });
    } else {
      window.open('../dashboard/dashboard.html', '_blank');
    }
  });

  let session = null;

  // 1. Direct check in chrome.storage.session
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session && activeTab) {
    try {
      const stored = await chrome.storage.session.get([`session_${activeTab.id}`]);
      if (stored && stored[`session_${activeTab.id}`]) {
        session = stored[`session_${activeTab.id}`];
      }
    } catch {}
  }

  // 2. Query Background Service Worker via message
  if (!session && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage && activeTab) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'GET_TAB_SESSION',
        tabId: activeTab.id
      });
      if (response && response.success && response.data) {
        session = response.data;
      }
    } catch {}
  }

  // 3. Fallback to clean real tab empty shell (NO MOCK DATA)
  if (!session) {
    session = createEmptySession(activeTab ? activeTab.id : 0, activeTab ? activeTab.url : '', activeTab ? activeTab.title : '');
  }

    // Render Target URL
    if (session.url) {
      try {
        const u = new URL(session.url);
        siteProtocol.textContent = u.protocol + '//';
        siteHostname.textContent = u.hostname + (u.pathname !== '/' ? u.pathname : '');
      } catch {
        siteHostname.textContent = session.url;
      }
    }

    // Protocol & Security
    const isHttps = session.security.isHttps;
    securityBadge.textContent = isHttps ? 'HTTPS' : 'INSECURE';
    securityBadge.className = `badge ${isHttps ? 'badge-emerald' : 'badge-rose'}`;

    if (session.protocols && session.protocols.length > 0) {
      protocolBadge.textContent = session.protocols[0].toUpperCase();
    } else {
      protocolBadge.textContent = isHttps ? 'TLS' : 'HTTP';
    }

    // Metrics
    totalRequests.textContent = session.stats.totalRequests || 0;
    domainsCount.textContent = session.domainsCount || 0;
    thirdPartyCount.textContent = session.stats.thirdPartyCount || 0;
    apiCount.textContent = session.stats.apiCount || (session.runtime.apis ? session.runtime.apis.length : 0);

    // Detected Tech
    const techItems = [];
    if (session.runtime.frameworks) {
      session.runtime.frameworks.forEach(f => techItems.push({ name: f.name || f, category: 'framework' }));
    }
    if (session.runtime.globals) {
      session.runtime.globals.forEach(g => {
        if (!techItems.some(t => t.name === g.name)) {
          techItems.push({ name: g.name, category: g.category });
        }
      });
    }
    if (session.runtime.domMetrics && session.runtime.domMetrics.frameworkMarkers) {
      session.runtime.domMetrics.frameworkMarkers.forEach(m => {
        if (!techItems.some(t => t.name === m.framework)) {
          techItems.push({ name: m.framework, category: 'framework' });
        }
      });
    }

    techCountBadge.textContent = techItems.length;
    if (techItems.length > 0) {
      techBadgesContainer.innerHTML = '';
      techItems.forEach(t => {
        const badge = document.createElement('span');
        badge.className = 'badge badge-cyan';
        badge.textContent = t.name;
        techBadgesContainer.appendChild(badge);
      });
    } else {
      techBadgesContainer.innerHTML = '<span class="text-muted" style="font-size:11px;">None detected yet</span>';
    }

    // Infrastructure detection
    const infraItems = [];
    if (session.security.headers) {
      const h = session.security.headers;
      if (h['cf-ray'] || (h['server'] && h['server'].toLowerCase().includes('cloudflare'))) {
        infraItems.push('Cloudflare');
      }
      if (h['x-amz-cf-id'] || h['x-amz-id-2']) {
        infraItems.push('AWS CloudFront');
      }
      if (h['x-vercel-id']) {
        infraItems.push('Vercel');
      }
      if (h['x-nf-request-id'] || (h['server'] && h['server'].toLowerCase().includes('netlify'))) {
        infraItems.push('Netlify');
      }
      if (h['x-fastly-request-id']) {
        infraItems.push('Fastly');
      }
      if (h['server']) {
        infraItems.push(h['server']);
      }
    }
    if (session.ipAddresses && session.ipAddresses.length > 0) {
      infraItems.push(`IP: ${session.ipAddresses[0]}`);
    }

    if (infraItems.length > 0) {
      infraBadgesContainer.innerHTML = '';
      infraItems.slice(0, 4).forEach(item => {
        const badge = document.createElement('span');
        badge.className = 'badge badge-purple';
        badge.textContent = item;
        infraBadgesContainer.appendChild(badge);
      });
    } else {
      infraBadgesContainer.innerHTML = '<span class="text-muted" style="font-size:11px;">Awaiting response headers</span>';
    }

    // Storage
    const lsCount = session.runtime && session.runtime.storage ? session.runtime.storage.localStorageCount : 0;
    storageMetric.textContent = `${lsCount} LocalStorage Keys`;

    // Query cookies directly via chrome.cookies
    if (session.url && session.url.startsWith('http')) {
      if (typeof chrome !== 'undefined' && chrome.cookies && chrome.cookies.getAll) {
        chrome.cookies.getAll({ url: session.url }, (cookies) => {
          const count = cookies ? cookies.length : 0;
          cookieMetric.textContent = `${count} Cookies`;
        });
      } else {
        cookieMetric.textContent = '0 Cookies';
      }
    } else {
      cookieMetric.textContent = '0 Cookies';
    }
  } catch (err) {
    console.error('Failed to load session data in popup:', err);
  }
});
