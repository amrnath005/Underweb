// src/storage/indexeddb.js
// Client-side IndexedDB persistence for session history and site snapshots.

const DB_NAME = 'UnderwebDB';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';

export class StorageManager {
  static openDb() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          const store = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id', autoIncrement: true });
          store.createIndex('domain', 'primaryDomain', { unique: false });
          store.createIndex('timestamp', 'startTime', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Save a complete session snapshot into local IndexedDB.
   * @param {object} session
   * @returns {Promise<number>} Session ID
   */
  static async saveSession(session) {
    try {
      const db = await this.openDb();
      if (!db) return -1;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SESSIONS, 'readwrite');
        const store = tx.objectStore(STORE_SESSIONS);
        const record = {
          url: session.url,
          primaryDomain: session.primaryDomain,
          startTime: session.startTime || Date.now(),
          stats: session.stats,
          domainsCount: session.domainsCount,
          snapshot: session
        };
        const req = store.add(record);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return -1;
    }
  }

  /**
   * Retrieve all saved sessions.
   * @returns {Promise<Array<object>>}
   */
  static async getAllSessions() {
    try {
      const db = await this.openDb();
      if (!db) return [];
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SESSIONS, 'readonly');
        const store = tx.objectStore(STORE_SESSIONS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  /**
   * Delete a session by ID.
   * @param {number} id
   */
  static async deleteSession(id) {
    try {
      const db = await this.openDb();
      if (!db) return;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SESSIONS, 'readwrite');
        const store = tx.objectStore(STORE_SESSIONS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignored
    }
  }
}
