// src/security/jwt-auditor.js
// Passively inspects client-side JWT tokens stored in cookies, localStorage, or auth headers.
// Decodes headers/claims and audits for weak algorithms (alg: none), expiration, and privilege claims.

export class JwtAuditor {
  static JWT_REGEX = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]*)?/g;

  /**
   * Safely decode a Base64Url encoded string.
   * @param {string} str
   * @returns {string}
   */
  static base64UrlDecode(str) {
    if (!str || typeof str !== 'string') return '';
    try {
      // Base64Url to standard Base64
      let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4 !== 0) {
        b64 += '=';
      }
      if (typeof atob === 'function') {
        return decodeURIComponent(
          atob(b64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      } else if (typeof Buffer !== 'undefined') {
        return Buffer.from(b64, 'base64').toString('utf8');
      }
    } catch {
      try {
        if (typeof Buffer !== 'undefined') {
          return Buffer.from(str, 'base64').toString('utf8');
        }
      } catch {}
    }
    return '';
  }

  /**
   * Parse and audit a single raw JWT string.
   * @param {string} tokenString
   * @param {string} [location='Client Storage']
   * @returns {object|null}
   */
  static parseToken(tokenString, location = 'Client Storage') {
    if (!tokenString || typeof tokenString !== 'string') return null;
    const parts = tokenString.trim().split('.');
    if (parts.length < 2 || parts.length > 3) return null;

    try {
      const headerRaw = this.base64UrlDecode(parts[0]);
      const payloadRaw = this.base64UrlDecode(parts[1]);
      if (!headerRaw || !payloadRaw) return null;

      const header = JSON.parse(headerRaw);
      const payload = JSON.parse(payloadRaw);

      const nowSec = Math.floor(Date.now() / 1000);
      const exp = payload.exp ? Number(payload.exp) : null;
      const isExpired = exp ? exp < nowSec : false;
      const ttlSeconds = exp ? Math.max(0, exp - nowSec) : null;

      const alg = header.alg ? String(header.alg).toLowerCase() : 'unknown';
      const isNoneAlg = alg === 'none';

      // Identify roles / permissions
      const roles = [];
      if (payload.role) roles.push(String(payload.role));
      if (Array.isArray(payload.roles)) roles.push(...payload.roles.map(String));
      if (payload.admin === true || payload.isAdmin === true || payload.is_admin === true) {
        roles.push('ADMIN');
      }
      if (payload.permissions) {
        if (Array.isArray(payload.permissions)) roles.push(...payload.permissions.map(String));
        else roles.push(String(payload.permissions));
      }

      const userId = payload.sub || payload.uid || payload.userId || payload.email || null;

      // Mask token signature for security display
      const maskedToken = `${parts[0]}.${parts[1].slice(0, 8)}...•${parts[2] ? parts[2].slice(-4) : ''}`;

      return {
        token: tokenString,
        maskedToken,
        location,
        header,
        payload,
        algorithm: header.alg || 'UNKNOWN',
        isNoneAlg,
        isExpired,
        ttlSeconds,
        roles,
        userId,
        issuer: payload.iss || null,
        audience: payload.aud || null
      };
    } catch {
      return null;
    }
  }

  /**
   * Passively scan session telemetry for JWTs across cookies, headers, and storage.
   * @param {object} session
   * @param {Array<object>} [cookies=[]]
   * @returns {object} { tokens, findings }
   */
  static audit(session, cookies = []) {
    if (!session) return { tokens: [], findings: [] };

    const discoveredTokens = [];
    const seenSignatures = new Set();
    const findings = [];
    const cookieList = Array.isArray(cookies) ? cookies : [];

    const processCandidate = (candidate, loc) => {
      if (!candidate || typeof candidate !== 'string' || candidate.length < 24) return;
      const matches = candidate.match(this.JWT_REGEX);
      if (matches) {
        for (const rawToken of matches) {
          const parsed = this.parseToken(rawToken, loc);
          if (parsed && !seenSignatures.has(parsed.token)) {
            seenSignatures.add(parsed.token);
            discoveredTokens.push(parsed);
          }
        }
      }
    };

    // 1. Scan cookies
    for (const c of cookieList) {
      if (c && c.value) {
        processCandidate(c.value, `Cookie: ${c.name}`);
      }
    }

    // 2. Scan localStorage keys & values
    if (session.runtime && session.runtime.storage) {
      const keys = session.runtime.storage.localStorageKeys || [];
      for (const k of keys) {
        processCandidate(k, `LocalStorage Key: ${k}`);
      }
    }

    // 3. Scan network request headers (Authorization: Bearer ...)
    const requests = session.requests || [];
    for (const req of requests) {
      if (req.requestHeaders) {
        const auth = req.requestHeaders['authorization'] || req.requestHeaders['Authorization'];
        if (auth) processCandidate(auth, `Authorization Header (${req.url ? req.url.split('?')[0] : 'Request'})`);
      }
    }

    // Evaluate Security Findings for Discovered Tokens
    for (const t of discoveredTokens) {
      // Finding 1: Insecure 'none' algorithm
      if (t.isNoneAlg) {
        findings.push({
          id: 'INSECURE_JWT_ALGORITHM_NONE',
          category: 'SECURITY',
          severity: 'CRITICAL',
          title: 'Critical JWT Vulnerability: Unsigned Token (alg: "none")',
          affectedUrl: session.url || session.primaryDomain,
          observed: `Token in ${t.location} uses alg: "none" without cryptographic signature`,
          expected: 'Cryptographically signed JWT (RS256, ES256, or strong HMAC-SHA256)',
          description: `The application accepts or generates JSON Web Tokens with the "none" algorithm. Attackers can forge arbitrary administrative claims and impersonate any user without cryptographic keys.`,
          remediation: 'Reject all tokens configured with alg: "none" on the backend verification middleware.',
          cwe: 'CWE-327',
          cvss: 9.8
        });
      }

      // Finding 2: Privileged admin claim in client-side storage
      if (t.roles.includes('ADMIN') || t.roles.some(r => r.toLowerCase().includes('admin'))) {
        findings.push({
          id: 'JWT_PRIVILEGED_ADMIN_ROLE_EXPOSED',
          category: 'SECURITY',
          severity: 'INFO',
          title: 'Administrative Role Claim Observed in Client JWT',
          affectedUrl: session.url || session.primaryDomain,
          observed: `Token in ${t.location} contains administrative privileges (Roles: ${t.roles.join(', ')})`,
          expected: 'Granular server-side permission checks enforced on all endpoints',
          description: `A client-accessible token holds administrative role claims for user ${t.userId || 'identity'}. Ensure the backend enforces strict authorization on all administrative APIs.`,
          remediation: 'Ensure backend verifies token integrity and does not trust client claims without database verification.',
          cwe: 'CWE-285',
          cvss: 5.0
        });
      }

      // Finding 3: Expired token still retained
      if (t.isExpired) {
        findings.push({
          id: 'EXPIRED_JWT_TOKEN_RETAINED',
          category: 'SECURITY',
          severity: 'LOW',
          title: 'Expired JWT Token Retained in Client Storage',
          affectedUrl: session.url || session.primaryDomain,
          observed: `Token in ${t.location} expired at ${new Date(t.payload.exp * 1000).toISOString()}`,
          expected: 'Expired tokens invalidated and cleared from client storage upon expiry',
          description: `The application maintains stale or expired authentication tokens in storage.`,
          remediation: 'Clear authentication state from storage when token expiration is reached.',
          cwe: 'CWE-613',
          cvss: 3.1
        });
      }
    }

    return {
      tokens: discoveredTokens,
      findings
    };
  }
}
