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

// Admin deletes
// Delete student (cascades enrollments and attendance)
router.delete('/students/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const student = await Student.findByPk(id);
    if(!student) return res.status(404).json({ message: 'Student not found' });

    // delete related attendance and enrollments
    await Attendance.destroy({ where: { stdId: id } });
    await Enrollment.destroy({ where: { stdId: id } });

    await student.destroy();
    return res.json({ message: 'Student deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete teacher (prevent if teacher has courses)
router.delete('/teachers/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const teacher = await Teacher.findByPk(id);
    if(!teacher) return res.status(404).json({ message: 'Teacher not found' });

    const courses = await Course.findAll({ where: { instructorID: id } });
    if(courses.length > 0) return res.status(400).json({ message: 'Teacher has courses. Remove or reassign courses before deleting teacher.' });

    await teacher.destroy();
    return res.json({ message: 'Teacher deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete course (cascades enrollments and attendance)
router.delete('/courses/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const course = await Course.findByPk(id);
    if(!course) return res.status(404).json({ message: 'Course not found' });

    await Attendance.destroy({ where: { courseID: id } });
    await Enrollment.destroy({ where: { courseID: id } });

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

    const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Admin Dashboard</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          :root{--bg:#f4f7fb;--card:#ffffff;--accent:#0d6efd}
          body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:var(--bg);padding:24px}
          .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
          .card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
          .stat-card{background:var(--card);padding:18px;border-radius:12px;box-shadow:0 6px 18px rgba(13,38,76,0.06)}
          .table-wrap{background:var(--card);padding:16px;border-radius:12px;box-shadow:0 6px 18px rgba(13,38,76,0.04);margin-top:18px}
          .logout-btn{margin-left:12px}
          pre{background:#0b1220;color:#dbeafe;padding:12px;border-radius:8px;overflow:auto}

          /* Responsive tweaks */
          @media (max-width: 768px) {
            body{padding:14px}
            .topbar{flex-direction:column;align-items:flex-start;gap:8px}
            .logout-btn{margin-left:0}
            .card-grid{grid-template-columns:1fr}
            .stat-card{padding:14px}
            .table-wrap{padding:12px}
            .stat-card h2{font-size:1.6rem}
          }

          @media (max-width: 480px) {
            .topbar h1{font-size:1.05rem}
            .stat-card h2{font-size:1.4rem}
            .table-wrap table td, .table-wrap table th{white-space:normal;word-break:break-word;font-size:0.9rem}
            .table-wrap .btn{width:100%;font-size:0.85rem;padding:6px 8px}
            pre{font-size:0.85rem}
          }
        </style>
      </head>
      <body>
        <div class="topbar">
          <div>
            <h1 class="h4">Biometric App — Admin</h1>
            <small class="text-muted">Overview & live stats</small>
          </div>
          <div>
            <a class="btn btn-outline-secondary" href="/">Home</a>
            <a class="btn btn-danger logout-btn" href="/admin/logout">Sign out</a>
          </div>
        </div>

        <div class="card-grid">
          <div class="stat-card">
            <h6 class="text-muted">Total Requests</h6>
            <h2>${counters.total}</h2>
            <small class="text-muted">By endpoint:</small>
            <pre>${JSON.stringify(counters.byEndpoint, null, 2)}</pre>
          </div>
          <div class="stat-card">
            <h6 class="text-muted">Students</h6>
            <h2>${students.length}</h2>
            <p class="text-muted mb-0">Total registered students</p>
          </div>
          <div class="stat-card">
            <h6 class="text-muted">Teachers</h6>
            <h2>${teachers.length}</h2>
            <p class="text-muted mb-0">Total registered teachers</p>
          </div>
          <div class="stat-card">
            <h6 class="text-muted">Courses</h6>
            <h2>${courses.length}</h2>
            <p class="text-muted mb-0">Active courses</p>
          </div>
        </div>

        <div class="table-wrap mt-4">
          <h5>Students</h5>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
              <tbody>
                ${students.map(s => `<tr data-id="${s.stdId}"><td>${s.stdId}</td><td>${s.name}</td><td>${s.email}</td><td><button class="btn btn-sm btn-danger delete-student">Delete</button></td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="table-wrap mt-4">
          <h5>Teachers</h5>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
              <tbody>
                ${teachers.map(t => `<tr data-id="${t.teacherId}"><td>${t.teacherId}</td><td>${t.name}</td><td>${t.email}</td><td><button class="btn btn-sm btn-danger delete-teacher">Delete</button></td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="table-wrap mt-4">
          <h5>Courses</h5>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead><tr><th>ID</th><th>Title</th><th>Start</th><th>End</th><th>InstructorID</th></tr></thead>
              <tbody>
                ${courses.map(c => `<tr data-id="${c.courseID}"><td>${c.courseID}</td><td>${c.title}</td><td>${new Date(c.startTime).toLocaleString()}</td><td>${new Date(c.endTime).toLocaleString()}</td><td>${c.instructorID}</td><td><button class="btn btn-sm btn-danger delete-course">Delete</button></td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <script>
          // helper to send DELETE and update UI
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

export default router;
