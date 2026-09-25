// Apply saved theme immediately
(function initTheme() {
  const savedTheme = localStorage.getItem('uw-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

import { FingerprintEngine } from '../../detection/fingerprint-engine.js';

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
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  function updatePopupThemeIcon(theme) {
    const icon = document.getElementById('popupThemeIcon');
    if (!icon) return;
    if (theme === 'dark') {
      icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    } else {
      icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    }
  }

  if (themeToggleBtn) {
    const html = document.documentElement;
    updatePopupThemeIcon(html.getAttribute('data-theme') || 'light');
    themeToggleBtn.addEventListener('click', () => {
      const curr = html.getAttribute('data-theme') || 'light';
      const next = curr === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', next);
      localStorage.setItem('uw-theme', next);
      updatePopupThemeIcon(next);
    });
  }

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

    // Detected Tech via universal FingerprintEngine
    const detectedTechs = FingerprintEngine.detect(session);
    techCountBadge.textContent = `${detectedTechs.length} Techs`;

    if (detectedTechs.length > 0) {
      techBadgesContainer.innerHTML = '';
      detectedTechs.slice(0, 10).forEach(t => {
        const badge = document.createElement('span');
        badge.className = `badge ${t.confidence === 'HIGH' ? 'badge-cyan' : 'badge-neutral'}`;
        badge.textContent = t.name;
        badge.title = `${t.category} (${t.status}, ${t.confidence} confidence, score: ${t.score}%)`;
        techBadgesContainer.appendChild(badge);
      });
      if (detectedTechs.length > 10) {
        const moreBadge = document.createElement('span');
        moreBadge.className = 'badge badge-neutral';
        moreBadge.textContent = `+${detectedTechs.length - 10} more`;
        techBadgesContainer.appendChild(moreBadge);
      }
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
