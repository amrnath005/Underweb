// data/technologies/infrastructure.js
// Signatures for cloud platforms, web hosting, and PaaS providers.

export const INFRASTRUCTURE_TECHNOLOGIES = [
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'Cloud & Hosting',
    website: 'https://vercel.com',
    description: 'Frontend cloud platform combining developer experience with edge infrastructure.',
    signatures: {
      headers: {
        'x-vercel-id': /.+/,
        'server': /Vercel/i
      }
    }
  },
  {
    id: 'netlify',
    name: 'Netlify',
    category: 'Cloud & Hosting',
    website: 'https://www.netlify.com',
    description: 'Cloud platform for building, deploying, and scaling modern web applications.',
    signatures: {
      headers: {
        'x-nf-request-id': /.+/,
        'server': /Netlify/i
      }
    }
  },
  {
    id: 'render',
    name: 'Render',
    category: 'Cloud & Hosting',
    website: 'https://render.com',
    description: 'Unified cloud platform to build and run all apps and websites with free SSL and auto deploys.',
    signatures: {
      headers: {
        'x-render-origin-server': /.+/,
        'server': /Render/i
      }
    }
  },
  {
    id: 'railway',
    name: 'Railway',
    category: 'Cloud & Hosting',
    website: 'https://railway.app',
    description: 'Infrastructure platform where teams develop, deploy, and scale code without infrastructure overhead.',
    signatures: {
      headers: {
        'x-railway-request-id': /.+/
      }
    }
  },
  {
    id: 'flyio',
    name: 'Fly.io',
    category: 'Cloud & Hosting',
    website: 'https://fly.io',
    description: 'Global application platform running apps on physical servers around the world.',
    signatures: {
      headers: {
        'fly-request-id': /.+/,
        'server': /^Fly\//i
      }
    }
  },
  {
    id: 'heroku',
    name: 'Heroku',
    category: 'Cloud & Hosting',
    website: 'https://www.heroku.com',
    description: 'Cloud platform as a service (PaaS) supporting several programming languages.',
    signatures: {
      headers: {
        'via': /vegur/i,
        'server': /cowboy/i
      }
    }
  },
  {
    id: 'github-pages',
    name: 'GitHub Pages',
    category: 'Cloud & Hosting',
    website: 'https://pages.github.com',
    description: 'Static site hosting service that takes HTML, CSS, and JavaScript files straight from a repository.',
    signatures: {
      headers: {
        'server': /GitHub\.com/i,
        'x-github-request-id': /.+/
      }
    }
  },
  {
    id: 'gitlab-pages',
    name: 'GitLab Pages',
    category: 'Cloud & Hosting',
    website: 'https://docs.gitlab.com/ee/user/project/pages/',
    description: 'Publish static websites directly from a repository in GitLab.',
    signatures: {
      headers: {
        'x-gitlab-custom-domain': /.+/
      }
    }
  },
  {
    id: 'firebase-hosting',
    name: 'Firebase Hosting',
    category: 'Cloud & Hosting',
    website: 'https://firebase.google.com/products/hosting',
    description: 'Fast and secure hosting for web apps, static and dynamic content, and microservices.',
    signatures: {
      headers: {
        'x-firebase-hosting': /.+/
      },
      scripts: [/__\/firebase\//i]
    }
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'Cloud & Hosting',
    website: 'https://supabase.com',
    description: 'Open source Firebase alternative providing Postgres, Authentication, and Edge Functions.',
    signatures: {
      globals: ['__SUPABASE__'],
      scripts: [/@supabase\/supabase-js/i],
      apis: [/supabase\.co\//i]
    }
  },
  {
    id: 'aws',
    name: 'Amazon Web Services (AWS)',
    category: 'Cloud & Hosting',
    website: 'https://aws.amazon.com',
    description: 'Comprehensive and broadly adopted cloud platform offering over 200 services from data centers globally.',
    signatures: {
      headers: {
        'x-amz-request-id': /.+/,
        'x-amz-id-2': /.+/
      }
    }
  },
  {
    id: 'google-cloud',
    name: 'Google Cloud Platform (GCP)',
    category: 'Cloud & Hosting',
    website: 'https://cloud.google.com',
    description: 'Suite of cloud computing services that runs on the same infrastructure Google uses internally.',
    signatures: {
      headers: {
        'x-goog-generation': /.+/,
        'server': /^Google Frontend$/i
      }
    }
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    category: 'Cloud & Hosting',
    website: 'https://azure.microsoft.com',
    description: 'Cloud computing platform and infrastructure created by Microsoft.',
    signatures: {
      headers: {
        'x-ms-request-id': /.+/,
        'x-powered-by': /ASP\.NET/i
      }
    }
  }
];
