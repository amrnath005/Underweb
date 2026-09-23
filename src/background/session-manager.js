// src/background/session-manager.js
// Per-tab session tracking, ring-buffer telemetry storage, and state aggregation.

import { DomainUtils } from '../utils/domain-utils.js';
import { UrlUtils } from '../utils/url-utils.js';
import { ResourceClassifier } from '../network/resource-classifier.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('SessionManager');
const MAX_REQUESTS_PER_TAB = 1000;

export class TabSession {
  /**
   * @param {number} tabId
   * @param {string} initialUrl
   */
  constructor(tabId, initialUrl = '') {
    this.tabId = tabId;
    this.url = initialUrl;
    this.title = '';
    this.favicon = '';
    this.startTime = Date.now();
    this.lastActiveTime = Date.now();
    this.primaryDomain = initialUrl ? UrlUtils.getHostname(initialUrl) : '';
    this.primaryApex = initialUrl ? DomainUtils.getApexDomain(this.primaryDomain) : '';

    // Network Telemetry Ring Buffer
    this.requests = [];
    this.requestsById = new Map(); // requestId -> request object
    this.domains = new Set();
    this.thirdPartyDomains = new Set();
    this.firstPartyDomains = new Set();
    this.ipAddresses = new Set();
    this.protocols = new Set();

    // Aggregates & Counters
    this.stats = {
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
    };

    // Client Runtime Telemetry (relayed from content & page analyzer)
    this.runtime = {
      globals: [],
      frameworks: [],
      libraries: [],
      apis: [],
      websockets: [],
      performance: {},
      storage: {
        localStorageCount: 0,
        localStorageKeys: [],
        sessionStorageCount: 0,
        indexedDbDatabases: [],
        cookies: []
      },
      permissions: {},
      domMetrics: {}
    };

    // Security Audit Records
    this.security = {
      isHttps: false,
      headers: {},
      csp: null,
      hsts: null,
      cors: {},
      mixedContentWarnings: [],
      cookieSecurityIssues: []
    };

    // "What Happens When I Click" Interaction Recordings
    this.interactionLogs = [];
    this.isRecordingInteractions = false;
  }

  /**
   * Add or update a network request in the ring buffer.
   * @param {object} reqData
   */
  recordRequest(reqData) {
    this.lastActiveTime = Date.now();
    const id = reqData.requestId || `${reqData.url}_${Date.now()}`;

    let req = this.requestsById.get(id);
    if (!req) {
      req = {
        id,
        url: reqData.url,
        method: reqData.method || 'GET',
        type: reqData.type || 'other',
        initiator: reqData.initiator || '',
        startTime: reqData.timeStamp || Date.now(),
        status: null,
        statusText: '',
        duration: 0,
        size: 0,
        protocol: '',
        ip: '',
        requestHeaders: {},
        responseHeaders: {},
        isFirstParty: true,
        category: reqData.category || ResourceClassifier.classify(reqData)
      };

      // Categorical counts
      if (req.category === 'API') this.stats.apiCount++;
      else if (req.category === 'SCRIPT') this.stats.scriptCount++;
      else if (req.category === 'STYLESHEET') this.stats.stylesheetCount++;
      else if (req.category === 'IMAGE') this.stats.imageCount++;
      else if (req.category === 'FONT') this.stats.fontCount++;
      else if (req.category === 'TRACKER' || req.category === 'ANALYTICS' || req.category === 'AD') this.stats.trackerCount++;
      else if (req.category === 'WEBSOCKET') this.stats.websocketCount++;

      // Extract domain info
      const host = UrlUtils.getHostname(req.url);
      if (host) {
        this.domains.add(host);
        req.isFirstParty = DomainUtils.isFirstParty(host, this.primaryDomain);
        if (req.isFirstParty) {
          this.firstPartyDomains.add(host);
          this.stats.firstPartyCount++;
        } else {
          this.thirdPartyDomains.add(host);
          this.stats.thirdPartyCount++;
        }
      }

      this.stats.totalRequests++;

      // Manage Ring Buffer
      if (this.requests.length >= MAX_REQUESTS_PER_TAB) {
        const oldest = this.requests.shift();
        if (oldest) this.requestsById.delete(oldest.id);
      }

      this.requests.push(req);
      this.requestsById.set(id, req);
    }

    // Merge updates (e.g. onHeadersReceived, onCompleted)
    if (reqData.status) req.status = reqData.status;
    if (reqData.statusText) req.statusText = reqData.statusText;
    if (reqData.ip) {
      req.ip = reqData.ip;
      this.ipAddresses.add(reqData.ip);
    }
    if (reqData.protocol) {
      req.protocol = reqData.protocol;
      this.protocols.add(reqData.protocol);
    }
    if (reqData.requestHeaders) req.requestHeaders = reqData.requestHeaders;
    if (reqData.responseHeaders) req.responseHeaders = reqData.responseHeaders;
    if (reqData.size) {
      req.size = reqData.size;
      this.stats.totalBytes += reqData.size;
    }
    if (reqData.duration) req.duration = reqData.duration;
    if (reqData.category) req.category = reqData.category;

    return req;
  }

