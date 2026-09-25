// scripts/validate-signature.js
// Automated CLI validator enforcing Underweb's Observable Evidence Standard on all technology signatures.

import { ALL_TECHNOLOGIES, TECHNOLOGIES } from '../data/technologies/index.js';

console.log('=== Underweb Technology Signature Validator ===\n');

let errors = 0;
let warnings = 0;
const seenIds = new Set();
const VALID_EVIDENCE_KEYS = [
  'globals', 'dom', 'domClasses', 'stylesheets', 'scripts', 'headers', 'cookies', 
  'meta', 'dns', 'protocols', 'apis', 'browserApis', 'storage', 'storageTypes', 'canvas'
];

// Disallowed backend/database guesses unless proven via observable headers or cookies
const FORBIDDEN_UNOBSERVABLE_TECHS = [
  { id: 'postgresql', name: 'PostgreSQL' },
  { id: 'mysql', name: 'MySQL' },
  { id: 'redis', name: 'Redis' },
  { id: 'mongodb', name: 'MongoDB' },
  { id: 'sqlite', name: 'SQLite' },
  { id: 'docker', name: 'Docker' },
  { id: 'kubernetes', name: 'Kubernetes' }
];

console.log(`Auditing ${ALL_TECHNOLOGIES.length} total signatures (${TECHNOLOGIES.length} unique)...`);

for (const tech of ALL_TECHNOLOGIES) {
  const prefix = `[${tech.id || 'MISSING_ID'}]`;

  // 1. Required fields
  if (!tech.id || typeof tech.id !== 'string') {
    console.error(`✖ ${prefix} Missing or invalid 'id' field`);
    errors++;
  } else if (!/^[a-z0-9-_.]+$/.test(tech.id)) {
    console.error(`✖ ${prefix} 'id' contains invalid characters. Use lowercase alphanumeric, hyphens, underscores.`);
    errors++;
  }

  if (!tech.name || typeof tech.name !== 'string') {
    console.error(`✖ ${prefix} Missing or invalid 'name' field`);
    errors++;
  }

  if (!tech.category || typeof tech.category !== 'string') {
    console.error(`✖ ${prefix} Missing or invalid 'category' field`);
    errors++;
  }

  if (!tech.description || typeof tech.description !== 'string') {
    console.warn(`⚠ ${prefix} Missing or empty 'description' field`);
    warnings++;
  }

  // 2. Signatures object
  if (!tech.signatures || typeof tech.signatures !== 'object') {
    console.error(`✖ ${prefix} Missing or invalid 'signatures' object`);
    errors++;
  } else {
    const keys = Object.keys(tech.signatures);
    if (keys.length === 0) {
      console.error(`✖ ${prefix} 'signatures' object is empty. Must declare at least one evidence rule.`);
      errors++;
    }

    const hasValidKey = keys.some(k => VALID_EVIDENCE_KEYS.includes(k));
    if (!hasValidKey) {
      console.error(`✖ ${prefix} 'signatures' contains no recognized evidence sources (${VALID_EVIDENCE_KEYS.join(', ')})`);
      errors++;
    }
  }

  // 3. ID Uniqueness in ALL_TECHNOLOGIES
  if (seenIds.has(tech.id)) {
    console.error(`✖ ${prefix} Duplicate technology ID detected in registry`);
    errors++;
  } else {
    seenIds.add(tech.id);
  }

  // 4. Zero Fabrication Enforcement (No unobservable databases/internal orchestration)
  for (const forbidden of FORBIDDEN_UNOBSERVABLE_TECHS) {
    if (tech.id === forbidden.id) {
      // Must only be permitted if evidence is strictly headers or cookies
      const sig = tech.signatures || {};
      const hasOnlyHeadersOrCookies = Object.keys(sig).every(k => k === 'headers' || k === 'cookies');
      if (!hasOnlyHeadersOrCookies) {
        console.error(`✖ ${prefix} VIOLATION OF ZERO FABRICATION RULE: '${forbidden.name}' cannot be detected via DOM or client globals. Only explicit server headers or debug cookies are observable.`);
        errors++;
      }
    }
  }
}

console.log('\n----------------------------------------');
if (errors === 0) {
  console.log(`✔ All ${TECHNOLOGIES.length} technology signatures validated successfully! (0 Errors, ${warnings} Warnings)`);
  console.log('----------------------------------------\n');
  process.exit(0);
} else {
  console.error(`✖ Signature validation failed with ${errors} error(s) and ${warnings} warning(s).`);
  console.log('----------------------------------------\n');
  process.exit(1);
}
