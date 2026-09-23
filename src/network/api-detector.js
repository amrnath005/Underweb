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
   * Catalog an array of requests and runtime-intercepted calls into organized API endpoint records.
   * @param {Array<object>} requests
   * @param {Array<object>} [runtimeApis]
   * @returns {Array<object>} Cataloged API endpoints
   */
  static catalogApis(requests = [], runtimeApis = []) {
    const apis = [];
    const seen = new Set();

    // 1. Process network requests from chrome.webRequest
    for (const req of (requests || [])) {
      if (!this.isApiRequest(req)) continue;

      const parsed = UrlUtils.safeParse(req.url);
      if (!parsed) continue;

      const method = (req.method || 'GET').toUpperCase();
      const endpointPath = parsed.pathname;
      const key = `${method} ${parsed.hostname}${endpointPath}`;

      if (seen.has(key)) {
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

    // 2. Process runtime intercepted APIs (from fetch/XHR hook in page-analyzer)
    for (const rApi of (runtimeApis || [])) {
      if (!rApi || !rApi.url) continue;

      const parsed = UrlUtils.safeParse(rApi.url);
      if (!parsed) continue;

      const method = (rApi.method || 'GET').toUpperCase();
      const endpointPath = parsed.pathname;
      const key = `${method} ${parsed.hostname}${endpointPath}`;

      if (seen.has(key)) {
        const existing = apis.find(a => a.key === key);
        if (existing) {
          existing.callCount++;
          if (rApi.duration) existing.durations.push(rApi.duration);
          if (rApi.operationName && !existing.operationName) existing.operationName = rApi.operationName;
        }
        continue;
      }

      seen.add(key);
      const isGraphQL = rApi.isGraphQL || endpointPath.includes('graphql') || endpointPath.includes('gql');
      let apiType = isGraphQL ? 'GraphQL' : 'REST';

      apis.push({
        key,
        host: parsed.hostname,
        path: endpointPath,
        method,
        apiType,
        operationName: rApi.operationName || null,
        isFirstParty: true,
        status: rApi.status || 200,
        duration: rApi.duration || 0,
        durations: rApi.duration ? [rApi.duration] : [],
        callCount: 1,
        queryParams: UrlUtils.getQueryParams(rApi.url),
        lastSeen: rApi.timestamp || Date.now()
      });
    }

    return apis;
  }
}
