// data/technologies/storage.js
// Signatures for client-side storage mechanisms in actual use.

export const STORAGE_TECHNOLOGIES = [
  {
    id: 'localstorage',
    name: 'localStorage',
    category: 'Storage',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage',
    description: 'Persistent client key-value storage with no expiration date across browser restarts.',
    signatures: {
      storageTypes: ['localStorage']
    }
  },
  {
    id: 'sessionstorage',
    name: 'sessionStorage',
    category: 'Storage',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage',
    description: 'Tab-scoped key-value storage persisting data for the duration of page session.',
    signatures: {
      storageTypes: ['sessionStorage']
    }
  },
  {
    id: 'indexeddb',
    name: 'IndexedDB',
    category: 'Storage',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API',
    description: 'Low-level API for client-side storage of significant amounts of structured data including files/blobs.',
    signatures: {
      storageTypes: ['indexedDB']
    }
  },
  {
    id: 'cookies-storage',
    name: 'HTTP Cookies',
    category: 'Storage',
    website: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies',
    description: 'Small blocks of data created by web server while user is browsing website and placed on device.',
    signatures: {
      storageTypes: ['cookies']
    }
  },
  {
    id: 'cache-storage',
    name: 'Cache Storage API',
    category: 'Storage',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage',
    description: 'Storage mechanism for Request / Response object pairs that are cached, typically used by Service Workers.',
    signatures: {
      storageTypes: ['cacheStorage']
    }
  }
];
