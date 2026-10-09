// src/security/dependency-auditor.js
// Rule-based security analysis engine evaluating client-side dependencies for known vulnerabilities and advisories.
// Operates strictly on reliably observed versions (from globals, script URLs, meta tags).
// Does NOT speculate, infer, or flag dependencies without reliable version evidence.

/**
 * Curated advisory database for prominent client-side libraries.
 * Each entry specifies: affected range evaluator, CVE identifiers, severity, summary, and fixedIn version.
 */
export const DEPENDENCY_ADVISORIES = [
  {
    name: 'jQuery',
    id: 'jquery',
    aliases: ['jquery', 'jquery.js'],
    advisories: [
      {
        cve: 'CVE-2020-11022',
        summary: 'Regex in jQuery.htmlPrefilter allows XSS during HTML execution',
        severity: 'HIGH',
        minVersion: '1.2.0',
        maxVersion: '3.4.1',
        fixedIn: '3.5.0'
      },
      {
        cve: 'CVE-2019-11358',
        summary: 'Prototype pollution in jQuery.extend(true, {}, ...)',
        severity: 'MEDIUM',
        minVersion: '1.0.0',
        maxVersion: '3.3.1',
        fixedIn: '3.4.0'
      },
      {
        cve: 'CVE-2015-9251',
        summary: 'Cross-site scripting (XSS) in jQuery.ajax with crossDomain=true and dataType=script',
        severity: 'MEDIUM',
        minVersion: '1.0.0',
        maxVersion: '2.2.4',
        fixedIn: '3.0.0'
      }
    ]
  },
  {
    name: 'Lodash',
    id: 'lodash',
    aliases: ['lodash', 'lodash.js'],
    advisories: [
      {
        cve: 'CVE-2021-23337',
        summary: 'Command injection / Prototype pollution via template function',
        severity: 'HIGH',
        minVersion: '0.1.0',
        maxVersion: '4.17.20',
        fixedIn: '4.17.21'
      },
      {
        cve: 'CVE-2019-10744',
        summary: 'Prototype pollution in defaultsDeep function',
        severity: 'HIGH',
        minVersion: '0.1.0',
        maxVersion: '4.17.11',
        fixedIn: '4.17.12'
      }
    ]
  },
  {
    name: 'Bootstrap',
    id: 'bootstrap',
    aliases: ['bootstrap', 'bootstrap.js', 'bootstrap.min.js'],
    advisories: [
      {
        cve: 'CVE-2019-8331',
        summary: 'XSS in tooltip and popover plugins via data-template attribute',
        severity: 'MEDIUM',
        minVersion: '3.0.0',
        maxVersion: '3.4.0',
        fixedIn: '3.4.1'
      },
      {
        cve: 'CVE-2018-14041',
        summary: 'XSS via collapse data-parent attribute',
        severity: 'MEDIUM',
        minVersion: '4.0.0',
        maxVersion: '4.1.1',
        fixedIn: '4.1.2'
      }
    ]
  },
  {
    name: 'AngularJS',
    id: 'angularjs',
    aliases: ['angularjs', 'angular', 'angular.js'],
    advisories: [
      {
        cve: 'CVE-2020-35769',
        summary: 'Prototype pollution in angular.copy() leading to potential bypasses',
        severity: 'HIGH',
        minVersion: '1.0.0',
        maxVersion: '1.7.9',
        fixedIn: '1.8.0'
      },
      {
        cve: 'CVE-2019-14863',
        summary: 'XSS in jqlite / DOM manipulation helpers',
        severity: 'MEDIUM',
        minVersion: '1.0.0',
        maxVersion: '1.7.8',
        fixedIn: '1.7.9'
      }
    ]
  },
  {
    name: 'Moment.js',
    id: 'momentjs',
    aliases: ['moment', 'moment.js'],
    advisories: [
      {
        cve: 'CVE-2022-31129',
        summary: 'Regular Expression Denial of Service (ReDoS) when parsing invalid rfc2822 date strings',
        severity: 'HIGH',
        minVersion: '2.0.0',
        maxVersion: '2.29.3',
        fixedIn: '2.29.4'
      }
    ]
  }
];

