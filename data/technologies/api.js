// data/technologies/api.js
// Signatures for API architectural patterns and communication protocols.

export const API_TECHNOLOGIES = [
  {
    id: 'graphql',
    name: 'GraphQL',
    category: 'API Technology',
    website: 'https://graphql.org',
    description: 'Query language for APIs giving clients power to ask for exactly what they need.',
    signatures: {
      apis: [/\/graphql(?:\?|$)/i, /\/gql(?:\?|$)/i],
      headers: {
        'content-type': /application\/graphql\+json|application\/json.*graphql/i
      }
    }
  },
  {
    id: 'rest',
    name: 'REST API',
    category: 'API Technology',
    website: 'https://restfulapi.net',
    description: 'Representational State Transfer architectural style for networked hypermedia applications.',
    signatures: {
      apis: [/\/api\/v[0-9]+\//i, /\/api\//i, /\/rest\//i]
    }
  },
  {
    id: 'websocket',
    name: 'WebSocket',
    category: 'API Technology',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSocket',
    description: 'Full-duplex bidirectional communication protocol over a single TCP connection.',
    signatures: {
      apis: [/^wss?:\/\//i]
    }
  },
  {
    id: 'trpc',
    name: 'tRPC',
    category: 'API Technology',
    website: 'https://trpc.io',
    description: 'End-to-end typesafe APIs made easy without schemas or code generation.',
    signatures: {
      apis: [/\/api\/trpc\//i, /\/trpc\//i]
    }
  },
  {
    id: 'grpc-web',
    name: 'gRPC-Web',
    category: 'API Technology',
    website: 'https://grpc.io/docs/platforms/web/',
    description: 'JavaScript client library for browser clients to directly communicate with gRPC services.',
    signatures: {
      headers: {
        'content-type': /application\/grpc-web/i
      }
    }
  },
  {
    id: 'sse',
    name: 'Server-Sent Events (SSE)',
    category: 'API Technology',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events',
    description: 'Unidirectional server-push event technology over standard HTTP.',
    signatures: {
      headers: {
        'content-type': /text\/event-stream/i
      }
    }
  },
  {
    id: 'jsonrpc',
    name: 'JSON-RPC',
    category: 'API Technology',
    website: 'https://www.jsonrpc.org',
    description: 'Remote procedure call protocol encoded in JSON.',
    signatures: {
      apis: [/\/rpc(?:\?|$)/i, /\/jsonrpc(?:\?|$)/i]
    }
  }
];
