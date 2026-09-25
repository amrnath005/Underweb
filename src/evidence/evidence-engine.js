// src/evidence/evidence-engine.js
// Structured confidence scoring, signal aggregation, diminishing returns, and proof explanation engine.

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
   * @param {object} [metadata] - Optional website/description
   */
  constructor(id, name, category, metadata = {}) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.website = metadata.website || '';
    this.description = metadata.description || '';
    this.firstObserved = Date.now();

    // Standard Evidence Collection
    this.signals = []; // Array<{ type, key, value, description, source, strength }>
    this.evidence = []; // Alias for standard schema compatibility
    this.sources = []; // Array of distinct evidence types
    this.role = this._resolveDefaultRole(category);

    this.score = 0; // 0 - 100 percentage
    this.normalizedScore = 0.0; // 0.0 - 1.0
    this.confidence = 'LOW'; // HIGH | MEDIUM | LOW | UNKNOWN
    this.status = 'UNKNOWN'; // OBSERVED | INFERRED | UNKNOWN
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
   */
  addSignal(type, key, value, description, source = 'browser', strength = null) {
    const baseWeight = SIGNAL_WEIGHTS[type] || 0.60;
    const computedStrength = strength || (baseWeight >= 0.85 ? 'HIGH' : (baseWeight >= 0.70 ? 'MEDIUM' : 'LOW'));

    const signalItem = {
      type,
      key,
      value: String(value ?? ''),
      description: description || `Detected via ${type}: ${key}`,
      source: source || 'browser',
      strength: computedStrength
    };

    this.signals.push(signalItem);
    this.evidence.push(signalItem);
    if (!this.sources.includes(type)) {
      this.sources.push(type);
    }

    this.recompute();
  }

  /**
   * Recompute normalized score, status, and confidence using diminishing returns.
   */
  recompute() {
    if (this.signals.length === 0) {
      this.score = 0;
      this.normalizedScore = 0.0;
      this.confidence = 'UNKNOWN';
      this.status = 'UNKNOWN';
      this.explanation = 'No positive evidence signals observed.';
      return;
    }

    // Duplicate evidence damping:
    // First signal of a type gets 100% of weight.
    // Second gets 25%. Third gets 10%. Additional get 2%.
    const typeCounts = new Map();
    let nonMatchProb = 1.0;
    let hasObservedDirectly = false;

    for (const sig of this.signals) {
      const count = typeCounts.get(sig.type) || 0;
      typeCounts.set(sig.type, count + 1);

      let dampingFactor = 1.0;
      if (count === 1) dampingFactor = 0.25;
      else if (count === 2) dampingFactor = 0.10;
      else if (count >= 3) dampingFactor = 0.02;

      const baseWeight = SIGNAL_WEIGHTS[sig.type] || 0.50;
      const effectiveWeight = baseWeight * dampingFactor;

      nonMatchProb *= (1.0 - effectiveWeight * 0.85);

      if (sig.type !== EVIDENCE_TYPES.INFERRED_HEURISTIC) {
        hasObservedDirectly = true;
      }
    }

    const calculatedFraction = Math.min(0.99, Math.max(0, 1.0 - nonMatchProb));
    this.score = Math.round(calculatedFraction * 100);
    this.normalizedScore = parseFloat(calculatedFraction.toFixed(2));
    this.status = hasObservedDirectly ? 'OBSERVED' : 'INFERRED';

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

    const signalDescriptions = this.signals.map(s => s.description).join('; ');
    this.explanation = `${this.name} (${this.category}) confirmed via ${this.signals.length} signal${this.signals.length > 1 ? 's' : ''} [${this.status}, ${this.confidence} confidence, score: ${this.score}%]. Signals: ${signalDescriptions}`;
  }
}
