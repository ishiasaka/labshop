import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

const FASTAPI_BASE = 'http://127.0.0.1:8001'; // <-- your API port
const PORT = 3000;

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// Session cookie
app.use(
  session({
    secret: 'labshop-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true only if https
    },
  })
);

app.use(express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  if (req.session?.admin?.admin_id) return next();
  return res.redirect('/login');
}

function requireAuthApi(req, res, next) {
  if (req.session?.admin?.admin_id) return next();
  return res.status(401).json({ detail: 'Not logged in' });
}

app.get('/', (req, res) => {
  if (req.session?.admin?.admin_id) return res.redirect('/admin');
  return res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      return res.status(400).json({ detail: 'username and password required' });
    }

    const r = await fetch(`${FASTAPI_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!r.ok) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const data = await r.json();

    req.session.admin = {
      admin_id: data.admin_id,
      admin_name: data.full_name,
    };

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ detail: 'Login proxy failed' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

app.get('/api/me', requireAuthApi, (req, res) => {
  res.json(req.session.admin);
});

app.use('/api', requireAuthApi, async (req, res) => {
  try {
    const url = `${FASTAPI_BASE}${req.originalUrl.replace(/^\/api/, '')}`;

    const admin = req.session.admin;
    const headers = {
      ...req.headers,
      'admin-id': String(admin.admin_id),
      'admin-name': String(admin.admin_name),
    };

    delete headers.host;
    delete headers.connection;
    delete headers['content-length'];

    const options = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = JSON.stringify(req.body ?? {});
      options.headers['Content-Type'] = 'application/json';
    }

    const r = await fetch(url, options);

    const contentType = r.headers.get('content-type') || '';
    res.status(r.status);
    if (contentType.includes('application/json')) {
      const j = await r.json();
      return res.json(j);
    } else {
      const t = await r.text();
      return res.send(t);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ detail: 'API proxy failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  console.log(`Login page:  http://localhost:${PORT}/login`);
});
