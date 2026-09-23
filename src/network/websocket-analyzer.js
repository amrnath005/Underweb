// src/network/websocket-analyzer.js
// Analyzes active and closed WebSocket connections and sub-protocols.

import { UrlUtils } from '../utils/url-utils.js';

export class WebSocketAnalyzer {
  /**
   * Catalog and analyze WebSocket connections from requests or page telemetry.
   * @param {Array<object>} rawEntries
   * @returns {Array<object>} WebSocket profiles
   */
  static analyze(rawEntries) {
    const sockets = [];
    const seen = new Set();

    for (const entry of rawEntries) {
      const url = entry.url || '';
      if (!url.startsWith('ws://') && !url.startsWith('wss://') && entry.type !== 'websocket') {
        continue;
      }

      if (seen.has(url)) continue;
      seen.add(url);

      const parsed = UrlUtils.safeParse(url);
      const host = parsed ? parsed.hostname : '';
      const isSecure = url.startsWith('wss:');

      // Infer sub-protocol from path or query
      let subProtocol = 'Standard WebSocket';
      if (url.includes('socket.io')) subProtocol = 'Socket.io';
      else if (url.includes('graphql') || url.includes('subscriptions')) subProtocol = 'GraphQL Subscriptions';
      else if (url.includes('stomp')) subProtocol = 'STOMP / SockJS';
      else if (url.includes('actioncable')) subProtocol = 'Rails ActionCable';
      else if (url.includes('pusher')) subProtocol = 'Pusher';
      else if (url.includes('firebase')) subProtocol = 'Firebase Realtime';

      sockets.push({
        url,
        host,
        path: parsed ? parsed.pathname : '',
        isSecure,
        subProtocol,
        status: entry.status || 'OPEN',
        timestamp: entry.timestamp || Date.now()
      });
    }

    return sockets;
  }
}
