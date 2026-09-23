// src/utils/time-utils.js
// Time formatting, millisecond conversions, relative times, and waterfall calculations.

export class TimeUtils {
  /**
   * Format duration in milliseconds to human readable string (e.g., '142ms', '1.45s').
   * @param {number} ms
   * @returns {string}
   */
  static formatDuration(ms) {
    if (ms === undefined || ms === null || isNaN(ms)) return '0ms';
    if (ms < 1) return '< 1ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = Math.round((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }

  /**
   * Format bytes to human readable string (e.g. '4.2 KB', '1.8 MB').
   * @param {number} bytes
   * @returns {string}
   */
  static formatBytes(bytes) {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const val = bytes / Math.pow(1024, idx);
    return `${val < 10 && idx > 0 ? val.toFixed(1) : Math.round(val)} ${units[idx]}`;
  }

  /**
   * Format ISO timestamp to local readable time (e.g., '14:23:45.120').
   * @param {number|string|Date} timestamp
   * @returns {string}
   */
  static formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const pad = (n, len = 2) => String(n).padStart(len, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
  }

  /**
   * Format relative timestamp (e.g., 'just now', '5s ago', '2m ago').
   * @param {number|string|Date} timestamp
   * @returns {string}
   */
  static formatRelative(timestamp) {
    if (!timestamp) return '';
    const diffMs = Date.now() - new Date(timestamp).getTime();
    if (diffMs < 2000) return 'just now';
    if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s ago`;
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    return `${Math.floor(diffMs / 3600000)}h ago`;
  }

  /**
   * Compute relative waterfall offset and percentage width.
   * @param {number} startMs - Request start timestamp
   * @param {number} durationMs - Request duration
   * @param {number} sessionStartMs - Earliest timestamp in session
   * @param {number} totalDurationMs - Total window span
   * @returns {{ offsetPercent: number, widthPercent: number }}
   */
  static calculateWaterfall(startMs, durationMs, sessionStartMs, totalDurationMs) {
    if (!totalDurationMs || totalDurationMs <= 0) {
      return { offsetPercent: 0, widthPercent: 100 };
    }
    const offset = Math.max(0, startMs - sessionStartMs);
    const offsetPercent = Math.min(100, Math.max(0, (offset / totalDurationMs) * 100));
    const widthPercent = Math.min(100 - offsetPercent, Math.max(0.5, (durationMs / totalDurationMs) * 100));
    return { offsetPercent, widthPercent };
  }
}
