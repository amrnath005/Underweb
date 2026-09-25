// data/technologies/libraries.js
// Signatures for utility, visualization, state management, and math/graphics libraries.

export const LIBRARY_TECHNOLOGIES = [
  {
    id: 'jquery',
    name: 'jQuery',
    category: 'JavaScript Library',
    website: 'https://jquery.com',
    description: 'DOM manipulation and event handling JavaScript utility library.',
    signatures: {
      globals: ['jQuery', '$'],
      scripts: [/jquery(?:[-.0-9]+)?(?:\.min)?\.js/i]
    }
  },
  {
    id: 'lodash',
    name: 'Lodash',
    category: 'JavaScript Library',
    website: 'https://lodash.com',
    description: 'Modern JavaScript utility library delivering modularity, performance & extras.',
    signatures: {
      globals: ['_'],
      scripts: [/lodash(?:\.min)?\.js/i]
    }
  },
  {
    id: 'underscore',
    name: 'Underscore.js',
    category: 'JavaScript Library',
    website: 'https://underscorejs.org',
    description: 'JavaScript library providing functional programming helpers without extending built-in objects.',
    signatures: {
      globals: ['_'],
      scripts: [/underscore(?:\.min)?\.js/i]
    }
  },
  {
    id: 'axios',
    name: 'Axios',
    category: 'JavaScript Library',
    website: 'https://axios-http.com',
    description: 'Promise-based HTTP client for the browser and node.js.',
    signatures: {
      globals: ['axios'],
      scripts: [/axios(?:\.min)?\.js/i]
    }
  },
  {
    id: 'moment',
    name: 'Moment.js',
    category: 'JavaScript Library',
    website: 'https://momentjs.com',
    description: 'Date and time parsing, validation, manipulation, and formatting.',
    signatures: {
      globals: ['moment'],
      scripts: [/moment(?:\.min)?\.js/i]
    }
  },
  {
    id: 'dayjs',
    name: 'Day.js',
    category: 'JavaScript Library',
    website: 'https://day.js.org',
    description: 'Fast 2kB alternative to Moment.js with the same modern API.',
    signatures: {
      globals: ['dayjs'],
      scripts: [/dayjs(?:\.min)?\.js/i]
    }
  },
  {
    id: 'date-fns',
    name: 'date-fns',
    category: 'JavaScript Library',
    website: 'https://date-fns.org',
    description: 'Modular date utility library providing immutable helpers.',
    signatures: {
      globals: ['dateFns'],
      scripts: [/date-fns/i]
    }
  },
  {
    id: 'rxjs',
    name: 'RxJS',
    category: 'JavaScript Library',
    website: 'https://rxjs.dev',
    description: 'Reactive Extensions library for asynchronous and event-based programming using observables.',
    signatures: {
      globals: ['rxjs'],
      scripts: [/rxjs/i]
    }
  },
  {
    id: 'threejs',
    name: 'Three.js',
    category: 'JavaScript Library',
    website: 'https://threejs.org',
    description: '3D WebGL library simplifying 3D scene creation in the browser.',
    signatures: {
      globals: ['THREE'],
      scripts: [/three(?:\.min)?\.js/i]
    }
  },
  {
    id: 'd3',
    name: 'D3.js',
    category: 'JavaScript Library',
    website: 'https://d3js.org',
    description: 'Data-driven document manipulation and custom data visualization library.',
    signatures: {
      globals: ['d3'],
      scripts: [/d3(?:\.v\d+)?(?:\.min)?\.js/i]
    }
  },
  {
    id: 'chartjs',
    name: 'Chart.js',
    category: 'JavaScript Library',
    website: 'https://www.chartjs.org',
    description: 'Simple yet flexible JavaScript charting for designers & developers.',
    signatures: {
      globals: ['Chart'],
      scripts: [/chart(?:\.umd)?(?:\.min)?\.js/i]
    }
  },
  {
    id: 'echarts',
    name: 'Apache ECharts',
    category: 'JavaScript Library',
    website: 'https://echarts.apache.org',
    description: 'Powerful, interactive charting and data visualization library for browser.',
    signatures: {
      globals: ['echarts'],
      scripts: [/echarts(?:\.min)?\.js/i]
    }
  },
  {
    id: 'gsap',
    name: 'GSAP (GreenSock)',
    category: 'JavaScript Library',
    website: 'https://gsap.com',
    description: 'High-performance professional animation library for modern web development.',
    signatures: {
      globals: ['gsap', 'TweenLite', 'TweenMax'],
      scripts: [/gsap(?:\.min)?\.js/i]
    }
  },
  {
    id: 'animejs',
    name: 'Anime.js',
    category: 'JavaScript Library',
    website: 'https://animejs.com',
    description: 'Lightweight JavaScript animation library with clean API.',
    signatures: {
      globals: ['anime'],
      scripts: [/anime(?:\.min)?\.js/i]
    }
  },
  {
    id: 'redux',
    name: 'Redux',
    category: 'JavaScript Library',
    website: 'https://redux.js.org',
    description: 'Predictable state container for JavaScript apps.',
    signatures: {
      globals: ['__REDUX_DEVTOOLS_EXTENSION__', '__REDUX_STATE__'],
      scripts: [/redux(?:\.min)?\.js/i]
    }
  },
  {
    id: 'zustand',
    name: 'Zustand',
    category: 'JavaScript Library',
    website: 'https://github.com/pmndrs/zustand',
    description: 'Small, fast, and scalable bearbones state management solution.',
    signatures: {
      globals: ['__zustand'],
      scripts: [/zustand/i]
    }
  },
  {
    id: 'mobx',
    name: 'MobX',
    category: 'JavaScript Library',
    website: 'https://mobx.js.org',
    description: 'Simple, scalable state management through transparent functional reactive programming.',
    signatures: {
      globals: ['mobx', '__mobxGlobal'],
      scripts: [/mobx(?:\.umd)?(?:\.min)?\.js/i]
    }
  },
  {
    id: 'recoil',
    name: 'Recoil',
    category: 'JavaScript Library',
    website: 'https://recoiljs.org',
    description: 'State management library for React providing fine-grained data-flow graph.',
    signatures: {
      globals: ['__recoil'],
      scripts: [/recoil(?:\.min)?\.js/i]
    }
  },
  {
    id: 'tanstack-query',
    name: 'TanStack Query (React Query)',
    category: 'JavaScript Library',
    website: 'https://tanstack.com/query',
    description: 'Powerful asynchronous state management and server state synchronization.',
    signatures: {
      globals: ['__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__'],
      scripts: [/@tanstack\/react-query/i, /react-query(?:\.production)?\.js/i]
    }
  },
  {
    id: 'swr',
    name: 'SWR',
    category: 'JavaScript Library',
    website: 'https://swr.vercel.app',
    description: 'React Hooks library for data fetching using stale-while-revalidate.',
    signatures: {
      scripts: [/\/swr\//i, /swr(?:\.min)?\.js/i]
    }
  },
  {
    id: 'socketio',
    name: 'Socket.IO Client',
    category: 'JavaScript Library',
    website: 'https://socket.io',
    description: 'Bidirectional low-latency real-time event-based communication library.',
    signatures: {
      globals: ['io'],
      scripts: [/socket\.io(?:\.min)?\.js/i],
      apis: [/\/socket\.io\//i]
    }
  },
  {
    id: 'leaflet',
    name: 'Leaflet',
    category: 'JavaScript Library',
    website: 'https://leafletjs.com',
    description: 'Mobile-friendly interactive JavaScript mapping library.',
    signatures: {
      globals: ['L'],
      dom: ['[class*="leaflet-"]', '.leaflet-container'],
      scripts: [/leaflet(?:\.min)?\.js/i]
    }
  },
  {
    id: 'mapbox',
    name: 'Mapbox GL JS',
    category: 'JavaScript Library',
    website: 'https://www.mapbox.com/mapbox-gl-js',
    description: 'Interactive, customizable vector maps powered by WebGL.',
    signatures: {
      globals: ['mapboxgl'],
      dom: ['.mapboxgl-map', '.mapboxgl-canvas'],
      scripts: [/mapbox-gl(?:\.min)?\.js/i]
    }
  },
  {
    id: 'babylonjs',
    name: 'Babylon.js',
    category: 'JavaScript Library',
    website: 'https://www.babylonjs.com',
    description: 'Real-time 3D engine using WebGL, WebGPU, and WebXR.',
    signatures: {
      globals: ['BABYLON'],
      scripts: [/babylon(?:\.min)?\.js/i]
    }
  },
  {
    id: 'tensorflowjs',
    name: 'TensorFlow.js',
    category: 'JavaScript Library',
    website: 'https://www.tensorflow.org/js',
    description: 'Machine learning library for training and deploying ML models in the browser.',
    signatures: {
      globals: ['tf'],
      scripts: [/tfjs(?:\.min)?\.js/i, /@tensorflow\/tfjs/i]
    }
  },
  {
    id: 'onnxweb',
    name: 'ONNX Runtime Web',
    category: 'JavaScript Library',
    website: 'https://onnxruntime.ai',
    description: 'Cross-platform accelerator for machine learning models running in web browsers via WebAssembly and WebGPU.',
    signatures: {
      globals: ['ort'],
      scripts: [/ort(?:\.min)?\.js/i, /onnxruntime-web/i]
    }
  }
];
