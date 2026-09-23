// src/infrastructure/http-analyzer.js
// Analyzes HTTP protocol versions, TLS, and compression methods.

export class HttpAnalyzer {
  /**
   * Determine protocol details.
   * @param {string} rawProtocol - e.g. 'h2', 'h3', 'http/1.1'
   * @param {boolean} isHttps
   * @param {string} contentEncoding - e.g. 'br', 'gzip', 'zstd'
   * @returns {object}
   */
  static analyze(rawProtocol, isHttps, contentEncoding) {
    const proto = (rawProtocol || '').toLowerCase();
    let name = 'HTTP/1.1';
    let isMux = false;
    let transport = 'TCP';

    if (proto === 'h3' || proto.includes('http/3') || proto.includes('quic')) {
      name = 'HTTP/3 (QUIC)';
      isMux = true;
      transport = 'UDP (QUIC)';
    } else if (proto === 'h2' || proto.includes('http/2')) {
      name = 'HTTP/2';
      isMux = true;
      transport = 'TCP';
    } else if (proto.includes('http/1.0')) {
      name = 'HTTP/1.0';
    }

    let compression = 'None (Plaintext)';
    if (contentEncoding) {
      const enc = contentEncoding.toLowerCase();
      if (enc.includes('br')) compression = 'Brotli (br)';
      else if (enc.includes('gzip')) compression = 'Gzip';
      else if (enc.includes('zstd')) compression = 'Zstandard (zstd)';
      else if (enc.includes('deflate')) compression = 'Deflate';
    }

    return {
      version: name,
      isMultiplexed: isMux,
      transport,
      tls: isHttps ? 'TLS Encrypted' : 'Insecure (Plaintext HTTP)',
      compression
    };
  }
}
