// admin.js
const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMsg');
const loginSection = document.getElementById('loginSection');
const adminUI = document.getElementById('adminUI');
const logoutBtn = document.getElementById('logoutBtn');

const postList = document.getElementById('postList');
const projectList = document.getElementById('projectList');

function getToken() {
  return localStorage.getItem('asfalt_token') || null;
}

function setToken(t) {
  if (t) localStorage.setItem('asfalt_token', t);
  else localStorage.removeItem('asfalt_token');
}

// Auth wrapper for fetch
async function authFetch(url, opts = {}) {
  const token = getToken();
  opts.headers = opts.headers || {};
  opts.headers['Content-Type'] = 'application/json';
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, opts);
  return res;
}

async function showAdminIfLogged() {
  if (!getToken()) {
    adminUI.classList.add('hidden');
    loginSection.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    return;
  }
  adminUI.classList.remove('hidden');
  loginSection.classList.add('hidden');
  logoutBtn.classList.remove('hidden');
  loadPosts();
  loadProjects();
}

// --- LOGIN ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginMsg.textContent = '';
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      loginMsg.textContent = await res.text();
      return;
    }
    const { token } = await res.json();
    setToken(token);
    showAdminIfLogged();
  } catch (err) {
    console.error(err);
    loginMsg.textContent = 'Network error';
  }
});

logoutBtn.addEventListener('click', () => {
  setToken(null);
  location.reload();
});

// --- ADD POST ---
document.getElementById('addPostForm').addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const msg = document.getElementById('addPostMsg');
  msg.textContent = '';
  if (!title || !content) { msg.textContent = 'Title and content required'; return; }

  try {
    const res = await authFetch('http://localhost:3000/add-post', {
      method: 'POST',
      body: JSON.stringify({ title, content })
    });
    if (res.ok) {
      msg.textContent = 'Post added';
      document.getElementById('addPostForm').reset();
      loadPosts();
    } else {
      msg.textContent = await res.text();
      if ([401,403].includes(res.status)) { setToken(null); showAdminIfLogged(); }
    }
  } catch {
    msg.textContent = 'Network error';
  }
});

// --- ADD PROJECT ---
document.getElementById('addProjectForm').addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('projTitle').value.trim();
  const description = document.getElementById('projDesc').value.trim();
  const image_url = document.getElementById('projImage').value.trim();
  const msg = document.getElementById('addProjMsg');
  msg.textContent = '';
  if (!title || !description) { msg.textContent = 'Title and description required'; return; }

  try {
    const res = await authFetch('http://localhost:3000/add-project', {
      method: 'POST',
      body: JSON.stringify({ title, description, image_url })
    });
    if (res.ok) {
      msg.textContent = 'Project added';
      document.getElementById('addProjectForm').reset();
      loadProjects();
    } else {
      msg.textContent = await res.text();
      if ([401,403].includes(res.status)) { setToken(null); showAdminIfLogged(); }
    }
  } catch {
    msg.textContent = 'Network error';
  }
});

// --- LOAD POSTS & PROJECTS ---
async function loadPosts() {
  try {
    const res = await authFetch('http://localhost:3000/posts');
    const posts = await res.json();
    postList.innerHTML = posts.map(p => `<div class="border p-2 mb-2">${p.title}: ${p.content}</div>`).join('') || 'No posts';
  } catch { postList.innerHTML = 'Error loading posts'; }
}

async function loadProjects() {
  try {
    const res = await authFetch('http://localhost:3000/projects');
    const projects = await res.json();
    projectList.innerHTML = projects.map(p => `<div class="border p-2 mb-2">${p.title}: ${p.description}</div>`).join('') || 'No projects';
  } catch { projectList.innerHTML = 'Error loading projects'; }
}

// --- INIT ---
showAdminIfLogged();