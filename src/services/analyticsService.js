/**
 * Privacy-friendly telemetry and event analytics for Anchor Fitness OS.
 * Zero cookies, zero IP harvesting, 100% compliant with local-first privacy.
 */

const TELEMETRY_KEY = 'anchor_local_telemetry_events';

export const analyticsService = {
  isConsented: () => {
    try {
      const consent = localStorage.getItem('anchor_cookie_consent_v1');
      return consent === 'all';
    } catch {
      return false;
    }
  },

  trackPageView: (path) => {
    analyticsService.trackEvent('page_view', { path, timestamp: Date.now() });
  },

  trackEvent: (eventName, properties = {}) => {
    const payload = {
      event: eventName,
      properties,
      timestamp: Date.now(),
      url: window.location.pathname
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Anchor Analytics] 📡 ${eventName}:`, properties);
    }

    // Persist in local memory or local session ring buffer
    try {
      const existing = JSON.parse(sessionStorage.getItem(TELEMETRY_KEY) || '[]');
      existing.push(payload);
      // Keep max 50 recent events
      if (existing.length > 50) existing.shift();
      sessionStorage.setItem(TELEMETRY_KEY, JSON.stringify(existing));
    } catch {
      // Ignore if storage blocked
    }
  },

  getLocalEvents: () => {
    try {
      return JSON.parse(sessionStorage.getItem(TELEMETRY_KEY) || '[]');
    } catch {
      return [];
    }
  }
};
