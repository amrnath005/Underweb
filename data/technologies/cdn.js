// data/technologies/cdn.js
// Signatures for Content Delivery Networks (CDNs) and edge reverse proxies.

export const CDN_TECHNOLOGIES = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'CDN / Edge',
    website: 'https://www.cloudflare.com',
    description: 'Global cloud platform delivering network security, CDN, and edge compute services.',
    signatures: {
      headers: {
        'cf-ray': /.+/,
        'server': /cloudflare/i,
        'cf-cache-status': /.+/i
      },
      cookies: [/^__cf_bm$/i, /^cf_clearance$/i]
    }
  },
  {
    id: 'cloudfront',
    name: 'AWS CloudFront',
    category: 'CDN / Edge',
    website: 'https://aws.amazon.com/cloudfront/',
    description: 'Fast, highly secure content delivery network (CDN) service by Amazon Web Services.',
    signatures: {
      headers: {
        'x-amz-cf-id': /.+/,
        'x-amz-cf-pop': /.+/,
        'via': /CloudFront/i
      }
    }
  },
  {
    id: 'fastly',
    name: 'Fastly',
    category: 'CDN / Edge',
    website: 'https://www.fastly.com',
    description: 'Edge cloud platform and programmable CDN providing real-time digital experiences.',
    signatures: {
      headers: {
        'x-fastly-request-id': /.+/,
        'fastly-restarts': /.+/,
        'x-served-by': /cache-[a-z0-9]+/i
      }
    }
  },
  {
    id: 'akamai',
    name: 'Akamai',
    category: 'CDN / Edge',
    website: 'https://www.akamai.com',
    description: 'Global content delivery network, cybersecurity, and cloud service provider.',
    signatures: {
      headers: {
        'x-akamai-transformed': /.+/,
        'server': /AkamaiGHost|AkamaiNetStorage/i
      }
    }
  },
  {
    id: 'bunny',
    name: 'Bunny CDN',
    category: 'CDN / Edge',
    website: 'https://bunny.net',
    description: 'Next-generation content delivery network and edge storage platform.',
    signatures: {
      headers: {
        'server': /BunnyCDN/i,
        'cdn-pullzone': /.+/
      }
    }
  },
  {
    id: 'keycdn',
    name: 'KeyCDN',
    category: 'CDN / Edge',
    website: 'https://www.keycdn.com',
    description: 'High performance content delivery network built for speed and simplicity.',
    signatures: {
      headers: {
        'server': /keycdn-engine/i,
        'x-edge-location': /.+/
      }
    }
  },
  {
    id: 'vercel-edge',
    name: 'Vercel Edge Network',
    category: 'CDN / Edge',
    website: 'https://vercel.com/docs/concepts/edge-network/overview',
    description: 'Global network designed to serve content and compute near users.',
    signatures: {
      headers: {
        'x-vercel-id': /.+/,
        'x-vercel-cache': /.+/,
        'server': /^Vercel$/i
      }
    }
  },
  {
    id: 'netlify-edge',
    name: 'Netlify Edge',
    category: 'CDN / Edge',
    website: 'https://www.netlify.com/products/edge/',
    description: 'Application delivery network with edge functions and multi-cloud redundancy.',
    signatures: {
      headers: {
        'x-nf-request-id': /.+/,
        'server': /^Netlify$/i
      }
    }
  }
];
