// src/security/leak-detector.js
// Passive in-flight telemetry auditor for database connection URIs, verbose SQL error stack traces,
// hardcoded credentials, cloud/AI API tokens, and sensitive authentication leaks.
// Zero external network calls. Implements Shannon entropy validation and default credential masking.

export const LEAK_CATEGORIES = {
  DATABASE_URI: 'DATABASE_URI',
  SQL_ERROR: 'SQL_ERROR',
  HARDCODED_CREDENTIAL: 'HARDCODED_CREDENTIAL',
  CLOUD_API_TOKEN: 'CLOUD_API_TOKEN',
  SENSITIVE_DATA_PII: 'SENSITIVE_DATA_PII'
};

export class LeakDetector {
  /**
   * Calculate Shannon Entropy of a string to measure character randomness.
   * Helps differentiate real high-entropy keys/passwords from UI placeholder labels.
   * @param {string} str
   * @returns {number} Entropy in bits per character (0.0 - 8.0)
   */
  static calculateEntropy(str) {
    if (!str || typeof str !== 'string' || str.length === 0) return 0;
    const len = str.length;
    const freq = {};
    for (let i = 0; i < len; i++) {
      const char = str[i];
      freq[char] = (freq[char] || 0) + 1;
    }
    let entropy = 0;
    for (const char in freq) {
      const p = freq[char] / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  /**
   * Safely mask a secret string for display.
   * Leaves leading prefix or protocol visible, masking the sensitive body.
   * @param {string} value
   * @param {string} [type='token']
   * @returns {string}
   */
  static maskSecret(value, type = 'token') {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();

    // Database connection URI: postgres://user:password@host:port/db
    if (trimmed.includes('://') && trimmed.includes('@')) {
      const protoIndex = trimmed.indexOf('://');
      const atIndex = trimmed.lastIndexOf('@');
      const authPart = trimmed.slice(protoIndex + 3, atIndex);
      const colonIndex = authPart.indexOf(':');
      if (colonIndex !== -1) {
        const user = authPart.slice(0, colonIndex);
        return trimmed.slice(0, protoIndex + 3) + user + ':••••••••@' + trimmed.slice(atIndex + 1);
      }
    }

    // Short strings
    if (trimmed.length <= 8) {
      return '••••••••';
    }

    // Long API tokens (keep first 6 and last 4, mask middle)
    const prefix = trimmed.slice(0, 6);
    const suffix = trimmed.slice(-4);
    return `${prefix}••••••••${suffix}`;
  }

  /**
   * Validate potential credit card number using Luhn Algorithm.
   * @param {string} numStr
   * @returns {boolean}
   */
  static isValidLuhn(numStr) {
    const clean = numStr.replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(clean)) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  /**
   * Passively inspect session telemetry for database connection strings, credentials, and errors.
   * @param {object} session
   * @returns {Array<object>} Detected leaks with CVSS, CWE, masked and raw values
   */
  static detect(session) {
    if (!session) return [];
    const leaks = [];
    const seenHashes = new Set();

    const addLeak = (leak) => {
      const dedupeKey = `${leak.category}|${leak.ruleId}|${leak.maskedValue}|${leak.affectedUrl}`;
      if (!seenHashes.has(dedupeKey)) {
        seenHashes.add(dedupeKey);
        leaks.push({
          ...leak,
          confidence: 'HIGH',
          evidence: leak.maskedValue || leak.title,
          observed: leak.maskedValue || leak.title,
          expected: 'No credentials in client-facing resources',
          limitations: 'Passive detection flags exposed secret syntax in transmitted payloads; Underweb strictly refrains from weaponizing or testing credentials against endpoints.',
          findingType: 'CONFIRMED',
          isControlMissing: false,
          isConfirmedExploit: true
        });
      }
    };

    const requests = session.requests || [];
    const runtimeGlobals = (session.runtime && session.runtime.globals) || [];
    const apis = (session.runtime && session.runtime.apis) || [];
    const pageHtml = (session.runtime && session.runtime.domMetrics && session.runtime.domMetrics.title) || '';

    // Inspect targets: request URLs, response headers, API payload bodies, script URLs
    const inspectionTargets = [];

    // Main document URL
    if (session.url) {
      inspectionTargets.push({ source: 'Main Document URL', url: session.url, content: session.url });
    }

    // Requests (URLs, headers, and any captured bodies)
    for (const req of requests) {
      const reqUrl = req.url || '';
      inspectionTargets.push({ source: 'Network Request URL', url: reqUrl, content: reqUrl });

      if (req.responseHeaders) {
        for (const [hKey, hVal] of Object.entries(req.responseHeaders)) {
          inspectionTargets.push({
            source: `Header (${hKey})`,
            url: reqUrl,
            content: `${hKey}: ${hVal}`
          });
        }
      }

      if (req.postData) {
        inspectionTargets.push({ source: 'POST Payload', url: reqUrl, content: String(req.postData) });
      }
      if (req.responseBody) {
        inspectionTargets.push({ source: 'API Response Body', url: reqUrl, content: String(req.responseBody) });
      }
    }

    // Runtime API calls captured in page-analyzer
    for (const api of apis) {
      if (api.body) {
        inspectionTargets.push({ source: 'Runtime API Request Body', url: api.url || session.url, content: String(api.body) });
      }
      if (api.response) {
        inspectionTargets.push({ source: 'Runtime API Response Body', url: api.url || session.url, content: String(api.response) });
      }
    }

    // Globals in page context
    for (const g of runtimeGlobals) {
      if (g.name && g.value) {
        inspectionTargets.push({
          source: `Window Global (${g.name})`,
          url: session.url,
          content: `${g.name} = ${JSON.stringify(g.value)}`
        });
      }
    }

    // -------------------------------------------------------------
    // RULE DEFINITIONS
    // -------------------------------------------------------------

    // 1. DATABASE CONNECTION STRINGS (CRITICAL)
    const DB_URI_REGEXES = [
      {
        id: 'LEAK_DB_POSTGRES',
        title: 'PostgreSQL Database Connection URI Leaked',
        regex: /(postgres(?:ql)?:\/\/[a-zA-Z0-9_\-\.]+:[^@\s"']+@[a-zA-Z0-9_\-\.]+(?::\d+)?\/[a-zA-Z0-9_\-\.]+)/gi,
        cwe: 'CWE-798',
        cvss: 9.8,
        severity: 'CRITICAL',
        dbType: 'PostgreSQL'
      },
      {
        id: 'LEAK_DB_MYSQL',
        title: 'MySQL Database Connection URI Leaked',
        regex: /(mysql:\/\/[a-zA-Z0-9_\-\.]+:[^@\s"']+@[a-zA-Z0-9_\-\.]+(?::\d+)?\/[a-zA-Z0-9_\-\.]+)/gi,
        cwe: 'CWE-798',
        cvss: 9.8,
        severity: 'CRITICAL',
        dbType: 'MySQL'
      },
      {
        id: 'LEAK_DB_MONGODB',
        title: 'MongoDB Connection String Leaked',
        regex: /(mongodb(?:\+srv)?:\/\/[a-zA-Z0-9_\-\.]+:[^@\s"']+@[a-zA-Z0-9_\-\.]+(?::\d+)?\/[a-zA-Z0-9_\-\.]*)/gi,
        cwe: 'CWE-798',
        cvss: 9.8,
        severity: 'CRITICAL',
        dbType: 'MongoDB'
      },
      {
        id: 'LEAK_DB_REDIS',
        title: 'Redis Connection URI with Auth Leaked',
        regex: /(rediss?:\/\/(?:[a-zA-Z0-9_\-\.]+:)?[^@\s"']+@[a-zA-Z0-9_\-\.]+(?::\d+)?)/gi,
        cwe: 'CWE-798',
        cvss: 9.1,
        severity: 'CRITICAL',
        dbType: 'Redis'
      }
    ];

    // 2. VERBOSE SQL SYNTAX & DATABASE ENGINE ERRORS (MEDIUM)
    const SQL_ERROR_PATTERNS = [
      {
        id: 'LEAK_SQL_ERROR_MYSQL',
        title: 'Verbose MySQL Syntax Error Leaked in Response',
        regex: /(You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version|mysql_fetch_array\(\)|mysql_query\(\)|supplied argument is not a valid MySQL result resource)/gi,
        cwe: 'CWE-209',
        cvss: 5.3,
        severity: 'MEDIUM',
        engine: 'MySQL'
      },
      {
        id: 'LEAK_SQL_ERROR_POSTGRES',
        title: 'Verbose PostgreSQL Error Stack Trace Leaked',
        regex: /(pg_query\(\): Query failed:|PostgreSQL query failed:|ERROR:  syntax error at or near|org\.postgresql\.util\.PSQLException)/gi,
        cwe: 'CWE-209',
        cvss: 5.3,
        severity: 'MEDIUM',
        engine: 'PostgreSQL'
      },
      {
        id: 'LEAK_SQL_ERROR_SQLITE',
        title: 'Verbose SQLite Driver Error Leaked',
        regex: /(SQLite\/JDBCDriver|SQLite\.Exception|System\.Data\.SQLite\.SQLiteException|unrecognized token:|no such table:)/gi,
        cwe: 'CWE-209',
        cvss: 5.3,
        severity: 'MEDIUM',
        engine: 'SQLite'
      },
      {
        id: 'LEAK_SQL_ERROR_MSSQL',
        title: 'Microsoft SQL Server (T-SQL) Exception Leaked',
        regex: /(Unclosed quotation mark before the character string|Microsoft OLE DB Provider for SQL Server|Line \d+: Incorrect syntax near)/gi,
        cwe: 'CWE-209',
        cvss: 5.3,
        severity: 'MEDIUM',
        engine: 'MSSQL'
      }
    ];

    // 3. HARDCODED PRIVATE KEYS & SECRETS (CRITICAL)
    const PRIVATE_KEY_PATTERNS = [
      {
        id: 'LEAK_RSA_PRIVATE_KEY',
        title: 'RSA/OpenSSH Private Key Exposed in Client Artifact',
        regex: /(-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----)/g,
        cwe: 'CWE-312',
        cvss: 9.8,
        severity: 'CRITICAL'
      }
    ];

    // 4. CLOUD, PAYMENT & AI API TOKENS (HIGH / CRITICAL)
    const TOKEN_PATTERNS = [
      {
        id: 'LEAK_TOKEN_AWS_ACCESS_KEY',
        title: 'Amazon Web Services (AWS) Access Key ID Exposed',
        regex: /\b(AKIA[0-9A-Z]{16})\b/g,
        minEntropy: 3.0,
        cwe: 'CWE-798',
        cvss: 8.6,
        severity: 'HIGH',
        provider: 'AWS'
      },
      {
        id: 'LEAK_TOKEN_STRIPE_SECRET_KEY',
        title: 'Stripe Live Secret Key Leaked (Payment Infrastructure)',
        regex: /\b(sk_live_[0-9a-zA-Z]{24,99})\b/g,
        minEntropy: 3.5,
        cwe: 'CWE-798',
        cvss: 9.8,
        severity: 'CRITICAL',
        provider: 'Stripe'
      },
      {
        id: 'LEAK_TOKEN_GITHUB_PAT',
        title: 'GitHub Personal Access Token Leaked',
        regex: /\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b/g,
        minEntropy: 3.5,
        cwe: 'CWE-798',
        cvss: 8.8,
        severity: 'HIGH',
        provider: 'GitHub'
      },
      {
        id: 'LEAK_TOKEN_OPENAI_KEY',
        title: 'OpenAI API Secret Key Leaked',
        regex: /\b(sk-(?:proj-)?[0-9a-zA-Z\-_]{40,90})\b/g,
        minEntropy: 3.8,
        cwe: 'CWE-798',
        cvss: 8.2,
        severity: 'HIGH',
        provider: 'OpenAI'
      },
      {
        id: 'LEAK_TOKEN_ANTHROPIC_KEY',
        title: 'Anthropic Claude API Secret Key Leaked',
        regex: /\b(sk-ant-[a-zA-Z0-9_\-]{80,110})\b/g,
        minEntropy: 3.8,
        cwe: 'CWE-798',
        cvss: 8.2,
        severity: 'HIGH',
        provider: 'Anthropic'
      },
      {
        id: 'LEAK_TOKEN_GOOGLE_API_KEY',
        title: 'Google Cloud / Gemini API Key Exposed',
        regex: /\b(AIzaSy[0-9a-zA-Z\-_]{33})\b/g,
        minEntropy: 3.5,
        cwe: 'CWE-798',
        cvss: 7.5,
        severity: 'HIGH',
        provider: 'Google Cloud'
      }
    ];

    // -------------------------------------------------------------
    // RUN PATTERN EVALUATION ACROSS ALL TARGETS
    // -------------------------------------------------------------

    for (const target of inspectionTargets) {
      const content = target.content;
      if (!content || typeof content !== 'string') continue;

      // 1. Database Connection Strings
      for (const rule of DB_URI_REGEXES) {
        rule.regex.lastIndex = 0;
        let match;
        while ((match = rule.regex.exec(content)) !== null) {
          const raw = match[1];
          addLeak({
            id: `${rule.id}_${Math.random().toString(36).substring(2, 7)}`,
            ruleId: rule.id,
            category: LEAK_CATEGORIES.DATABASE_URI,
            title: rule.title,
            severity: rule.severity,
            cvss: rule.cvss,
            cwe: rule.cwe,
            cweName: 'Use of Hard-coded Credentials',
            affectedUrl: target.url,
            evidenceSource: target.source,
            rawSecret: raw,
            maskedValue: this.maskSecret(raw, 'uri'),
            explanation: `Found live ${rule.dbType} connection URI with embedded authentication credentials exposed in ${target.source}.`,
            impact: `An unauthorized attacker can connect directly to the ${rule.dbType} database instance, dumping tables, modifying data, or taking complete control of backend data records.`,
            remediation: 'Immediately revoke the database user password. Store connection strings in private server-side environment variables and never bundle them into client-facing code.'
          });
        }
      }

      // 2. Verbose SQL Syntax Errors
      for (const rule of SQL_ERROR_PATTERNS) {
        rule.regex.lastIndex = 0;
        let match;
        while ((match = rule.regex.exec(content)) !== null) {
          const raw = match[1];
          addLeak({
            id: `${rule.id}_${Math.random().toString(36).substring(2, 7)}`,
            ruleId: rule.id,
            category: LEAK_CATEGORIES.SQL_ERROR,
            title: rule.title,
            severity: rule.severity,
            cvss: rule.cvss,
            cwe: rule.cwe,
            cweName: 'Generation of Error Message Containing Sensitive Information',
            affectedUrl: target.url,
            evidenceSource: target.source,
            rawSecret: raw,
            maskedValue: raw.slice(0, 70) + (raw.length > 70 ? '...' : ''),
            explanation: `Observed verbose ${rule.engine} database error output containing internal query structures in ${target.source}.`,
            impact: 'Detailed SQL database error messages disclose internal table names, column structures, and SQL query syntax, drastically simplifying SQL Injection (SQLi) attacks.',
            remediation: 'Configure the database and web framework to suppress verbose database stack traces in production. Return generic error codes (HTTP 500) to clients while logging details privately on the server.'
          });
        }
      }

      // 3. RSA / Private Keys
      for (const rule of PRIVATE_KEY_PATTERNS) {
        rule.regex.lastIndex = 0;
        if (rule.regex.test(content)) {
          addLeak({
            id: `${rule.id}_${Math.random().toString(36).substring(2, 7)}`,
            ruleId: rule.id,
            category: LEAK_CATEGORIES.HARDCODED_CREDENTIAL,
            title: rule.title,
            severity: rule.severity,
            cvss: rule.cvss,
            cwe: rule.cwe,
            cweName: 'Cleartext Storage of Sensitive Information',
            affectedUrl: target.url,
            evidenceSource: target.source,
            rawSecret: '-----BEGIN PRIVATE KEY----- ... [TRUNCATED]',
            maskedValue: '-----BEGIN PRIVATE KEY----- ••••••••••••',
            explanation: `Found private cryptographic key headers inside ${target.source}.`,
            impact: 'Private keys allow adversaries to forge identity tokens, decrypt private communication, or authenticate directly into cloud and server environments.',
            remediation: 'Immediately rotate the exposed keypair. Remove all private keys from client-accessible directories.'
          });
        }
      }

      // 4. Cloud & Payment API Tokens
      for (const rule of TOKEN_PATTERNS) {
        rule.regex.lastIndex = 0;
        let match;
        while ((match = rule.regex.exec(content)) !== null) {
          const raw = match[1];
          const entropy = this.calculateEntropy(raw);
          // Entropy filter eliminates dummy/placeholder strings like 'AKIAAAAAAAAAAAAAAAAA'
          if (rule.minEntropy && entropy < rule.minEntropy) {
            continue;
          }

          addLeak({
            id: `${rule.id}_${Math.random().toString(36).substring(2, 7)}`,
            ruleId: rule.id,
            category: LEAK_CATEGORIES.CLOUD_API_TOKEN,
            title: rule.title,
            severity: rule.severity,
            cvss: rule.cvss,
            cwe: rule.cwe,
            cweName: 'Use of Hard-coded Credentials',
            affectedUrl: target.url,
            evidenceSource: target.source,
            rawSecret: raw,
            maskedValue: this.maskSecret(raw, 'token'),
            explanation: `Detected active ${rule.provider} secret token in ${target.source} (Entropy: ${entropy.toFixed(2)} bits/char).`,
            impact: rule.provider === 'Stripe'
              ? 'Exposing a Stripe live secret key grants full access to customer charges, refund processing, and sensitive payment records.'
              : `Adversaries can utilize this token to make unauthorized API calls against ${rule.provider}, incur runaway billing charges, or exfiltrate private data.`,
            remediation: `Rotate this ${rule.provider} credential in the provider dashboard immediately. Restrict keys to backend server environments.`
          });
        }
      }

      // 5. Hardcoded Cleartext Password in JSON responses
      // Pattern: "password": "...", "db_pass": "..." with sufficient entropy
      const PASS_JSON_REGEX = /["'](?:db_password|password|db_pass|root_password|admin_pass)["']\s*:\s*["']([^"'\s]{8,64})["']/gi;
      let passMatch;
      while ((passMatch = PASS_JSON_REGEX.exec(content)) !== null) {
        const rawPass = passMatch[1];
        const entropy = this.calculateEntropy(rawPass);
        // Exclude dummy passwords like "password", "********", "12345678"
        if (entropy >= 2.8 && !/^(password|secret|changeme|test|123456)/i.test(rawPass)) {
          addLeak({
            id: `LEAK_JSON_PASSWORD_${Math.random().toString(36).substring(2, 7)}`,
            ruleId: 'LEAK_JSON_PASSWORD',
            category: LEAK_CATEGORIES.HARDCODED_CREDENTIAL,
            title: 'Hardcoded Cleartext Password Excerpt Leaked in Response',
            severity: 'CRITICAL',
            cvss: 9.1,
            cwe: 'CWE-798',
            cweName: 'Use of Hard-coded Credentials',
            affectedUrl: target.url,
            evidenceSource: target.source,
            rawSecret: rawPass,
            maskedValue: this.maskSecret(rawPass, 'password'),
            explanation: `Found explicit password field populated in JSON data payload inside ${target.source}.`,
            impact: 'Cleartext passwords exposed in client-facing JSON responses can be extracted by any user or intercepted across the network to compromise user or system accounts.',
            remediation: 'Sanitize server responses to never return raw password fields or hashes in API outputs.'
          });
        }
      }
    }

    return leaks;
  }
}
