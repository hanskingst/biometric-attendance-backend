import { Router } from 'express';

const router = Router();

// Minimal stable /docs implementation (single-source for frontend developers)
router.get('/', (req, res) => {
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>API Docs</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;margin:24px}</style>
    </head>
    <body>
      <h1>API Documentation</h1>
      <p>This is the canonical API reference for frontend developers. For full examples consult the README in the repository root.</p>
      <ul>
        <li><a href="/students">/students</a> – student endpoints (register, login, list)</li>
        <li><a href="/teachers">/teachers</a> – teacher endpoints</li>
        <li><a href="/courses">/courses</a> – courses endpoints</li>
        <li><a href="/attendance">/attendance</a> – attendance capture and reporting</li>
      </ul>
      <p>If you need machine-readable docs, ask and I can add an OpenAPI JSON at <code>/openapi.json</code>.</p>
    </body>
  </html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
