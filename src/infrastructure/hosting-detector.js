// src/infrastructure/hosting-detector.js
// Identifies cloud hosting origins, web servers, and reverse proxy layers.

import { Parsers } from '../utils/parsers.js';

export class HostingDetector {
  /**
   * Infer origin cloud host and web server from HTTP headers.
   * @param {Record<string, string>|Array<{name: string, value: string}>} rawHeaders
   * @returns {{ hostingProvider: string|null, webServer: string|null, isOriginMasked: boolean, evidence: string[] }}
   */
  static detect(rawHeaders) {
    const headers = Parsers.normalizeHeaders(rawHeaders);
    const evidence = [];
    let hostingProvider = null;
    let webServer = null;

    const server = headers.get('server');
    if (server) {
      evidence.push(`Server: ${server}`);
      if (/nginx/i.test(server)) webServer = 'Nginx';
      else if (/apache/i.test(server)) webServer = 'Apache HTTP Server';
      else if (/caddy/i.test(server)) webServer = 'Caddy Server';
      else if (/cloudflare/i.test(server)) webServer = 'Cloudflare Reverse Proxy';
      else if (/amazons3/i.test(server)) {
        webServer = 'Amazon S3';
        hostingProvider = 'AWS S3 Static Hosting';
      } else if (/gunicorn|uvicorn|werkzeug/i.test(server)) {
        webServer = server;
        hostingProvider = 'Python WSGI/ASGI Server';
      } else {
        webServer = server;
      }
    }

    // Cloud hosting origin signals
    if (headers.has('fly-request-id')) {
      hostingProvider = 'Fly.io';
      evidence.push('Fly-Request-Id header detected');
    } else if (headers.has('x-render-origin-server')) {
      hostingProvider = 'Render';
      evidence.push('Render Origin header detected');
    } else if (headers.get('via') && headers.get('via').includes('vegur')) {
      hostingProvider = 'Heroku';
      evidence.push('Vegur proxy header detected (Heroku)');
    } else if (headers.has('x-goog-generation') || (server && server.includes('Google Frontend'))) {
      hostingProvider = 'Google Cloud Platform (GCP)';
      evidence.push('GCP Frontend header detected');
    } else if (headers.has('x-ms-request-id')) {
      hostingProvider = 'Microsoft Azure';
      evidence.push('Azure Request-ID header detected');
    } else if (headers.has('x-amz-request-id')) {
      hostingProvider = 'Amazon Web Services (AWS)';
      evidence.push('AWS Request-ID header detected');
    }

    // Origin masking status
    const isOriginMasked = headers.has('cf-ray') || headers.has('x-amz-cf-id') || headers.has('x-fastly-request-id');

    return {
      hostingProvider,
      webServer,
      isOriginMasked,
      evidence
    };
  }
}
