// data/technologies/frontend.js
// Signatures for frontend frameworks, meta-frameworks, and static site generators.

export const FRONTEND_TECHNOLOGIES = [
  {
    id: 'react',
    name: 'React',
    category: 'Frontend Framework',
    website: 'https://react.dev',
    description: 'Component-based library for building user interfaces.',
    signatures: {
      globals: ['React', '__REACT_DEVTOOLS_GLOBAL_HOOK__'],
      dom: ['[data-reactroot]', '[data-react-helmet]'],
      scripts: [/react(?:\.production|\.development)?\.js/i, /react-dom/i],
      meta: []
    }
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'Frontend Framework',
    website: 'https://nextjs.org',
    description: 'React full-stack framework with SSR, ISR, and edge rendering.',
    signatures: {
      globals: ['__NEXT_DATA__', 'next'],
      dom: ['#__next', 'script[id="__NEXT_DATA__"]'],
      scripts: [/_next\/static\//i],
      headers: {
        'x-powered-by': /Next\.js/i,
        'x-nextjs-cache': /.+/,
        'x-nextjs-matched-path': /.+/
      },
      meta: [{ name: 'generator', content: /Next\.js/i }],
      implies: ['react']
    }
  },
  {
    id: 'remix',
    name: 'Remix',
    category: 'Frontend Framework',
    website: 'https://remix.run',
    description: 'Full-stack web framework focused on web standards and modern UX.',
    signatures: {
      globals: ['__remixContext', '__remixManifest', '__remixRouteModules'],
      dom: ['script[type="application/json"][data-remix]'],
      scripts: [/\/build\/root-[a-z0-9]+\.js/i],
      implies: ['react']
    }
  },
  {
    id: 'gatsby',
    name: 'Gatsby',
    category: 'Frontend Framework',
    website: 'https://www.gatsbyjs.com',
    description: 'Static site generator and React framework for headless architecture.',
    signatures: {
      globals: ['___gatsby', '___loader'],
      dom: ['#___gatsby', '#gatsby-focus-wrapper'],
      scripts: [/\/gatsby-[a-z0-9]+\.js/i, /component---/i],
      meta: [{ name: 'generator', content: /Gatsby/i }],
      implies: ['react']
    }
  },
  {
    id: 'vue',
    name: 'Vue.js',
    category: 'Frontend Framework',
    website: 'https://vuejs.org',
    description: 'Progressive JavaScript framework for building reactive web interfaces.',
    signatures: {
      globals: ['Vue', '__VUE__', '__VUE_DEVTOOLS_GLOBAL_HOOK__'],
      dom: ['[data-v-]', '#app[data-server-rendered]'],
      scripts: [/vue(?:\.runtime)?(?:\.min)?\.js/i, /vue-router/i, /vuex/i, /pinia/i]
    }
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    category: 'Frontend Framework',
    website: 'https://nuxt.com',
    description: 'Vue-based meta-framework providing SSR, SSG, and file-based routing.',
    signatures: {
      globals: ['__NUXT__', '$nuxt'],
      dom: ['#__nuxt', '#__layout', 'script[id="__NUXT_DATA__"]'],
      scripts: [/_nuxt\//i],
      headers: { 'x-powered-by': /Nuxt/i },
      implies: ['vue']
    }
  },
  {
    id: 'angular',
    name: 'Angular',
    category: 'Frontend Framework',
    website: 'https://angular.dev',
    description: 'Enterprise TypeScript-based application framework maintained by Google.',
    signatures: {
      globals: ['ng', 'getAllAngularRootElements', 'ngDevMode'],
      dom: ['[ng-version]', 'app-root', '[_nghost-]', '[_ngcontent-]'],
      scripts: [/main(?:\.[a-z0-9]+)?\.js/i, /polyfills(?:\.[a-z0-9]+)?\.js/i, /runtime(?:\.[a-z0-9]+)?\.js/i]
    }
  },
  {
    id: 'angularjs',
    name: 'AngularJS',
    category: 'Frontend Framework',
    website: 'https://angularjs.org',
    description: 'Legacy 1.x MVC framework for client-side web applications.',
    signatures: {
      globals: ['angular'],
      dom: ['[ng-app]', '[ng-controller]', '[ng-model]', '[ng-repeat]'],
      scripts: [/angular(?:\.min)?\.js/i]
    }
  },
  {
    id: 'svelte',
    name: 'Svelte',
    category: 'Frontend Framework',
    website: 'https://svelte.dev',
    description: 'Compiler-based component framework converting code into tiny imperative DOM updates.',
    signatures: {
      globals: ['__svelte'],
      dom: ['[class*="svelte-"]'],
      scripts: [/svelte(?:\.min)?\.js/i, /_app\/immutable\//i]
    }
  },
  {
    id: 'sveltekit',
    name: 'SvelteKit',
    category: 'Frontend Framework',
    website: 'https://kit.svelte.dev',
    description: 'Application framework for Svelte offering SSR, hydration, and routing.',
    signatures: {
      globals: ['__sveltekit_data'],
      dom: ['[data-sveltekit-preload-data]', '[data-sveltekit-keepfocus]'],
      scripts: [/_app\/immutable\/start/i],
      implies: ['svelte']
    }
  },
  {
    id: 'solid',
    name: 'SolidJS',
    category: 'Frontend Framework',
    website: 'https://www.solidjs.com',
    description: 'Declarative, efficient, and flexible JavaScript library for user interfaces.',
    signatures: {
      globals: ['_$HY'],
      dom: ['[data-hk]'],
      scripts: [/solid-js/i]
    }
  },
  {
    id: 'qwik',
    name: 'Qwik',
    category: 'Frontend Framework',
    website: 'https://qwik.dev',
    description: 'Resumable framework delivering instant-on web applications with zero hydration.',
    signatures: {
      globals: ['qwikevents', 'qwikloader'],
      dom: ['[q\\:container]', '[q\\:key]', '[q\\:version]'],
      scripts: [/q-manifest\.json/i, /q-[a-z0-9]+\.js/i]
    }
  },
  {
    id: 'astro',
    name: 'Astro',
    category: 'Frontend Framework',
    website: 'https://astro.build',
    description: 'Content-focused web framework with zero-JS by default and Islands architecture.',
    signatures: {
      globals: ['__astro'],
      dom: ['astro-island', 'astro-slot', '[class*="astro-"]'],
      scripts: [/_astro\//i],
      meta: [{ name: 'generator', content: /Astro/i }]
    }
  },
  {
    id: 'preact',
    name: 'Preact',
    category: 'Frontend Framework',
    website: 'https://preactjs.com',
    description: 'Fast 3kB alternative to React with modern component API.',
    signatures: {
      globals: ['preact'],
      scripts: [/preact(?:\.min)?\.js/i]
    }
  },
  {
    id: 'alpine',
    name: 'Alpine.js',
    category: 'Frontend Framework',
    website: 'https://alpinejs.dev',
    description: 'Rugged, minimal tool for composing behavior directly in markup.',
    signatures: {
      globals: ['Alpine'],
      dom: ['[x-data]', '[x-init]', '[x-show]', '[x-bind]', '[x-model]'],
      scripts: [/alpine(?:\.min)?\.js/i]
    }
  },
  {
    id: 'htmx',
    name: 'HTMX',
    category: 'Frontend Framework',
    website: 'https://htmx.org',
    description: 'High-power tools for HTML using attributes to access AJAX, CSS Transitions, and WebSockets.',
    signatures: {
      globals: ['htmx'],
      dom: ['[hx-get]', '[hx-post]', '[hx-target]', '[hx-swap]', '[hx-trigger]'],
      scripts: [/htmx(?:\.min)?\.js/i]
    }
  },
  {
    id: 'lit',
    name: 'Lit',
    category: 'Frontend Framework',
    website: 'https://lit.dev',
    description: 'Fast, lightweight library for building shareable Web Components.',
    signatures: {
      globals: ['litHtml', 'litElementVersions', 'litHtmlVersions'],
      scripts: [/lit-element/i, /lit-html/i]
    }
  },
  {
    id: 'ember',
    name: 'Ember.js',
    category: 'Frontend Framework',
    website: 'https://emberjs.com',
    description: 'Productive, battle-tested JavaScript framework for building modern web applications.',
    signatures: {
      globals: ['Ember', 'Em'],
      dom: ['[class*="ember-view"]', '#ember-testing'],
      scripts: [/ember(?:\.prod|\.min)?\.js/i]
    }
  },
  {
    id: 'backbone',
    name: 'Backbone.js',
    category: 'Frontend Framework',
    website: 'https://backbonejs.org',
    description: 'Lightweight models, collections, and views for rich client web applications.',
    signatures: {
      globals: ['Backbone'],
      scripts: [/backbone(?:\.min)?\.js/i]
    }
  },
  {
    id: 'knockout',
    name: 'Knockout',
    category: 'Frontend Framework',
    website: 'https://knockoutjs.com',
    description: 'MVVM JavaScript library with declarative data bindings and dependency tracking.',
    signatures: {
      globals: ['ko'],
      dom: ['[data-bind]'],
      scripts: [/knockout(?:\.min|-[\d.]+)?\.js/i]
    }
  },
  {
    id: 'mithril',
    name: 'Mithril.js',
    category: 'Frontend Framework',
    website: 'https://mithril.js.org',
    description: 'Modern client-side JavaScript framework for building Single Page Applications.',
    signatures: {
      globals: ['m'],
      scripts: [/mithril(?:\.min)?\.js/i]
    }
  },
  {
    id: 'stimulus',
    name: 'Stimulus',
    category: 'Frontend Framework',
    website: 'https://stimulus.hotwired.dev',
    description: 'Modest JavaScript framework for the HTML you already have (Hotwire).',
    signatures: {
      globals: ['Stimulus'],
      dom: ['[data-controller]', '[data-action]', '[data-target]'],
      scripts: [/stimulus(?:\.umd)?\.js/i]
    }
  },
  {
    id: 'polymer',
    name: 'Polymer',
    category: 'Frontend Framework',
    website: 'https://polymer-library.polymer-project.org',
    description: 'Google library for building Web Components.',
    signatures: {
      globals: ['Polymer'],
      dom: ['dom-module', '[is^="dom-"]'],
      scripts: [/polymer(?:\.min)?\.js/i]
    }
  },
  {
    id: 'meteor',
    name: 'Meteor',
    category: 'Frontend Framework',
    website: 'https://www.meteor.com',
    description: 'Full-stack JavaScript platform for developing modern web and mobile applications.',
    signatures: {
      globals: ['Meteor', 'Package'],
      scripts: [/\/meteor\.js/i]
    }
  },
  {
    id: 'marko',
    name: 'Marko',
    category: 'Frontend Framework',
    website: 'https://markojs.com',
    description: 'HTML-first language and reactive framework with streaming and partial hydration.',
    signatures: {
      globals: ['$_mod'],
      dom: ['[data-marko]'],
      scripts: [/marko/i]
    }
  },
  {
    id: 'inferno',
    name: 'Inferno',
    category: 'Frontend Framework',
    website: 'https://infernojs.org',
    description: 'Extremely fast, React-like JavaScript library for building high-performance UIs.',
    signatures: {
      globals: ['Inferno'],
      scripts: [/inferno(?:\.min)?\.js/i]
    }
  },
  {
    id: 'fresh',
    name: 'Fresh',
    category: 'Frontend Framework',
    website: 'https://fresh.deno.dev',
    description: 'Next-generation web framework for Deno with zero-config island hydration.',
    signatures: {
      dom: ['script[id="__FRSH_STATE"]'],
      headers: { 'x-powered-by': /Fresh/i }
    }
  },
  {
    id: 'eleventy',
    name: 'Eleventy (11ty)',
    category: 'Frontend Framework',
    website: 'https://www.11ty.dev',
    description: 'Simpler, zero-client-JS static site generator.',
    signatures: {
      meta: [{ name: 'generator', content: /Eleventy/i }]
    }
  },
  {
    id: 'hugo',
    name: 'Hugo',
    category: 'Frontend Framework',
    website: 'https://gohugo.io',
    description: 'Fast open-source static site generator written in Go.',
    signatures: {
      meta: [{ name: 'generator', content: /Hugo/i }]
    }
  },
  {
    id: 'jekyll',
    name: 'Jekyll',
    category: 'Frontend Framework',
    website: 'https://jekyllrb.com',
    description: 'Simple, blog-aware static site generator powered by Ruby.',
    signatures: {
      meta: [{ name: 'generator', content: /Jekyll/i }]
    }
  },
  {
    id: 'docusaurus',
    name: 'Docusaurus',
    category: 'Frontend Framework',
    website: 'https://docusaurus.io',
    description: 'React-based static site generator optimized for documentation sites.',
    signatures: {
      globals: ['docusaurus'],
      dom: ['#__docusaurus', '[data-theme-choice]'],
      meta: [{ name: 'generator', content: /Docusaurus/i }],
      implies: ['react']
    }
  }
];
