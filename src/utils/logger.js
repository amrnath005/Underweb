// src/utils/logger.js
// Scoped, styled console logger with toggleable levels for Underweb modules.

const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

let currentLevel = LEVELS.INFO;

export class Logger {
  /**
   * @param {string} scope - Module or component name (e.g., 'Network', 'Fingerprint')
   */
  constructor(scope) {
    this.scope = scope;
  }

  static setLevel(levelName) {
    if (LEVELS[levelName] !== undefined) {
      currentLevel = LEVELS[levelName];
    }
  }

  debug(...args) {
    if (currentLevel <= LEVELS.DEBUG) {
      console.debug(`%c[UNDERWEB::${this.scope}]`, 'color: #94a3b8; font-weight: bold;', ...args);
    }
  }

  info(...args) {
    if (currentLevel <= LEVELS.INFO) {
      console.info(`%c[UNDERWEB::${this.scope}]`, 'color: #06b6d4; font-weight: bold;', ...args);
    }
  }

  warn(...args) {
    if (currentLevel <= LEVELS.WARN) {
      console.warn(`%c[UNDERWEB::${this.scope}]`, 'color: #f59e0b; font-weight: bold;', ...args);
    }
  }

  error(...args) {
    if (currentLevel <= LEVELS.ERROR) {
      console.error(`%c[UNDERWEB::${this.scope}]`, 'color: #ef4444; font-weight: bold;', ...args);
    }
  }
}
