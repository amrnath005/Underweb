// data/technologies/build-tools.js
// Signatures for bundlers, compilers, and JavaScript build systems.

export const BUILD_TOOL_TECHNOLOGIES = [
  {
    id: 'webpack',
    name: 'Webpack',
    category: 'Build Tool',
    website: 'https://webpack.js.org',
    description: 'Static module bundler for modern JavaScript applications.',
    signatures: {
      globals: ['webpackChunk', 'webpackJsonp', '__webpack_require__'],
      scripts: [/\/webpack\//i, /runtime~main\.[a-z0-9]+\.js/i]
    }
  },
  {
    id: 'vite',
    name: 'Vite',
    category: 'Build Tool',
    website: 'https://vitejs.dev',
    description: 'Next-generation frontend tooling with native ESM dev server and Rollup/esbuild bundling.',
    signatures: {
      globals: ['__vite_plugin_react_preamble_installed__'],
      dom: ['script[type="module"][src*="@vite/client"]'],
      scripts: [/\/@vite\/client/i, /\/assets\/[a-zA-Z0-9_-]+\.[a-z0-9]{8}\.js/i]
    }
  },
  {
    id: 'turbopack',
    name: 'Turbopack',
    category: 'Build Tool',
    website: 'https://turbo.build/pack',
    description: 'Incremental bundler optimized for JavaScript and TypeScript, written in Rust.',
    signatures: {
      globals: ['__turbopack__', 'TURBOPACK'],
      headers: { 'x-turbopack': /.+/i }
    }
  },
  {
    id: 'rollup',
    name: 'Rollup',
    category: 'Build Tool',
    website: 'https://rollupjs.org',
    description: 'Module bundler for JavaScript which compiles small pieces of code into something larger.',
    signatures: {
      scripts: [/rollup/i]
    }
  },
  {
    id: 'parcel',
    name: 'Parcel',
    category: 'Build Tool',
    website: 'https://parceljs.org',
    description: 'Zero-configuration build tool and bundler.',
    signatures: {
      globals: ['parcelRequire'],
      scripts: [/parcel/i]
    }
  },
  {
    id: 'esbuild',
    name: 'esbuild',
    category: 'Build Tool',
    website: 'https://esbuild.github.io',
    description: 'Extremely fast JavaScript bundler and minifier written in Go.',
    signatures: {
      headers: { 'x-esbuild': /.+/i }
    }
  },
  {
    id: 'rspack',
    name: 'Rspack',
    category: 'Build Tool',
    website: 'https://www.rspack.dev',
    description: 'High performance JavaScript bundler written in Rust with Webpack interoperability.',
    signatures: {
      globals: ['__rspack_require__', 'rspackChunk']
    }
  },
  {
    id: 'babel',
    name: 'Babel',
    category: 'Build Tool',
    website: 'https://babeljs.io',
    description: 'JavaScript compiler that lets you use next generation JavaScript today.',
    signatures: {
      globals: ['_babelPolyfill', 'regeneratorRuntime']
    }
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'Programming Language',
    website: 'https://www.typescriptlang.org',
    description: 'Strongly typed programming language that builds on JavaScript.',
    signatures: {
      // Evidence-driven only: detect through sourceMappingURL or ts artifacts
      scripts: [/\.ts(?:\.map)?(?:\?|$)/i, /__extends\s*=\s*\(this\s*&&\s*this\.__extends\)/]
    }
  }
];
