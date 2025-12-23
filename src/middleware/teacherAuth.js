import { Teacher } from '../models/index.js';

// Simple teacher auth middleware using Basic Auth (email:password)
// Attaches req.teacher on success
async function teacherAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Teacher"');
    return res.status(401).json({ message: 'Teacher authentication required' });
  }

  try {
    const creds = Buffer.from(auth.slice(6), 'base64').toString('utf8');
    const [email, password] = creds.split(':');
    if (!email || !password) return res.status(401).json({ message: 'Invalid credentials' });

    const teacher = await Teacher.findOne({ where: { email }, attributes: ['teacherId', 'name', 'email', 'password'] });
    if (!teacher) return res.status(401).json({ message: 'Invalid credentials' });

    if (teacher.password !== password) return res.status(401).json({ message: 'Invalid credentials' });

    // attach minimal teacher info
    req.teacher = { teacherId: teacher.teacherId, name: teacher.name, email: teacher.email };
    return next();
  } catch (err) {
    console.error('teacherAuth error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export default teacherAuth;
