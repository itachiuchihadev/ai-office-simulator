// src/js/telemetry.js — Privacy-preserving usage metrics for Cloudflare Observability

/**
 * Sends lightweight metric events to Cloudflare Worker.
 * Only sends the event type and selected model name (NO prompts, NO user messages, NO API keys).
 * Cloudflare Worker extracts the IP, Country, and City on the server side.
 *
 * @param {string} event - Event name (e.g. 'page_visit', 'chat')
 * @param {object} data - Extra non-sensitive metadata (e.g. { model: 'gemini-2.5-flash' })
 */
export function trackMetric(event, data = {}) {
  try {
    const payload = JSON.stringify({
      event,
      ...data
    });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/metrics', blob);
    } else {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  } catch {
    // Fail silently so metrics never interrupt application execution
  }
}
