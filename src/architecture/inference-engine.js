// src/architecture/inference-engine.js
// Infers high-level system architectural archetype (SPA, SSR, SSG, Jamstack, Headless CMS, PWA).

export class ArchitectureInferenceEngine {
  /**
   * Infer overarching architectural pattern from multi-signal telemetry.
   * @param {object} sessionSnapshot
   * @param {Array<object>} detectedTechnologies
   * @param {Array<object>} apis
   * @returns {{ archetype: string, confidence: string, signals: string[], explanation: string }}
   */
  static infer(sessionSnapshot, detectedTechnologies = [], apis = []) {
    const signals = [];
    const techNames = (detectedTechnologies || []).map(t => t.name.toLowerCase());
    const { runtime = {}, security = {}, requests = [] } = sessionSnapshot || {};
    const domMetrics = runtime.domMetrics || {};

    if (!sessionSnapshot || (requests.length === 0 && detectedTechnologies.length === 0)) {
      return {
        archetype: 'Awaiting Telemetry',
        confidence: 'LOW',
        signals: ['No HTTP transactions or DOM script executions captured yet for this tab.'],
        explanation: 'Underweb is ready. Click "Re-scan" in the top bar to capture live network requests, scripts, and dependencies.'
      };
    }

    let isPwa = false;
    let isSsr = false;
    let isSsg = false;
    let isSpa = false;
    let isHeadless = false;

    // Check PWA signals
    if (domMetrics.metaTags && (domMetrics.metaTags['theme-color'] || domMetrics.metaTags['mobile-web-app-capable'])) {
      isPwa = true;
      signals.push('PWA manifest/theme-color meta tags detected');
    }

    // Check SSR / SSG signals
    if (techNames.includes('next.js')) {
      if (security.headers && (security.headers['x-nextjs-cache'] || security.headers['x-vercel-cache'])) {
        isSsg = true;
        signals.push('Next.js with edge caching headers (SSG / ISR pattern)');
      } else {
        isSsr = true;
        signals.push('Next.js server runtime indicators (SSR pattern)');
      }
    } else if (techNames.includes('nuxt')) {
      isSsr = true;
      signals.push('Nuxt framework detected with server hydration');
    } else if (techNames.includes('gatsby') || techNames.includes('astro')) {
      isSsg = true;
      signals.push('Static generator (Gatsby / Astro) zero-JS island architecture');
    } else if (techNames.includes('wordpress') || techNames.includes('drupal')) {
      // Traditional server-rendered or headless?
      if (apis.length > 5) {
        isHeadless = true;
        signals.push('CMS detected in conjunction with heavy client API transactions (Headless CMS pattern)');
      } else {
        signals.push('Traditional Server-Rendered CMS with dynamic backend templates');
      }
    } else if (techNames.includes('react') || techNames.includes('vue') || techNames.includes('angular') || techNames.includes('svelte')) {
      if (apis.length > 2) {
        isSpa = true;
        signals.push('Component framework active with client-side API hydration (Single Page Application)');
      }
    }

    // Archetype resolution
    let archetype = 'Traditional Server-Rendered Application';
    let confidence = 'MEDIUM';
    let explanation = 'The website serves HTML generated on the server with standard request-response navigation.';

    if (isPwa && (isSpa || isSsr)) {
      archetype = 'Progressive Web App (PWA)';
      confidence = 'HIGH';
      explanation = 'The website utilizes client-side framework rendering, app shell architecture, and progressive web app capabilities.';
    } else if (isHeadless) {
      archetype = 'Headless CMS / Decoupled Architecture';
      confidence = 'HIGH';
      explanation = 'Content is managed via a dedicated CMS platform but rendered by a decoupled client frontend via API calls.';
    } else if (isSsr) {
      archetype = 'Server-Side Rendered (SSR) Hydrated App';
      confidence = 'HIGH';
      explanation = 'Pages are rendered to HTML on the server for instant first-paint and SEO, then hydrated by client JavaScript for interactivity.';
    } else if (isSsg) {
      archetype = 'Static Site Generation (SSG) / Jamstack';
      confidence = 'HIGH';
      explanation = 'Pre-rendered static HTML is served directly from edge CDN storage, complemented by client-side APIs for dynamic functionality.';
    } else if (isSpa) {
      archetype = 'Single Page Application (SPA)';
      confidence = 'HIGH';
      explanation = 'The application loads a single shell and renders views dynamically in the browser via client-side routing and API endpoints.';
    } else if (apis.length > 5) {
      archetype = 'API-Driven Client Architecture';
      confidence = 'MEDIUM';
      explanation = 'Heavy reliance on structured asynchronous REST/GraphQL API endpoints indicates an API-first frontend decoupled from backend data.';
    }

    return {
      archetype,
      confidence,
      signals,
      explanation
    };
  }
}
