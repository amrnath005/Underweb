// src/privacy/cookie-analyzer.js
// Audits cookie security flags, lifespans, first/third-party status, and tracking markers.

export class CookieAnalyzer {
  /**
   * Audit an array of cookie objects returned from chrome.cookies.getAll().
   * @param {Array<object>} cookies
   * @param {string} pageApex
   * @returns {object} Audit report
   */
  static analyze(cookies, pageApex) {
    if (!cookies || !Array.isArray(cookies)) {
      return { total: 0, firstParty: 0, thirdParty: 0, issues: [], summary: {} };
    }

    let firstParty = 0;
    let thirdParty = 0;
    let secureCount = 0;
    let httpOnlyCount = 0;
    let sameSiteStrict = 0;
    let sameSiteLax = 0;
    let sameSiteNone = 0;
    let persistentCount = 0;
    let sessionCount = 0;
    const issues = [];

    const now = Date.now() / 1000;

    for (const c of cookies) {
      const isThird = pageApex && !c.domain.includes(pageApex);
      if (isThird) thirdParty++;
      else firstParty++;

      if (c.secure) secureCount++;
      else {
        issues.push({
          cookie: c.name,
          domain: c.domain,
          severity: 'HIGH',
          issue: 'Missing Secure flag',
          description: 'Cookie can be transmitted over unencrypted HTTP connections.'
        });
      }

      if (c.httpOnly) httpOnlyCount++;
      else {
        // Only warn for sensitive-looking names (token, auth, session, id)
        if (/token|auth|sess|id|key/i.test(c.name)) {
          issues.push({
            cookie: c.name,
            domain: c.domain,
            severity: 'MEDIUM',
            issue: 'Sensitive cookie missing HttpOnly flag',
            description: 'Can be read by client-side JavaScript, increasing risk in case of XSS.'
          });
        }
      }

      if (c.sameSite === 'strict') sameSiteStrict++;
      else if (c.sameSite === 'lax') sameSiteLax++;
      else {
        sameSiteNone++;
        if (!c.secure) {
          issues.push({
            cookie: c.name,
            domain: c.domain,
            severity: 'HIGH',
            issue: 'SameSite=None without Secure flag',
            description: 'Violates modern browser standards and risks cross-site request forgery.'
          });
        }
      }

      if (c.session) {
        sessionCount++;
      } else {
        persistentCount++;
        // Check excessive lifespan (> 400 days)
        if (c.expirationDate && (c.expirationDate - now) > 400 * 86400) {
          issues.push({
            cookie: c.name,
            domain: c.domain,
            severity: 'LOW',
            issue: 'Long-term tracking lifespan (> 400 days)',
            description: `Cookie persists until ${new Date(c.expirationDate * 1000).toLocaleDateString()}, typical of persistent tracking IDs.`
          });
        }
      }
    }

    return {
      total: cookies.length,
      firstParty,
      thirdParty,
      secureCount,
      httpOnlyCount,
      sameSiteStrict,
      sameSiteLax,
      sameSiteNone,
      persistentCount,
      sessionCount,
      issues
    };
  }
}
