// src/security/bounty-report-builder.js
// Generates professional, ready-to-submit Bug Bounty Reports in HackerOne/Bugcrowd Markdown format
// and OASIS Static Analysis Results Interchange Format (SARIF) for GitHub Code Scanning.

export class BountyReportBuilder {
  /**
   * Generate complete Markdown bug bounty report for a given leak or finding.
   * @param {object} finding
   * @param {object} [context={}]
   * @returns {string}
   */
  static toMarkdown(finding, context = {}) {
    if (!finding) return '';
    const now = new Date().toISOString().split('T')[0];
    const targetUrl = context.targetUrl || finding.affectedUrl || 'Target Web Application';
    const cvss = finding.cvss || (finding.severity === 'CRITICAL' ? 9.8 : finding.severity === 'HIGH' ? 8.2 : 5.3);

    return `# [${finding.severity}] ${finding.title}

**Target Asset:** \`${targetUrl}\`
**Date of Discovery:** ${now}
**Tool:** Underweb Passive Security Exoskeleton (v1.2.0)
**Vulnerability Type:** ${finding.cwe || 'CWE-200'} — ${finding.cweName || 'Exposure of Sensitive Information'}
**Severity Rating:** ${finding.severity} (CVSS v3.1 Score: ${cvss})

---

## 1. Summary
During a client-side architecture and security posture audit of \`${targetUrl}\`, an in-flight security exposure was passively detected:
> ${finding.explanation || finding.description}

This asset is exposed to any client connecting to the application and does not require elevated permissions to observe.

---

## 2. Technical Evidence & Proof of Concept (PoC)

- **Affected URL / Endpoint:** \`${finding.affectedUrl || targetUrl}\`
- **Evidence Origin:** \`${finding.evidenceSource || 'HTTP Network Response'}\`
- **Observed Artifact (Redacted for Disclosure):**
\`\`\`text
${finding.maskedValue || finding.observed || 'Sensitive pattern detected'}
\`\`\`

---

## 3. Impact Assessment
${finding.impact || 'An attacker could leverage this information disclosure to execute unauthorized operations or escalate privileges.'}

- **Confidentiality Impact:** HIGH
- **Integrity Impact:** ${finding.severity === 'CRITICAL' ? 'HIGH' : 'LOW'}
- **Availability Impact:** ${finding.severity === 'CRITICAL' ? 'HIGH' : 'NONE'}

---

## 4. Remediation Guidance
${finding.remediation || 'Remove sensitive credentials from all client-side bundles and suppress verbose server exception messages.'}

### Recommended Actions:
1. Immediately rotate and invalidate any leaked tokens or database credentials.
2. Ensure sensitive configuration variables reside strictly on the server-side environment.
3. Review build pipeline to prevent developer environment variables from being bundled into client code.

---
*Report generated automatically by Underweb — Zero-telemetry web architecture explorer.*
`;
  }

