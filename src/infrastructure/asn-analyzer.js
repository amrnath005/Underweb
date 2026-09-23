// src/infrastructure/asn-analyzer.js
// Maps IP addresses to Autonomous System Numbers (ASN) and network owners locally.

import { IpAnalyzer } from './ip-analyzer.js';

// Offline lookup table for major cloud, CDN, and hosting networks
const ASN_REGISTRY = [
  {
    asn: 'AS13335',
    org: 'Cloudflare, Inc.',
    type: 'CDN / Edge Network',
    ranges: ['104.16.0.0/12', '172.64.0.0/13', '162.158.0.0/15', '198.41.128.0/17', '1.1.1.0/24']
  },
  {
    asn: 'AS16509',
    org: 'Amazon.com, Inc. (AWS)',
    type: 'Cloud / Hosting',
    ranges: ['52.0.0.0/11', '54.0.0.0/12', '18.0.0.0/11', '3.0.0.0/9', '13.32.0.0/15', '99.84.0.0/16']
  },
  {
    asn: 'AS15169',
    org: 'Google LLC',
    type: 'Cloud / Search / CDN',
    ranges: ['142.250.0.0/15', '172.217.0.0/16', '216.58.192.0/19', '34.64.0.0/11', '35.184.0.0/13', '8.8.8.0/24']
  },
  {
    asn: 'AS8075',
    org: 'Microsoft Corporation (Azure)',
    type: 'Cloud / Hosting',
    ranges: ['20.0.0.0/11', '40.74.0.0/15', '13.64.0.0/11', '51.140.0.0/14', '104.40.0.0/13']
  },
  {
    asn: 'AS54113',
    org: 'Fastly, Inc.',
    type: 'CDN / Edge Cloud',
    ranges: ['151.101.0.0/16', '199.232.0.0/16', '146.75.0.0/16']
  },
  {
    asn: 'AS20940',
    org: 'Akamai Technologies',
    type: 'CDN / Edge Network',
    ranges: ['23.32.0.0/11', '104.64.0.0/10', '184.24.0.0/13', '96.6.0.0/15']
  },
  {
    asn: 'AS14061',
    org: 'DigitalOcean, LLC',
    type: 'Cloud VPS',
    ranges: ['138.68.0.0/16', '159.203.0.0/16', '165.227.0.0/16', '134.209.0.0/16', '67.205.0.0/16']
  },
  {
    asn: 'AS62240',
    org: 'Vercel, Inc.',
    type: 'Frontend Cloud',
    ranges: ['76.76.21.0/24', '76.223.126.0/24']
  },
  {
    asn: 'AS31898',
    org: 'Oracle Corporation (OCI)',
    type: 'Cloud VPS',
    ranges: ['129.213.0.0/16', '132.145.0.0/16', '140.238.0.0/16', '150.136.0.0/16']
  },
  {
    asn: 'AS24940',
    org: 'Hetzner Online GmbH',
    type: 'Dedicated / Cloud Hosting',
    ranges: ['78.46.0.0/15', '88.198.0.0/16', '136.243.0.0/16', '144.76.0.0/16', '148.251.0.0/16', '168.119.0.0/16']
  },
  {
    asn: 'AS16276',
    org: 'OVH SAS',
    type: 'Cloud / Dedicated Hosting',
    ranges: ['51.254.0.0/15', '54.36.0.0/15', '141.94.0.0/16', '198.27.64.0/18']
  },
  {
    asn: 'AS63949',
    org: 'Linode / Akamai Cloud',
    type: 'Cloud VPS',
    ranges: ['45.33.0.0/16', '45.56.0.0/16', '172.104.0.0/15', '173.255.192.0/18']
  },
  {
    asn: 'AS45102',
    org: 'Alibaba Cloud (Aliyun)',
    type: 'Cloud / Hosting',
    ranges: ['47.74.0.0/15', '47.88.0.0/14', '47.240.0.0/13']
  },
  {
    asn: 'AS36459',
    org: 'GitHub, Inc.',
    type: 'Version Control / Cloud',
    ranges: ['140.82.112.0/20', '185.199.108.0/22']
  }
];

export class AsnAnalyzer {
  /**
   * Resolve an IP to its ASN and organization.
   * @param {string} ip
   * @returns {{ asn: string, org: string, type: string, isPrivate: boolean }}
   */
  static lookup(ip) {
    if (!ip) {
      return { asn: 'UNKNOWN', org: 'Unknown Network', type: 'Unknown', isPrivate: false };
    }

    if (IpAnalyzer.isPrivate(ip)) {
      return { asn: 'PRIVATE', org: 'Private / Localhost Network', type: 'Local', isPrivate: true };
    }

    for (const entry of ASN_REGISTRY) {
      for (const cidr of entry.ranges) {
        if (IpAnalyzer.matchesIpv4Cidr(ip, cidr)) {
          return {
            asn: entry.asn,
            org: entry.org,
            type: entry.type,
            isPrivate: false
          };
        }
      }
    }

    return {
      asn: 'AS-EXTERNAL',
      org: 'External Routed Network',
      type: 'ISP / Hosting',
      isPrivate: false
    };
  }

  /**
   * Optional, non-blocking DNS-over-HTTPS (DoH) resolution for public hostnames.
   * Completely optional; returns null if offline or on network failure without blocking.
   * @param {string} domain
   * @returns {Promise<Array<{name: string, type: string, data: string, ttl: number}>|null>}
   */
  static async resolveDoh(domain) {
    if (!domain || typeof fetch === 'undefined') return null;
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 2000) : null;
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
        headers: { 'accept': 'application/dns-json' },
        signal: controller ? controller.signal : undefined
      });
      if (timer) clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        return (data.Answer || []).map(ans => ({
          name: ans.name,
          type: ans.type === 1 ? 'A' : ans.type === 28 ? 'AAAA' : ans.type === 5 ? 'CNAME' : `${ans.type}`,
          data: ans.data,
          ttl: ans.TTL
        }));
      }
    } catch {}
    return null;
  }
}
