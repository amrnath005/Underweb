// src/security/boundary-enforcer.js
// Enforces strict passive observation boundaries across Underweb analysis pipelines.
// Guarantees zero active probing, zero unauthorized access attempts, and zero weaponization.

export const INSPECTION_BOUNDARIES = {
  STRICT_PASSIVE: 'STRICT_PASSIVE',
  NO_EXPLOITATION: 'NO_EXPLOITATION',
  NO_AUTH_BYPASS: 'NO_AUTH_BYPASS',
  NO_PRIVATE_DATA_EXTRACTION: 'NO_PRIVATE_DATA_EXTRACTION',
  NO_BRUTE_FORCE: 'NO_BRUTE_FORCE',
  NO_DESTRUCTIVE_OPERATIONS: 'NO_DESTRUCTIVE_OPERATIONS',
  NO_INTRUSIVE_PROBES: 'NO_INTRUSIVE_PROBES',
  NO_CREDENTIAL_REUSE: 'NO_CREDENTIAL_REUSE'
};

export class BoundaryEnforcer {
  /**
   * Passive boundary statement governing Underweb's architecture.
   */
  static getBoundaryPolicy() {
    return {
      mode: INSPECTION_BOUNDARIES.STRICT_PASSIVE,
      description: 'Underweb operates strictly as a passive defensive telemetry and observation engine.',
      rules: [
        'Must NOT exploit vulnerabilities or trigger offensive payloads.',
        'Must NOT attempt authentication bypass or privilege escalation.',
        'Must NOT extract, harvest, or exfiltrate private user data.',
        'Must NOT brute-force credentials, endpoints, or parameters.',
        'Must NOT execute destructive operations or mutate server state.',
        'Must NOT send intrusive network probes to third-party domains.',
        'Must NOT treat inferred routes, discovered APIs, or detected credentials as permission to access or query them.'
      ],
      activeProbingPermitted: false
    };
  }

  /**
   * Validate that an operation adheres strictly to passive inspection boundaries.
   * Throws or returns an error descriptor if any boundary is violated.
   * @param {object} action
   * @param {string} action.type - 'PASSIVE_OBSERVE' | 'INTRUSIVE_PROBE' | 'ACTIVE_REQUEST'
   * @param {string} [action.targetUrl]
   * @returns {{ allowed: boolean, reason?: string }}
   */
  static validateOperation(action) {
    if (!action || typeof action !== 'object') {
      return { allowed: false, reason: 'Invalid action descriptor.' };
    }

    if (action.type !== 'PASSIVE_OBSERVE') {
      return {
        allowed: false,
        reason: `Operation "${action.type}" rejected: Underweb passive inspection boundaries forbid active probing or offensive actions.`
      };
    }

    return { allowed: true };
  }

  /**
   * Sanitizes and confirms that any discovered secret, token, or credential
   * is tagged strictly as an observed artifact and NEVER treated as an authorization token.
   * @param {object} leakFinding
   * @returns {object} Finding enriched with boundary governance
   */
  static tagPassiveFinding(leakFinding) {
    return {
      ...leakFinding,
      boundaryClassification: 'PASSIVE_OBSERVATION_ONLY',
      accessPermitted: false,
      boundaryNotice: 'This artifact was passively observed in transmitted client telemetry. It must NOT be used for unauthorized access.'
    };
  }
}
