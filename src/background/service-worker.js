// src/background/service-worker.js
// Central Background Service Worker for Underweb Manifest V3 Extension.

import { SessionManager } from './session-manager.js';
import { MessageRouter } from './message-router.js';
import { UrlUtils } from '../utils/url-utils.js';
import { Parsers } from '../utils/parsers.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('ServiceWorker');
const sessionManager = new SessionManager();
const messageRouter = new MessageRouter(sessionManager);

// Configure storage.session access level for MV3
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session && chrome.storage.session.setAccessLevel) {
  chrome.storage.session.setAccessLevel({
    accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS'
  }).catch(() => {});
}

// Start message router listener
messageRouter.listen();

// Inject content script into existing tabs on install or extension reload
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(async () => {
    logger.info('Underweb Extension installed or reloaded.');
    if (chrome.tabs && chrome.scripting) {
      try {
        const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
        for (const tab of tabs) {
          if (!tab.id || UrlUtils.isInternalOrSpecial(tab.url)) continue;
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['src/content/content.js']
            });
            logger.info(`Injected content script into existing tab ${tab.id} (${tab.url})`);
          } catch {}
        }
      } catch (err) {
        logger.warn('Failed to inject content script on install:', err);
      }
    }
  });
}

// Active request cache during in-flight lifecycle
// requestId -> { startTime, url, method, type, initiator }
const inFlightRequests = new Map();

/**
 * -------------------------------------------------------------
 * 1. Network Telemetry via chrome.webRequest (Passive MV3)
 * -------------------------------------------------------------
 */

// Step A: onBeforeRequest
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0 || UrlUtils.isInternalOrSpecial(details.url)) return;

    inFlightRequests.set(details.requestId, {
      requestId: details.requestId,
      tabId: details.tabId,
      url: details.url,
      method: details.method,
      type: details.type,
      initiator: details.initiator || '',
      startTime: details.timeStamp
    });

    const session = sessionManager.getOrCreate(details.tabId);
    session.recordRequest({
      requestId: details.requestId,
      url: details.url,
      method: details.method,
      type: details.type,
      initiator: details.initiator,
      timeStamp: details.timeStamp
    });
  },
  { urls: ['<all_urls>'] }
);

// Step B: onBeforeSendHeaders (Capture outgoing headers)
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (details.tabId < 0 || !inFlightRequests.has(details.requestId)) return;
    const session = sessionManager.get(details.tabId);
    if (!session) return;

    const headersMap = Parsers.normalizeHeaders(details.requestHeaders);
    const reqHeadersObj = Object.fromEntries(headersMap);

    session.recordRequest({
      requestId: details.requestId,
      requestHeaders: reqHeadersObj
    });
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders', 'extraHeaders']
);

// Step C: onHeadersReceived (Capture response headers, CSP, HSTS, Server, IP)
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId < 0) return;
    const session = sessionManager.get(details.tabId);
    if (!session) return;

    const headersMap = Parsers.normalizeHeaders(details.responseHeaders);
    const respHeadersObj = Object.fromEntries(headersMap);

    // If this is the main frame document, inspect security headers
    if (details.type === 'main_frame') {
      session.security.isHttps = UrlUtils.isSecure(details.url);
      session.security.headers = respHeadersObj;

      if (respHeadersObj['content-security-policy']) {
        session.security.csp = respHeadersObj['content-security-policy'];
      }
      if (respHeadersObj['strict-transport-security']) {
        session.security.hsts = respHeadersObj['strict-transport-security'];
      }
      if (respHeadersObj['access-control-allow-origin']) {
        session.security.cors.allowOrigin = respHeadersObj['access-control-allow-origin'];
      }
    }

    session.recordRequest({
      requestId: details.requestId,
      status: details.statusCode,
      statusText: details.statusLine || '',
      ip: details.ip || '',
      responseHeaders: respHeadersObj
    });
    sessionManager.schedulePersist(details.tabId);
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders', 'extraHeaders']
);

// Step D: onCompleted (Finalize request timing and size)
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId < 0) return;
    const session = sessionManager.get(details.tabId);
    if (!session) return;

    const inFlight = inFlightRequests.get(details.requestId);
    const duration = inFlight ? Math.max(0, details.timeStamp - inFlight.startTime) : 0;
    inFlightRequests.delete(details.requestId);

    // Extract content length if header present
    let size = 0;
    if (details.responseHeaders) {
      const hMap = Parsers.normalizeHeaders(details.responseHeaders);
      const cl = hMap.get('content-length');
      if (cl) size = parseInt(cl, 10) || 0;
    }

    session.recordRequest({
      requestId: details.requestId,
      status: details.statusCode,
      ip: details.ip || '',
      duration,
      size
    });
    sessionManager.schedulePersist(details.tabId);
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// Step E: onErrorOccurred
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (details.tabId < 0) return;
    inFlightRequests.delete(details.requestId);
    const session = sessionManager.get(details.tabId);
    if (session) {
      session.recordRequest({
        requestId: details.requestId,
        status: 0,
        statusText: details.error || 'NET_ERROR'
      });
      sessionManager.schedulePersist(details.tabId);
    }
  },
  { urls: ['<all_urls>'] }
);

/**
 * -------------------------------------------------------------
 * 2. Tab Lifecycle Management
 * -------------------------------------------------------------
 */

// Track Tab URL updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    if (!UrlUtils.isInternalOrSpecial(changeInfo.url)) {
      sessionManager.resetTab(tabId, changeInfo.url);
    }
  }
  if (tab && tab.url && !UrlUtils.isInternalOrSpecial(tab.url)) {
    const session = sessionManager.getOrCreate(tabId, tab.url);
    if (tab.title) session.title = tab.title;
    if (tab.favIconUrl) session.favicon = tab.favIconUrl;
  }
});

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  sessionManager.removeTab(tabId);
});

logger.info('Underweb Service Worker initialized successfully.');
