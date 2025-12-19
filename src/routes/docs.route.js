import { Router } from 'express';

const router = Router();

// Public API documentation (HTML)
router.get('/', (req, res) => {
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>API Documentation</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body{background:#f6f8fb;font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:28px}
        .card{border-radius:10px;margin-bottom:16px}
        pre{background:#0b1220;color:#dbeafe;padding:12px;border-radius:8px;overflow:auto;white-space:pre-wrap;word-break:break-word}

        /* Responsive tweaks */
        .container{max-width:1100px}
        @media (max-width:768px){
          body{padding:16px}
          .container{padding:0 8px}
          pre{font-size:0.9rem}
        }
        @media (max-width:480px){
          h1{font-size:1.2rem}
          pre{font-size:0.85rem}
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="mb-3">Biometric Attendance API — Documentation</h1>
        <p class="text-muted">This page documents the public API endpoints. Admin endpoints are intentionally excluded; see the project README for admin delete endpoints and usage.</p>

        <div class="card p-3">
          <h4>Base URL</h4>
          <pre>http://{host}/</pre>
          <small class="text-muted">Replace {host} with your server host (e.g. http://localhost:3000).</small>
        </div>

        <div class="card p-3">
          <h4>Students</h4>
          <ul>
            <li><strong>POST /students/register</strong> — Create a student<br/>
              Body: <code>{ "name": string, "email": string, "password": string }</code>
            </li>
            <li><strong>POST /students/login</strong> — Login (returns student data on success)<br/>
              Body: <code>{ "email": string, "password": string }</code>
            </li>
            <li><strong>GET /students</strong> — Lists students (stdId, name, email)</li>
          </ul>
        </div>

        <div class="card p-3">
          <h4>Teachers</h4>
          <ul>
            <li><strong>POST /teachers/register</strong> — Create a teacher<br/>
              Body: <code>{ "name": string, "email": string, "password": string }</code>
            </li>
            <li><strong>POST /teachers/login</strong> — Login (returns teacher data on success)<br/>
              Body: <code>{ "email": string, "password": string }</code>
            </li>
            <li><strong>GET /teachers</strong> — Lists teachers (teacherId, name, email)</li>
          </ul>
        </div>

        <div class="card p-3">
          <h4>Courses</h4>
          <ul>
            <li><strong>POST /courses/course</strong> — Create a course<br/>
              Body: <code>{ "title": string, "startTime": ISODateString, "endTime": ISODateString, "instructorID": number }</code>
            </li>
            <li><strong>GET /courses</strong> — Lists courses</li>
          </ul>
        </div>

        <div class="card p-3">
          <h4>Enrollments</h4>
          <ul>
            <li><strong>POST /enrollments</strong> — Enroll a student to a course<br/>
              Body: <code>{ "stdId": number, "courseID": number }</code>
            </li>
          </ul>
        </div>

        <div class="card p-3">
          <h4>Attendance</h4>
          <ul>
            <li><strong>POST /attendance</strong> — Record attendance (validations applied)<br/>
              Body: <code>{ "stdId": number, "courseID": number, "fingerprinthash": string, "latitude": string, "longitude": string }</code>
            </li>
            <li>Checks: student must be enrolled in course; attendance must be within course start/end time; location must be within configured school radius.</li>
          </ul>
        </div>

        <div class="card p-3">
          <h4>Examples</h4>
          <p>Create a student (curl):</p>
          <pre>curl -X POST http://localhost:3000/students/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"pass"}'</pre>

          <p>Record attendance (curl):</p>
          <pre>curl -X POST http://localhost:3000/attendance \
  -H "Content-Type: application/json" \
  -d '{"stdId":1,"courseID":1,"fingerprinthash":"abc123","latitude":"4.1533","longitude":"9.2927"}'</pre>

          <p class="mt-2 text-muted">Admin endpoints (DELETE) are intentionally not shown here. See the project <a href="/README.md">README</a> for admin delete documentation.</p>
        </div>

      </div>
    </body>
  </html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
