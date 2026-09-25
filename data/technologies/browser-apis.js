// data/technologies/browser-apis.js
// Signatures for Browser Hardware, Graphics, and System APIs actually invoked by the website.

export const BROWSER_API_TECHNOLOGIES = [
  {
    id: 'webgl',
    name: 'WebGL (Hardware Accelerated 3D)',
    category: 'Browser API',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API',
    description: 'JavaScript API for rendering high-performance interactive 3D and 2D graphics.',
    signatures: {
      browserApis: ['webgl', 'webgl2'],
      dom: ['canvas[width]']
    }
  },
  {
    id: 'webgpu',
    name: 'WebGPU (Modern Compute & Graphics)',
    category: 'Browser API',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API',
    description: 'Next-generation low-level graphics and computation API on the web.',
    signatures: {
      browserApis: ['webgpu']
    }
  },
  {
    id: 'html-canvas',
    name: 'HTML5 2D Canvas',
    category: 'Browser API',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API',
    description: 'Element and 2D context for dynamic scriptable rendering of 2D shapes and bitmap images.',
    signatures: {
      browserApis: ['canvas2d'],
      dom: ['canvas']
    }
  },
  {
    id: 'webrtc',
    name: 'WebRTC (Real-Time Communication)',
    category: 'Browser API',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API',
    description: 'Direct peer-to-peer audio, video, and data streaming capabilities in browser.',
    signatures: {
      browserApis: ['webrtc'],
      globals: ['RTCPeerConnection', 'webkitRTCPeerConnection']
    }
  },
  {
    id: 'service-worker',
    name: 'Service Worker API',
    category: 'Browser API',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API',
    description: 'Event-driven background worker acting as a programmable proxy between web app and network.',
    signatures: {
      browserApis: ['service-worker']
    }
  },
  {
    id: 'webassembly',
    name: 'WebAssembly (Wasm)',
    category: 'Browser API',
    website: 'https://webassembly.org',
    description: 'Binary instruction format for high-performance execution of code on web.',
    signatures: {
      browserApis: ['webassembly'],
      scripts: [/\.wasm(?:\?|$)/i]
    }
  },
  {
    id: 'web-workers',
    name: 'Web Workers',
    category: 'Browser API',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API',
    description: 'Background thread execution offloading CPU-intensive tasks from the main UI thread.',
    signatures: {
      browserApis: ['web-worker']
    }
  },
  {
    id: 'geolocation',
    name: 'Geolocation API',
    category: 'Browser API',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API',
    description: 'Allows web applications to access the geographical location of the device with consent.',
    signatures: {
      browserApis: ['geolocation']
    }
  },
  {
    id: 'notifications',
    name: 'Notifications API',
    category: 'Browser API',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API',
    description: 'Allows web pages to display system notifications to the user.',
    signatures: {
      browserApis: ['notifications']
    }
  },
  {
    id: 'web-crypto',
    name: 'Web Cryptography API',
    category: 'Browser API',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API',
    description: 'Cryptographic operations such as hashing, signature generation and verification, and encryption/decryption.',
    signatures: {
      browserApis: ['crypto']
    }
  },
  {
    id: 'intersection-observer',
    name: 'Intersection Observer',
    category: 'Browser API',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API',
    description: 'Asynchronously observes changes in the intersection of a target element with an ancestor element or viewport.',
    signatures: {
      browserApis: ['intersection-observer']
    }
  },
  {
    id: 'mutation-observer',
    name: 'Mutation Observer',
    category: 'Browser API',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver',
    description: 'Provides the ability to watch for changes being made to the DOM tree.',
    signatures: {
      browserApis: ['mutation-observer']
    }
  },
  {
    id: 'resize-observer',
    name: 'Resize Observer',
    category: 'Browser API',
    website: 'https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver',
    description: 'Reports changes to the dimensions of an Element content or border box.',
    signatures: {
      browserApis: ['resize-observer']
    }
  }
];
