// src/evidence/evidence-engine.js
// Structured confidence scoring, signal aggregation, and proof explanation engine.

export const EVIDENCE_TYPES = {
  WINDOW_GLOBAL: 'WINDOW_GLOBAL',
  DOM_MARKER: 'DOM_MARKER',
  HTTP_HEADER: 'HTTP_HEADER',
  SCRIPT_URL: 'SCRIPT_URL',
  META_TAG: 'META_TAG',
  CSS_CLASS: 'CSS_CLASS',
  NETWORK_BEHAVIOR: 'NETWORK_BEHAVIOR',
  INFERRED_HEURISTIC: 'INFERRED_HEURISTIC'
};

const SIGNAL_WEIGHTS = {
  [EVIDENCE_TYPES.WINDOW_GLOBAL]: 1.0,
  [EVIDENCE_TYPES.HTTP_HEADER]: 0.95,
  [EVIDENCE_TYPES.DOM_MARKER]: 0.90,
  [EVIDENCE_TYPES.SCRIPT_URL]: 0.85,
  [EVIDENCE_TYPES.META_TAG]: 0.85,
  [EVIDENCE_TYPES.CSS_CLASS]: 0.75,
  [EVIDENCE_TYPES.NETWORK_BEHAVIOR]: 0.70,
  [EVIDENCE_TYPES.INFERRED_HEURISTIC]: 0.40
};

export class EvidenceRecord {
  /**
   * @param {string} id - Technology or entity ID
   * @param {string} name - Display name
   * @param {string} category - Tech category
   */
  constructor(id, name, category) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.signals = []; // Array<{ type, key, value, description }>
    this.score = 0;
    this.confidence = 'LOW'; // HIGH | MEDIUM | LOW
    this.status = 'UNKNOWN'; // OBSERVED | INFERRED | UNKNOWN
    this.explanation = '';
  }

  addSignal(type, key, value, description) {
    this.signals.push({
      type,
      key,
      value: String(value),
      description: description || `Detected via ${type}: ${key}`
    });
    this.recompute();
  }

  recompute() {
    if (this.signals.length === 0) {
      this.score = 0;
      this.confidence = 'LOW';
      this.status = 'UNKNOWN';
      this.explanation = 'No positive signals observed.';
      return;
    }

    // Cumulative probabilistic confidence formula: 1 - product(1 - weight_i)
    let nonMatchProb = 1.0;
    let hasObservedDirectly = false;

    for (const sig of this.signals) {
      const weight = SIGNAL_WEIGHTS[sig.type] || 0.5;
      nonMatchProb *= (1.0 - weight * 0.85);

      if (
        sig.type === EVIDENCE_TYPES.WINDOW_GLOBAL ||
        sig.type === EVIDENCE_TYPES.HTTP_HEADER ||
        sig.type === EVIDENCE_TYPES.DOM_MARKER ||
        sig.type === EVIDENCE_TYPES.SCRIPT_URL ||
        sig.type === EVIDENCE_TYPES.META_TAG
      ) {
        hasObservedDirectly = true;
      }
    }

    this.score = parseFloat((1.0 - nonMatchProb).toFixed(2));
    this.status = hasObservedDirectly ? 'OBSERVED' : 'INFERRED';

    if (this.score >= 0.85) {
      this.confidence = 'HIGH';
    } else if (this.score >= 0.50) {
      this.confidence = 'MEDIUM';
    } else {
      this.confidence = 'LOW';
    }

    // Generate clear, student-friendly explanation
    const signalNames = this.signals.map(s => s.description).join('; ');
    this.explanation = `${this.name} appears to be used by this website (${this.status}, ${this.confidence} confidence, score: ${this.score}). Evidence signals: ${signalNames}.`;
  }
}
