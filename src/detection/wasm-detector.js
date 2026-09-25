// src/detection/wasm-detector.js
// Inspects WebAssembly (.wasm) network payloads and runtime instantiations to identify source toolchains.

import { EvidenceRecord, EVIDENCE_TYPES } from '../evidence/evidence-engine.js';

export const WASM_TOOLCHAINS = {
  RUST: 'Rust (wasm-bindgen)',
  GO: 'Go / TinyGo',
  EMSCRIPTEN: 'Emscripten (C/C++)',
  ASSEMBLYSCRIPT: 'AssemblyScript'
};

export class WasmDetector {
  /**
   * Detect WASM payloads and attribute to source compiler toolchain.
   * @param {object} session
   * @returns {Array<object>}
   */
  static detect(session) {
    if (!session) return [];
    const detected = [];
    const requests = session.requests || [];
    const runtimeGlobals = (session.runtime && session.runtime.globals) || [];

    // Find any WASM network transactions
    const wasmRequests = requests.filter(r => {
      const url = (r.url || '').toLowerCase();
      const type = (r.type || '').toLowerCase();
      const mime = (r.responseHeaders && r.responseHeaders['content-type']) || '';
      return url.endsWith('.wasm') || url.includes('.wasm?') || type === 'wasm' || mime.includes('application/wasm');
    });

    // Check runtime globals or browserApis
    const hasWebAssemblyGlobal = runtimeGlobals.some(g => (g.name || '').toLowerCase() === 'webassembly') ||
      (session.runtime?.browserApis || []).some(b => b.api === 'webassembly');

    if (wasmRequests.length === 0 && !hasWebAssemblyGlobal) {
      return [];
    }

    // 1. Base WebAssembly detection
    const wasmEvidence = new EvidenceRecord('webassembly', 'WebAssembly', 'Browser API');
    if (wasmRequests.length > 0) {
      wasmEvidence.addSignal(
        EVIDENCE_TYPES.SCRIPT_URL,
        'wasmPayload',
        wasmRequests[0].url,
        `WASM binary loaded: ${wasmRequests[0].url}`,
        'network',
        'HIGH'
      );
    }
    if (hasWebAssemblyGlobal) {
      wasmEvidence.addSignal(
        EVIDENCE_TYPES.WINDOW_GLOBAL,
        'window.WebAssembly',
        'present',
        'WebAssembly runtime global active in page context',
        'page-analyzer.js',
        'HIGH'
      );
    }

    detected.push({
      id: 'webassembly',
      name: 'WebAssembly',
      category: 'Browser API',
      version: null,
      role: 'CORE_ENGINE',
      evidence: wasmEvidence,
      confidence: wasmEvidence.confidence,
      score: wasmEvidence.score,
      status: wasmEvidence.status,
      explanation: `Observed ${wasmRequests.length} .wasm binary modules loaded via network`
    });

    // 2. Toolchain Identification
    for (const req of wasmRequests) {
      const url = req.url.toLowerCase();
      let toolchain = null;
      let toolchainId = null;
      let signatureValue = '';

      if (url.includes('wasm-bindgen') || url.includes('_bg.wasm') || url.includes('rust')) {
        toolchain = WASM_TOOLCHAINS.RUST;
        toolchainId = 'wasm-rust';
        signatureValue = 'wasm-bindgen naming convention (_bg.wasm)';
      } else if (url.includes('wasm_exec') || url.includes('tinygo') || url.includes('go.wasm')) {
        toolchain = WASM_TOOLCHAINS.GO;
        toolchainId = 'wasm-go';
        signatureValue = 'Go wasm_exec runtime binding';
      } else if (url.includes('emscripten') || url.includes('.out.wasm')) {
        toolchain = WASM_TOOLCHAINS.EMSCRIPTEN;
        toolchainId = 'wasm-emscripten';
        signatureValue = 'Emscripten compilation artifact';
      } else if (url.includes('assemblyscript') || url.includes('asc.wasm')) {
        toolchain = WASM_TOOLCHAINS.ASSEMBLYSCRIPT;
        toolchainId = 'wasm-assemblyscript';
        signatureValue = 'AssemblyScript compiler output';
      }

      if (toolchain && !detected.some(d => d.id === toolchainId)) {
        const tcEvidence = new EvidenceRecord(toolchainId, toolchain, 'Build Tool');
        tcEvidence.addSignal(
          EVIDENCE_TYPES.SCRIPT_URL,
          signatureValue,
          req.url,
          `Identified ${toolchain} from ${signatureValue} (${req.url})`,
          'network',
          'HIGH'
        );

        detected.push({
          id: toolchainId,
          name: toolchain,
          category: 'Build Tool',
          version: null,
          role: 'COMPILER',
          evidence: tcEvidence,
          confidence: tcEvidence.confidence,
          score: tcEvidence.score,
          status: tcEvidence.status,
          explanation: `Identified ${toolchain} from ${signatureValue}`
        });
      }
    }

    return detected;
  }
}
