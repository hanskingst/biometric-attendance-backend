import app from "./app.js";
import { syncDB } from "./models/index.js";
import http from 'http';
import https from 'https';

const PORT = process.env.PORT || 3000;

function startKeepalive(url, intervalSeconds = 60) {
  if (!url) return null;
  let target;
  try {
    target = new URL(url);
  } catch (err) {
    console.error('KEEPALIVE_URL is not a valid URL:', err.message);
    return null;
  }

  const lib = target.protocol === 'https:' ? https : http;
  const intervalMs = Math.max(10, Number(intervalSeconds)) * 1000;
  let lastLog = 0;

  const timer = setInterval(() => {
    try {
      const req = lib.request(
        {
          hostname: target.hostname,
          port: target.port || (target.protocol === 'https:' ? 443 : 80),
          path: target.pathname + (target.search || ''),
          method: 'GET',
          headers: { 'User-Agent': 'keepalive/1.0' },
          timeout: 5000,
        },
        (res) => {
          // drain response quickly
          res.on('data', () => {});
          res.on('end', () => {});
        }
      );

      req.on('error', (err) => {
        const now = Date.now();
        // avoid noisy logs: print errors at most once per minute
        if (now - lastLog > 60_000) {
          console.error('Keepalive error pinging', url, err.message);
          lastLog = now;
        }
      });

      req.on('timeout', () => {
        req.destroy();
      });

      req.end();
    } catch (err) {
      const now = Date.now();
      if (now - lastLog > 60_000) {
        console.error('Keepalive unexpected error:', err.message);
        lastLog = now;
      }
    }
  }, intervalMs);

  // Do not keep the Node.js process open just for this timer
  if (typeof timer.unref === 'function') timer.unref();
  console.log(`Keepalive started: pinging ${url} every ${intervalMs / 1000}s`);
  return timer;
}

const startServer = async () => {
  try {
    await syncDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);

      // Start keep-alive background pinger only if KEEPALIVE_URL is set in env
      const keepaliveUrl = process.env.KEEPALIVE_URL || null;
      const intervalSeconds = process.env.KEEPALIVE_INTERVAL_SECONDS || '60';
      if (keepaliveUrl) {
        startKeepalive(keepaliveUrl, intervalSeconds);
      } else {
        console.log('KEEPALIVE_URL not set — keepalive pinger disabled. To enable set KEEPALIVE_URL=https://your-app.onrender.com');
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
