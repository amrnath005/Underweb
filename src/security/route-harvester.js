// src/security/route-harvester.js
// Passively extracts frontend SPA route declarations, internal administrative paths,
// and API endpoints bundled within client scripts, requests, and DOM metadata.

export class RouteHarvester {
  static ROUTE_CATEGORIES = {
    ADMIN: 'ADMIN',
    AUTH: 'AUTH',
    PAYMENT: 'PAYMENT',
    DEBUG: 'DEBUG',
    API: 'API',
    PUBLIC: 'PUBLIC'
  };

  /**
   * Assess the privilege tier of a path.
   * @param {string} path
   * @returns {{ category: string, isPrivileged: boolean, reason: string }}
   */
  static categorizePath(path) {
    const lower = path.toLowerCase();

    // Debug / Dev inspection endpoints
    if (lower.match(/\/(debug|actuator|metrics|healthz|graphiql|graphql\/console|swagger|openapi|\.well-known)/)) {
      return { category: this.ROUTE_CATEGORIES.DEBUG, isPrivileged: true, reason: 'Debug/Developer diagnostic surface' };
    }

    // Administrative / Internal controls
    if (lower.match(/\/(admin|internal|backoffice|superadmin|moderator|staff|sysadmin|root|console)/)) {
      return { category: this.ROUTE_CATEGORIES.ADMIN, isPrivileged: true, reason: 'Administrative or internal management portal' };
    }

    // Authentication & Identity
    if (lower.match(/\/(login|signup|register|signin|auth|oauth|sso|token|password|reset|mfa|2fa)/)) {
      return { category: this.ROUTE_CATEGORIES.AUTH, isPrivileged: false, reason: 'Authentication and identity flow' };
    }

    // Billing & Payments
    if (lower.match(/\/(billing|checkout|payment|stripe|invoice|subscription|wallet|cart)/)) {
      return { category: this.ROUTE_CATEGORIES.PAYMENT, isPrivileged: false, reason: 'Financial / payment processing flow' };
    }

    // API endpoints
    if (lower.match(/^\/(api|v[0-9]+|graphql|rpc|services)\//)) {
      return { category: this.ROUTE_CATEGORIES.API, isPrivileged: false, reason: 'Application API endpoint' };
    }

    return { category: this.ROUTE_CATEGORIES.PUBLIC, isPrivileged: false, reason: 'Public view route' };
  }

  /**
   * Passively harvest declared routes from session telemetry (requests, scripts, runtime data).
   * @param {object} session
   * @returns {object} { routes, stats, findings }
   */
  static harvest(session) {
    if (!session) return { routes: [], stats: { total: 0, adminCount: 0, authCount: 0, apiCount: 0, debugCount: 0 }, findings: [] };

    const discoveredRoutes = new Map();
    const findings = [];

    const addRoute = (rawPath, source) => {
      if (!rawPath || typeof rawPath !== 'string') return;
      let path = rawPath.trim();
      // Remove query string or hash
      path = path.split('?')[0].split('#')[0];
      if (!path.startsWith('/')) path = '/' + path;

      // Filter out common non-route artifacts (file extensions that are static assets)
      if (path.match(/\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|css|map)$/i)) return;
      if (path === '/' || path.length < 2 || path.length > 120) return;
      // Filter out placeholders
      if (path.includes(' ') || path.includes('<') || path.includes('{') && path.includes('}')) return;

      if (!discoveredRoutes.has(path)) {
        const cat = this.categorizePath(path);
        discoveredRoutes.set(path, {
          path,
          category: cat.category,
          isPrivileged: cat.isPrivileged,
          reason: cat.reason,
          source
        });
      }
    };

    // 1. Harvest from known network request paths
    const requests = session.requests || [];
    for (const req of requests) {
      if (!req.url) continue;
      try {
        const u = new URL(req.url);
        if (session.primaryDomain && u.hostname.includes(session.primaryDomain)) {
          addRoute(u.pathname, 'Network Request');
        }
      } catch {}

      // If response body or content was captured in script/json
      if (req.responseBody && typeof req.responseBody === 'string') {
        this._extractRoutesFromText(req.responseBody, req.url).forEach(r => addRoute(r.path, r.source));
      }
    }

    // 2. Harvest from runtime API catalog
    const runtimeApis = (session.runtime && session.runtime.apis) || [];
    for (const api of runtimeApis) {
      if (api.url) {
        try {
          const u = new URL(api.url);
          addRoute(u.pathname, 'Runtime API Telemetry');
        } catch {
          addRoute(api.url, 'Runtime API Telemetry');
        }
      }
    }

    // 3. Harvest from HTML DOM links / script references
    const scripts = (session.runtime && session.runtime.domMetrics && session.runtime.domMetrics.scripts) || [];
    for (const s of scripts) {
      const scriptUrl = typeof s === 'string' ? s : (s && s.src);
      if (scriptUrl) {
        try {
          const u = new URL(scriptUrl);
          if (u.pathname.includes('/api/') || u.pathname.includes('/admin/')) {
            addRoute(u.pathname, 'Script Path');
          }
        } catch {}
      }
    }

    const routesList = Array.from(discoveredRoutes.values()).sort((a, b) => {
      // Prioritize ADMIN and DEBUG routes first
      if (a.isPrivileged !== b.isPrivileged) return a.isPrivileged ? -1 : 1;
      return a.path.localeCompare(b.path);
    });

    const stats = {
      total: routesList.length,
      adminCount: routesList.filter(r => r.category === this.ROUTE_CATEGORIES.ADMIN).length,
      debugCount: routesList.filter(r => r.category === this.ROUTE_CATEGORIES.DEBUG).length,
      authCount: routesList.filter(r => r.category === this.ROUTE_CATEGORIES.AUTH).length,
      apiCount: routesList.filter(r => r.category === this.ROUTE_CATEGORIES.API).length
    };

    // Generate security findings for high-risk discovered paths
    if (stats.adminCount > 0) {
      const adminExamples = routesList.filter(r => r.category === this.ROUTE_CATEGORIES.ADMIN).slice(0, 4).map(r => r.path).join(', ');
      findings.push({
        id: 'EXPOSED_ADMIN_ROUTE_SURFACE',
        category: 'ATTACK_SURFACE',
        severity: 'MEDIUM',
        title: 'Administrative Routes Declared in Client Bundles',
        affectedUrl: session.url || session.primaryDomain,
        observed: `${stats.adminCount} administrative route(s) found in client code: ${adminExamples}`,
        expected: 'Administrative endpoints isolated or restricted to authorized subdomains',
        description: `Client-side application bundles expose ${stats.adminCount} administrative or internal route declarations. Attackers can map privileged functionality and target hidden endpoints.`,
        remediation: 'Ensure backend endpoints enforce strict server-side authorization middleware regardless of frontend route visibility.',
        cwe: 'CWE-200',
        cvss: 5.3
      });
    }

    if (stats.debugCount > 0) {
      const debugExamples = routesList.filter(r => r.category === this.ROUTE_CATEGORIES.DEBUG).slice(0, 3).map(r => r.path).join(', ');
      findings.push({
        id: 'EXPOSED_DEBUG_DIAGNOSTIC_ENDPOINT',
        category: 'ATTACK_SURFACE',
        severity: 'HIGH',
        title: 'Diagnostic / Debug Endpoints Exposed in Client Code',
        affectedUrl: session.url || session.primaryDomain,
        observed: `${stats.debugCount} debug/diagnostic endpoint(s) declared: ${debugExamples}`,
        expected: 'Diagnostic consoles and Swagger/Actuator endpoints restricted or disabled in production',
        description: `The application reveals internal diagnostic routes (${debugExamples}). If unauthenticated, these endpoints can disclose internal system metadata or schema structures.`,
        remediation: 'Disable production Swagger/OpenAPI/Actuator debug consoles or enforce strong mutual authentication.',
        cwe: 'CWE-215',
        cvss: 7.5
      });
    }

    return {
      routes: routesList,
      stats,
      findings
    };
  }

  /**
   * Helper: scan raw script text for route definition patterns.
   * @param {string} text
   * @param {string} sourceUrl
   * @returns {Array<{ path: string, source: string }>}
   */
  static _extractRoutesFromText(text, sourceUrl) {
    if (!text || typeof text !== 'string') return [];
    const results = [];
    const regex = /["'](\/(?:admin|api|v[0-9]+|dashboard|internal|manage|settings|users|auth|debug|actuator)[a-zA-Z0-9_\-\/]*)["']/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({
        path: match[1],
        source: `Embedded in ${sourceUrl ? sourceUrl.split('/').pop() : 'script bundle'}`
      });
      if (results.length > 50) break; // Limit extraction per file
    }
    return results;
  }
}
