import { Router } from 'express';

const router = Router();

// Public API documentation (HTML) detailed request/response examples to support frontend development
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

      <div class="card p-3">
        <h5 class="mb-2">Database & Deployment (important)</h5>
        <p class="small text-muted">Notes for deploying and schema changes (Render / production).</p>
        <ul>
          <li>The server auto-syncs Sequelize models on startup via <code>src/models/index.js</code>.</li>
          <li>Default behavior: <strong>uses <code>{ alter: true }</code></strong> to safely add/alter columns without dropping tables. This preserves data when you push model changes.</li>
          <li>Developer-only destructive mode: set <code>FORCE_SYNC=true</code> to use <code>{ force: true }</code> (drops and recreates tables — <strong>will delete data</strong>).</li>
          <li>SQLite-specific: the startup logic temporarily disables foreign-key checks while altering schema to avoid constraint errors, then re-enables them.</li>
          <li>On Render: mount a persistent disk for <code>./database.sqlite</code> and ensure <code>FORCE_SYNC=false</code> in service environment variables — otherwise a deploy may destroy data.</li>
        </ul>
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
        <pre>{ "message":"Login successful", "teacher": { "teacherId": 1, "name":"Bob", "email":"bob@example.com" } }</pre>
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

      <h3>Attendance Sessions (Teacher Management)</h3>
      <div class="card p-3">
        <h5 class="mb-2 endpoint">POST /attendance/course/:courseID/attendance-sessions</h5>
        <p class="text-muted">Teacher creates and opens a new attendance session for a course. Requires teacher authentication.</p>
        <p>Request body (JSON):</p>
        <pre>{
  "openedAt": "2025-12-23T08:30:00Z",  // optional, defaults to now
  "closedAt": "2025-12-23T09:30:00Z",  // optional, null means no end time
  "status": "open",                     // optional, defaults to "open"
  "notes": "Regular class session"      // optional
}</pre>
        <p>Success response (201):</p>
        <pre>{
  "message": "Attendance session created",
  "session": {
    "sessionId": 1,
    "courseID": 1,
    "teacherId": 5,
    "openedAt": "2025-12-23T08:30:00Z",
    "closedAt": "2025-12-23T09:30:00Z",
    "status": "open",
    "notes": "Regular class session"
  }
}</pre>
        <p>Error responses:</p>
        <ul>
          <li>404: Course not found</li>
          <li>403: Teacher does not own this course</li>
        </ul>
      </div>

      <div class="card p-3">
        <h5 class="mb-2 endpoint">GET /attendance/course/:courseID/attendance-sessions/open</h5>
        <p class="text-muted">Check if there is an active (open) attendance session for a course. Used by student app to determine if they can mark attendance.</p>
        <p>Success response when session exists (200):</p>
        <pre>{
  "active": true,
  "session": {
    "sessionId": 1,
    "courseID": 1,
    "teacherId": 5,
    "openedAt": "2025-12-23T08:30:00Z",
    "closedAt": "2025-12-23T09:30:00Z",
    "status": "open",
    "notes": "Regular class session"
  }
}</pre>
        <p>Response when no active session (200):</p>
        <pre>{ "active": false }</pre>
      </div>

      <div class="card p-3">
        <h5 class="mb-2 endpoint">GET /attendance/course/:courseID/attendance-sessions</h5>
        <p class="text-muted">List all attendance sessions for a course. Requires teacher authentication and teacher must own the course. Supports pagination and status filtering.</p>
        <p>Query parameters:</p>
        <ul>
          <li><code>page</code> (optional, default: 1)</li>
          <li><code>limit</code> (optional, default: 50, max: 200)</li>
          <li><code>status</code> (optional, filter by "open" or "closed")</li>
        </ul>
        <p>Example: <code>GET /attendance/course/1/attendance-sessions?page=1&limit=20&status=open</code></p>
        <p>Success response (200):</p>
        <pre>{
  "data": [
    {
      "sessionId": 1,
      "courseID": 1,
      "teacherId": 5,
      "openedAt": "2025-12-23T08:30:00Z",
      "closedAt": "2025-12-23T09:30:00Z",
      "status": "closed",
      "notes": "Regular class session"
    },
    {
      "sessionId": 2,
      "courseID": 1,
      "teacherId": 5,
      "openedAt": "2025-12-24T08:30:00Z",
      "closedAt": null,
      "status": "open",
      "notes": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}</pre>
        <p>Error responses:</p>
        <ul>
          <li>404: Course not found</li>
          <li>403: Teacher does not own this course</li>
        </ul>
      </div>

      <h3>Attendance (student mobile -> backend)</h3>
      <div class="card p-3">
        <h5 class="mb-2 endpoint">POST /attendance/attendance-sessions/:sessionID/attendance</h5>
        <p class="text-muted"><strong>New session-aware endpoint:</strong> Students submit attendance to a specific session. The session must be open and within its time window.</p>
        <p>Request body (JSON):</p>
        <pre>{
  "stdId": 1,
  "fingerprinthash": "abc123",   // or empty string when biometric failed
  "latitude": "4.1533",
  "longitude": "9.2927",
  "school_lat": "4.1533",        // optional but recommended
  "school_lon": "9.2927"         // optional but recommended
}</pre>

        <p>Behavior & Responses:</p>
        <ul>
          <li>If session not found: <code>404</code> { "message": "Attendance session not found" }</li>
          <li>If session is not open: <code>400</code> { "message": "Attendance session is not open" }</li>
          <li>If session has not opened yet: <code>400</code> { "message": "Attendance session has not opened yet" }</li>
          <li>If session is already closed: <code>400</code> { "message": "Attendance session is already closed" }</li>
          <li>If student is not enrolled: <code>403</code> { "message": "Student not enrolled in this course" }</li>
          <li>If location invalid/missing: <code>400</code> { "message": "Location is required" } or { "message": "Invalid latitude/longitude" }</li>
          <li>If location outside learned course radius (after 5+ samples): <code>400</code> with detailed distance info</li>
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
    "sessionId": 1,
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
    "sessionId": 1,
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

        <p>Example location rejection (after course location learned):</p>
        <pre>{
  "message": "Your location is 250m away from the course location (100m allowed). Are you on campus?",
  "distance": 250,
  "allowed": 100,
  "courseLocation": { "lat": 4.1533, "lon": 9.2927 },
  "yourLocation": { "lat": 4.1556, "lon": 9.2950 }
}</pre>
      </div>

      <div class="card p-3">
        <h5 class="mb-2 endpoint">GET /attendance/attendance-sessions/:sessionID/attendance</h5>
        <p class="text-muted">List all attendance records for a specific session. Includes student and course details. Supports pagination.</p>
        <p>Query parameters:</p>
        <ul>
          <li><code>page</code> (optional, default: 1)</li>
          <li><code>limit</code> (optional, default: 50, max: 200)</li>
        </ul>
        <p>Success response (200):</p>
        <pre>{
  "data": [
    {
      "attId": 12,
      "stdId": 1,
      "courseID": 1,
      "sessionId": 1,
      "fingerprinthash": "abc123",
      "timestamp": "2025-12-23T08:31:23Z",
      "latitude": "4.1533",
      "longitude": "9.2927",
      "valid": true,
      "status": "present",
      "markedBy": "biometric",
      "markedAt": "2025-12-23T08:31:23Z",
      "teacherId": null,
      "notes": null,
      "createdAt": "2025-12-23T08:31:23Z",
      "updatedAt": "2025-12-23T08:31:23Z",
      "student": {
        "stdId": 1,
        "name": "Alice",
        "email": "alice@example.com"
      },
      "course": {
        "courseID": 1,
        "title": "Math 101"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 45,
    "totalPages": 1
  }
}</pre>
      </div>

      <h4>Attendance - List / Filters / Pagination</h4>
      <div class="card p-3">
        <h5 class="endpoint">GET /attendance?courseID=1&date=2025-12-23&page=1&limit=20&status=present&stdId=1</h5>
        <p>Query params:</p>
        <ul>
          <li><code>courseID</code> (optional)</li>
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

      <h4>Location Learning System</h4>
      <div class="card p-3">
        <h5>How Course Location Validation Works</h5>
        <p class="text-muted">The system uses a two-phase approach to learn and enforce course locations:</p>
        <ul>
          <li><strong>Phase 1 (Learning, < 5 samples):</strong> Accepts any location submission and collects GPS coordinates to learn the actual course location. No rejections during this phase.</li>
          <li><strong>Phase 2 (Enforcement, >= 5 samples):</strong> Once 5 or more attendance submissions are collected, the system calculates the average location and enforces a 100m radius check on all future submissions.</li>
          <li>If a student is outside the learned radius, they receive a clear error message with their distance from the course location.</li>
          <li>This approach allows for campus diversity (different buildings, outdoor classes) while preventing abuse once the system learns where the course actually takes place.</li>
        </ul>
        <p class="text-muted">Debug endpoints (remove in production):</p>
        <ul>
          <li><code>GET /attendance/debug/locations</code> - View all learned course locations</li>
          <li><code>DELETE /attendance/debug/locations/:courseID</code> - Reset learning for a course</li>
        </ul>
      </div>

      <p class="mt-3 text-muted">Notes: Admin endpoints (dashboard, stats, deletes) and the teacher admin flows are documented in the project README. The endpoints above are everything the student mobile app and teacher web app need to build a working UI.</p>

    </div>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;