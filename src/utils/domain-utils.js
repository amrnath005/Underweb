// src/utils/domain-utils.js
// Domain decomposition, Public Suffix extraction (eTLD+1), and First-party vs Third-party determination.

// Common multi-part public suffixes for accurate eTLD+1 calculation without huge downloads
const MULTI_PART_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'me.uk', 'gov.uk', 'ac.uk', 'ltd.uk', 'net.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'asn.au', 'id.au',
  'co.nz', 'net.nz', 'org.nz', 'govt.nz', 'ac.nz',
  'co.jp', 'ne.jp', 'or.jp', 'go.jp', 'ac.jp', 'ad.jp', 'ed.jp',
  'co.in', 'net.in', 'org.in', 'gen.in', 'firm.in', 'ind.in',
  'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br', 'adm.br',
  'com.cn', 'net.cn', 'org.cn', 'gov.cn', 'edu.cn',
  'co.kr', 'ne.kr', 'or.kr', 'go.kr', 're.kr',
  'com.sg', 'net.sg', 'org.sg', 'gov.sg', 'edu.sg',
  'co.za', 'net.za', 'org.za', 'gov.za',
  'com.mx', 'net.mx', 'org.mx', 'gob.mx', 'edu.mx',
  'com.tw', 'net.tw', 'org.tw', 'gov.tw', 'idv.tw',
  'com.tr', 'net.tr', 'org.tr', 'gov.tr', 'edu.tr',
  'com.ar', 'net.ar', 'org.ar', 'gob.ar',
  'github.io', 'gitlab.io', 'pages.dev', 'workers.dev',
  'vercel.app', 'now.sh', 'netlify.app', 'web.app', 'firebaseapp.com',
  'cloudfront.net', 'azurewebsites.net', 'amazonaws.com', 'herokuapp.com'
]);

export class DomainUtils {
  /**
   * Determine if hostname is an IPv4 or IPv6 address.
   * @param {string} hostname
   * @returns {boolean}
   */
  static isIpAddress(hostname) {
    if (!hostname) return false;
    // IPv4 pattern
    if (/^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(hostname)) {
      return true;
    }
    // IPv6 pattern
    if (/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^([0-9a-fA-F]{1,4}:){1,7}:|^:([0-9a-fA-F]{1,4}:){1,7}/.test(hostname)) {
      return true;
    }
    return false;
  }

  /**
   * Extract apex domain (eTLD+1) from a hostname.
   * Example: 'api.cdn.example.co.uk' -> 'example.co.uk'
   * Example: 'sub.shop.myshopify.com' -> 'myshopify.com'
   * Example: '192.168.1.1' -> '192.168.1.1'
   * @param {string} hostname
   * @returns {string}
   */
  static getApexDomain(hostname) {
    if (!hostname) return '';
    const cleanHost = hostname.toLowerCase().trim().replace(/\.$/, '');

    if (this.isIpAddress(cleanHost) || cleanHost === 'localhost') {
      return cleanHost;
    }

    const parts = cleanHost.split('.');
    if (parts.length <= 2) {
      return cleanHost;
    }

    // Check two-part suffix (e.g. co.uk, com.au, pages.dev)
    const lastTwo = parts.slice(-2).join('.');
    if (MULTI_PART_SUFFIXES.has(lastTwo)) {
      if (parts.length >= 3) {
        return parts.slice(-3).join('.');
      }
      return cleanHost;
    }

    // Check three-part suffix (rare edge cases)
    if (parts.length >= 4) {
      const lastThree = parts.slice(-3).join('.');
      if (MULTI_PART_SUFFIXES.has(lastThree)) {
        return parts.slice(-4).join('.');
      }
    }

    // Standard single TLD (.com, .org, .dev, etc.)
    return parts.slice(-2).join('.');
  }

  /**
   * Extract subdomain from hostname.
   * Example: 'cdn.api.example.com' -> 'cdn.api'
   * @param {string} hostname
   * @returns {string}
   */
  static getSubdomain(hostname) {
    if (!hostname) return '';
    const apex = this.getApexDomain(hostname);
    if (!apex || apex === hostname) return '';
    const cleanHost = hostname.toLowerCase().trim();
    if (cleanHost.endsWith('.' + apex)) {
      return cleanHost.slice(0, cleanHost.length - apex.length - 1);
    }
    return '';
  }

  /**
   * Check whether targetHost is first-party relative to primaryHost.
   * Compares apex domains.
   * @param {string} targetHost
   * @param {string} primaryHost
   * @returns {boolean}
   */
  static isFirstParty(targetHost, primaryHost) {
    if (!targetHost || !primaryHost) return false;
    const targetApex = this.getApexDomain(targetHost);
    const primaryApex = this.getApexDomain(primaryHost);
    return targetApex === primaryApex && targetApex !== '';
  }

  /**
   * Categorize domain into broad architectural class based on common naming patterns.
   * @param {string} hostname
   * @returns {'CDN'|'API'|'STATIC'|'AUTH'|'ANALYTICS'|'STANDARD'}
   */
  static inferDomainRole(hostname) {
    if (!hostname) return 'STANDARD';
    const sub = this.getSubdomain(hostname);
    if (/^(cdn|static|assets|media|img|images|res|dist)/.test(sub)) {
      return 'CDN';
    }
    if (/^(api|gql|graphql|rest|ws|socket|service|backend)/.test(sub)) {
      return 'API';
    }
    if (/^(auth|login|sso|oauth|identity|accounts)/.test(sub)) {
      return 'AUTH';
    }
    if (/^(analytics|telemetry|metrics|stats|track|events)/.test(sub)) {
      return 'ANALYTICS';
    }
    return 'STANDARD';
  }
}
