// src/utils/parsers.js
// Header parsers, CSP directive tree tokenizer, HSTS parser, CORS analyzer helpers.

export class Parsers {
  /**
   * Convert Chrome webRequest header array [{ name, value }] or raw string to a lowercased Map.
   * @param {Array<{name: string, value?: string}>|Record<string, string>|string} headers
   * @returns {Map<string, string>}
   */
  static normalizeHeaders(headers) {
    const map = new Map();
    if (!headers) return map;

    if (Array.isArray(headers)) {
      for (const h of headers) {
        if (h && h.name) {
          const key = h.name.toLowerCase().trim();
          const val = (h.value || '').trim();
          if (map.has(key)) {
            map.set(key, `${map.get(key)}, ${val}`);
          } else {
            map.set(key, val);
          }
        }
      }
    } else if (typeof headers === 'object') {
      for (const [key, val] of Object.entries(headers)) {
        if (key && typeof val === 'string') {
          map.set(key.toLowerCase().trim(), val.trim());
        }
      }
    } else if (typeof headers === 'string') {
      const lines = headers.split(/\r?\n/);
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).toLowerCase().trim();
          const val = line.slice(colonIdx + 1).trim();
          map.set(key, val);
        }
      }
    }
    return map;
  }

  /**
   * Parse Content-Security-Policy (CSP) string into directive tokens.
   * Example: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.com"
   * @param {string} cspString
   * @returns {Map<string, string[]>}
   */
  static parseCsp(cspString) {
    const directives = new Map();
    if (!cspString || typeof cspString !== 'string') return directives;

    const parts = cspString.split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const tokens = trimmed.split(/\s+/);
      const directiveName = tokens[0].toLowerCase();
      const sources = tokens.slice(1);
      directives.set(directiveName, sources);
    }
    return directives;
  }

  /**
   * Parse Strict-Transport-Security (HSTS) header string.
   * Example: "max-age=31536000; includeSubDomains; preload"
   * @param {string} hstsString
   * @returns {{ maxAge: number, includeSubDomains: boolean, preload: boolean, raw: string }}
   */
  static parseHsts(hstsString) {
    const result = {
      maxAge: 0,
      includeSubDomains: false,
      preload: false,
      raw: hstsString || ''
    };
    if (!hstsString) return result;

    const directives = hstsString.split(';').map(d => d.trim().toLowerCase());
    for (const d of directives) {
      if (d.startsWith('max-age=')) {
        const seconds = parseInt(d.slice(8), 10);
        if (!isNaN(seconds)) result.maxAge = seconds;
      } else if (d === 'includesubdomains') {
        result.includeSubDomains = true;
      } else if (d === 'preload') {
        result.preload = true;
      }
    }
    return result;
  }

  /**
   * Parse Set-Cookie string attributes.
   * @param {string} setCookieString
   * @returns {{ name: string, value: string, httpOnly: boolean, secure: boolean, sameSite: string, path: string, domain: string, maxAge?: number }}
   */
  static parseSetCookie(setCookieString) {
    if (!setCookieString) return null;
    const parts = setCookieString.split(';').map(p => p.trim());
    const [nameVal] = parts;
    const eqIdx = nameVal.indexOf('=');
    const name = eqIdx > 0 ? nameVal.slice(0, eqIdx).trim() : nameVal;
    const value = eqIdx > 0 ? nameVal.slice(eqIdx + 1).trim() : '';

    const cookie = {
      name,
      value,
      httpOnly: false,
      secure: false,
      sameSite: 'None',
      path: '/',
      domain: ''
    };

    for (let i = 1; i < parts.length; i++) {
      const p = parts[i].toLowerCase();
      if (p === 'httponly') cookie.httpOnly = true;
      else if (p === 'secure') cookie.secure = true;
      else if (p.startsWith('samesite=')) cookie.sameSite = parts[i].slice(9).trim();
      else if (p.startsWith('path=')) cookie.path = parts[i].slice(5).trim();
      else if (p.startsWith('domain=')) cookie.domain = parts[i].slice(7).trim();
      else if (p.startsWith('max-age=')) cookie.maxAge = parseInt(parts[i].slice(8), 10);
    }
    return cookie;
  }
}
