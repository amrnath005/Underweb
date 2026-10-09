// src/security/active-verifier.js
// Dedicated, isolated active verification interface designed strictly for local test applications
// or explicitly authorized testing environments (e.g., localhost, test fixtures).
// Disabled by default (enabled = false, authorized = false).

export const AUTHORIZED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0'
]);

export class ActiveVerificationInterface {
  /**
   * @param {object} [config={}]
   * @param {boolean} [config.enabled=false] - Explicit opt-in flag, defaults to false
   * @param {string} [config.authorizationToken=null] - User confirmation token
   * @param {Array<string>} [config.allowedOrigins=[]] - Explicitly permitted origins
   */
  constructor(config = {}) {
    // Disabled by default
    this.enabled = config.enabled === true;
    this.authorizationToken = config.authorizationToken || null;
    this.allowedOrigins = new Set(config.allowedOrigins || []);
    this.auditLog = [];
  }

  /**
   * Check if active verification is currently permissible for a given target URL.
   * @param {string} targetUrl
   * @returns {{ permitted: boolean, reason: string }}
   */
  canVerify(targetUrl) {
    if (!this.enabled) {
      return {
        permitted: false,
        reason: 'Active verification is disabled by default. Underweb strictly enforces passive observation boundaries.'
      };
    }

    if (!this.authorizationToken) {
      return {
        permitted: false,
        reason: 'Active verification requires an explicit authorization token from the test operator.'
      };
    }

    if (!targetUrl) {
      return { permitted: false, reason: 'Target URL is required.' };
    }

    let hostname = '';
    try {
      hostname = new URL(targetUrl).hostname.toLowerCase();
    } catch {
      return { permitted: false, reason: 'Malformed target URL.' };
    }

    // Must be local or in explicitly authorized origins
    const isLocal = AUTHORIZED_HOSTS.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.test');
    const isExplicitlyAllowed = this.allowedOrigins.has(hostname);

    if (!isLocal && !isExplicitlyAllowed) {
      return {
        permitted: false,
        reason: `Target "${hostname}" is not a recognized local or authorized test environment. Active verification cannot target third-party hosts.`
      };
    }

    return { permitted: true, reason: 'Target is within an authorized local test environment.' };
  }

  /**
   * Controlled test execution interface for local test suites and authorized environments.
   * Rejects any non-passive calls to third-party or unauthorized origins.
   * @param {string} targetUrl
   * @param {object} probeOptions
   * @returns {Promise<object>} Verification result
   */
  async verifyEndpoint(targetUrl, probeOptions = {}) {
    const check = this.canVerify(targetUrl);
    if (!check.permitted) {
      const entry = {
        timestamp: Date.now(),
        targetUrl,
        success: false,
        blocked: true,
        reason: check.reason
      };
      this.auditLog.push(entry);
      return entry;
    }

    // Record verified test run in authorized environment
    const result = {
      timestamp: Date.now(),
      targetUrl,
      success: true,
      blocked: false,
      environment: 'AUTHORIZED_LOCAL_ENVIRONMENT',
      details: 'Active verification simulated within authorized test boundary.'
    };
    this.auditLog.push(result);
    return result;
  }
}
