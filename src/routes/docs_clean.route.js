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
              <p class="text-muted">Register a new student account. Email must be unique.</p>
              <pre>{ "name": "Alice Johnson", "email": "alice@example.com", "password": "SecurePass123!" }</pre>
              <p class="text-muted">Response (201):</p>
            <pre>{ "message": "Student created successfully", "student": { "stdId": 1, "name": "Alice", "email": "alice@example.com" } }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/students/login</code></p>
              <p class="text-muted">Authenticate student with email and password credentials.</p>
              <pre>{ "email": "alice@example.com", "password": "SecurePass123!" }</pre>
            <p class="text-muted">Success (200):</p>
            <pre>{ "message": "Login successful", "student": { "stdId": 1, "name": "Alice", "email": "alice@example.com" } }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/students?page=1&limit=20</code></p>
              <p class="text-muted">List all registered students with pagination.</p>
            <pre>{ "data": [ { "stdId":1, "name":"Alice", "email":"alice@example.com" } ], "meta": { "page":1, "limit":20, "total":42, "totalPages":3 } }</pre>
          </div>
        </div>

        <h4 class="section-title">Teachers</h4>
        <div class="card mb-3">
          <div class="card-body">
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/teachers/register</code></p>
            <p class="text-muted">Register a new teacher account.</p>
            <pre>{ "name":"Bob Wilson", "email":"bob@example.com", "password":"secret" }</pre>
            <p class="text-muted">Response (201):</p>
            <pre>{ "message": "Teacher created successfully", "teacher": { "teacherId": 1, "name": "Bob Wilson", "email": "bob@example.com" } }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/teachers/login</code></p>
            <p class="text-muted">Authenticate a teacher with email and password.</p>
            <pre>{ "email":"bob@example.com", "password":"secret" }</pre>
            <p class="text-muted">Response (200):</p>
            <pre>{ "message": "Login successful", "teacher": { "teacherId": 1, "name": "Bob Wilson", "email": "bob@example.com" } }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/teachers?page=1&limit=20</code></p>
            <p class="text-muted">List all teachers with pagination.</p>
            <pre>{ "data": [ { "teacherId":1, "name":"Bob Wilson", "email":"bob@example.com" }, { "teacherId":2, "name":"Carol Davis", "email":"carol@example.com" } ], "meta": { "page":1, "limit":20, "total":3, "totalPages":1 } }</pre>
          </div>
        </div>

        <h4 class="section-title">Courses</h4>
        <div class="card mb-3">
          <div class="card-body">
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/courses/course</code></p>
            <p class="text-muted">Create a new course.</p>
            <pre>{ "title": "Math 101", "startTime": "2025-12-23T08:30:00Z", "endTime": "2025-12-23T09:30:00Z", "instructorID": 1 }</pre>
            <p class="text-muted">Response (201):</p>
            <pre>{ "message": "course registered successfully", "course": { "courseID": 1, "title": "Math 101", "instructorID": 1, "startTime": "2025-12-23T08:30:00Z", "endTime": "2025-12-23T09:30:00Z" } }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/courses?page=1&limit=20</code></p>
            <p class="text-muted">List all courses (with pagination). Optional: add <code>teacherID</code> query param to filter courses by instructor.</p>
            <pre>// Without teacherID filter
{ "data": [ { "courseID":1, "title":"Math 101", "startTime":"2025-12-23T08:30:00Z", "endTime":"2025-12-23T09:30:00Z", "instructorID":1 } ], "meta": { "page":1, "limit":20, "total":10, "totalPages":1 } }