  /**
   * Generate OASIS SARIF v2.1.0 document from an array of security findings/leaks.
   * @param {Array<object>} findings
   * @param {object} [context={}]
   * @returns {object} SARIF Object
   */
  static toSarif(findings = [], context = {}) {
    const targetUrl = context.targetUrl || 'https://underweb.local';

    const rules = [];
    const results = [];
    const ruleIds = new Set();

    findings.forEach(f => {
      const ruleId = f.ruleId || f.id || 'UNDERWEB_SEC_001';
      if (!ruleIds.has(ruleId)) {
        ruleIds.add(ruleId);
        rules.push({
          id: ruleId,
          name: f.title ? f.title.replace(/\s+/g, '_') : ruleId,
          shortDescription: { text: f.title || 'Security Finding' },
          fullDescription: { text: f.explanation || f.description || f.title },
          helpUri: `https://cwe.mitre.org/data/definitions/${(f.cwe || 'CWE-200').replace('CWE-', '')}.html`,
          properties: {
            tags: ['security', 'vulnerability', f.category || 'leak'],
            precision: 'high',
            problem: {
              severity: f.severity === 'CRITICAL' ? 'error' : f.severity === 'HIGH' ? 'error' : 'warning'
            }
          }
        });
      }

      results.push({
        ruleId: ruleId,
        level: f.severity === 'CRITICAL' || f.severity === 'HIGH' ? 'error' : 'warning',
        message: {
          text: `${f.title}: ${f.explanation || f.description} (Evidence: ${f.maskedValue || f.observed})`
        },
        locations: [
          {
            physicalLocation: {
              artifactLocation: {
                uri: f.affectedUrl || targetUrl
              }
            }
          }
        ]
      });
    });

      return {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'Underweb',
              version: '1.2.0',
              informationUri: 'https://github.com/amrnath005/Underweb',
              rules: rules
            }
          },
          results: results
        }
      ]
    };
  }

  /**
   * Generate a comprehensive Bug Bounty Reconnaissance Dossier in Markdown format.
   * @param {object} security
   * @param {object} [context={}]
   * @returns {string}
   */
  static generateReconReport(security, context = {}) {
    if (!security) return '';
    const now = new Date().toISOString().split('T')[0];
    const targetUrl = context.targetUrl || security.mainUrl || 'Target Web Application';
    const routes = security.routes || [];
    const tokens = security.tokens || [];
    const tree = security.sourceTree;
    const findings = security.findings || [];

    let md = `# [Reconnaissance Dossier] Target Attack Surface & Client Security Audit\n\n`;
    md += `**Target Asset:** \`${targetUrl}\`\n`;
    md += `**Audit Date:** ${now}\n`;
    md += `**Auditor Tool:** Underweb Passive Security Exoskeleton (v1.2.0)\n`;
    md += `**Security Score:** ${security.score !== null ? security.score + '/100' : 'N/A'} (Grade ${security.grade || 'N/A'})\n\n`;
    md += `---\n\n`;

    md += `## 1. Executive Summary\n`;
    md += `During passive reconnaissance of \`${targetUrl}\`, Underweb harvested **${routes.length}** client-side routes, audited **${tokens.length}** client authentication token(s), and analyzed **${findings.length}** security finding(s).\n\n`;

    // 2. Discovered Attack Surface
    md += `## 2. Discovered Attack Surface & Route Inventory\n\n`;
    if (routes.length > 0) {
      md += `| Category | Path | Tier | Origin |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      routes.forEach(r => {
        md += `| \`${r.category}\` | \`${r.path}\` | ${r.isPrivileged ? '**PRIVILEGED**' : 'Standard'} | ${r.source} |\n`;
      });
      md += `\n`;
    } else {
      md += `*No unique route definitions harvested in passive telemetry.*\n\n`;
    }

    // 3. Client-Side JWT & Token Audit
    md += `## 3. Client Authentication & Token Telemetry\n\n`;
    if (tokens.length > 0) {
      tokens.forEach((t, i) => {
        md += `### Token #${i + 1} (${t.location})\n`;
        md += `- **Algorithm:** \`${t.algorithm}\`${t.isNoneAlg ? ' **[CRITICAL VULNERABILITY: alg: "none"]**' : ''}\n`;
        md += `- **Status:** ${t.isExpired ? 'Expired' : 'Active'}\n`;
        md += `- **User/Subject:** \`${t.userId || 'N/A'}\`\n`;
        md += `- **Roles / Claims:** ${t.roles.length > 0 ? t.roles.map(r => `\`${r}\``).join(', ') : 'None'}\n`;
        md += `- **Masked Token:** \`${t.maskedToken}\`\n\n`;
      });
    } else {
      md += `*No active JSON Web Tokens discovered in client storage or Authorization headers.*\n\n`;
    }

    // 4. Source Map Reconstruction
    if (tree && tree.asciiTree) {
      md += `## 4. Reconstructed Project File System Tree\n\n`;
      md += `**Total Files Discovered:** ${tree.totalFiles} | **Total Directories:** ${tree.totalDirectories}\n`;
      if (tree.sensitiveFiles && tree.sensitiveFiles.length > 0) {
        md += `**Sensitive File Targets (${tree.sensitiveFiles.length}):**\n`;
        tree.sensitiveFiles.forEach(f => {
          md += `- \`${f.path}\` (*${f.sensitivityReason}*)\n`;
        });
        md += `\n`;
      }
      md += `\`\`\`text\n${tree.asciiTree}\n\`\`\`\n\n`;
    }

    // 5. Findings Breakdown
    md += `## 5. Security Findings & Defect Manifest\n\n`;
    if (findings.length > 0) {
      md += `| Severity | Title | Affected Resource | CWE |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      findings.forEach(f => {
        md += `| **${f.severity}** | ${f.title} | \`${f.affectedUrl || targetUrl}\` | ${f.cwe || 'CWE-200'} |\n`;
      });
      md += `\n`;
    } else {
      md += `*Zero critical security findings observed.*\n\n`;
    }

    md += `---\n*Generated by Underweb — 100% Zero-Telemetry Passive Security Exoskeleton.*\n`;
    return md;
  }
}
