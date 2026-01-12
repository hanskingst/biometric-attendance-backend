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

        <h4 class="section-title">Attendance Sessions (Session Management)</h4>
        <div class="card mb-3">
          <div class="card-body">
            <p class="text-muted mb-3">The attendance system now uses sessions. Teachers create sessions to control when students can mark attendance. Students can only submit attendance to an active (open) session within its time window.</p>

            <p class="mb-1 endpoint"><strong>POST</strong> <code>/attendance/course/:courseID/attendance-sessions</code></p>
            <p class="text-muted">Teacher creates and opens a new attendance session for their course. Requires teacher authentication. The teacher must own the course.</p>
            <p class="text-muted">Request JSON:</p>
            <pre>{
  "openedAt": "2025-12-23T08:30:00Z",  // optional, defaults to current time
  "closedAt": "2025-12-23T09:30:00Z",  // optional, null for no end time
  "status": "open",                     // optional, "open" or "closed", defaults to "open"
  "notes": "Regular class session"      // optional, any teacher notes
}</pre>
            <p class="text-muted">Success response (201):</p>
            <pre>{
  "message": "Attendance session created",
  "session": {
    "sessionId": 1,
    "courseID": 1,
    "teacherId": 5,
    "openedAt": "2025-12-23T08:30:00Z",
    "closedAt": "2025-12-23T09:30:00Z",
    "status": "open",
    "notes": "Regular class session",
    "createdAt": "2025-12-23T08:29:00Z",
    "updatedAt": "2025-12-23T08:29:00Z"
  }
}</pre>
            <p class="text-muted">Error responses:</p>
            <ul class="small">
              <li>404: Course not found</li>
              <li>403: Teacher does not own this course</li>
            </ul>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/attendance/course/:courseID/attendance-sessions/open</code></p>
            <p class="text-muted">Check if there is currently an active (open) attendance session for a course. Used by student apps to determine if they can submit attendance. No authentication required.</p>
            <p class="text-muted">Response when active session exists and is within time bounds (200):</p>
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
            <p class="text-muted">Response when no active session or session is outside time bounds (200):</p>
            <pre>{ "active": false }</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/attendance/course/:courseID/attendance-sessions</code></p>
            <p class="text-muted">List all attendance sessions for a course with pagination and optional status filtering. Requires teacher authentication. Teacher must own the course.</p>
            <p class="text-muted">Query parameters:</p>
            <ul class="small">
              <li><code>page</code> (optional, default: 1, min: 1)</li>
              <li><code>limit</code> (optional, default: 50, min: 1, max: 200)</li>
              <li><code>status</code> (optional, filter by "open" or "closed")</li>
            </ul>
            <p class="text-muted">Example: <code>GET /attendance/course/1/attendance-sessions?page=1&limit=20&status=open</code></p>
            <p class="text-muted">Success response (200):</p>
            <pre>{
  "data": [
    {
      "sessionId": 2,
      "courseID": 1,
      "teacherId": 5,
      "openedAt": "2025-12-24T08:30:00Z",
      "closedAt": null,
      "status": "open",
      "notes": "Morning session",
      "createdAt": "2025-12-24T08:29:00Z",
      "updatedAt": "2025-12-24T08:29:00Z"
    },
    {
      "sessionId": 1,
      "courseID": 1,
      "teacherId": 5,
      "openedAt": "2025-12-23T08:30:00Z",
      "closedAt": "2025-12-23T09:30:00Z",
      "status": "closed",
      "notes": "Regular class session",
      "createdAt": "2025-12-23T08:29:00Z",
      "updatedAt": "2025-12-23T09:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}</pre>
            <p class="text-muted">Error responses:</p>
            <ul class="small">
              <li>404: Course not found</li>
              <li>403: Teacher does not own this course</li>
            </ul>
          </div>
        </div>

        <h4 class="section-title">Attendance (Student Submission)</h4>
        <div class="card mb-3">
          <div class="card-body">
            <p class="mb-1 endpoint"><strong>POST</strong> <code>/attendance/attendance-sessions/:sessionID/attendance</code></p>
            <p class="text-muted"><strong>Primary student attendance endpoint (session-aware):</strong> Students submit their attendance (location + biometric) to a specific open session. The session must exist, be open, and the current time must be within the session's time window.</p>
            <p class="text-muted">Request JSON:</p>
            <pre>{
  "stdId": 1,
  "fingerprinthash": "abc123def456",  // biometric hash from device, empty string if failed
  "latitude": "4.1533",                // student's GPS latitude
  "longitude": "9.2927",               // student's GPS longitude
  "school_lat": "4.1533",              // optional but recommended - expected course location
  "school_lon": "9.2927"               // optional but recommended
}</pre>

            <p class="text-muted mt-3">Validation flow and responses:</p>
            <ul class="small">
              <li><strong>Session validation:</strong>
                <ul>
                  <li>404 if session not found: <code>{ "message": "Attendance session not found" }</code></li>
                  <li>400 if session not open: <code>{ "message": "Attendance session is not open" }</code></li>
                  <li>400 if before openedAt: <code>{ "message": "Attendance session has not opened yet" }</code></li>
                  <li>400 if after closedAt: <code>{ "message": "Attendance session is already closed" }</code></li>
                </ul>
              </li>
              <li><strong>Enrollment validation:</strong>
                <ul>
                  <li>403 if not enrolled: <code>{ "message": "Student not enrolled in this course" }</code></li>
                </ul>
              </li>
              <li><strong>Location validation:</strong>
                <ul>
                  <li>400 if location missing: <code>{ "message": "Location is required" }</code></li>
                  <li>400 if invalid coordinates: <code>{ "message": "Invalid latitude/longitude" }</code></li>
                  <li>400 if outside learned course radius (Phase 2, after 5+ samples): detailed error with distance</li>
                </ul>
              </li>
              <li><strong>Biometric validation:</strong>
                <ul>
                  <li>If biometric failed (missing or < 5 chars): <strong>Does not reject</strong> - creates absent record marked by system</li>
                  <li>If biometric succeeded: creates present record marked by biometric</li>
                </ul>
              </li>
            </ul>

            <p class="text-muted mt-3">Success response - biometric passed (200):</p>
            <pre>{
  "message": "Attendance recorded",
  "attendance": {
    "attId": 12,
    "stdId": 1,
    "courseID": 1,
    "sessionId": 1,
    "fingerprinthash": "abc123def456",
    "latitude": "4.1533",
    "longitude": "9.2927",
    "timestamp": "2025-12-23T08:31:23.000Z",
    "valid": true,
    "status": "present",
    "markedBy": "biometric",
    "markedAt": "2025-12-23T08:31:23.000Z",
    "teacherId": null,
    "notes": null
  }
}</pre>

            <p class="text-muted">Success response - biometric failed (200):</p>
            <pre>{
  "message": "Biometric failed - recorded as absent",
  "attendance": {
    "attId": 13,
    "stdId": 1,
    "courseID": 1,
    "sessionId": 1,
    "fingerprinthash": null,
    "latitude": "4.1533",
    "longitude": "9.2927",
    "timestamp": "2025-12-23T08:32:00.000Z",
    "valid": false,
    "status": "absent",
    "markedBy": "system",
    "markedAt": "2025-12-23T08:32:00.000Z",
    "teacherId": null,
    "notes": null
  }
}</pre>

            <p class="text-muted">Error response - location outside course radius (400, Phase 2 only):</p>
            <pre>{
  "message": "Your location is 250m away from the course location (100m allowed). Are you on campus?",
  "distance": 250,
  "allowed": 100,
  "courseLocation": { "lat": 4.1533, "lon": 9.2927 },
  "yourLocation": { "lat": 4.1556, "lon": 9.2950 }
}</pre>

            <hr />
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/attendance/attendance-sessions/:sessionID/attendance</code></p>
            <p class="text-muted">List all attendance records for a specific session. Returns student and course details. Supports pagination.</p>
            <p class="text-muted">Query parameters:</p>
            <ul class="small">
              <li><code>page</code> (optional, default: 1)</li>
              <li><code>limit</code> (optional, default: 50, max: 200)</li>
            </ul>
            <p class="text-muted">Success response (200):</p>
            <pre>{
  "data": [
    {
      "attId": 12,
      "stdId": 1,
      "courseID": 1,
      "sessionId": 1,
      "fingerprinthash": "abc123def456",
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
        "name": "Alice Johnson",
        "email": "alice@example.com"
      },
      "course": {
        "courseID": 1,
        "title": "Math 101"
      }
    },
    {
      "attId": 13,
      "stdId": 2,
      "courseID": 1,
      "sessionId": 1,
      "fingerprinthash": null,
      "timestamp": "2025-12-23T08:32:15Z",
      "latitude": "4.1534",
      "longitude": "9.2928",
      "valid": false,
      "status": "absent",
      "markedBy": "system",
      "markedAt": "2025-12-23T08:32:15Z",
      "teacherId": null,
      "notes": null,
      "createdAt": "2025-12-23T08:32:15Z",
      "updatedAt": "2025-12-23T08:32:15Z",
      "student": {
        "stdId": 2,
        "name": "Bob Smith",
        "email": "bob@example.com"
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
        </div>

        <h4 class="section-title">Attendance (Legacy & Filtering)</h4>
        <div class="card mb-3">
          <div class="card-body">
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/attendance?courseID=1&date=YYYY-MM-DD&page=1&limit=20&status=present&stdId=1</code></p>
            <p class="text-muted">List attendance records for a course with optional filters. All filters are optional. Includes student object with name and email.</p>
            <p class="text-muted">Query parameters:</p>
            <ul class="small">
              <li><code>courseID</code> (optional, numeric filter)</li>
              <li><code>date</code> (optional, format: YYYY-MM-DD)</li>
              <li><code>stdId</code> (optional, numeric filter)</li>
              <li><code>status</code> (optional: present/absent/manual)</li>
              <li><code>page</code>, <code>limit</code> (optional pagination)</li>
            </ul>
            <pre>{ "data": [ { "attId":12, "stdId":1, "courseID":1, "fingerprinthash":"abc123", "timestamp":"2025-12-23T08:31:23Z", "latitude":"4.1533", "longitude":"9.2927", "valid":true, "createdAt":"2025-12-23T08:31:23Z", "updatedAt":"2025-12-23T08:31:23Z", "student": { "stdId":1, "name":"Alice", "email":"alice@example.com" }, "course": { "courseID":1, "title":"Math 101" } } ], "meta": { "page":1, "limit":20, "total":120, "totalPages":6 } }</pre>

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

            <hr />
            <p class="mb-1 endpoint"><strong>DELETE</strong> <code>/attendance/:attId</code> (Teacher Auth Required)</p>
            <p class="text-muted">Delete an attendance record. Teacher must own the course that the attendance belongs to. Returns the deleted record ID.</p>
            <p class="text-muted">Success response (200):</p>
            <pre>{ "message": "Attendance record deleted successfully", "attId": 14 }</pre>
            <p class="text-muted">Error responses:</p>
            <ul class="small">
              <li>400: attId is required</li>
              <li>404: Attendance record not found</li>
              <li>404: Course not found</li>
              <li>403: You can only delete attendance from your own courses</li>
            </ul>
          </div>
        </div>

        <h4 class="section-title">Location Learning System</h4>
        <div class="card mb-3">
          <div class="card-body">
            <h6>How Course Location Validation Works</h6>
            <p class="text-muted">The system uses a two-phase adaptive learning approach to balance security with flexibility:</p>
            
            <p class="text-muted mt-2"><strong>Phase 1: Learning Mode (< 5 samples)</strong></p>
            <ul class="small">
              <li>Accepts any GPS location from students marking attendance</li>
              <li>Collects and stores location coordinates to learn where the course actually takes place</li>
              <li>No location-based rejections during this phase</li>
              <li>Ideal for new courses or courses in varying locations</li>
            </ul>

            <p class="text-muted mt-2"><strong>Phase 2: Enforcement Mode (>= 5 samples)</strong></p>
            <ul class="small">
              <li>System calculates average location from the first 5+ attendance submissions</li>
              <li>Creates a CourseLocation record with the inferred coordinates</li>
              <li>All future attendance submissions must be within 100 meters of this learned location</li>
              <li>Submissions outside the radius are rejected with a detailed error message showing:
                              <ul>
                  <li>Distance from expected course location</li>
                  <li>Allowed radius (default: 100 meters)</li>
                  <li>Expected course coordinates</li>
                  <li>Student's submitted coordinates</li>
                </ul>
            </ul>

            <p class="text-muted mt-3">
              This approach prevents early false rejections while gradually enforcing strict
              on-campus attendance as reliable data becomes available.
            </p>
          </div>
        </div>

        <h4 class="section-title">Health & Utilities</h4>
        <div class="card mb-3">
          <div class="card-body">
            <p class="mb-1 endpoint"><strong>GET</strong> <code>/health</code></p>
            <p class="text-muted">
              Lightweight health check endpoint. Returns server status and timestamp.
            </p>
            <pre>{ "status": "ok", "timestamp": "2025-12-23T08:30:00Z" }</pre>
          </div>
        </div>

        <footer class="text-center text-muted small mt-4">
          <hr />
          <p>
            Biometric Attendance System — API Documentation<br/>
            Session-based attendance is the recommended approach for all new clients.
          </p>
        </footer>

      </div>
    </body>
  </html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
