const express       = require('express');
const cors          = require('cors');
const path          = require('path');
const fs            = require('fs');
const bcrypt        = require('bcrypt');
const jwt           = require('jsonwebtoken');
const cookieParser  = require('cookie-parser');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ---------- CONFIG ---------- */
const ACCESS_SECRET  = process.env.ACCESS_SECRET  || 'CHANGE_ME_32_CHARS_OR_MORE';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'ANOTHER_32_CHARS_OR_MORE';
const BCRYPT_ROUNDS  = 10;

/* ---------- IN-MEMORY USER (replace with DB later) ---------- */
const USERS = [
  {
    id: 1,
    login: 'admin',
    // password = 1234
    hash: '$2b$10$bHgY5D7Ds85tMdbNmIQeBeZOd/e2xtf8R0E.lA8lGed7jSxnqWdD2'
  }
];

/* ---------- MIDDLEWARE ---------- */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

/* ---------- AUTH ROUTES ---------- */
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;
  const user = USERS.find(u => u.login === login);
  if (!user || !await bcrypt.compare(password, user.hash))
    return res.status(401).json({ message: 'Invalid credentials' });

  const access  = jwt.sign({ uid: user.id, login: user.login }, ACCESS_SECRET,  { expiresIn: '15m' });
  const refresh = jwt.sign({ uid: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

  res.cookie('refresh', refresh, { httpOnly: true, secure: false, sameSite: 'Lax', maxAge: 7 * 24 * 3600 * 1000 });
  res.json({ accessToken: access });
});

app.post('/api/refresh', (req, res) => {
  const ref = req.cookies.refresh;
  if (!ref) return res.sendStatus(401);
  try {
    const payload = jwt.verify(ref, REFRESH_SECRET);
    const access = jwt.sign({ uid: payload.uid, login: USERS.find(u => u.id === payload.uid).login }, ACCESS_SECRET, { expiresIn: '15m' });
    res.json({ accessToken: access });
  } catch {
    res.sendStatus(403);
  }
});

app.post('/api/logout', (_req, res) => {
  res.clearCookie('refresh');
  res.sendStatus(204);
});

/* ---------- PROTECTED ADMIN PING ---------- */
app.get('/api/admin/verify', auth, (_req, res) => res.json({ ok: true }));

/* ---------- EXISTING API ROUTES ---------- */
app.get('/api/news',     (_,r)=>r.json(read('data/news.json')));
app.get('/api/projects', (_,r)=>r.json(read('data/projects.json')));

app.post('/api/news',     auth, (req,res)=> res.json(save('data/news.json',     read('data/news.json').concat(req.body))) );
app.post('/api/projects', auth, (req,res)=> res.json(save('data/projects.json', read('data/projects.json').concat(req.body))) );

app.put('/api/news/:id',     auth, (req,res) => { /* …same as before… */ });
app.put('/api/projects/:id', auth, (req,res) => { /* …same as before… */ });

app.delete('/api/news/:id',     auth, (req,res) => { /* …same as before… */ });
app.delete('/api/projects/:id', auth, (req,res) => { /* …same as before… */ });

/* ---------- IMAGE UPLOAD ---------- */
const multer  = require('multer');
const upload  = multer({ dest: 'public/uploads/' });
app.post('/upload-image', auth, upload.array('images'), (req,res) => {
  const urls = req.files.map(f => `/uploads/${f.filename}`);
  res.json({ urls });
});
app.delete('/delete-image', auth, (req,res) => {
  const file = path.join(__dirname, '..', 'public', req.body.url);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ ok: true });
});

app.listen(PORT, ()=>console.log(`Running on http://localhost:${PORT}`));

/* ---------- HELPERS ---------- */
function read(f){try{return JSON.parse(fs.readFileSync(f))}catch{return []}}
function save(f,data){ fs.writeFileSync(f, JSON.stringify(data,null,2)); return data}
function auth(req, res, next){
  const hdr = req.headers['authorization'];
  const token = hdr && hdr.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    req.user = jwt.verify(token, ACCESS_SECRET);
    next();
  } catch {
    res.sendStatus(403);
  }
}