  /**
   * Export clean serializable snapshot of this tab's state.
   */
  getSnapshot() {
    return {
      tabId: this.tabId,
      url: this.url,
      title: this.title,
      favicon: this.favicon,
      startTime: this.startTime,
      primaryDomain: this.primaryDomain,
      primaryApex: this.primaryApex,
      stats: { ...this.stats },
      domainsCount: this.domains.size,
      firstPartyDomainsCount: this.firstPartyDomains.size,
      thirdPartyDomainsCount: this.thirdPartyDomains.size,
      ipAddresses: Array.from(this.ipAddresses),
      protocols: Array.from(this.protocols),
      domains: Array.from(this.domains),
      thirdPartyDomains: Array.from(this.thirdPartyDomains),
      firstPartyDomains: Array.from(this.firstPartyDomains),
      requests: this.requests.slice(-200), // Return recent requests for display
      runtime: this.runtime,
      security: this.security,
      interactionLogs: this.interactionLogs.slice(-50),
      isRecordingInteractions: this.isRecordingInteractions
    };
  }

  /**
   * Reconstruct a TabSession instance from a serialized snapshot.
   * @param {object} snapshot
   * @returns {TabSession}
   */
  static fromSnapshot(snapshot) {
    if (!snapshot) return null;
    const session = new TabSession(snapshot.tabId, snapshot.url);
    session.title = snapshot.title || '';
    session.favicon = snapshot.favicon || '';
    session.startTime = snapshot.startTime || Date.now();
    session.primaryDomain = snapshot.primaryDomain || '';
    session.primaryApex = snapshot.primaryApex || '';
    session.stats = snapshot.stats ? { ...snapshot.stats } : session.stats;

    session.domains = new Set(snapshot.domains || []);
    session.thirdPartyDomains = new Set(snapshot.thirdPartyDomains || []);
    session.firstPartyDomains = new Set(snapshot.firstPartyDomains || []);
    session.ipAddresses = new Set(snapshot.ipAddresses || []);
    session.protocols = new Set(snapshot.protocols || []);

    session.requests = snapshot.requests ? [...snapshot.requests] : [];
    session.requestsById = new Map();
    for (const r of session.requests) {
      if (r && r.id) session.requestsById.set(r.id, r);
    }

    session.runtime = snapshot.runtime ? { ...snapshot.runtime } : session.runtime;
    session.security = snapshot.security ? { ...snapshot.security } : session.security;
    session.interactionLogs = snapshot.interactionLogs ? [...snapshot.interactionLogs] : [];
    session.isRecordingInteractions = !!snapshot.isRecordingInteractions;

    return session;
  }
}

export class SessionManager {
  constructor() {
    /** @type {Map<number, TabSession>} */
    this.sessions = new Map();
    /** @type {Map<number, any>} */
    this._persistTimeouts = new Map();
  }

