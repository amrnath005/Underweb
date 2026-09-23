// src/background/message-router.js
// Inter-process messaging dispatcher between Background, Content Scripts, Popup, and Dashboard.

import { Logger } from '../utils/logger.js';

const logger = new Logger('MessageRouter');

export class MessageRouter {
  /**
   * @param {import('./session-manager.js').SessionManager} sessionManager
   * @param {object} [engineCoordinator]
   */
  constructor(sessionManager, engineCoordinator = null) {
    this.sessionManager = sessionManager;
    this.engineCoordinator = engineCoordinator;
    this.handlers = new Map();
    this.registerDefaultHandlers();
  }

  register(action, handler) {
    this.handlers.set(action, handler);
  }

  registerDefaultHandlers() {
    // 1. Return snapshot of a specific tab session
    this.register('GET_TAB_SESSION', async (message, sender) => {
      const tabId = message.tabId || (sender && sender.tab ? sender.tab.id : null);
      if (!tabId) {
        return { success: false, error: 'No tabId provided' };
      }
      const session = this.sessionManager.get(tabId);
      if (!session) {
        return { success: false, error: `No active session for tab ${tabId}` };
      }
      return { success: true, data: session.getSnapshot() };
    });

    // 2. Receive telemetry payload from content script / page analyzer
    this.register('CONTENT_TELEMETRY', async (message, sender) => {
      const tabId = sender.tab ? sender.tab.id : message.tabId;
      if (!tabId) return { success: false };

      const session = this.sessionManager.getOrCreate(tabId, message.url || (sender.tab && sender.tab.url));
      if (message.payload) {
        // Merge runtime data
        if (message.payload.globals) session.runtime.globals = message.payload.globals;
        if (message.payload.frameworks) session.runtime.frameworks = message.payload.frameworks;
        if (message.payload.libraries) session.runtime.libraries = message.payload.libraries;
        if (message.payload.apis) session.runtime.apis = message.payload.apis;
        if (message.payload.storage) session.runtime.storage = message.payload.storage;
        if (message.payload.permissions) session.runtime.permissions = message.payload.permissions;
        if (message.payload.domMetrics) session.runtime.domMetrics = message.payload.domMetrics;
        if (message.payload.security) {
          Object.assign(session.security, message.payload.security);
        }
      }
      return { success: true };
    });

    // 3. Receive interaction recording events ("What Happens When I Click")
    this.register('INTERACTION_EVENT', async (message, sender) => {
      const tabId = sender.tab ? sender.tab.id : message.tabId;
      if (!tabId) return { success: false };

      const session = this.sessionManager.get(tabId);
      if (session && session.isRecordingInteractions) {
        session.interactionLogs.push({
          timestamp: Date.now(),
          ...message.event
        });
      }
      return { success: true };
    });

    // 4. Toggle interaction recording state
    this.register('TOGGLE_CLICK_RECORDER', async (message) => {
      const { tabId, enabled } = message;
      const session = this.sessionManager.get(tabId);
      if (session) {
        session.isRecordingInteractions = enabled;
        if (enabled && message.clearPrevious) {
          session.interactionLogs = [];
        }
        // Notify content script in that tab
        try {
          chrome.tabs.sendMessage(tabId, {
            action: 'SET_CLICK_RECORDING',
            enabled: session.isRecordingInteractions
          });
        } catch (err) {
          logger.warn(`Failed to notify content script in tab ${tabId}`, err);
        }
        return { success: true, isRecording: session.isRecordingInteractions };
      }
      return { success: false, error: 'Session not found' };
    });
  }

  /**
   * Listen and dispatch chrome.runtime.onMessage.
   */
  listen() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || !message.action) {
        return false;
      }

      const handler = this.handlers.get(message.action);
      if (handler) {
        Promise.resolve(handler(message, sender))
          .then((res) => sendResponse(res))
          .catch((err) => {
            logger.error(`Error handling ${message.action}:`, err);
            sendResponse({ success: false, error: err.message });
          });
        return true; // Keep channel open for async response
      }

      logger.warn(`Unregistered message action: ${message.action}`);
      return false;
    });
  }
}
