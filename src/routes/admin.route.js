import { Router } from 'express';
import { getCounters } from '../middleware/requestCounter.js';
import { Student, Teacher, Course, Enrollment, Attendance } from '../models/index.js';
import { loginAdmin, requireAdmin, logoutToken, parseCookies } from '../middleware/adminAuth.js';

const router = Router();

// show login form
router.get('/login', (req, res) => {
  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Admin Login</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>body{background:#f4f7fa} .login-card{max-width:420px;margin:80px auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,0.06)}</style>
    </head>
    <body>
      <div class="login-card">
        <h3 class="mb-3">Admin Sign in</h3>
        <form method="POST" action="/admin/login">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input class="form-control" name="email" type="email" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input class="form-control" name="password" type="password" required />
          </div>
          <button class="btn btn-primary w-100" type="submit">Sign in</button>
        </form>
      </div>
    </body>
  </html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// handle login (simple form; store token in cookie)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).send('Email and password required');

    const token = await loginAdmin(email, password);
    if (!token) {
      return res.status(401).send('Invalid credentials');
    }

    // set HttpOnly cookie
    const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=${60*60}${secureFlag}`);
    return res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server error');
  }
});

// logout
router.get('/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.admin_token;
  if (token) logoutToken(token);
  res.setHeader('Set-Cookie', `admin_token=; HttpOnly; Path=/; Max-Age=0`);
  return res.redirect('/admin/login');
});

// JSON stats endpoint (protected)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const counters = getCounters();
    const students = await Student.findAll({ attributes: ['stdId','name','email'] });
    const teachers = await Teacher.findAll({ attributes: ['teacherId','name','email'] });
    const courses = await Course.findAll({ attributes: ['courseID','title','startTime','endTime','instructorID'] });

    return res.json({ counters, counts: { students: students.length, teachers: teachers.length, courses: courses.length }, students, teachers, courses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin deletes student
router.delete('/students/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Cascade will handle enrollments + attendance
    await student.destroy();

    return res.json({ message: 'Student deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});


// Admin deletes teacher
router.delete('/teachers/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const courses = await Course.findAll({ where: { instructorID: id } });
    if (courses.length > 0) {
      return res.status(400).json({ message: 'Teacher has courses. Remove or reassign courses before deleting teacher.' });
    }

    // Cascade will handle sessions, attendance, etc.
    await teacher.destroy();

    return res.json({ message: 'Teacher deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});


// Admin deletes course
router.delete('/courses/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Cascade will handle enrollments, attendance, sessions, location
    await course.destroy();

    return res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});


// Styled dashboard (protected)
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const counters = getCounters();
    const students = await Student.findAll({ attributes: ['stdId','name','email'] });
    const teachers = await Teacher.findAll({ attributes: ['teacherId','name','email'] });
    const courses = await Course.findAll({ attributes: ['courseID','title','startTime','endTime','instructorID'] });
    const attendances = await Attendance.findAll({ 
      order: [['timestamp', 'DESC']],
      limit: 50,
      include: [
        { model: Student, attributes: ['stdId', 'name'] },
        { model: Course, attributes: ['courseID', 'title'] }
      ]
    });

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <title>Admin Dashboard</title>
  
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #64748b;
      --shadow-sm: 0 2px 8px rgba(0,0,0,0.05);
    }

    * { box-sizing: border-box; }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 1rem;
      min-height: 100vh;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.75rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .topbar h1 {
      margin: 0;
      font-size: clamp(1.35rem, 5vw, 1.75rem);
      font-weight: 700;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--card-bg);
      border-radius: 10px;
      padding: 1.5rem;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }

    .stat-card h6 {
      color: var(--muted);
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .stat-card h2 {
      margin: 0.25rem 0 0.75rem;
      font-weight: 700;
      font-size: clamp(1.9rem, 6vw, 2.75rem);
      line-height: 1.1;
    }

    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      overflow-x: auto;
      margin: 0.75rem 0 0;
      max-height: 260px;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .table-section {
      background: var(--card-bg);
      border-radius: 10px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      padding: 1.25rem;
      margin-bottom: 2rem;
    }

    .table-section h5 {
      margin: 0 0 1rem 0;
      font-weight: 600;
      font-size: 1.25rem;
    }

    .table-responsive {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 0 -0.5rem;
    }

    .table {
      width: 100%;
      margin-bottom: 0;
      font-size: 0.95rem;
    }

    .table th,
    .table td {
      padding: 0.75rem;
      vertical-align: middle;
    }

    .table thead th {
      background: #f1f5f9;
      font-weight: 600;
      white-space: nowrap;
    }

    td.long-text {
      white-space: normal !important;
      word-break: break-word;
      min-width: 160px;
    }

    .btn-sm {
      padding: 0.4rem 0.85rem;
      font-size: 0.875rem;
    }

    /* ── RESPONSIVE ─────────────────────────────────────────────── */
    @media (max-width: 992px) {
      .card-grid { gap: 1rem; }
    }

    @media (max-width: 768px) {
      body { padding: 0.875rem; }
      .topbar { flex-direction: column; align-items: flex-start; }
      .stat-card { padding: 1.25rem; }
      .table-section { padding: 1rem; }
      .btn { width: 100%; margin-top: 0.5rem; }
      .table th, .table td { padding: 0.6rem; }
    }

    @media (max-width: 576px) {
      .topbar h1 { font-size: 1.3rem; }
      .stat-card h2 { font-size: 2.1rem; }
      .table th, .table td { font-size: 0.875rem; }
      pre { font-size: 0.8rem; padding: 0.75rem; }
      .table-responsive { margin: 0 -0.875rem; }
      .btn-sm { padding: 0.35rem 0.7rem; font-size: 0.85rem; }
    }
  </style>
</head>
<body>

  <div class="topbar">
    <div>
      <h1>Biometric App — Admin</h1>
      <small class="text-muted">Overview & live stats</small>
    </div>
    <div class="d-flex gap-2 flex-wrap">
      <a class="btn btn-outline-secondary" href="/">Home</a>
      <a class="btn btn-danger logout-btn" href="/admin/logout">Sign out</a>
    </div>
  </div>

  <div class="card-grid">
    <div class="stat-card">
      <h6 class="text-muted">Total Requests:</h6>
      <h2>${counters.total}</h2>
      <small class="text-muted">By endpoint:</small>
      <pre>${JSON.stringify(counters.byEndpoint, null, 2)}</pre>
    </div>
    <div class="stat-card">
      <h6 class="text-muted">Students:</h6>
      <h2>${students.length}</h2>
      <p class="text-muted mb-0">Total registered students</p>
    </div>
    <div class="stat-card">
      <h6 class="text-muted">Teachers:</h6>
      <h2>${teachers.length}</h2>
      <p class="text-muted mb-0">Total registered teachers</p>
    </div>
    <div class="stat-card">
      <h6 class="text-muted">Courses:</h6>
      <h2>${courses.length}</h2>
      <p class="text-muted mb-0">Active courses</p>
    </div>
  </div>

  <div class="table-section">
    <h5>Students</h5>
    <div class="table-responsive">
      <table class="table table-hover table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th class="long-text">Name</th>
            <th class="long-text">Email</th>
            <th style="width:110px;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(s =>`
            <tr data-id="${s.stdId}">
              <td>${s.stdId}</td>
              <td class="long-text">${s.name}</td>
              <td class="long-text">${s.email}</td>
              <td><button class="btn btn-sm btn-danger delete-student w-100">Delete</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="table-section">
    <h5>Teachers</h5>
    <div class="table-responsive">
      <table class="table table-hover table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th class="long-text">Name</th>
            <th class="long-text">Email</th>
            <th style="width:110px;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${teachers.map(t => `
            <tr data-id="\${t.teacherId}">
              <td>${t.teacherId}</td>
              <td class="long-text">${t.name}</td>
              <td class="long-text">${t.email}</td>
              <td><button class="btn btn-sm btn-danger delete-teacher w-100">Delete</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="table-section">
    <h5>Courses</h5>
    <div class="table-responsive">
      <table class="table table-hover table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th class="long-text">Title</th>
            <th>Start</th>
            <th>End</th>
            <th>InstructorID</th>
            <th style="width:110px;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${courses.map(c => `
            <tr data-id="\${c.courseID}">
              <td>${c.courseID}</td>
              <td class="long-text">${c.title}</td>
              <td>${new Date(c.startTime).toLocaleString()}</td>
              <td>${new Date(c.endTime).toLocaleString()}</td>
              <td>${c.instructorID}</td>
              <td><button class="btn btn-sm btn-danger delete-course w-100">Delete</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="table-section">
    <h5>Attendance Records (Latest 50)</h5>
    <div class="table-responsive">
      <table class="table table-hover table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th class="long-text">Student</th>
            <th class="long-text">Course</th>
            <th>Status</th>
            <th>Timestamp</th>
            <th>Marked By</th>
            <th style="width:110px;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${attendances.map(a => {
            const att = a.toJSON ? a.toJSON() : a;
            return `
              <tr data-id="${att.attId}">
                <td>${att.attId}</td>
                <td class="long-text">${att.Student?.name || 'N/A'} (${att.stdId})</td>
                <td class="long-text">${att.Course?.title || 'N/A'} (${att.courseID})</td>
                <td>
                  <span class="badge rounded-pill ${att.status === 'present' ? 'bg-success' : att.status === 'absent' ? 'bg-danger' : 'bg-warning'}">
                    ${att.status}
                  </span>
                </td>
                <td>${new Date(att.timestamp).toLocaleString()}</td>
                <td>${att.markedBy || 'N/A'}</td>
                <td><button class="btn btn-sm btn-danger delete-attendance w-100">Delete</button></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <script>
    async function sendDelete(url){
      if(!confirm('Are you sure you want to delete this item?')) return null;
      const res = await fetch(url, { method: 'DELETE', credentials: 'same-origin' });
      if(!res.ok){
        const body = await res.text();
        alert('Delete failed: ' + res.status + ' ' + body);
        return null;
      }
      return await res.json().catch(()=>({}));
    }

    document.addEventListener('click', async (e) => {
      if(e.target.matches('.delete-student')){
        const row = e.target.closest('tr');
        const id = row.getAttribute('data-id');
        const r = await sendDelete('/admin/students/' + id);
        if(r) row.remove();
      }
      if(e.target.matches('.delete-teacher')){
        const row = e.target.closest('tr');
        const id = row.getAttribute('data-id');
        const r = await sendDelete('/admin/teachers/' + id);
        if(r) row.remove();
      }
      if(e.target.matches('.delete-course')){
        const row = e.target.closest('tr');
        const id = row.getAttribute('data-id');
        const r = await sendDelete('/admin/courses/' + id);
        if(r) row.remove();
      }
      if(e.target.matches('.delete-attendance')){
        const row = e.target.closest('tr');
        const id = row.getAttribute('data-id');
        const r = await sendDelete('/admin/attendance/' + id);
        if(r) row.remove();
      }
    });
  </script>

</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server error');
  }
});

// DELETE /admin/attendance/:attId  (super admin unrestricted delete)
router.delete('/attendance/:attId', requireAdmin, async (req, res) => {
  try {
    const { attId } = req.params;

    if (!attId) {
      return res.status(400).json({ message: 'attId is required' });
    }

    const attendance = await Attendance.findByPk(attId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Delete the attendance record
    await attendance.destroy();
    return res.json({ 
      message: 'Attendance record deleted successfully', 
      attId: parseInt(attId, 10),
      stdId: attendance.stdId,
      courseID: attendance.courseID
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