// With teacherID=1 filter
{ "teacherID": 1, "data": [ { "courseID":1, "title":"Math 101", "startTime":"...", "endTime":"...", "instructorID":1 } ], "meta": { "page":1, "limit":20, "total":3, "totalPages":1 } }</pre>
            <p class="text-muted small">Note: When <code>teacherID</code> is provided, it appears in the response; pagination parameters (page, limit) work with or without filters.</p>
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
            <p class="text-muted">Error (400) if already enrolled:</p>
            <pre>{ "message": "Already enrolled" }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/enrollments/course/:courseID</code></p>
            <p class="text-muted">List all students enrolled in a specific course with student details and total count.</p>
            <pre>{ "courseID": 1, "students": [ { "stdId":1, "name":"Alice", "email":"alice@example.com" }, { "stdId":2, "name":"Bob", "email":"bob@example.com" } ], "totalStudents": 2 }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/enrollments/student/:stdId</code></p>
            <p class="text-muted">List all courses a specific student is enrolled in with course details.</p>
            <pre>{ "stdId": 1, "courses": [ { "courseID":1, "title":"Math 101", "instructorID":5, "startTime":"2025-12-23T08:30:00Z", "endTime":"2025-12-23T09:30:00Z" }, { "courseID":2, "title":"Physics 101", "instructorID":6, "startTime":"2025-12-23T10:00:00Z", "endTime":"2025-12-23T11:00:00Z" } ] }</pre>
          </div>
        </div>

        <h4 class="section-title">Attendance</h4>
        <div class="card mb-3">
          <div class="card-body">
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/attendance</code></p>
            <p class="text-muted">Student mobile sends location + fingerprint hash. Backend enforces course time window and validates school location.</p>
            <pre>{ "stdId":1, "courseID":1, "fingerprinthash":"abc123def456", "latitude":"4.1533", "longitude":"9.2927" }</pre>

            <p class="text-muted">Response on biometric success (200):</p>
            <pre>{ "message":"Attendance recorded", "attendance": { "attId":12, "stdId":1, "courseID":1, "fingerprinthash":"abc123def456", "latitude":"4.1533", "longitude":"9.2927", "timestamp":"2025-12-23T08:31:23Z", "valid":true, "status":"present", "markedBy":"biometric", "markedAt":"2025-12-23T08:31:23Z" } }</pre>

            <p class="text-muted">Response on biometric failure - recorded as absent (200):</p>
            <pre>{ "message":"Biometric failed - recorded as absent", "attendance": { "attId":13, "stdId":1, "courseID":1, "fingerprinthash":null, "latitude":"4.1533", "longitude":"9.2927", "timestamp":"2025-12-23T08:32:00Z", "valid":false, "status":"absent", "markedBy":"system", "markedAt":"2025-12-23T08:32:00Z" } }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/attendance?courseID=1&date=YYYY-MM-DD&page=1&limit=20&status=present&stdId=1</code></p>
            <p class="text-muted">List attendance records for a course with optional filters. Required: <code>courseID</code>. Optional: <code>date</code> (YYYY-MM-DD), <code>status</code> (present/absent/manual), <code>stdId</code>, <code>page</code>, <code>limit</code>. Includes student object with name and email.</p>
            <pre>{ "data": [ { "attId":12, "stdId":1, "courseID":1, "fingerprinthash":"abc123", "timestamp":"2025-12-23T08:31:23Z", "latitude":"4.1533", "longitude":"9.2927", "valid":true, "createdAt":"2025-12-23T08:31:23Z", "updatedAt":"2025-12-23T08:31:23Z", "student": { "stdId":1, "name":"Alice", "email":"alice@example.com" } } ], "meta": { "page":1, "limit":20, "total":120, "totalPages":6 } }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/attendance/stats/:teacherID?date=YYYY-MM-DD</code></p>
            <p class="text-muted">Get attendance statistics for all courses taught by a specific teacher on a given date. Required: <code>teacherID</code> (path param) and <code>date</code> (query param, format: YYYY-MM-DD). Returns total students enrolled, present count, absent count, and percentages.</p>
            <pre>{ "teacherID": 5, "date": "2025-12-23", "stats": { "totalStudents": 75, "present": 53, "absent": 22, "presentPercentage": 70.67, "absentPercentage": 29.33 } }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/attendance/failed?courseID=1&date=YYYY-MM-DD</code></p>
            <p class="text-muted">List unique students with failed biometric attendance (marked as absent by system). Required: <code>courseID</code>. Optional: <code>date</code> (YYYY-MM-DD).</p>
            <pre>{ "students": [ { "stdId":1, "name":"Alice", "email":"alice@example.com" }, { "stdId":3, "name":"Charlie", "email":"charlie@example.com" } ] }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/attendance/manual</code> (Teacher Auth Required)</p>
            <p class="text-muted">Teacher manually marks attendance for a student in their course. Teacher must own the course and marking must be within course time window.</p>
            <pre>{ "stdId":3, "courseID":1, "notes":"Fingerprint sensor malfunction" }</pre>
            <p class="text-muted">Response (201) - new manual attendance:</p>
            <pre>{ "message": "Attendance marked manually", "attendance": { "attId":14, "stdId":3, "courseID":1, "fingerprinthash":null, "latitude":null, "longitude":null, "timestamp":"2025-12-23T08:45:00Z", "valid":false, "status":"manual", "markedBy":"teacher", "teacherId":5, "markedAt":"2025-12-23T08:45:00Z", "notes":"Fingerprint sensor malfunction" } }</pre>
            <p class="text-muted">Response (200) - updated existing attendance on same day:</p>
            <pre>{ "message": "Attendance updated (manual)", "attendance": { "attId":13, "stdId":3, "courseID":1, "status":"manual", "markedBy":"teacher", "teacherId":5, "markedAt":"2025-12-23T08:45:00Z", "notes":"Fingerprint sensor malfunction" } }</pre>
          </div>
        </div>

        <h4 class="section-title">Admin (dashboard & management)</h4>
        <div class="card mb-4">
          <div class="card-body">
            <p class="text-muted">Admin endpoints for viewing statistics, managing entities (students, teachers, courses), and system administration. Requires admin authentication (Basic Auth with admin credentials or session cookie).</p>
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/admin/stats</code></p>
            <p class="text-muted">Get system-wide statistics including total requests, students, teachers, and courses.</p>
            <pre>{ "requests": 1234, "students": 42, "teachers": 3, "courses": 10 }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>DELETE</strong> <code>/admin/students/:id</code></p>
            <p class="text-muted">Delete a student account. Cascades to remove all related enrollments and attendance records. Requires admin authentication.</p>
            <pre>Example: curl -X DELETE -u johnnystock@gmail.com:Jesus12@# http://{host}/admin/students/1
