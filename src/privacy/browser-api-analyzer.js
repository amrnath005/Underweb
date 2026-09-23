// src/privacy/browser-api-analyzer.js
// Analyzes browser permission states and device API surveillance surface.

export class BrowserApiAnalyzer {
  /**
   * Evaluate browser permission queries and sensitive API access.
   * @param {Record<string, string>} permissions
   * @returns {object} API capability profile
   */
  static analyze(permissions = {}) {
    const capabilities = [
      {
        name: 'Geolocation API',
        id: 'geolocation',
        risk: 'HIGH',
        status: permissions.geolocation || 'prompt',
        description: 'Can query precise geographical location coordinates.'
      },
      {
        name: 'Camera & Microphone',
        id: 'camera_mic',
        risk: 'HIGH',
        status: (permissions.camera === 'granted' || permissions.microphone === 'granted') ? 'granted' : 'prompt',
        description: 'Can capture audio and video streams via getUserMedia.'
      },
      {
        name: 'Notifications API',
        id: 'notifications',
        risk: 'MEDIUM',
        status: permissions.notifications || 'prompt',
        description: 'Can display push and desktop system notifications.'
      },
      {
        name: 'Clipboard API',
        id: 'clipboard',
        risk: 'MEDIUM',
        status: permissions['clipboard-read'] || 'prompt',
        description: 'Can read or write sensitive clipboard contents.'
      }
    ];

    const grantedCount = capabilities.filter(c => c.status === 'granted').length;

    return {
      capabilities,
      grantedCount,
      surveillanceRisk: grantedCount > 1 ? 'ELEVATED' : grantedCount === 1 ? 'MODERATE' : 'MINIMAL'
    };
  }
}
