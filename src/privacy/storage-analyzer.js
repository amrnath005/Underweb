// src/privacy/storage-analyzer.js
// Audits client-side storage footprint (LocalStorage, SessionStorage, IndexedDB).

export class StorageAnalyzer {
  /**
   * Analyze client storage telemetry.
   * @param {object} storageTelemetry
   * @returns {object} Storage profile
   */
  static analyze(storageTelemetry = {}) {
    const lsCount = storageTelemetry.localStorageCount || 0;
    const lsKeys = storageTelemetry.localStorageKeys || [];
    const ssCount = storageTelemetry.sessionStorageCount || 0;
    const idbDbs = storageTelemetry.indexedDbDatabases || [];

    // Categorize common storage patterns
    const authKeys = lsKeys.filter(k => /auth|token|jwt|sess|user|id/i.test(k));
    const trackingKeys = lsKeys.filter(k => /track|ga_|gid|uid|pixel|event/i.test(k));
    const cacheKeys = lsKeys.filter(k => /cache|store|data|state/i.test(k));

    return {
      localStorage: {
        itemCount: lsCount,
        keys: lsKeys,
        authRelated: authKeys,
        trackingRelated: trackingKeys,
        cacheRelated: cacheKeys
      },
      sessionStorage: {
        itemCount: ssCount
      },
      indexedDB: {
        databaseCount: idbDbs.length,
        databases: idbDbs
      },
      hasClientDatabases: idbDbs.length > 0
    };
  }
}
