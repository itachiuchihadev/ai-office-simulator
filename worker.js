// worker.js — Cloudflare Worker entry point for AI Office Simulator & Metrics Logging

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Endpoint to record user metrics (IP, geo, model used)
    if (url.pathname === '/api/metrics') {
      // Support CORS preflight if needed
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json().catch(() => ({}));

          // Cloudflare automatically provides client network metadata
          const ip = request.headers.get('cf-connecting-ip') || 'Unknown IP';
          const country = request.cf?.country || 'Unknown Country';
          const city = request.cf?.city || 'Unknown City';
          const region = request.cf?.region || 'Unknown Region';
          const event = body.event || 'interaction';
          const model = body.model || 'none';

          // Cloudflare Observability structured log entry
          console.log(JSON.stringify({
            level: 'METRIC',
            tag: 'USER_METRIC',
            event,
            ip,
            country,
            city,
            region,
            model,
            timestamp: new Date().toISOString()
          }));

          return new Response(JSON.stringify({ status: 'ok' }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } catch (err) {
          console.error('[METRIC_ERROR]', err);
          return new Response(JSON.stringify({ status: 'error', message: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response('Method Not Allowed', { status: 405 });
    }

    // Pass all other requests to the static assets (Vite build output)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Asset handler not configured.', { status: 500 });
  }
};
