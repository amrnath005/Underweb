// data/technologies/index.js
// Universal Technology Registry assembling modular, evidence-driven technology signatures.

import { FRONTEND_TECHNOLOGIES } from './frontend.js';
import { LIBRARY_TECHNOLOGIES } from './libraries.js';
import { CSS_TECHNOLOGIES } from './css.js';
import { BUILD_TOOL_TECHNOLOGIES } from './build-tools.js';
import { BACKEND_TECHNOLOGIES } from './backend.js';
import { CMS_TECHNOLOGIES } from './cms.js';
import { ECOMMERCE_TECHNOLOGIES } from './ecommerce.js';
import { ANALYTICS_TECHNOLOGIES } from './analytics.js';
import { ADVERTISING_TECHNOLOGIES } from './advertising.js';
import { AUTHENTICATION_TECHNOLOGIES } from './authentication.js';
import { API_TECHNOLOGIES } from './api.js';
import { INFRASTRUCTURE_TECHNOLOGIES } from './infrastructure.js';
import { CDN_TECHNOLOGIES } from './cdn.js';
import { SECURITY_TECHNOLOGIES } from './security.js';
import { BROWSER_API_TECHNOLOGIES } from './browser-apis.js';
import { STORAGE_TECHNOLOGIES } from './storage.js';
import { PWA_TECHNOLOGIES } from './pwa.js';
import { LANGUAGE_TECHNOLOGIES } from './languages.js';

export const ALL_TECHNOLOGIES = [
  ...FRONTEND_TECHNOLOGIES,
  ...LIBRARY_TECHNOLOGIES,
  ...CSS_TECHNOLOGIES,
  ...BUILD_TOOL_TECHNOLOGIES,
  ...BACKEND_TECHNOLOGIES,
  ...CMS_TECHNOLOGIES,
  ...ECOMMERCE_TECHNOLOGIES,
  ...ANALYTICS_TECHNOLOGIES,
  ...ADVERTISING_TECHNOLOGIES,
  ...AUTHENTICATION_TECHNOLOGIES,
  ...API_TECHNOLOGIES,
  ...INFRASTRUCTURE_TECHNOLOGIES,
  ...CDN_TECHNOLOGIES,
  ...SECURITY_TECHNOLOGIES,
  ...BROWSER_API_TECHNOLOGIES,
  ...STORAGE_TECHNOLOGIES,
  ...PWA_TECHNOLOGIES,
  ...LANGUAGE_TECHNOLOGIES
];

// De-duplicate by id if any overlap exists
const techMap = new Map();
for (const tech of ALL_TECHNOLOGIES) {
  if (!techMap.has(tech.id)) {
    techMap.set(tech.id, tech);
  }
}

export const TECHNOLOGIES = Array.from(techMap.values());

export const TECH_BY_ID = new Map(TECHNOLOGIES.map(t => [t.id, t]));

export const TECH_CATEGORIES = [
  'Frontend Framework',
  'JavaScript Library',
  'CSS & UI',
  'Build Tool',
  'Backend / Server',
  'CMS',
  'E-Commerce',
  'Analytics',
  'Advertising',
  'Authentication',
  'API Technology',
  'Infrastructure',
  'Cloud & Hosting',
  'CDN / Edge',
  'Security',
  'Browser API',
  'Storage',
  'PWA',
  'Programming Language'
];

export {
  FRONTEND_TECHNOLOGIES,
  LIBRARY_TECHNOLOGIES,
  CSS_TECHNOLOGIES,
  BUILD_TOOL_TECHNOLOGIES,
  BACKEND_TECHNOLOGIES,
  CMS_TECHNOLOGIES,
  ECOMMERCE_TECHNOLOGIES,
  ANALYTICS_TECHNOLOGIES,
  ADVERTISING_TECHNOLOGIES,
  AUTHENTICATION_TECHNOLOGIES,
  API_TECHNOLOGIES,
  INFRASTRUCTURE_TECHNOLOGIES,
  CDN_TECHNOLOGIES,
  SECURITY_TECHNOLOGIES,
  BROWSER_API_TECHNOLOGIES,
  STORAGE_TECHNOLOGIES,
  PWA_TECHNOLOGIES,
  LANGUAGE_TECHNOLOGIES
};
