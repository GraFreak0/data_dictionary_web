/* ================================================================
   Data Dictionary — Shared Utilities
   Path: static/scripts/app.js
   Imported by every app page via <script src="/static/scripts/app.js">
   ================================================================ */

/* ── 1. Theme ──────────────────────────────────────────────────
   Apply before DOMContentLoaded to prevent flash of wrong theme.
   Call toggleTheme() from sidebar button.
   ──────────────────────────────────────────────────────────── */
(function applyStoredTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = dark ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyTheme(!isDark);
}

// Keep label in sync on load
document.addEventListener('DOMContentLoaded', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
});

/* ── 2. Auth helpers ───────────────────────────────────────────
   getUser()  — returns parsed user object from sessionStorage or null
   api()      — fetch wrapper that redirects to /signin on 401
   ──────────────────────────────────────────────────────────── */
const API_BASE = '';

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('user') || 'null'); }
  catch { return null; }
}

async function api(url, opts = {}) {
  try {
    const r = await fetch(API_BASE + url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
    });
    if (r.status === 401) {
      sessionStorage.clear();
      window.location.href = '/signin';
      return null;
    }
    return r.json();
  } catch (err) {
    console.error('API error:', url, err);
    return null;
  }
}

/* ── 3. Alerts ─────────────────────────────────────────────────
   showAlert(message, type, targetId)
   type: 'success' | 'error' | 'info' | 'warning'
   targetId: id of a <div class="alert"> element (default: 'globalAlert')
   ──────────────────────────────────────────────────────────── */
function showAlert(message, type = 'success', targetId = 'globalAlert') {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 5000);
}

/* ── 4. Sidebar init ───────────────────────────────────────────
   Call initSidebar() once user is confirmed logged in.
   Fills avatar / name / role, shows admin nav items if admin.
   Also fills footer user info.
   ──────────────────────────────────────────────────────────── */
function initSidebar(user) {
  if (!user) { window.location.href = '/signin'; return; }

  // Avatar / name / role
  const avatar = document.getElementById('userAvatar');
  const name   = document.getElementById('userName');
  const role   = document.getElementById('userRole');
  const footer = document.getElementById('footerUser');

  if (avatar) avatar.textContent = user.username[0].toUpperCase();
  if (name)   name.textContent   = user.username;
  if (role)   role.textContent   = user.role;
  if (footer) footer.textContent = `${user.username} · ${user.role}`;

  // Show admin-only nav items
  if (user.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
  }

  // Show export button if user has permission
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn && (user.can_export || user.role === 'admin')) {
    exportBtn.style.display = 'inline-flex';
  }
}

/* ── 5. Logout ─────────────────────────────────────────────────
   Attached to any element with onclick="logout()"
   ──────────────────────────────────────────────────────────── */
async function logout() {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
  sessionStorage.clear();
  window.location.href = '/signin';
}

/* ── 6. Modal helpers ──────────────────────────────────────────
   openModal(id)  / closeModal(id)
   Click outside backdrop to close.
   ──────────────────────────────────────────────────────────── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) {
    closeModal(e.target.id);
  }
});

/* ── 7. Tab helpers ────────────────────────────────────────────
   switchTab(clickedBtn, panelId, scopeSelector)
   scopeSelector: CSS selector for the container that holds tabs+panels
   (defaults to closest .modal-box or .tab-scope)
   ──────────────────────────────────────────────────────────── */
function switchTab(btn, panelId, scopeSelector) {
  const scope = scopeSelector
    ? document.querySelector(scopeSelector)
    : (btn.closest('.modal-box') || btn.closest('.tab-scope') || document);

  scope.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  scope.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
}
