import { Router } from 'express';

const router = Router();

// Full, styled API docs page for frontend developers and admins.
router.get('/', (req, res) => {
  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Biometric Attendance — API Docs</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body { background: #f7fafc; }
        .container { max-width: 980px; }
        pre { background: #0b1220; color: #dbeafe; padding: 12px; border-radius: 6px; overflow:auto; }
        .endpoint { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace; }
        .section-title { margin-top: 1.25rem; }
      </style>
    </head>
    <body>
      <div class="container py-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h1 class="h3">Biometric Attendance — API Reference</h1>
          <nav>
            <a class="btn btn-sm btn-outline-primary me-2" href="/">Home</a>
            <a class="btn btn-sm btn-outline-secondary" href="/admin/dashboard">Admin</a>
          </nav>
        </div>

        <p class="text-muted">This page documents all public endpoints used by the student mobile app, teacher UI and the admin dashboard. Examples show request body and typical responses. Use the <code>/health</code> endpoint for lightweight pings.</p>

        <div class="card mb-3">
          <div class="card-body">
            <h5 class="card-title">Quick facts</h5>
            <ul>
              <li>Base URL: <code>http://{host}/</code> (replace {host} with your server host)</li>
              <li>Content-Type: <code>application/json</code> for JSON endpoints</li>
              <li>Admin credentials (development/demo): <strong>johnnystock@gmail.com / Jesus12@#</strong></li>
            </ul>
          </div>
        </div>

        <h4 class="section-title">Students</h4>
        <div class="card mb-3">
          <div class="card-body">
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/students/register</code></p>
            <p class="text-muted mb-1">Request JSON:</p>
            <pre>{ "name": "Alice", "email": "alice@example.com", "password": "pass" }</pre>
            <p class="text-muted mb-1">Response (201):</p>
            <pre>{ "message": "Student created successfully", "student": { "stdId": 1, "name": "Alice", "email": "alice@example.com" } }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/students/login</code></p>
            <pre>{ "email": "alice@example.com", "password": "pass" }</pre>
            <p class="text-muted">Success (200):</p>
            <pre>{ "message": "Login successful", "student": { "stdId": 1, "name": "Alice", "email": "alice@example.com" } }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/students?page=1&limit=20</code></p>
            <p class="text-muted">Paginated list:</p>
            <pre>{ "data": [ { "stdId":1, "name":"Alice", "email":"alice@example.com" } ], "meta": { "page":1, "limit":20, "total":42, "totalPages":3 } }</pre>
          </div>
        </div>

        <h4 class="section-title">Teachers</h4>
        <div class="card mb-3">
          <div class="card-body">
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/teachers/register</code></p>
            <pre>{ "name":"Bob", "email":"bob@example.com", "password":"secret" }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/teachers/login</code></p>
            <pre>{ "email":"bob@example.com", "password":"secret" }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/teachers?page=1&limit=20</code></p>
            <pre>{ "data": [ { "teacherId":1, "name":"Bob", "email":"bob@example.com" } ], "meta": { "page":1, "limit":20, "total":3, "totalPages":1 } }</pre>
          </div>
        </div>

        <h4 class="section-title">Courses</h4>
        <div class="card mb-3">
          <div class="card-body">
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/courses/course</code></p>
            <pre>{ "title": "Math 101", "startTime": "2025-12-23T08:30:00Z", "endTime": "2025-12-23T09:30:00Z", "instructorID": 1 }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/courses?page=1&limit=20</code></p>
            <pre>{ "data": [ { "courseID":1, "title":"Math 101", "startTime":"...", "endTime":"...", "instructorID":1 } ], "meta": { "page":1, "limit":20, "total":10, "totalPages":1 } }</pre>
          </div>
        </div>

        <h4 class="section-title">Enrollments</h4>
        <div class="card mb-3">
          <div class="card-body">
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/enrollments</code></p>
            <p class="text-muted">Enroll a student into a course.</p>
            <pre>{ "stdId": 1, "courseID": 1 }</pre>
            <p class="text-muted">Success (201):</p>
            <pre>{ "message": "Enrolled successfully", "enrollement": { "EnrolId": 1, "stdId":1, "courseID":1 } }</pre>
          </div>
        </div>

        <h4 class="section-title">Attendance</h4>
        <div class="card mb-3">
          <div class="card-body">
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/attendance</code></p>
            <p class="text-muted">Student mobile sends location + optional fingerprint hash. Backend enforces course time & learned school location.</p>
            <pre>{ "stdId":1, "courseID":1, "fingerprinthash":"abc123", "latitude":"4.1533", "longitude":"9.2927" }</pre>

            <p class="text-muted">Responses:</p>
            <pre>// Biometric success
{ "message":"Attendance recorded", "attendance": { "attId":12, "stdId":1, "status":"present", "markedBy":"biometric" } }

// Biometric failed recorded as absent (teacher can override)
{ "message":"Biometric failed - recorded as absent", "attendance": { "attId":13, "stdId":1, "status":"absent", "markedBy":"system" } }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/attendance?courseID=1&date=YYYY-MM-DD&page=1&limit=20&status=present&stdId=1</code></p>
            <pre>{ "data": [ /* attendance rows */ ], "meta": { "page":1, "limit":20, "total":120, "totalPages":6 } }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/attendance/failed?courseID=1&date=YYYY-MM-DD</code></p>
            <pre>{ "students": [ { "stdId":1, "name":"Alice", "email":"alice@example.com" } ] }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/attendance/manual</code> (Teacher Basic Auth)</p>
            <pre>{ "stdId":3, "courseID":1, "notes":"Fingerprint sensor failed" }</pre>
            <p class="text-muted">Marks attendance manually (teacher must own the course).</p>
          </div>
        </div>

        <h4 class="section-title">Admin (dashboard & management)</h4>
        <div class="card mb-4">
          <div class="card-body">
            <p class="text-muted">Admin can view stats, list students/teachers/courses and delete entities via the dashboard or API (admin credential required).</p>
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/admin/stats</code></p>
            <pre>{ "requests": 1234, "students": 42, "teachers": 3, "courses": 10 }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>DELETE</strong> <code>/admin/students/:id</code></p>
            <p class="text-muted">Deletes student and cascades related enrollments & attendance. Admin Basic Auth or admin cookie required.</p>
            <pre>Example: curl -X DELETE -u johnnystock@gmail.com:Jesus12@# http://{host}/admin/students/1</pre>
          </div>
        </div>

        <footer class="text-muted small">If you want a machine-readable spec (OpenAPI) or interactive docs (Swagger UI) I can add that — it's the recommended approach for frontend-first development.</footer>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    </body>
  </html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;