export class DependencyAuditor {
  /**
   * Compare two semver strings (supports major.minor.patch[-prerelease]).
   * Returns -1 if v1 < v2, 1 if v1 > v2, 0 if v1 === v2.
   * @param {string} v1
   * @param {string} v2
   * @returns {number}
   */
  static compareSemver(v1, v2) {
    if (!v1 || !v2) return 0;
    const clean1 = String(v1).replace(/^[^\d]*/, '').split('-')[0];
    const clean2 = String(v2).replace(/^[^\d]*/, '').split('-')[0];

    const parts1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
    const parts2 = clean2.split('.').map(n => parseInt(n, 10) || 0);

    const maxLen = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < maxLen; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  /**
   * Check if a version falls within [minVersion, maxVersion] inclusive.
   * @param {string} version
   * @param {string} minVersion
   * @param {string} maxVersion
   * @returns {boolean}
   */
  static isVersionInRange(version, minVersion, maxVersion) {
    if (!version) return false;
    const gteMin = this.compareSemver(version, minVersion) >= 0;
    const lteMax = this.compareSemver(version, maxVersion) <= 0;
    return gteMin && lteMax;
  }

  /**
   * Audit detected technologies with observed versions against known security advisories.
   * @param {Array<object>} detectedTechnologies - Array of EvidenceRecord objects or tech findings
   * @returns {Array<object>} Security findings adhering to the 7-property contract
   */
  static audit(detectedTechnologies = []) {
    const findings = [];
    if (!Array.isArray(detectedTechnologies)) return findings;

    for (const tech of detectedTechnologies) {
      if (!tech || !tech.name) continue;

      // Only evaluate if a reliable version was observed
      const version = tech.version || null;
      if (!version || typeof version !== 'string') continue;

      const techId = (tech.id || '').toLowerCase();
      const techName = tech.name.toLowerCase();

      // Find matching advisory definition
      const def = DEPENDENCY_ADVISORIES.find(d =>
        d.id === techId ||
        d.name.toLowerCase() === techName ||
        d.aliases.some(a => techName.includes(a) || techId.includes(a))
      );

      if (!def) continue;

      // Check each advisory
      for (const adv of def.advisories) {
        if (this.isVersionInRange(version, adv.minVersion, adv.maxVersion)) {
          findings.push({
            id: `OUTDATED_DEPENDENCY_${def.name.toUpperCase()}_${adv.cve.replace(/[^A-Z0-9]/gi, '_')}`,
            category: 'DEPENDENCIES',
            title: `Outdated Client-Side Dependency (${def.name} v${version})`,
            severity: adv.severity,
            confidence: 'HIGH',
            evidence: `Observed ${def.name} version ${version} (Affected: ${adv.minVersion} - ${adv.maxVersion})`,
            observed: `${def.name} v${version}`,
            expected: `>= ${adv.fixedIn}`,
            explanation: `The publicly loaded ${def.name} v${version} matches advisory ${adv.cve}: ${adv.summary}.`,
            description: `The publicly loaded ${def.name} v${version} matches advisory ${adv.cve}: ${adv.summary}.`,
            remediation: `Upgrade ${def.name} to version ${adv.fixedIn} or higher in production bundles.`,
            limitations: `Passive inspection confirms presence of ${def.name} v${version} in client runtime; it cannot prove whether the specific vulnerable API (${adv.summary.slice(0, 30)}...) is invoked by application code.`,
            findingType: 'POTENTIAL',
            isControlMissing: false,
            isConfirmedExploit: false,
            scoreImpact: adv.severity === 'HIGH' ? -6 : -3,
            scoreDeduction: adv.severity === 'HIGH' ? 6 : 3,
            scoreExplanation: `Deducted ${adv.severity === 'HIGH' ? 6 : 3} points for publicly exposed client dependency with known advisory (${adv.cve}).`,
            cve: adv.cve,
            fixedIn: adv.fixedIn,
            affectedUrl: tech.source || tech.website || 'Client Asset Bundle',
            resourceScope: 'SUBRESOURCE',
            partyScope: 'FIRST_PARTY',
            resourceType: 'script'
          });
        }
      }
    }

    return findings;
  }
}
