// src/background/session-manager.js
// Per-tab session tracking, ring-buffer telemetry storage, and state aggregation.

import { DomainUtils } from '../utils/domain-utils.js';
import { UrlUtils } from '../utils/url-utils.js';
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
        category: 'UNKNOWN'
      };

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
      requests: this.requests.slice(-200), // Return recent requests for display
      runtime: this.runtime,
      security: this.security,
      interactionLogs: this.interactionLogs.slice(-50),
      isRecordingInteractions: this.isRecordingInteractions
    };
  }
}

export class SessionManager {
  constructor() {
    /** @type {Map<number, TabSession>} */
    this.sessions = new Map();
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
    return session;
  }

  /**
   * Retrieve existing session or null.
   * @param {number} tabId
   * @returns {TabSession|null}
   */
  get(tabId) {
    return this.sessions.get(tabId) || null;
  }

  /**
   * Reset session on navigation.
   * @param {number} tabId
   * @param {string} newUrl
   */
  resetTab(tabId, newUrl = '') {
    logger.debug(`Resetting session for tab ${tabId}`);
    this.sessions.set(tabId, new TabSession(tabId, newUrl));
  }

  /**
   * Remove tab session on tab close.
   * @param {number} tabId
   */
  removeTab(tabId) {
    if (this.sessions.has(tabId)) {
      logger.debug(`Removing session for closed tab ${tabId}`);
      this.sessions.delete(tabId);
    }
  }
}
