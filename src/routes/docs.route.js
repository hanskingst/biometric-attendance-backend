import { Router } from 'express';

const router = Router();

// Public API documentation (HTML) - detailed request/response examples to support frontend development
import { Router } from 'express';

const router = Router();

// Minimal /docs page to serve a stable, single-source API reference
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
      <p>This minimal page points to the README for full details. The server also exposes detailed examples at the same route when running in development.</p>
      <p>See <a href="/">home</a> and <a href="/admin">admin</a>.</p>
    </body>
  </html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;

// Detailed public API documentation (HTML) for frontend developers
router.get('/', (req, res) => {
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>API Documentation (Detailed)</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body{background:#f6f8fb;font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:18px}
        .card{border-radius:10px;margin-bottom:16px}
        pre{background:#0b1220;color:#dbeafe;padding:12px;border-radius:8px;overflow:auto;white-space:pre-wrap}
        .endpoint{font-family:monospace;background:#fff;padding:8px;border-radius:6px}
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="mb-3">Biometric Attendance — API Reference</h1>
        <p class="text-muted">This page documents the public API endpoints and exact request/response shapes used by the student and teacher frontends. Use these examples to implement the mobile/web apps.</p>

        <div class="card p-3">
          <h4>Base URL</h4>
          <pre>http://{host}/</pre>
          <small class="text-muted">Replace {host} with your server host (e.g. http://localhost:3000).</small>
        </div>

        <!-- Students -->
        <h3>Students</h3>
        <div class="card p-3">
          <h5 class="mb-2 endpoint">POST /students/register</h5>
          <p>Request body (JSON):</p>
          <pre>{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "pass"
}</pre>
          <p>Success response (201):</p>
          <pre>{
  "message": "Student created successfully",
  "student": { "stdId": 1, "name": "Alice", "email": "alice@example.com", "password": "pass" }
}</pre>
        </div>

        <div class="card p-3">
          <h5 class="mb-2 endpoint">POST /students/login</h5>
          <p>Request body:</p>
          <pre>{ "email": "alice@example.com", "password": "pass" }</pre>
          <p>Success (200):</p>
          <pre>{ "message": "Login successful", "student": { "stdId": 1, "name": "Alice", "email": "alice@example.com" } }</pre>
        </div>

        <div class="card p-3">
          <h5 class="mb-2 endpoint">GET /students?page=1&limit=20</h5>
          <p>Response (paginated):</p>
          <pre>{ "data": [ { "stdId": 1, "name": "Alice", "email": "alice@example.com" } ], "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }</pre>
        </div>

        <!-- Teachers -->
        <h3>Teachers</h3>
        <div class="card p-3">
          <h5 class="mb-2 endpoint">POST /teachers/register</h5>
          <pre>{ "name": "Bob", "email": "bob@example.com", "password": "secret" }</pre>
        </div>
        <div class="card p-3">
          <h5 class="mb-2 endpoint">POST /teachers/login</h5>
          <pre>{ "email": "bob@example.com", "password": "secret" }</pre>
        </div>
        <div class="card p-3">
          <h5 class="mb-2 endpoint">GET /teachers?page=1&limit=20</h5>
          <pre>{ "data": [ { "teacherId":1, "name":"Bob", "email":"bob@example.com" } ], "meta": { "page":1, "limit":20, "total":3, "totalPages":1 } }</pre>
        </div>

        <!-- Courses -->
        <h3>Courses</h3>
        <div class="card p-3">
          <h5 class="mb-2 endpoint">POST /courses/course</h5>
          <pre>{ "title": "Math 101", "startTime": "2025-12-23T08:30:00Z", "endTime": "2025-12-23T09:30:00Z", "instructorID": 1 }</pre>
        </div>
        <div class="card p-3">
          <h5 class="mb-2 endpoint">GET /courses?page=1&limit=20</h5>
          <pre>{ "data": [ { "courseID":1, "title":"Math 101", "startTime":"...", "endTime":"...", "instructorID":1 } ], "meta": { "page":1, "limit":20, "total":10, "totalPages":1 } }</pre>
        </div>

        <!-- Enrollments -->
        <h3>Enrollments</h3>
        <div class="card p-3">
          <h5 class="mb-2 endpoint">POST /enrollments</h5>
          <pre>{ "stdId": 1, "courseID": 1 }</pre>
          <p>Success (201):</p>
          <pre>{ "message": "Enrolled successfully", "enrollement": { "EnrolId": 1, "stdId":1, "courseID":1 } }</pre>
        </div>

        <!-- Attendance -->
        <h3>Attendance (student mobile -> backend)</h3>
        <div class="card p-3">
          <h5 class="mb-2 endpoint">POST /attendance</h5>
          <p>Request body (JSON):</p>
          <pre>{ "stdId":1, "courseID":1, "fingerprinthash":"abc123", "latitude":"4.1533", "longitude":"9.2927" }</pre>
          <p>Successful present response (200):</p>
          <pre>{ "message":"Attendance recorded", "attendance": { /* attendance object */ } }</pre>
          <p>Biometric failed response (200):</p>
          <pre>{ "message":"Biometric failed - recorded as absent", "attendance": { /* attendance object with status=absent, markedBy=system */ } }</pre>
        </div>

        <div class="card p-3">
          <h5 class="mb-2 endpoint">GET /attendance?courseID=1&date=YYYY-MM-DD&page=1&limit=20&status=present&stdId=1</h5>
          <p>Response (paginated):</p>
          <pre>{ "data": [ /* attendance rows */ ], "meta": { "page":1, "limit":20, "total":120, "totalPages":6 } }</pre>
        </div>

        <div class="card p-3">
          <h5 class="mb-2 endpoint">GET /attendance/failed?courseID=1&date=YYYY-MM-DD</h5>
          <pre>{ "students": [ { "stdId":1, "name":"Alice", "email":"alice@example.com" } ] }</pre>
        </div>

        <div class="card p-3">
          <h5 class="mb-2 endpoint">POST /attendance/manual</h5>
          <p>Teacher Basic Auth required. Request body: <code>{ "stdId":3, "courseID":1, "notes":"..." }</code></p>
          <pre>Success: 200 or 201 with attendance object (status=manual, markedBy=teacher)</pre>
        </div>

        <div class="card p-3">
          <h5 class="mb-2 endpoint">GET /attendance/analytics?courseID=1</h5>
          <pre>{ "totalStudents": 60, "averageAttendance": 85, "byDate": [ { "date":"2025-12-10","present":50,"absent":10 } ] }</pre>
        </div>

        <p class="mt-3 text-muted">For admin-only endpoints (dashboard, stats, delete), see the README. The pages above contain the request and response shapes the frontend needs to implement.</p>

      </div>
    </body>
  </html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
import { Router } from 'express';

// Public API documentation (HTML)
router.get('/', (req, res) => {
  const html = `<!doctype html>
  import { Router } from 'express';

  const router = Router();

  // Public API documentation (HTML) - detailed request/response examples to support frontend development
  router.get('/', (req, res) => {
    const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>API Documentation (Detailed)</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body{background:#f6f8fb;font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:18px}
          .card{border-radius:10px;margin-bottom:16px}
          pre{background:#0b1220;color:#dbeafe;padding:12px;border-radius:8px;overflow:auto;white-space:pre-wrap}
          .endpoint{font-family:monospace;background:#fff;padding:8px;border-radius:6px}
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="mb-3">Biometric Attendance — API Reference</h1>
          <p class="text-muted">This page documents the public API endpoints and exact request/response shapes used by the student and teacher frontends. Use these examples to implement the mobile/web apps.</p>

          <div class="card p-3">
            <h4>Base URL</h4>
            <pre>http://{host}/</pre>
            <small class="text-muted">Replace {host} with your server host (e.g. http://localhost:3000).</small>
          </div>

          <h3>Students</h3>
          <div class="card p-3">
            <h5 class="mb-2 endpoint">POST /students/register</h5>
            <p>Request body (JSON):</p>
            <pre>{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "pass"
  }</pre>
            <p>Success response (201):</p>
            <pre>{
    "message": "Student created successfully",
    "student": {
      "stdId": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "password": "pass"
    }
  }</pre>
          </div>

          <div class="card p-3">
            <h5 class="mb-2 endpoint">POST /students/login</h5>
            <p>Request body:</p>
            <pre>{ "email": "alice@example.com", "password": "pass" }</pre>
            <p>Success (200):</p>
            <pre>{
    "message": "Login successful",
    "student": { "stdId": 1, "name": "Alice", "email": "alice@example.com" }
  }</pre>
          </div>

          <div class="card p-3">
            <h5 class="mb-2 endpoint">GET /students?page=1&limit=20</h5>
            <p>Response (paginated):</p>
            <pre>{
    "data": [ { "stdId": 1, "name": "Alice", "email": "alice@example.com" }, ... ],
    "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
  }</pre>
          </div>

          <h3>Teachers</h3>
          <div class="card p-3">
            <h5 class="mb-2 endpoint">POST /teachers/register</h5>
            <pre>{ "name":"Bob", "email":"bob@example.com", "password":"secret" }</pre>
            <p>Success (201): returns created teacher object.</p>
          </div>
          <div class="card p-3">
            <h5 class="mb-2 endpoint">POST /teachers/login</h5>
            <pre>{ "email":"bob@example.com", "password":"secret" }</pre>
            <p>Success (200):</p>
            <pre>{ "message":"Login successful", "student": { "teacherId": 1, "name":"Bob", "email":"bob@example.com" } }</pre>
          </div>
          <div class="card p-3">
            <h5 class="mb-2 endpoint">GET /teachers?page=1&limit=20</h5>
            <pre>{ "data": [ { "teacherId":1, "name":"Bob", "email":"bob@example.com" } ], "meta": { "page":1, "limit":20, "total":3, "totalPages":1 } }</pre>
          </div>

          <h3>Courses</h3>
          <div class="card p-3">
            <h5 class="mb-2 endpoint">POST /courses/course</h5>
            <p>Request:</p>
            <pre>{ "title": "Math 101", "startTime": "2025-12-23T08:30:00Z", "endTime": "2025-12-23T09:30:00Z", "instructorID": 1 }</pre>
            <p>Success (201):</p>
            <pre>{ "message": "course registered successfully", "course": { "courseID": 1, "title":"Math 101", "startTime":"...","endTime":"...","instructorID":1 } }</pre>
          </div>
          <div class="card p-3">
            <h5 class="mb-2 endpoint">GET /courses?page=1&limit=20</h5>
            <pre>{ "data": [ { "courseID":1, "title":"Math 101", "startTime":"...", "endTime":"...", "instructorID":1 } ], "meta": { "page":1, "limit":20, "total":10, "totalPages":1 } }</pre>
          </div>

          <h3>Enrollments</h3>
          <div class="card p-3">
            <h5 class="mb-2 endpoint">POST /enrollments</h5>
            <p>Request:</p>
            <pre>{ "stdId": 1, "courseID": 1 }</pre>
            <p>Success (201):</p>
            <pre>{ "message": "Enrolled successfully", "enrollement": { "EnrolId": 1, "stdId":1, "courseID":1 } }</pre>
          </div>

          <h3>Attendance (student mobile -> backend)</h3>
          <div class="card p-3">
            <h5 class="mb-2 endpoint">POST /attendance</h5>
            <p>Request body (JSON) - required fields: <code>stdId</code>, <code>courseID</code>, <code>latitude</code>, <code>longitude</code>. <code>fingerprinthash</code> is provided by the biometric scanner and may be empty on failure.</p>
            <pre>{
    "stdId": 1,
    "courseID": 1,
    "fingerprinthash": "abc123",   // or empty string when biometric failed
    "latitude": "4.1533",
    "longitude": "9.2927"
  }</pre>

            <p>Behavior & Responses:</p>
            <ul>
              <li>If student is not enrolled: <code>403</code> { "message": "Student not enrolled in this course" }</li>
              <li>If course not found: <code>404</code> { "message": "Course not found" }</li>
              <li>If outside course time window: <code>400</code> { "message": "Attendance outside allowed time and outside school" }</li>
              <li>If location invalid/missing: <code>400</code> { "message": "Location is required" } or { "message": "Invalid latitude/longitude" }</li>
              <li>If location outside learned school radius: <code>400</code> { "message": "location outside school" }</li>
              <li>If biometric failed (missing/short fingerprint): the server will <strong>not</strong> reject; it records an <code>absent</code> attendance marked by the system: <code>200</code> { "message": "Biometric failed - recorded as absent", "attendance": { ... } }</li>
              <li>If biometric succeeded: <code>200</code> { "message": "Attendance recorded", "attendance": { ... } }</li>
            </ul>

            <p>Example success (present):</p>
            <pre>{
    "message": "Attendance recorded",
    "attendance": {
      "attId": 12,
      "stdId": 1,
      "courseID": 1,
      "fingerprinthash": "abc123",
      "timestamp": "2025-12-23T08:31:23.000Z",
      "latitude": "4.1533",
      "longitude": "9.2927",
      "valid": true,
      "status": "present",
      "markedBy": "biometric",
      "markedAt": "2025-12-23T08:31:23.000Z",
      "teacherId": null,
      "notes": null
    }
  }</pre>

            <p>Example biometric failure (recorded as absent):</p>
            <pre>{
    "message": "Biometric failed - recorded as absent",
    "attendance": {
      "attId": 13,
      "stdId": 1,
      "courseID": 1,
      "fingerprinthash": null,
      "timestamp": "2025-12-23T08:32:00.000Z",
      "latitude": "4.1533",
      "longitude": "9.2927",
      "valid": false,
      "status": "absent",
      "markedBy": "system",
      "markedAt": "2025-12-23T08:32:00.000Z",
      "teacherId": null,
      "notes": null
    }
  }</pre>
          </div>

          <h4>Attendance - List / Filters / Pagination</h4>
          <div class="card p-3">
            <h5 class="endpoint">GET /attendance?courseID=1&date=2025-12-23&page=1&limit=20&status=present&stdId=1</h5>
            <p>Query params:</p>
            <ul>
              <li><code>courseID</code> (required)</li>
              <li><code>date</code> (optional, format YYYY-MM-DD)</li>
              <li><code>stdId</code> (optional)</li>
              <li><code>status</code> (optional: present / absent / manual)</li>
              <li><code>page</code>, <code>limit</code> (optional pagination)</li>
            </ul>
            <p>Response (paginated):</p>
            <pre>{
    "data": [ { /* attendance rows */ } ],
    "meta": { "page":1, "limit":20, "total": 120, "totalPages": 6 }
  }</pre>
          </div>

          <h4>Biometric-failed students (teacher view)</h4>
          <div class="card p-3">
            <h5 class="endpoint">GET /attendance/failed?courseID=1&date=2025-12-23</h5>
            <p>Returns students who attempted attendance but biometric failed (status=absent and markedBy=system).</p>
            <p>Response:</p>
            <pre>{ "students": [ { "stdId":1, "name":"Alice", "email":"alice@example.com" }, ... ] }</pre>
          </div>

          <h4>Manual marking (teacher override)</h4>
          <div class="card p-3">
            <h5 class="endpoint">POST /attendance/manual</h5>
            <p>Authentication: Basic Auth header (teacher email:password). The middleware requires the teacher and verifies ownership of the course.</p>
            <p>Request body:</p>
            <pre>{ "stdId": 3, "courseID": 1, "notes": "Fingerprint sensor failed" }</pre>
            <p>Behaviour:</p>
            <ul>
              <li>Teacher must own the course.</li>
              <li>Student must be enrolled.</li>
              <li>Current time must be within class time (server-side check).</li>
            </ul>
            <p>Responses:</p>
            <pre>200 { "message": "Attendance updated (manual)", "attendance": { ... } }
  201 { "message": "Attendance marked manually", "attendance": { ... } }</pre>
          </div>

          <h4>Analytics</h4>
          <div class="card p-3">
            <h5 class="endpoint">GET /attendance/analytics?courseID=1</h5>
            <p>Response:</p>
            <pre>{
    "totalStudents": 60,
    "averageAttendance": 85,
    "byDate": [ { "date":"2025-12-10","present":50,"absent":10 }, ... ]
  }</pre>
          </div>

          <p class="mt-3 text-muted">Notes: Admin endpoints (dashboard, stats, deletes) and the teacher admin flows are documented in the project README. The endpoints above are everything the student mobile app and teacher web app need to build a working UI.</p>

        </div>
      </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  export default router;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
