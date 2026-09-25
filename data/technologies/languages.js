// data/technologies/languages.js
// Signatures for programming languages with direct observable client or protocol evidence.

export const LANGUAGE_TECHNOLOGIES = [
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'Programming Language',
    website: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    description: 'High-level, often just-in-time compiled language that conforms to the ECMAScript specification.',
    signatures: {
      scripts: [/\.js(?:\?|$)/i],
      headers: {
        'content-type': /text\/javascript|application\/javascript/i
      }
    }
  },
  {
    id: 'typescript-lang',
    name: 'TypeScript',
    category: 'Programming Language',
    website: 'https://www.typescriptlang.org',
    description: 'Typed superset of JavaScript that compiles to plain JavaScript.',
    signatures: {
      scripts: [/\.ts(?:\.map)?(?:\?|$)/i],
      sourceMaps: [/\.ts$/i]
    }
  },
  {
    id: 'webassembly-lang',
    name: 'WebAssembly',
    category: 'Programming Language',
    website: 'https://webassembly.org',
    description: 'Binary code format enabling near-native execution speed in web browsers.',
    signatures: {
      scripts: [/\.wasm(?:\?|$)/i],
      headers: {
        'content-type': /application\/wasm/i
      }
    }
  },
  {
    id: 'php-lang',
    name: 'PHP',
    category: 'Programming Language',
    website: 'https://www.php.net',
    description: 'Server-side scripting language designed for web development.',
    signatures: {
      headers: {
        'x-powered-by': /PHP/i,
        'server': /PHP/i
      },
      cookies: [/^PHPSESSID$/i]
    }
  },
  {
    id: 'python-lang',
    name: 'Python',
    category: 'Programming Language',
    website: 'https://www.python.org',
    description: 'High-level interpreted general-purpose programming language.',
    signatures: {
      headers: {
        'server': /WSGIServer|Gunicorn|uWSGI|Werkzeug/i,
        'x-powered-by': /Django/i
      }
    }
  },
  {
    id: 'ruby-lang',
    name: 'Ruby',
    category: 'Programming Language',
    website: 'https://www.ruby-lang.org',
    description: 'Dynamic, open source programming language with a focus on simplicity and productivity.',
    signatures: {
      headers: {
        'x-powered-by': /Phusion Passenger/i,
        'server': /Puma|Unicorn/i
      }
    }
  },
  {
    id: 'csharp-lang',
    name: 'C# / .NET',
    category: 'Programming Language',
    website: 'https://dotnet.microsoft.com',
    description: 'Modern, object-oriented, and type-safe programming language developed by Microsoft.',
    signatures: {
      headers: {
        'x-powered-by': /ASP\.NET/i,
        'x-aspnet-version': /.+/i
      }
    }
  },
  {
    id: 'java-lang',
    name: 'Java',
    category: 'Programming Language',
    website: 'https://www.java.com',
    description: 'Object-oriented, class-based concurrent programming language.',
    signatures: {
      headers: {
        'server': /Tomcat|Jetty|GlassFish|WildFly/i,
        'x-application-context': /.+/
      },
      cookies: [/^JSESSIONID$/i]
    }
  }
];
