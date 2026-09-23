// src/infrastructure/cdn-detector.js
// Identifies Content Delivery Networks (CDN) and edge cache signatures.

import { Parsers } from '../utils/parsers.js';

export class CdnDetector {
  /**
   * Detect CDN provider and cache attributes from response headers.
   * @param {Record<string, string>|Array<{name: string, value: string}>} rawHeaders
   * @returns {{ detected: boolean, provider: string|null, pop: string|null, cacheStatus: string|null, evidence: string[] }}
   */
  static detect(rawHeaders) {
    const headers = Parsers.normalizeHeaders(rawHeaders);
    const evidence = [];
    let provider = null;
    let pop = null;
    let cacheStatus = null;

    // Cloudflare
    if (headers.has('cf-ray') || (headers.get('server') && headers.get('server').toLowerCase().includes('cloudflare'))) {
      provider = 'Cloudflare';
      const ray = headers.get('cf-ray');
      if (ray) {
        evidence.push(`CF-Ray: ${ray}`);
        const parts = ray.split('-');
        if (parts.length > 1) pop = parts[1]; // e.g. IAD, LHR, FRA
      }
      cacheStatus = headers.get('cf-cache-status');
      if (cacheStatus) evidence.push(`CF-Cache-Status: ${cacheStatus}`);
    }
    // AWS CloudFront
    else if (headers.has('x-amz-cf-id') || (headers.get('via') && headers.get('via').includes('CloudFront'))) {
      provider = 'AWS CloudFront';
      if (headers.has('x-amz-cf-id')) evidence.push(`X-Amz-Cf-Id present`);
      pop = headers.get('x-amz-cf-pop') || null;
      if (pop) evidence.push(`CloudFront POP: ${pop}`);
      cacheStatus = headers.get('x-cache');
      if (cacheStatus) evidence.push(`X-Cache: ${cacheStatus}`);
    }
    // Fastly
    else if (headers.has('x-fastly-request-id') || headers.has('fastly-restarts')) {
      provider = 'Fastly';
      evidence.push('X-Fastly-Request-Id present');
      pop = headers.get('x-served-by') || null;
      cacheStatus = headers.get('x-cache');
    }
    // Akamai
    else if (headers.has('x-akamai-transformed') || (headers.get('server') && headers.get('server').includes('AkamaiGHost'))) {
      provider = 'Akamai';
      evidence.push('Akamai Ghost headers present');
      cacheStatus = headers.get('x-cache');
    }
    // Vercel Edge Network
    else if (headers.has('x-vercel-id')) {
      provider = 'Vercel Edge Network';
      const vId = headers.get('x-vercel-id');
      evidence.push(`X-Vercel-Id: ${vId}`);
      if (vId) pop = vId.split('::')[0];
      cacheStatus = headers.get('x-vercel-cache');
    }
    // Netlify Edge
    else if (headers.has('x-nf-request-id')) {
      provider = 'Netlify Edge';
      evidence.push('X-Nf-Request-Id present');
    }

    return {
      detected: provider !== null,
      provider,
      pop,
      cacheStatus,
      evidence
    };
  }
}