Response (200): { "message": "Student deleted successfully" }</pre>

            <hr />
            <p class="text-muted"><strong>Note:</strong> Admin credentials (development/demo): <code>johnnystock@gmail.com / Jesus12@#</code></p>
          </div>
        </div>

          <h4 class="section-title">HTTP Status Codes</h4>
          <div class="card mb-3">
            <div class="card-body">
              <ul>
                <li><strong>200 OK:</strong> Successful GET/POST/PUT request</li>
                <li><strong>201 Created:</strong> Resource successfully created (POST requests)</li>
                <li><strong>400 Bad Request:</strong> Missing or invalid request parameters</li>
                <li><strong>403 Forbidden:</strong> Insufficient permissions (e.g., teacher accessing another teacher's course)</li>
                <li><strong>404 Not Found:</strong> Resource does not exist</li>
                <li><strong>500 Server Error:</strong> Internal server error</li>
              </ul>
            </div>
          </div>

          <h4 class="section-title">Important Notes & Best Practices</h4>
          <div class="card mb-4">
            <div class="card-body">
              <h6>Authentication</h6>
              <ul>
                <li>Student/Teacher login endpoints return user data in response (no token); store credentials securely on client side</li>
                <li>Teacher endpoints for manual attendance marking require teacher authentication via middleware</li>
                <li>Admin endpoints require Basic Auth with admin email/password credentials</li>
              </ul>

              <h6 class="mt-3">Attendance Marking</h6>
              <ul>
                <li>Students can only submit attendance during their course's scheduled time window (between <code>startTime</code> and <code>endTime</code>)</li>
                <li>Biometric validation requires a fingerprint hash of at least 5 characters; failures are recorded as "absent" by system</li>
                <li>Location validation checks if student is within ~100 meters of the learned school location or default coordinates</li>
                <li>Teachers can manually override attendance using <code>POST /attendance/manual</code> if biometric fails or issues occur</li>
              </ul>

              <h6 class="mt-3">Enrollment</h6>
              <ul>
                <li>Students must be enrolled in a course before they can mark attendance</li>
                <li>Use <code>GET /enrollments/course/:courseID</code> to see all students in a course</li>
                <li>Use <code>GET /enrollments/student/:stdId</code> to see all courses a student is taking</li>
              </ul>

              <h6 class="mt-3">Pagination</h6>
              <ul>
                <li>Default page size is 20 records; adjust with <code>limit</code> parameter</li>
                <li>Always check <code>meta.totalPages</code> to determine if more results exist</li>
                <li>Pages are 1-indexed (start from page 1, not 0)</li>
              </ul>

              <h6 class="mt-3">Course Management</h6>
              <ul>
                <li>Courses belong to teachers (instructorID field links to teacher)</li>
                <li>Use <code>GET /courses?teacherID=X</code> to list courses taught by a specific teacher</li>
                <li>School location is inferred from the first 5 attendance submissions per course if not explicitly set</li>
              </ul>

              <h6 class="mt-3">Analytics & Reporting</h6>
              <ul>
                <li><code>GET /attendance/stats/:teacherID?date=YYYY-MM-DD</code> provides daily attendance summary across all teacher's courses</li>
                <li><code>GET /attendance/failed?courseID=X</code> lists students with failed biometric attempts for a course</li>
                <li>Both endpoints support optional date filtering in YYYY-MM-DD format</li>
              </ul>
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

