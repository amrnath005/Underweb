// src/network/request-analyzer.js
// Parses, enriches, and validates individual network request transactions.

import { UrlUtils } from '../utils/url-utils.js';
import { DomainUtils } from '../utils/domain-utils.js';
import { ResourceClassifier } from './resource-classifier.js';

export class RequestAnalyzer {
  /**
   * Enrich raw chrome.webRequest details with domain, apex, first-party flag, and resource classification.
   * @param {object} rawRequest
   * @param {string} pageOriginHost
   * @returns {object}
   */
  static analyze(rawRequest, pageOriginHost) {
    const url = rawRequest.url || '';
    const parsed = UrlUtils.safeParse(url);
    const host = parsed ? parsed.hostname.toLowerCase() : '';
    const apex = DomainUtils.getApexDomain(host);
    const isFirstParty = DomainUtils.isFirstParty(host, pageOriginHost);
    const category = ResourceClassifier.classify(rawRequest);

    return {
      id: rawRequest.requestId || `${url}_${Date.now()}`,
      url,
      host,
      apex,
      pathname: parsed ? parsed.pathname : '',
      method: (rawRequest.method || 'GET').toUpperCase(),
      type: rawRequest.type || 'other',
      initiator: rawRequest.initiator || '',
      startTime: rawRequest.timeStamp || Date.now(),
      status: rawRequest.status || null,
      statusText: rawRequest.statusText || '',
      duration: rawRequest.duration || 0,
      size: rawRequest.size || 0,
      ip: rawRequest.ip || '',
      protocol: rawRequest.protocol || '',
      isFirstParty,
      category,
      domainRole: DomainUtils.inferDomainRole(host),
      requestHeaders: rawRequest.requestHeaders || {},
      responseHeaders: rawRequest.responseHeaders || {}
    };
  }
}
