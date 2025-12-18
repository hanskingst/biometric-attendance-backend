import crypto from 'crypto';

// Single admin credential (as requested)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'johnnystock@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Jesus12@#';

// In-memory token store (simple)
const tokens = new Set();

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

function parseCookies(cookieHeader) {
  const obj = {};
  if (!cookieHeader) return obj;
  cookieHeader.split(';').forEach(part => {
    const [k, ...v] = part.trim().split('=');
    obj[k] = decodeURIComponent(v.join('='));
  });
  return obj;
}

// Login validator: returns token on success
async function loginAdmin(email, password) {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = generateToken();
    tokens.add(token);
    return token;
  }
  return null;
}

function requireAdmin(req, res, next) {
  // check cookie
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.admin_token;
  if (token && tokens.has(token)) return next();

  // fallback: Basic auth header
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Basic ')) {
    try {
      const creds = Buffer.from(auth.slice(6), 'base64').toString('utf8');
      const [email, password] = creds.split(':');
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) return next();
    } catch (e) {
      // ignore
    }
  }

  // Not authorized
  // If the request accepts html, redirect to login; otherwise send 401
  const accept = req.headers.accept || '';
  if (accept.includes('text/html')) {
    return res.redirect('/admin/login');
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
  return res.status(401).json({ message: 'Unauthorized' });
}

function logoutToken(token) {
  tokens.delete(token);
}

export { loginAdmin, requireAdmin, parseCookies, logoutToken };
