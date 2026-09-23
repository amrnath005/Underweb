// src/network/api-detector.js
// Identifies and catalogs REST endpoints, GraphQL queries, and RPC transactions.

import { UrlUtils } from '../utils/url-utils.js';

export class ApiDetector {
  /**
   * Determine if a request represents an API call.
   * @param {object} req
   * @returns {boolean}
   */
  static isApiRequest(req) {
    if (!req || !req.url) return false;
    const url = req.url.toLowerCase();
    const type = (req.type || '').toLowerCase();

    if (type === 'xmlhttprequest' || type === 'fetch') return true;
    if (url.includes('/api/') || url.includes('/graphql') || url.includes('/gql')) return true;
    if (/\/v\d+\//.test(url)) return true;
    if (req.responseHeaders && req.responseHeaders['content-type']) {
      const ct = req.responseHeaders['content-type'].toLowerCase();
      if (ct.includes('application/json') || ct.includes('application/graphql')) return true;
    }
    return false;
  }

  /**
   * Catalog an array of requests into organized API endpoint records.
   * @param {Array<object>} requests
   * @returns {Array<object>} Cataloged API endpoints
   */
  static catalogApis(requests) {
    const apis = [];
    const seen = new Set();

    for (const req of requests) {
      if (!this.isApiRequest(req)) continue;

      const parsed = UrlUtils.safeParse(req.url);
      if (!parsed) continue;

      const method = (req.method || 'GET').toUpperCase();
      const endpointPath = parsed.pathname;
      const key = `${method} ${parsed.hostname}${endpointPath}`;

      if (seen.has(key)) {
        // Find existing and increment count
        const existing = apis.find(a => a.key === key);
        if (existing) {
          existing.callCount++;
          if (req.duration) existing.durations.push(req.duration);
        }
        continue;
      }

      seen.add(key);

      const isGraphQL = endpointPath.includes('graphql') || endpointPath.includes('gql');
      let apiType = isGraphQL ? 'GraphQL' : 'REST';
      if (endpointPath.includes('/rpc/') || endpointPath.includes('/trpc/')) {
        apiType = 'tRPC / RPC';
      }

      apis.push({
        key,
        host: parsed.hostname,
        path: endpointPath,
        method,
        apiType,
        isFirstParty: req.isFirstParty !== false,
        status: req.status,
        duration: req.duration || 0,
        durations: req.duration ? [req.duration] : [],
        callCount: 1,
        queryParams: UrlUtils.getQueryParams(req.url),
        lastSeen: req.startTime || Date.now()
      });
    }

    return apis;
  }
}
