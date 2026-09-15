import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'dev-metrics-mock',
      configureServer(server) {
        server.middlewares.use('/api/metrics', (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                console.log('[Dev Metrics]', data);
              } catch {}
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'ok' }));
            });
          } else {
            res.end();
          }
        });
      }
    }
  ],
  root: './',
  server: {
    port: 3000,
    open: true
  }
});
