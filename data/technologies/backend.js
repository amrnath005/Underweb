// data/technologies/backend.js
// Signatures for backend and server-side runtimes detectable via headers, cookies, and observable response patterns.

export const BACKEND_TECHNOLOGIES = [
  {
    id: 'express',
    name: 'Express',
    category: 'Backend / Server',
    website: 'https://expressjs.com',
    description: 'Fast, unopinionated, minimalist web framework for Node.js.',
    signatures: {
      headers: {
        'x-powered-by': /^Express$/i
      },
      cookies: [/^connect\.sid$/i]
    }
  },
  {
    id: 'fastify',
    name: 'Fastify',
    category: 'Backend / Server',
    website: 'https://fastify.dev',
    description: 'Fast and low overhead web framework for Node.js.',
    signatures: {
      headers: {
        'x-powered-by': /^Fastify$/i
      }
    }
  },
  {
    id: 'nestjs',
    name: 'NestJS',
    category: 'Backend / Server',
    website: 'https://nestjs.com',
    description: 'Progressive Node.js framework for building efficient, reliable, and scalable server-side applications.',
    signatures: {
      headers: {
        'x-powered-by': /^NestJS$/i
      }
    }
  },
  {
    id: 'laravel',
    name: 'Laravel',
    category: 'Backend / Server',
    website: 'https://laravel.com',
    description: 'PHP web application framework with expressive, elegant syntax.',
    signatures: {
      headers: {
        'x-powered-by': /Laravel/i
      },
      cookies: [/laravel_session/i, /XSRF-TOKEN/i]
    }
  },
  {
    id: 'rails',
    name: 'Ruby on Rails',
    category: 'Backend / Server',
    website: 'https://rubyonrails.org',
    description: 'Full-stack web-application framework that includes everything needed to create database-backed web applications.',
    signatures: {
      headers: {
        'x-powered-by': /Phusion Passenger|Rails/i,
        'x-runtime': /^\d+\.\d+$/
      },
      cookies: [/_rails_session/i, /_session_id/i],
      dom: ['meta[name="csrf-param"][content="authenticity_token"]']
    }
  },
  {
    id: 'django',
    name: 'Django',
    category: 'Backend / Server',
    website: 'https://www.djangoproject.com',
    description: 'High-level Python web framework that encourages rapid development and clean, pragmatic design.',
    signatures: {
      cookies: [/^csrftoken$/i, /^sessionid$/i],
      headers: {
        'x-powered-by': /Django/i
      }
    }
  },
  {
    id: 'flask',
    name: 'Flask',
    category: 'Backend / Server',
    website: 'https://flask.palletsprojects.com',
    description: 'Lightweight WSGI Python web application framework.',
    signatures: {
      headers: {
        'server': /Werkzeug/i
      }
    }
  },
  {
    id: 'aspnet',
    name: 'ASP.NET',
    category: 'Backend / Server',
    website: 'https://dotnet.microsoft.com/apps/aspnet',
    description: 'Microsoft open-source framework for building modern web apps and services with .NET.',
    signatures: {
      headers: {
        'x-powered-by': /ASP\.NET/i,
        'x-aspnet-version': /.+/,
        'x-aspnetmvc-version': /.+/
      },
      cookies: [/^ASP\.NET_SessionId$/i, /^\.AspNetCore\./i],
      dom: ['#__VIEWSTATE', '#__EVENTVALIDATION']
    }
  },
  {
    id: 'spring',
    name: 'Spring Boot',
    category: 'Backend / Server',
    website: 'https://spring.io/projects/spring-boot',
    description: 'Java framework for creating stand-alone, production-grade Spring-based applications.',
    signatures: {
      headers: {
        'x-application-context': /.+/
      },
      cookies: [/^JSESSIONID$/i]
    }
  },
  {
    id: 'php',
    name: 'PHP',
    category: 'Programming Language',
    website: 'https://www.php.net',
    description: 'Popular general-purpose scripting language suited to web development.',
    signatures: {
      headers: {
        'x-powered-by': /PHP\/[\d.]+/i,
        'server': /PHP\/[\d.]+/i
      },
      cookies: [/^PHPSESSID$/i]
    }
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'Backend / Server',
    website: 'https://nodejs.org',
    description: 'Open-source, cross-platform JavaScript runtime environment.',
    signatures: {
      headers: {
        'x-powered-by': /Node\.js/i
      }
    }
  }
];
