// data/technologies/authentication.js
// Signatures for identity and authentication providers. (Never exposes credentials/tokens).

export const AUTHENTICATION_TECHNOLOGIES = [
  {
    id: 'auth0',
    name: 'Auth0',
    category: 'Authentication',
    website: 'https://auth0.com',
    description: 'Adaptable authentication and authorization platform.',
    signatures: {
      globals: ['auth0'],
      scripts: [/cdn\.auth0\.com\/js\/auth0/i],
      apis: [/auth0\.com\/oauth\/token/i, /auth0\.com\/userinfo/i]
    }
  },
  {
    id: 'clerk',
    name: 'Clerk',
    category: 'Authentication',
    website: 'https://clerk.com',
    description: 'Complete user management and authentication suite for React, Next.js, and modern web.',
    signatures: {
      globals: ['Clerk'],
      dom: ['[data-clerk-telemetry]', '.cl-rootBox', '.cl-card'],
      scripts: [/clerk(?:\.[a-z0-9]+)?\.js/i, /clerk\.browser/i],
      apis: [/clerk\.[a-z0-9.]+\/v1\/client/i]
    }
  },
  {
    id: 'firebase-auth',
    name: 'Firebase Auth',
    category: 'Authentication',
    website: 'https://firebase.google.com/products/auth',
    description: 'End-to-end identity solution supporting passwords, federated identity providers, and phone numbers.',
    signatures: {
      scripts: [/firebase(?:-auth)?(?:\.min)?\.js/i],
      apis: [/identitytoolkit\.googleapis\.com/i, /securetoken\.googleapis\.com/i]
    }
  },
  {
    id: 'supabase-auth',
    name: 'Supabase Auth',
    category: 'Authentication',
    website: 'https://supabase.com/docs/guides/auth',
    description: 'Open source authentication platform with built-in user management and Row Level Security.',
    signatures: {
      storage: [/^sb-[a-zA-Z0-9_-]+-auth-token$/i],
      apis: [/supabase\.co\/auth\/v1/i]
    }
  },
  {
    id: 'nextauth',
    name: 'NextAuth.js (Auth.js)',
    category: 'Authentication',
    website: 'https://authjs.dev',
    description: 'Complete open-source authentication solution for Next.js and web applications.',
    signatures: {
      cookies: [/^__Secure-next-auth\.session-token$/i, /^next-auth\.session-token$/i, /^__Host-next-auth\.csrf-token$/i],
      apis: [/\/api\/auth\/session/i, /\/api\/auth\/csrf/i, /\/api\/auth\/providers/i]
    }
  },
  {
    id: 'okta',
    name: 'Okta',
    category: 'Authentication',
    website: 'https://www.okta.com',
    description: 'Enterprise identity management and single sign-on service.',
    signatures: {
      globals: ['OktaAuth', 'oktaSignIn'],
      scripts: [/global\.oktacdn\.com/i]
    }
  },
  {
    id: 'cognito',
    name: 'Amazon Cognito',
    category: 'Authentication',
    website: 'https://aws.amazon.com/cognito/',
    description: 'Customer identity and access management for web and mobile apps.',
    signatures: {
      apis: [/cognito-idp\.[a-z0-9-]+\.amazonaws\.com/i]
    }
  }
];
