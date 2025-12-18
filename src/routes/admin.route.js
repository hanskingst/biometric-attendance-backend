import { Router } from 'express';
import { getCounters } from '../middleware/requestCounter.js';
import { Student, Teacher, Course } from '../models/index.js';

const router = Router();

// JSON stats endpoint
router.get('/stats', async (req, res) => {
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

// Simple server-rendered dashboard (HTML)
router.get('/dashboard', async (req, res) => {
  try {
    const counters = getCounters();
    const students = await Student.findAll({ attributes: ['stdId','name','email'] });
    const teachers = await Teacher.findAll({ attributes: ['teacherId','name','email'] });
    const courses = await Course.findAll({ attributes: ['courseID','title','startTime','endTime','instructorID'] });

    const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Admin Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left }
          h2 { margin-top: 40px }
          pre { background: #f6f6f6; padding: 12px }
        </style>
      </head>
      <body>
        <h1>Admin Dashboard</h1>
        <h2>Request Counters</h2>
        <pre>${JSON.stringify(counters, null, 2)}</pre>

        <h2>Counts</h2>
        <ul>
          <li>Students: ${students.length}</li>
          <li>Teachers: ${teachers.length}</li>
          <li>Courses: ${courses.length}</li>
        </ul>

        <h2>Students</h2>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
          <tbody>
          ${students.map(s => `<tr><td>${s.stdId}</td><td>${s.name}</td><td>${s.email}</td></tr>`).join('')}
          </tbody>
        </table>

        <h2>Teachers</h2>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
          <tbody>
          ${teachers.map(t => `<tr><td>${t.teacherId}</td><td>${t.name}</td><td>${t.email}</td></tr>`).join('')}
          </tbody>
        </table>

        <h2>Courses</h2>
        <table>
          <thead><tr><th>ID</th><th>Title</th><th>Start</th><th>End</th><th>InstructorID</th></tr></thead>
          <tbody>
          ${courses.map(c => `<tr><td>${c.courseID}</td><td>${c.title}</td><td>${new Date(c.startTime).toLocaleString()}</td><td>${new Date(c.endTime).toLocaleString()}</td><td>${c.instructorID}</td></tr>`).join('')}
          </tbody>
        </table>
      </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server error');
  }
});

export default router;
