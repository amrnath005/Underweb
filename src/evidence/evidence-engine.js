// src/evidence/evidence-engine.js
// Structured confidence scoring, signal aggregation, diminishing returns, and proof explanation engine.
// Implements strict confirmed vs. inferred vs. ambiguous differentiation.
// "Never label a technology as confirmed solely because of a weak or ambiguous fingerprint."

export const EVIDENCE_TYPES = {
  WINDOW_GLOBAL: 'WINDOW_GLOBAL',
  DOM_MARKER: 'DOM_MARKER',
  HTTP_HEADER: 'HTTP_HEADER',
  SCRIPT_URL: 'SCRIPT_URL',
  STYLESHEET_URL: 'STYLESHEET_URL',
  META_TAG: 'META_TAG',
  CSS_CLASS: 'CSS_CLASS',
  COOKIE_NAME: 'COOKIE_NAME',
  STORAGE_KEY: 'STORAGE_KEY',
  API_ENDPOINT: 'API_ENDPOINT',
  BROWSER_API: 'BROWSER_API',
  PWA_MANIFEST: 'PWA_MANIFEST',
  PROTOCOL: 'PROTOCOL',
  NETWORK_BEHAVIOR: 'NETWORK_BEHAVIOR',
  INFERRED_HEURISTIC: 'INFERRED_HEURISTIC'
};

export const SIGNAL_WEIGHTS = {
  [EVIDENCE_TYPES.WINDOW_GLOBAL]: 0.95,
  [EVIDENCE_TYPES.HTTP_HEADER]: 0.90,
  [EVIDENCE_TYPES.DOM_MARKER]: 0.90,
  [EVIDENCE_TYPES.PROTOCOL]: 0.95,
  [EVIDENCE_TYPES.BROWSER_API]: 0.90,
  [EVIDENCE_TYPES.SCRIPT_URL]: 0.85,
  [EVIDENCE_TYPES.META_TAG]: 0.85,
  [EVIDENCE_TYPES.PWA_MANIFEST]: 0.85,
  [EVIDENCE_TYPES.COOKIE_NAME]: 0.80,
  [EVIDENCE_TYPES.STYLESHEET_URL]: 0.80,
  [EVIDENCE_TYPES.STORAGE_KEY]: 0.75,
  [EVIDENCE_TYPES.API_ENDPOINT]: 0.75,
  [EVIDENCE_TYPES.CSS_CLASS]: 0.75,
  [EVIDENCE_TYPES.NETWORK_BEHAVIOR]: 0.70,
  [EVIDENCE_TYPES.INFERRED_HEURISTIC]: 0.60
};

export class EvidenceRecord {
  /**
   * @param {string} id - Technology ID
   * @param {string} name - Display name
   * @param {string} category - Technology category
   * @param {object} [metadata] - Optional website/description/version
   */
  constructor(id, name, category, metadata = {}) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.website = metadata.website || '';
    this.description = metadata.description || '';
    this.version = metadata.version || null;
    this.firstObserved = Date.now();

    // Standard Evidence Collection
    this.signals = []; // Array<{ type, key, value, description, source, strength, isAmbiguous }>
    this.evidence = []; // Alias for standard schema compatibility
    this.sources = []; // Array of distinct evidence types
    this.source = 'browser'; // Primary evidence source description
    this.role = this._resolveDefaultRole(category);

