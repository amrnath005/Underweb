// data/technologies/css.js
// Signatures for CSS frameworks, component libraries, and styling engines.

export const CSS_TECHNOLOGIES = [
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    category: 'CSS & UI',
    website: 'https://tailwindcss.com',
    description: 'Utility-first CSS framework for rapid custom user interface development.',
    signatures: {
      // Require distinctive combinations of utility classes rather than isolated single names
      domClasses: [
        /\b(?:flex|grid)\s+(?:items-|justify-|gap-|p-|m-|space-)\w+/i,
        /\b(?:sm|md|lg|xl|2xl)\:(?:flex|grid|hidden|block|w-|p-)\w+/i,
        /\b(?:dark\:bg-|dark\:text-|hover\:bg-|focus\:ring-)\w+/i
      ],
      dom: ['style[id^="__tailwind"]', 'link[href*="tailwind"]'],
      stylesheets: [/tailwind(?:\.min)?\.css/i]
    }
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    category: 'CSS & UI',
    website: 'https://getbootstrap.com',
    description: 'Popular responsive front-end component library with grid system.',
    signatures: {
      globals: ['bootstrap'],
      dom: ['[class*="navbar-expand"]', '[data-bs-toggle]', '[data-bs-target]'],
      domClasses: [/\bcol-(?:sm|md|lg|xl|xxl)-\d+\b/i, /\bbtn-(?:primary|secondary|success|danger|warning|info)\b/i],
      scripts: [/bootstrap(?:\.bundle)?(?:\.min)?\.js/i],
      stylesheets: [/bootstrap(?:\.min)?\.css/i]
    }
  },
  {
    id: 'bulma',
    name: 'Bulma',
    category: 'CSS & UI',
    website: 'https://bulma.io',
    description: 'Modern CSS framework based on Flexbox.',
    signatures: {
      dom: ['.columns', '.column.is-one-quarter', '.is-primary', '.hero.is-medium'],
      domClasses: [/\bis-(?:primary|info|success|warning|danger)\b/i, /\bcolumn is-(?:half|full|\d+)\b/i],
      stylesheets: [/bulma(?:\.min)?\.css/i]
    }
  },
  {
    id: 'foundation',
    name: 'Foundation',
    category: 'CSS & UI',
    website: 'https://get.foundation',
    description: 'Advanced responsive front-end framework.',
    signatures: {
      globals: ['Foundation'],
      dom: ['[data-foundation]', '.grid-x', '.cell.small-12'],
      scripts: [/foundation(?:\.min)?\.js/i]
    }
  },
  {
    id: 'mui',
    name: 'Material UI (MUI)',
    category: 'CSS & UI',
    website: 'https://mui.com',
    description: 'React component library implementing Google Material Design.',
    signatures: {
      dom: ['[class*="MuiButton-root"]', '[class*="MuiTypography-root"]', '[class*="MuiBox-root"]', '[class*="MuiGrid-root"]'],
      domClasses: [/\bMui[A-Z][a-zA-Z]+-root\b/]
    }
  },
  {
    id: 'antdesign',
    name: 'Ant Design',
    category: 'CSS & UI',
    website: 'https://ant.design',
    description: 'Enterprise-class React UI design language and component library.',
    signatures: {
      dom: ['[class*="ant-btn"]', '[class*="ant-layout"]', '[class*="ant-row"]', '[class*="ant-col"]'],
      domClasses: [/\bant-(?:btn|layout|row|col|menu|modal)\b/]
    }
  },
  {
    id: 'chakrai',
    name: 'Chakra UI',
    category: 'CSS & UI',
    website: 'https://chakra-ui.com',
    description: 'Simple, modular and accessible component library for React applications.',
    signatures: {
      dom: ['[class*="chakra-button"]', '[class*="chakra-stack"]', '[class*="chakra-ui-"]'],
      domClasses: [/\bchakra-[a-z]+\b/]
    }
  },
  {
    id: 'mantine',
    name: 'Mantine',
    category: 'CSS & UI',
    website: 'https://mantine.dev',
    description: 'Fully featured React component library with built-in dark theme and hooks.',
    signatures: {
      dom: ['[class*="mantine-Button"]', '[class*="mantine-Text"]', '[class*="mantine-Grid"]', '[data-mantine-color-scheme]'],
      domClasses: [/\bmantine-[A-Z][a-zA-Z]+-[a-z]+\b/]
    }
  },
  {
    id: 'semanticui',
    name: 'Semantic UI',
    category: 'CSS & UI',
    website: 'https://semantic-ui.com',
    description: 'UI component framework using human-friendly HTML phrasing.',
    signatures: {
      dom: ['.ui.button', '.ui.grid', '.ui.container', '.ui.menu'],
      stylesheets: [/semantic(?:\.min)?\.css/i]
    }
  },
  {
    id: 'uikit',
    name: 'UIkit',
    category: 'CSS & UI',
    website: 'https://getuikit.com',
    description: 'Lightweight and modular front-end framework for developing fast and powerful web interfaces.',
    signatures: {
      globals: ['UIkit'],
      dom: ['[uk-grid]', '[uk-scroll]', '[class*="uk-button"]'],
      scripts: [/uikit(?:\.min)?\.js/i]
    }
  },
  {
    id: 'daisyui',
    name: 'daisyUI',
    category: 'CSS & UI',
    website: 'https://daisyui.com',
    description: 'Component library for Tailwind CSS adding clean semantic classes.',
    signatures: {
      domClasses: [/\bbtn (?:btn-primary|btn-secondary|btn-accent|btn-ghost)\b/i, /\bcard (?:card-bordered|card-compact)\b/i],
      dom: ['[data-theme="light"]', '[data-theme="dark"]', '[data-theme="cyberpunk"]', '[data-theme="synthwave"]']
    }
  },
  {
    id: 'shadcnui',
    name: 'shadcn/ui',
    category: 'CSS & UI',
    website: 'https://ui.shadcn.com',
    description: 'Re-usable components built with Radix UI and Tailwind CSS.',
    signatures: {
      dom: ['[data-radix-collection-item]', '[data-radix-popper-content-wrapper]', '[data-state="closed"]', '[data-state="open"]'],
      implies: ['tailwindcss']
    }
  },
  {
    id: 'styled-components',
    name: 'Styled Components',
    category: 'CSS & UI',
    website: 'https://styled-components.com',
    description: 'CSS-in-JS styling tool for React components with scoped styles.',
    signatures: {
      dom: ['style[data-styled]', 'style[data-styled-components]']
    }
  },
  {
    id: 'emotion',
    name: 'Emotion',
    category: 'CSS & UI',
    website: 'https://emotion.sh',
    description: 'Performant and flexible CSS-in-JS library.',
    signatures: {
      dom: ['style[data-emotion]', '[class*="css-"]']
    }
  },
  {
    id: 'css-modules',
    name: 'CSS Modules',
    category: 'CSS & UI',
    website: 'https://github.com/css-modules/css-modules',
    description: 'CSS file in which all class names and animation names are scoped locally by default.',
    signatures: {
      domClasses: [/_[a-zA-Z0-9]+_[a-zA-Z0-9]{5}/]
    }
  }
];
