# Contributing to Underweb

Thank you for your interest in improving Underweb!

Underweb is an open-source website intelligence platform and developer tool built for developers, cybersecurity researchers, students, and curious internet explorers.

---

## Architecture Guidelines

1. **Local-First**: Underweb must execute 100% locally in the browser with zero external network telemetry, third-party data collection, or paid APIs.
2. **Explainable Detections**: Every technology detection must register concrete evidence signals (`DOM_MARKER`, `WINDOW_GLOBAL`, `HTTP_HEADER`, `SCRIPT_URL`) with an `EvidenceRecord`.
3. **Pure Modern JavaScript**: Use ES Modules. Keep the codebase lightweight, fast, and free of unnecessary heavy frameworks.

---

## Adding a New Technology Signature

To add support for a new framework, library, build tool, or service:
1. Open `data/technologies.js`.
2. Add your entry adhering to the schema:
   ```javascript
   {
     id: 'my-tech',
     name: 'My Technology',
     category: 'FRAMEWORK', // or LIBRARY, BUILD_TOOL, CMS, ANALYTICS, PAYMENT, CLOUD
     website: 'https://example.com',
     description: 'Brief description.',
     signatures: {
       globals: ['myGlobal'],
       dom: ['#my-root', '[data-my-marker]'],
       scripts: [/my-tech(?:\.min)?\.js/],
       headers: { 'x-powered-by': /MyTech/i }
     }
   }
   ```
3. Open `data/providers.js` and add an educational breakdown for Student Learning Mode (WHAT, WHY, HOW, EVIDENCE, REAL-WORLD USE).
4. Run `node tests/test-runner.js` to ensure all tests pass.

---

## Running Tests

Execute the zero-dependency test suite:
```bash
node tests/test-runner.js
```