  /**
   * Debounced persistence of TabSession to chrome.storage.session.
   * @param {number} tabId
   */
  schedulePersist(tabId) {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.session) return;
    if (this._persistTimeouts.has(tabId)) return;

    const timeout = setTimeout(async () => {
      this._persistTimeouts.delete(tabId);
      const session = this.sessions.get(tabId);
      if (session) {
        try {
          const snapshot = session.getSnapshot();
          await chrome.storage.session.set({ [`session_${tabId}`]: snapshot });
        } catch (err) {
          logger.warn(`Failed to persist session_${tabId} to storage:`, err);
        }
      }
    }, 150);

    this._persistTimeouts.set(tabId, timeout);
  }

  /**
   * Get or initialize session for a given tab.
   * @param {number} tabId
   * @param {string} [url]
   * @returns {TabSession}
   */
  getOrCreate(tabId, url = '') {
    if (!this.sessions.has(tabId)) {
      logger.debug(`Creating new TabSession for tab ${tabId}`);
      this.sessions.set(tabId, new TabSession(tabId, url));
    }
    const session = this.sessions.get(tabId);
    if (url && (!session.url || session.url !== url)) {
      session.url = url;
      session.primaryDomain = UrlUtils.getHostname(url);
      session.primaryApex = DomainUtils.getApexDomain(session.primaryDomain);
      session.security.isHttps = UrlUtils.isSecure(url);
    }
    this.schedulePersist(tabId);
    return session;
  }

  /**
   * Async get or create tab session, hydrating from storage.session if worker woke up.
   * @param {number} tabId
   * @param {string} [url]
   * @returns {Promise<TabSession>}
   */
  async getOrCreateAsync(tabId, url = '') {
    let session = await this.getAsync(tabId);
    if (!session) {
      session = this.getOrCreate(tabId, url);
    } else if (url && (!session.url || session.url !== url)) {
      session.url = url;
      session.primaryDomain = UrlUtils.getHostname(url);
      session.primaryApex = DomainUtils.getApexDomain(session.primaryDomain);
      session.security.isHttps = UrlUtils.isSecure(url);
      this.schedulePersist(tabId);
    }
    return session;
  }

  /**
   * Synchronous get from in-memory cache.
   * @param {number} tabId
   * @returns {TabSession|null}
   */
  get(tabId) {
    return this.sessions.get(tabId) || null;
  }

  /**
   * Asynchronous get: checks in-memory cache first, then hydrates from chrome.storage.session.
   * @param {number} tabId
   * @returns {Promise<TabSession|null>}
   */
  async getAsync(tabId) {
    if (this.sessions.has(tabId)) {
      return this.sessions.get(tabId);
    }
    // Attempt hydration from chrome.storage.session (survives service worker sleep/wake)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
      try {
        const key = `session_${tabId}`;
        const stored = await chrome.storage.session.get([key]);
        if (stored && stored[key]) {
          const session = TabSession.fromSnapshot(stored[key]);
          this.sessions.set(tabId, session);
          logger.debug(`Hydrated tab session ${tabId} from chrome.storage.session`);
          return session;
        }
      } catch (err) {
        logger.warn(`Failed to hydrate tab session ${tabId}:`, err);
      }
    }
    return null;
  }

  /**
   * Reset session on navigation.
   * @param {number} tabId
   * @param {string} newUrl
   */
  resetTab(tabId, newUrl = '') {
    logger.debug(`Resetting session for tab ${tabId}`);
    this.sessions.set(tabId, new TabSession(tabId, newUrl));
    this.schedulePersist(tabId);
  }

  /**
   * Remove tab session on tab close.
   * @param {number} tabId
   */
  removeTab(tabId) {
    if (this._persistTimeouts.has(tabId)) {
      clearTimeout(this._persistTimeouts.get(tabId));
      this._persistTimeouts.delete(tabId);
    }
    if (this.sessions.has(tabId)) {
      logger.debug(`Removing session for closed tab ${tabId}`);
      this.sessions.delete(tabId);
    }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
      chrome.storage.session.remove([`session_${tabId}`]).catch(() => {});
    }
  }
}
