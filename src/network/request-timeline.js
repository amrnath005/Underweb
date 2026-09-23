// src/network/request-timeline.js
// Chronological request ordering, First Contact sequencing, and waterfall positioning.

import { TimeUtils } from '../utils/time-utils.js';

export class RequestTimeline {
  /**
   * Sort and calculate waterfall layout coordinates for an array of requests.
   * @param {Array<object>} requests
   * @returns {{ timeline: Array<object>, sessionStart: number, totalDuration: number, firstContact: Array<object> }}
   */
  static generateTimeline(requests) {
    if (!requests || requests.length === 0) {
      return { timeline: [], sessionStart: 0, totalDuration: 0, firstContact: [] };
    }

    // Sort chronologically by startTime
    const sorted = [...requests].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    const sessionStart = sorted[0].startTime || Date.now();
    let latestEnd = sessionStart;

    for (const req of sorted) {
      const end = (req.startTime || sessionStart) + (req.duration || 10);
      if (end > latestEnd) latestEnd = end;
    }

    const totalDuration = Math.max(100, latestEnd - sessionStart);

    // Compute waterfall geometry for each request
    const timeline = sorted.map((req, index) => {
      const startOffset = Math.max(0, (req.startTime || sessionStart) - sessionStart);
      const duration = Math.max(2, req.duration || 5);
      const { offsetPercent, widthPercent } = TimeUtils.calculateWaterfall(
        req.startTime || sessionStart,
        duration,
        sessionStart,
        totalDuration
      );

      return {
        ...req,
        index,
        startOffsetMs: startOffset,
        durationMs: duration,
        offsetPercent,
        widthPercent
      };
    });

    // "First Contact" Sequence: First 8 distinct requests or domains
    const seenHosts = new Set();
    const firstContact = [];
    for (const item of timeline) {
      if (!seenHosts.has(item.host)) {
        seenHosts.add(item.host);
        firstContact.push({
          step: firstContact.length + 1,
          timeMs: item.startOffsetMs,
          host: item.host,
          category: item.category,
          isFirstParty: item.isFirstParty,
          url: item.url,
          status: item.status
        });
      }
      if (firstContact.length >= 8) break;
    }

    return {
      timeline,
      sessionStart,
      totalDuration,
      firstContact
    };
  }
}
