// tests/security-pipeline.test.js
// Automated verification suite for Underweb's evidence-driven website analysis pipeline,
// passive technology detection, defensive security observations, boundary enforcement, and scoring model.

import { FingerprintEngine } from '../src/detection/fingerprint-engine.js';
import { SecurityAnalyzer, SECURITY_STATES } from '../src/security/security-analyzer.js';
import { HeaderAnalyzer } from '../src/security/header-analyzer.js';
import { MixedContentDetector } from '../src/security/mixed-content.js';
import { LeakDetector } from '../src/security/leak-detector.js';
import { DependencyAuditor } from '../src/security/dependency-auditor.js';
import { BoundaryEnforcer } from '../src/security/boundary-enforcer.js';
import { ActiveVerificationInterface } from '../src/security/active-verifier.js';
import { EvidenceRecord, EVIDENCE_TYPES } from '../src/evidence/evidence-engine.js';

import {
  modernFrontendFixture,
  secureHeadersFixture,
  missingHeadersFixture,
  thirdPartyScriptsFixture,
  exposedDummyCredentialFixture,
  ambiguousFingerprintsFixture
} from './fixtures/synthetic-pages.js';

export function runSecurityPipelineTests(assert, suite) {
  // =========================================================================
  // SUITE 1: Passive Technology Detection & Ambiguous Fingerprint Suppression
  // =========================================================================
  suite('Passive Technology Detection & Fingerprint Confirmation', () => {
    // 1. Modern Frontend application detection
    const detectedModern = FingerprintEngine.detect(modernFrontendFixture);
    const modernMap = new Map(detectedModern.map(d => [d.id, d]));

    assert(modernMap.has('nextjs'), 'Correctly detects Next.js in modern frontend fixture');
    const nextjs = modernMap.get('nextjs');
    assert(nextjs.confirmed === true && nextjs.isConfirmed === true, 'Next.js is confirmed with high-confidence signals');
    assert(nextjs.confidence === 'HIGH', 'Next.js confidence is HIGH');
    assert(nextjs.version === '14.2.3', 'Reliably extracted Next.js version 14.2.3');
    assert(nextjs.evidence.length >= 2, 'Next.js contains verifiable evidence signals');
    assert(nextjs.source && nextjs.sources.length > 0, 'Records evidence source');

    // 2. Implied vs direct
    assert(modernMap.has('react'), 'Infers or detects React');
    const react = modernMap.get('react');
    assert(react.confidence === 'HIGH', 'React confidence is HIGH');

    // 3. Ambiguous fingerprint suppression
    // A page with only utility CSS classes must NEVER be labeled as confirmed!
    const detectedAmbiguous = FingerprintEngine.detect(ambiguousFingerprintsFixture);
    const tw = detectedAmbiguous.find(d => d.id === 'tailwindcss');
    if (tw) {
      assert(tw.confirmed === false, 'CRITICAL: Ambiguous CSS-only fingerprint is NOT marked confirmed');
      assert(tw.isConfirmed === false, 'isConfirmed is false for weak CSS-only signal');
      assert(tw.detectionType === 'AMBIGUOUS' || tw.detectionType === 'UNCONFIRMED', 'detectionType is AMBIGUOUS for non-unique CSS class');
      assert(tw.ambiguityReasons.length > 0, 'Explains ambiguity reasons for non-unique signal');
    } else {
      assert(true, 'Weak CSS-only fingerprint safely filtered or unconfirmed');
    }

    // 4. Standalone EvidenceRecord confirmation contract
    const weakRecord = new EvidenceRecord('custom-lib', 'CustomLib', 'JavaScript Library');
    weakRecord.addSignal(EVIDENCE_TYPES.CSS_CLASS, 'custom-class', 'matched', 'Generic class', 'DOM', 'LOW', true);
    assert(weakRecord.confirmed === false, 'EvidenceRecord with single ambiguous signal is NOT confirmed');
    assert(weakRecord.isConfirmed === false, 'isConfirmed is false on ambiguous signal');

    const strongRecord = new EvidenceRecord('verified-lib', 'VerifiedLib', 'Frontend Framework');
    strongRecord.addSignal(EVIDENCE_TYPES.WINDOW_GLOBAL, 'window.VerifiedLib', '2.0.0', 'Definitive global', 'page-analyzer.js', 'HIGH', false);
    strongRecord.addSignal(EVIDENCE_TYPES.DOM_MARKER, '#verified-root', 'present', 'Unique DOM root', 'DOM', 'HIGH', false);
    assert(strongRecord.confirmed === true, 'EvidenceRecord with definitive signals is CONFIRMED');
    assert(strongRecord.confidence === 'HIGH', 'Confidence is HIGH');
    assert(strongRecord.version === '2.0.0', 'Version 2.0.0 is captured');
  });

  // =========================================================================
  // SUITE 2: Defensive Security Observations & 7-Property Schema Validation
  // =========================================================================
  suite('Defensive Security Observations & Finding Schema Contract', () => {
    // 1. Analyze page with missing security headers
    const missingRes = SecurityAnalyzer.analyze(missingHeadersFixture, []);
    assert(missingRes.findings.length >= 3, 'Identifies multiple missing defensive security controls');

    // Validate that EVERY finding conforms strictly to the 7-property contract
    const requiredKeys = ['title', 'severity', 'evidence', 'confidence', 'explanation', 'remediation', 'limitations'];
    for (const f of missingRes.findings) {
      for (const k of requiredKeys) {
        assert(f[k] !== undefined && f[k] !== null && String(f[k]).length > 0, `Finding "${f.title}" defines required property "${k}"`);
      }
      assert(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].includes(f.severity), `Finding "${f.title}" has valid severity (${f.severity})`);
      assert(['HIGH', 'MEDIUM', 'LOW'].includes(f.confidence), `Finding "${f.title}" has valid confidence (${f.confidence})`);
    }

    // 2. Distinguish missing controls from confirmed exploit paths
    const missingCsp = missingRes.findings.find(f => f.id === 'MISSING_CSP' || f.title.includes('Content-Security-Policy'));
    assert(missingCsp !== undefined, 'Flags missing Content-Security-Policy header');
    assert(missingCsp.isControlMissing === true, 'Tags missing CSP as a missing control (isControlMissing = true)');
    assert(missingCsp.isConfirmedExploit === false, 'Missing CSP is NOT marked as a confirmed exploit path');
    assert(missingCsp.findingType === 'POTENTIAL', 'Finding type is POTENTIAL');
    assert(missingCsp.limitations.includes('defense-in-depth') || missingCsp.limitations.includes('Passive'), 'Explains passive limitation in finding');

    // 3. Website with exemplary security headers receives Grade A and 0 deductions
    const secureRes = SecurityAnalyzer.analyze(secureHeadersFixture, []);
    assert(secureRes.grade === 'A', 'Secure origin receives Grade A');
    assert(secureRes.score >= 90, 'Score is >= 90');
    assert(secureRes.summary.headerScore === 30, 'Full 30/30 header score preserved');
    assert(secureRes.summary.transportScore === 25, 'Full 25/25 transport score preserved');
  });

  // =========================================================================
  // SUITE 3: Outdated Client Dependencies & CVE Advisory Engine
  // =========================================================================
  suite('Outdated Client Dependencies & Vulnerability Advisories', () => {
    // 1. Outdated jQuery 2.1.4 (affected by CVE-2020-11022, CVE-2015-9251)
    const vulnerableTechs = [
      {
        id: 'jquery',
        name: 'jQuery',
        version: '2.1.4',
        source: 'https://example.com/js/jquery-2.1.4.min.js'
      },
      {
        id: 'lodash',
        name: 'Lodash',
        version: '4.17.11',
        source: 'https://example.com/js/lodash.js'
      }
    ];

    const advisories = DependencyAuditor.audit(vulnerableTechs);
    assert(advisories.length >= 2, 'Discovers known CVE advisories for outdated jQuery and Lodash');
    
    const jqAdv = advisories.find(a => a.id.includes('JQUERY'));
    assert(jqAdv !== undefined, 'Returns jQuery advisory finding');
    assert(jqAdv.cve.startsWith('CVE-'), 'Attributed to specific CVE identifier');
    assert(jqAdv.fixedIn.length > 0, 'Identifies fixed version');
    assert(jqAdv.remediation.includes('Upgrade'), 'Provides actionable remediation guidance');
    assert(jqAdv.limitations.includes('Passive'), 'Explains passive limitation');
    assert(jqAdv.isConfirmedExploit === false, 'Advisory is NOT flagged as confirmed exploit path');

    // 2. Safe up-to-date dependency produces 0 advisories
    const safeTechs = [
      { id: 'jquery', name: 'jQuery', version: '3.6.0' },
      { id: 'lodash', name: 'Lodash', version: '4.17.21' }
    ];
    const safeAdvisories = DependencyAuditor.audit(safeTechs);
    assert(safeAdvisories.length === 0, 'No false positives for patched, up-to-date dependencies');

    // 3. Dependency without detected version produces 0 advisories (NO GUESSING)
    const unversionedTechs = [
      { id: 'jquery', name: 'jQuery', version: null }
    ];
    const unversionedAdvisories = DependencyAuditor.audit(unversionedTechs);
    assert(unversionedAdvisories.length === 0, 'Does NOT guess or fabricate advisories when version is unobserved');
  });

  // =========================================================================
  // SUITE 4: Inspection Boundaries & Passive Guarantees
  // =========================================================================
  suite('Inspection Boundaries & Passive Policy Guarantees', () => {
    // 1. Boundary policy declaration
    const policy = BoundaryEnforcer.getBoundaryPolicy();
    assert(policy.mode === 'STRICT_PASSIVE', 'Boundary policy operates in STRICT_PASSIVE mode');
    assert(policy.activeProbingPermitted === false, 'Active probing is strictly forbidden');
    assert(policy.rules.length >= 7, 'Enforces all mandatory boundary constraints');

    // 2. Rejection of active operations
    const activeCheck = BoundaryEnforcer.validateOperation({ type: 'INTRUSIVE_PROBE' });
    assert(activeCheck.allowed === false, 'Rejects intrusive probe operation');
    assert(activeCheck.reason.includes('passive'), 'Explains passive boundary reason');

    const passiveCheck = BoundaryEnforcer.validateOperation({ type: 'PASSIVE_OBSERVE' });
    assert(passiveCheck.allowed === true, 'Allows legitimate passive observation');

    // 3. Passive tagging of discovered credentials
    const dummyFinding = { id: 'LEAK_KEY', rawSecret: 'synthetic_secret_123' };
    const tagged = BoundaryEnforcer.tagPassiveFinding(dummyFinding);
    assert(tagged.accessPermitted === false, 'Access is strictly not permitted using observed credentials');
    assert(tagged.boundaryClassification === 'PASSIVE_OBSERVATION_ONLY', 'Classified as PASSIVE_OBSERVATION_ONLY');

    // 4. ActiveVerificationInterface disabled by default
    const verifier = new ActiveVerificationInterface();
    assert(verifier.enabled === false, 'Active verification is DISABLED by default');
    
    const checkThirdParty = verifier.canVerify('https://external-site.com/api');
    assert(checkThirdParty.permitted === false, 'Cannot verify external third-party targets');
    assert(checkThirdParty.reason.includes('disabled by default'), 'Explains default-disabled state');

    // 5. ActiveVerificationInterface rejects unauthorized non-local hosts even if enabled
    const enabledVerifier = new ActiveVerificationInterface({ enabled: true, authorizationToken: 'test-token' });
    const checkUnauthorizedHost = enabledVerifier.canVerify('https://google.com');
    assert(checkUnauthorizedHost.permitted === false, 'Rejects public third-party host even when enabled');

    const checkLocalHost = enabledVerifier.canVerify('http://localhost:3000');
    assert(checkLocalHost.permitted === true, 'Permits local test application when explicitly enabled and authorized');
  });

  // =========================================================================
  // SUITE 5: Documented Security Scoring & No Default Scores
  // =========================================================================
  suite('Documented Security Scoring Engine & Evidence Grounding', () => {
    // 1. Insufficient evidence displays "Not enough data" instead of inventing a score
    const emptySession = { url: '', requests: [] };
    const insufficientRes = SecurityAnalyzer.analyze(emptySession, []);
    assert(insufficientRes.score === null, 'Score is null when evidence is insufficient');
    assert(insufficientRes.scoreDisplay === 'Not enough data', 'scoreDisplay is "Not enough data"');
    assert(insufficientRes.assessmentState === SECURITY_STATES.INSUFFICIENT_EVIDENCE, 'State is INSUFFICIENT_EVIDENCE');
    assert(insufficientRes.grade === 'N/A', 'Grade is N/A for insufficient data');

    // 2. No arbitrary default score (e.g. 10/100)
    assert(insufficientRes.score !== 10, 'CRITICAL: Never assigns an arbitrary default score like 10/100');

    // 3. Documented score impacts on every finding
    const missingRes = SecurityAnalyzer.analyze(missingHeadersFixture, []);
    for (const f of missingRes.findings) {
      assert(typeof f.scoreDeduction === 'number', `Finding "${f.title}" defines explicit scoreDeduction`);
      assert(typeof f.scoreExplanation === 'string' && f.scoreExplanation.length > 0, `Finding "${f.title}" explains its score impact`);
    }

    // 4. Avoid double-counting related findings
    // Clickingjacking evaluated as a single unified check: if CSP frame-ancestors is present, XFO is not penalized.
    const cspFrameSession = {
      url: 'https://cj-test.local/',
      security: {
        isHttps: true,
        headers: { 'content-security-policy': "frame-ancestors 'none'" }
      },
      requests: [{ url: 'https://cj-test.local/', type: 'main_frame', responseHeaders: { 'content-security-policy': "frame-ancestors 'none'" } }]
    };
    const cjRes = SecurityAnalyzer.analyze(cspFrameSession, []);
    const cjFindings = cjRes.findings.filter(f => f.header === 'Clickjacking Protection');
    assert(cjFindings.length === 0, 'No clickjacking deduction when frame-ancestors is configured');

    // 5. Breakdown of confirmed vs potential findings
    assert(missingRes.findingStats !== undefined, 'Reports findingStats summary');
    assert(typeof missingRes.findingStats.confirmedCount === 'number', 'Reports confirmed finding count');
    assert(typeof missingRes.findingStats.potentialCount === 'number', 'Reports potential finding count');
  });

  // =========================================================================
  // SUITE 6: Third-Party Request Classification & Exposed Dummy Credentials
  // =========================================================================
  suite('Third-Party Classification & Exposed Dummy Credentials', () => {
    // 1. Third-party script loading
    const tpRes = SecurityAnalyzer.analyze(thirdPartyScriptsFixture, []);
    assert(tpRes.findings !== undefined, 'Audits third-party fixture cleanly');

    // 2. Dummy credentials detection
    const leakRes = LeakDetector.detect(exposedDummyCredentialFixture);
    assert(leakRes.length >= 3, 'Detects synthetic PostgreSQL URI, Stripe secret key, OpenAI secret key, and SQL error');

    const pgLeak = leakRes.find(l => l.ruleId === 'LEAK_DB_POSTGRES');
    assert(pgLeak !== undefined, 'Detects dummy PostgreSQL connection URI');
    assert(pgLeak.maskedValue.includes('test_user:••••••••@127.0.0.1:5432'), 'Correctly masks dummy database credentials');
    assert(pgLeak.severity === 'CRITICAL', 'Classifies database leak as CRITICAL');
    assert(pgLeak.cwe === 'CWE-798', 'Associates CWE-798 Hard-coded Credentials');

    const stripeLeak = leakRes.find(l => l.ruleId === 'LEAK_TOKEN_STRIPE_SECRET_KEY');
    assert(stripeLeak !== undefined, 'Detects dummy Stripe live key');
    assert(stripeLeak.maskedValue.startsWith('sk_liv') && stripeLeak.maskedValue.includes('••••••••'), 'Masks Stripe secret key token');

    // 3. Error trace detection
    const sqlError = leakRes.find(l => l.category === 'SQL_ERROR');
    assert(sqlError !== undefined, 'Detects verbose SQL syntax error trace');
    assert(sqlError.cwe === 'CWE-209', 'Associates CWE-209 Information Exposure Through Error Message');
  });

  // =========================================================================
  // SUITE 7: Error Handling & Boundary Edge Cases
  // =========================================================================
  suite('Pipeline Robustness & Error Handling', () => {
    // 1. Null / undefined handling across all pipeline functions
    assert(FingerprintEngine.detect(null).length === 0, 'FingerprintEngine handles null session');
    assert(SecurityAnalyzer.analyze(null).assessmentState === 'INSUFFICIENT_EVIDENCE', 'SecurityAnalyzer handles null session');
    assert(HeaderAnalyzer.analyze(null).hasObservedHeaders === false, 'HeaderAnalyzer handles null headers');
    assert(MixedContentDetector.detect(null, true).length === 0, 'MixedContentDetector handles null requests');
    assert(LeakDetector.detect(null).length === 0, 'LeakDetector handles null session');
    assert(DependencyAuditor.audit(null).length === 0, 'DependencyAuditor handles null dependencies');

    // 2. Malformed URLs
    const malformedSession = {
      url: 'not-a-valid-url',
      security: { isHttps: false, headers: {} },
      requests: [{ url: ':::invalid' }]
    };
    const malformedRes = SecurityAnalyzer.analyze(malformedSession, []);
    assert(malformedRes !== null, 'SecurityAnalyzer handles malformed URL gracefully without throw');

    // 3. Empty cookies array
    const emptyCookieRes = SecurityAnalyzer.analyze(secureHeadersFixture, null);
    assert(emptyCookieRes.categories.cookies.status === 'PASS', 'Handles null rawCookies gracefully');
  });
}