    this.score = 0; // 0 - 100 percentage
    this.normalizedScore = 0.0; // 0.0 - 1.0
    this.confidence = 'LOW'; // HIGH | MEDIUM | LOW | UNKNOWN
    this.status = 'UNKNOWN'; // OBSERVED | INFERRED | UNKNOWN (for backwards-compatibility)
    this.confirmed = false; // Whether detection is confirmed
    this.isConfirmed = false; // Alias for confirmed
    this.detectionType = 'UNCONFIRMED'; // CONFIRMED | INFERRED | AMBIGUOUS | UNCONFIRMED
    this.ambiguityReasons = [];
    this.explanation = '';
  }

  _resolveDefaultRole(category) {
    if (['Frontend Framework', 'CMS', 'E-Commerce', 'Meta Framework', 'FRAMEWORK'].includes(category)) {
      return 'PRIMARY';
    }
    if (['Analytics', 'Advertising', 'CDN / Edge', 'TRACKER'].includes(category)) {
      return 'THIRD_PARTY';
    }
    return 'SECONDARY';
  }

  /**
   * Record an observed signal with automatic strength classification and duplicate damping.
   * @param {string} type - EVIDENCE_TYPES enum
   * @param {string} key - Identifier (e.g. 'window.React', 'X-Powered-By')
   * @param {string|number} value - Matched value or version
   * @param {string} description - Human-readable explanation
   * @param {string} [source] - Source file or origin (e.g. 'page-analyzer.js', 'DOM')
   * @param {string} [strength] - HIGH | MEDIUM | LOW
   * @param {boolean} [isAmbiguous=false] - Whether this signal is weak or ambiguous
   */
  addSignal(type, key, value, description, source = 'browser', strength = null, isAmbiguous = false) {
    const baseWeight = SIGNAL_WEIGHTS[type] || 0.60;
    const computedStrength = strength || (baseWeight >= 0.85 ? 'HIGH' : (baseWeight >= 0.70 ? 'MEDIUM' : 'LOW'));

    // Try extracting version if provided in value and not yet recorded
    if (!this.version && typeof value === 'string' && /^\d+(\.\d+)+([a-zA-Z0-9.\-_]+)?$/.test(value.trim())) {
      this.version = value.trim();
    }

    const signalItem = {
      type,
      key,
      value: String(value ?? ''),
      description: description || `Detected via ${type}: ${key}`,
      source: source || 'browser',
      strength: computedStrength,
      isAmbiguous: Boolean(isAmbiguous)
    };

    this.signals.push(signalItem);
    this.evidence.push(signalItem);
    if (!this.sources.includes(type)) {
      this.sources.push(type);
    }
    if (!this.source || this.source === 'browser') {
      this.source = source || type;
    }

    this.recompute();
  }

  /**
   * Recompute normalized score, status, confirmation, and confidence using diminishing returns.
   */
  recompute() {
    if (this.signals.length === 0) {
      this.score = 0;
      this.normalizedScore = 0.0;
      this.confidence = 'UNKNOWN';
      this.status = 'UNKNOWN';
      this.confirmed = false;
      this.isConfirmed = false;
      this.detectionType = 'UNCONFIRMED';
      this.explanation = 'No positive evidence signals observed.';
      return;
    }

    // Duplicate evidence damping:
    // First signal of a type gets 100% of weight.
    // Second gets 25%. Third gets 10%. Additional get 2%.
    const typeCounts = new Map();
    let nonMatchProb = 1.0;
    let hasObservedDirectly = false;
    let hasDefinitiveSignal = false;
    let allAmbiguous = true;
    this.ambiguityReasons = [];

    for (const sig of this.signals) {
      const count = typeCounts.get(sig.type) || 0;
      typeCounts.set(sig.type, count + 1);

      let dampingFactor = 1.0;
      if (count === 1) dampingFactor = 0.25;
      else if (count === 2) dampingFactor = 0.10;
      else if (count >= 3) dampingFactor = 0.02;

      // Ambiguous signal penalty
      if (sig.isAmbiguous || sig.type === EVIDENCE_TYPES.CSS_CLASS) {
        dampingFactor *= 0.5;
        this.ambiguityReasons.push(`${sig.type} "${sig.key}" is an ambiguous or non-unique pattern.`);
      } else {
        allAmbiguous = false;
      }

      const baseWeight = SIGNAL_WEIGHTS[sig.type] || 0.50;
      const effectiveWeight = baseWeight * dampingFactor;

      nonMatchProb *= (1.0 - effectiveWeight * 0.85);

      if (sig.type !== EVIDENCE_TYPES.INFERRED_HEURISTIC) {
        hasObservedDirectly = true;
      }

      // Check for definitive signal
      if (
        (sig.type === EVIDENCE_TYPES.WINDOW_GLOBAL && !sig.isAmbiguous) ||
        (sig.type === EVIDENCE_TYPES.HTTP_HEADER && !sig.isAmbiguous) ||
        (sig.type === EVIDENCE_TYPES.DOM_MARKER && !sig.isAmbiguous && sig.key && sig.key.includes('#')) ||
        (sig.type === EVIDENCE_TYPES.PROTOCOL) ||
        (sig.type === EVIDENCE_TYPES.PWA_MANIFEST) ||
        (this.version !== null)
      ) {
        hasDefinitiveSignal = true;
      }
    }

    const calculatedFraction = Math.min(0.99, Math.max(0, 1.0 - nonMatchProb));
    this.score = Math.round(calculatedFraction * 100);
    this.normalizedScore = parseFloat(calculatedFraction.toFixed(2));
    this.status = hasObservedDirectly ? 'OBSERVED' : 'INFERRED';

    // Confidence mapping
    if (this.score >= 80) {
      this.confidence = 'HIGH';
    } else if (this.score >= 50) {
      this.confidence = 'MEDIUM';
    } else if (this.score >= 20) {
      this.confidence = 'LOW';
    } else {
      this.confidence = 'UNKNOWN';
      this.status = 'UNKNOWN';
    }

    // Strict Confirmation Contract:
    // "Never label a technology as confirmed solely because of a weak or ambiguous fingerprint."
    if (!hasObservedDirectly || this.status === 'INFERRED') {
      this.confirmed = false;
      this.isConfirmed = false;
      this.detectionType = 'INFERRED';
    } else if (allAmbiguous || this.confidence !== 'HIGH') {
      this.confirmed = false;
      this.isConfirmed = false;
      this.detectionType = 'AMBIGUOUS';
    } else if (hasDefinitiveSignal || this.sources.length >= 2) {
      this.confirmed = true;
      this.isConfirmed = true;
      this.detectionType = 'CONFIRMED';
    } else {
      this.confirmed = false;
      this.isConfirmed = false;
      this.detectionType = 'UNCONFIRMED';
    }

    const signalDescriptions = this.signals.map(s => s.description).join('; ');
    const confirmLabel = this.confirmed ? 'CONFIRMED' : (this.status === 'INFERRED' ? 'INFERRED' : 'UNCONFIRMED');
    this.explanation = `${this.name} (${this.category}) [${confirmLabel}, ${this.confidence} confidence, score: ${this.score}%]. Signals: ${signalDescriptions}`;
  }
}
