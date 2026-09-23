// src/infrastructure/ip-analyzer.js
// IP address classification (IPv4, IPv6, Public, Private, CIDR matcher).

export class IpAnalyzer {
  /**
   * Determine IP version: 4, 6, or 0 (not an IP).
   * @param {string} ip
   * @returns {4|6|0}
   */
  static getVersion(ip) {
    if (!ip || typeof ip !== 'string') return 0;
    const clean = ip.trim();
    if (/^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(clean)) {
      return 4;
    }
    if (/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^([0-9a-fA-F]{1,4}:){1,7}:|^:([0-9a-fA-F]{1,4}:){1,7}/.test(clean)) {
      return 6;
    }
    return 0;
  }

  /**
   * Check if IP address is a private, loopback, or local address.
   * @param {string} ip
   * @returns {boolean}
   */
  static isPrivate(ip) {
    const v = this.getVersion(ip);
    if (v === 4) {
      const parts = ip.split('.').map(Number);
      if (parts[0] === 10) return true; // 10.0.0.0/8
      if (parts[0] === 127) return true; // 127.0.0.0/8 loopback
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
      if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
      if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16 link-local
      return false;
    }
    if (v === 6) {
      if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Convert IPv4 string to 32-bit unsigned integer.
   * @param {string} ip
   * @returns {number}
   */
  static ipv4ToInt(ip) {
    return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
  }

  /**
   * Test if IPv4 matches CIDR notation (e.g. '104.16.0.0/12').
   * @param {string} ip
   * @param {string} cidr
   * @returns {boolean}
   */
  static matchesIpv4Cidr(ip, cidr) {
    if (this.getVersion(ip) !== 4) return false;
    const [range, bitsStr] = cidr.split('/');
    const bits = parseInt(bitsStr, 10);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    const ipInt = this.ipv4ToInt(ip);
    const rangeInt = this.ipv4ToInt(range);
    return (ipInt & mask) === (rangeInt & mask);
  }
}
