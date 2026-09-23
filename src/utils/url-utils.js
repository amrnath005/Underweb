// src/utils/url-utils.js
// URL normalization, decomposition, query parsing, and security validation.

export class UrlUtils {
  /**
   * Safely parse a URL string, returning null if invalid.
   * @param {string} urlString
   * @returns {URL|null}
   */
  static safeParse(urlString) {
    if (!urlString || typeof urlString !== 'string') return null;
    try {
      return new URL(urlString.trim());
    } catch {
      return null;
    }
  }

  /**
   * Extract hostname without port, converted to lowercase.
   * @param {string} urlString
   * @returns {string}
   */
  static getHostname(urlString) {
    const parsed = this.safeParse(urlString);
    return parsed ? parsed.hostname.toLowerCase() : '';
  }

  /**
   * Extract path segments as an array.
   * @param {string} urlString
   * @returns {string[]}
   */
  static getPathSegments(urlString) {
    const parsed = this.safeParse(urlString);
    if (!parsed) return [];
    return parsed.pathname.split('/').filter(Boolean);
  }

  /**
   * Get query parameters as a clean key-value object.
   * @param {string} urlString
   * @returns {Record<string, string>}
   */
  static getQueryParams(urlString) {
    const parsed = this.safeParse(urlString);
    if (!parsed) return {};
    const params = {};
    for (const [key, value] of parsed.searchParams.entries()) {
      params[key] = value;
    }
    return params;
  }

  /**
   * Check if a URL has an HTTPS or WSS secure scheme.
   * @param {string} urlString
   * @returns {boolean}
   */
  static isSecure(urlString) {
    const parsed = this.safeParse(urlString);
    if (!parsed) return false;
    return parsed.protocol === 'https:' || parsed.protocol === 'wss:';
  }

  /**
   * Check if a URL represents a data, blob, or internal browser URI.
   * @param {string} urlString
   * @returns {boolean}
   */
  static isInternalOrSpecial(urlString) {
    if (!urlString) return true;
    const lower = urlString.trim().toLowerCase();
    return (
      lower.startsWith('chrome:') ||
      lower.startsWith('chrome-extension:') ||
      lower.startsWith('data:') ||
      lower.startsWith('blob:') ||
      lower.startsWith('about:') ||
      lower.startsWith('javascript:')
    );
  }

  /**
   * Sanitize a URL for display by trimming and truncating query params if too long.
   * @param {string} urlString
   * @param {number} maxLen
   * @returns {string}
   */
  static truncate(urlString, maxLen = 80) {
    if (!urlString) return '';
    if (urlString.length <= maxLen) return urlString;
    const parsed = this.safeParse(urlString);
    if (parsed) {
      const base = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
      if (base.length >= maxLen) {
        return base.slice(0, maxLen - 3) + '...';
      }
      return (base + parsed.search).slice(0, maxLen - 3) + '...';
    }
    return urlString.slice(0, maxLen - 3) + '...';
  }

  /**
   * Extract file extension from URL pathname.
   * @param {string} urlString
   * @returns {string}
   */
  static getExtension(urlString) {
    const parsed = this.safeParse(urlString);
    if (!parsed) return '';
    const lastSegment = parsed.pathname.split('/').pop() || '';
    const dotIdx = lastSegment.lastIndexOf('.');
    if (dotIdx === -1) return '';
    return lastSegment.slice(dotIdx + 1).toLowerCase().split('?')[0];
  }
}
