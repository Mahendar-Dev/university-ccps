const API = '/api';

// ===================== Auth state =====================
let token = localStorage.getItem('mdht_token');
let username = localStorage.getItem('mdht_username');

const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');

function showApp() {
  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  document.getElementById('usernameDisplay').textContent = username;
  loadHistory();
}

function showAuth() {
  appScreen.classList.add('hidden');
  authScreen.classList.remove('hidden');
}

function authHeaders() {
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ----- Tab switching -----
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isLogin = tab.dataset.tab === 'login';
    document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
    document.getElementById('registerForm').classList.toggle('hidden', isLogin);
  });
});

// ----- Login -----
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  const uname = document.getElementById('loginUsername').value.trim();
  const pass = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uname, password: pass })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Login failed.'; return; }
    token = data.token; username = data.username;
    localStorage.setItem('mdht_token', token);
    localStorage.setItem('mdht_username', username);
    showApp();
  } catch (err) {
    errEl.textContent = 'Could not reach the server.';
  }
});

// ----- Register -----
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('registerError');
  errEl.textContent = '';
  const uname = document.getElementById('registerUsername').value.trim();
  const pass = document.getElementById('registerPassword').value;

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: uname, password: pass })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Could not create account.'; return; }
    token = data.token; username = data.username;
    localStorage.setItem('mdht_token', token);
    localStorage.setItem('mdht_username', username);
    showApp();
  } catch (err) {
    errEl.textContent = 'Could not reach the server.';
  }
});

// ----- Logout -----
document.getElementById('logoutBtn').addEventListener('click', () => {
  token = null; username = null;
  localStorage.removeItem('mdht_token');
  localStorage.removeItem('mdht_username');
  showAuth();
});

// ===================== Hashing tool =====================
let selected = new Set(['sha-256']);
const chipRow = document.getElementById('chipRow');
const algoList = document.getElementById('algoList');

function renderChips() {
  chipRow.innerHTML = '';
  ALGOS.forEach(a => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (selected.has(a.id) ? ' active' : '');
    chip.textContent = a.label;
    chip.addEventListener('click', () => {
      if (selected.has(a.id)) {
        if (selected.size === 1) return;
        selected.delete(a.id);
      } else {
        selected.add(a.id);
      }
      renderChips();
      renderAlgoRows();
      recompute();
    });
    chipRow.appendChild(chip);
  });
}

function renderAlgoRows() {
  algoList.innerHTML = '';
  ALGOS.filter(a => selected.has(a.id)).forEach(a => {
    const row = document.createElement('div');
    row.className = 'algo-row';
    row.innerHTML = `
      <div class="algo-name">${a.label}<small>${a.bits}${a.legacy ? ' · legacy' : ''}</small></div>
      <div class="digest empty" id="out-${a.id}">waiting for input…</div>
      <button class="save-btn" id="save-${a.id}" data-target="${a.id}" disabled>save</button>
      <button class="copy-btn" id="copy-${a.id}" data-target="${a.id}">copy</button>
    `;
    algoList.appendChild(row);
  });
}

algoList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('copy-btn')) {
    const id = e.target.dataset.target;
    const text = document.getElementById(`out-${id}`).textContent;
    if (!text || text.includes('waiting')) return;
    await navigator.clipboard.writeText(text);
    e.target.textContent = 'copied';
    e.target.classList.add('copied');
    setTimeout(() => { e.target.textContent = 'copy'; e.target.classList.remove('copied'); }, 1200);
  }
  if (e.target.classList.contains('save-btn') && !e.target.disabled) {
    const id = e.target.dataset.target;
    const digest = document.getElementById(`out-${id}`).textContent;
    if (!digest || digest.includes('waiting')) return;
    await saveToHistory(id, digest);
    e.target.textContent = 'saved';
    e.target.classList.add('saved');
    setTimeout(() => { e.target.textContent = 'save'; e.target.classList.remove('saved'); }, 1200);
  }
});

let mode = 'text';
let currentBytes = new Uint8Array();
let hasInput = false;
let currentLabel = '';

async function computeAllFromBytes(bytes, has) {
  for (const a of ALGOS.filter(x => selected.has(x.id))) {
    const el = document.getElementById(`out-${a.id}`);
    const saveBtn = document.getElementById(`save-${a.id}`);
    if (!el) continue;
    if (!has) {
      el.textContent = 'waiting for input…';
      el.classList.add('empty');
      if (saveBtn) saveBtn.disabled = true;
      continue;
    }
    el.classList.remove('empty');
    el.textContent = await computeDigest(a.id, bytes);
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function recompute() {
  await computeAllFromBytes(currentBytes, hasInput);
}

// ----- Avalanche grid -----
const grid = document.getElementById('avalanche');
const CELLS = 64;
for (let i = 0; i < CELLS; i++) {
  const d = document.createElement('div');
  d.className = 'bit';
  grid.appendChild(d);
}
let lastHashBits = null;

function hexToBitArray(hex, count) {
  const bits = [];
  for (let i = 0; i < hex.length; i++) {
    const nibble = parseInt(hex[i], 16);
    for (let b = 3; b >= 0; b--) bits.push((nibble >> b) & 1);
  }
  const out = [];
  for (let i = 0; i < count; i++) out.push(bits[Math.floor(i * bits.length / count)]);
  return out;
}

async function updateAvalanche(text) {
  if (!text) {
    document.querySelectorAll('.bit').forEach(b => b.classList.remove('flip'));
    document.getElementById('flipCount').textContent = '0% bits flipped';
    lastHashBits = null;
    return;
  }
  const hash = await webCryptoHash('SHA-256', strToBytes(text));
  const bits = hexToBitArray(hash, CELLS);
  const cells = document.querySelectorAll('.bit');
  let flips = 0;
  cells.forEach((cell, i) => {
    const changed = lastHashBits ? (bits[i] !== lastHashBits[i]) : bits[i] === 1;
    if (changed) { cell.classList.add('flip'); flips++; } else { cell.classList.remove('flip'); }
  });
  document.getElementById('flipCount').textContent = `${Math.round(flips / CELLS * 100)}% bits flipped`;
  lastHashBits = bits;
}

// ----- Wiring -----
const msgEl = document.getElementById('msg');
const fileInput = document.getElementById('fileInput');
const fileNameEl = document.getElementById('fileName');
const clearBtn = document.getElementById('clearBtn');

msgEl.addEventListener('input', async () => {
  mode = 'text';
  fileNameEl.textContent = '';
  const text = msgEl.value;
  hasInput = text.length > 0;
  currentBytes = strToBytes(text);
  currentLabel = text.slice(0, 80);
  await computeAllFromBytes(currentBytes, hasInput);
  await updateAvalanche(text);
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  mode = 'file';
  msgEl.value = '';
  fileNameEl.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  currentBytes = new Uint8Array(await file.arrayBuffer());
  currentLabel = file.name;
  hasInput = true;
  await computeAllFromBytes(currentBytes, hasInput);
  document.getElementById('flipCount').textContent = 'n/a for files';
  document.querySelectorAll('.bit').forEach(b => b.classList.remove('flip'));
  lastHashBits = null;
});

clearBtn.addEventListener('click', async () => {
  msgEl.value = '';
  fileInput.value = '';
  fileNameEl.textContent = '';
  mode = 'text';
  currentBytes = new Uint8Array();
  currentLabel = '';
  hasInput = false;
  await computeAllFromBytes(currentBytes, hasInput);
  await updateAvalanche('');
});

// ===================== History (backend) =====================
async function saveToHistory(algoId, digest) {
  await fetch(`${API}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      sourceType: mode,
      sourceLabel: currentLabel || (mode === 'file' ? 'file' : ''),
      algorithm: algoId,
      digest
    })
  });
  loadHistory();
}

function formatTimestamp(iso) {
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

async function loadHistory() {
  const listEl = document.getElementById('historyList');
  try {
    const res = await fetch(`${API}/history`, { headers: authHeaders() });
    if (res.status === 401) { showAuth(); return; }
    const rows = await res.json();

    if (!rows.length) {
      listEl.innerHTML = '<div class="history-empty">No hashes saved yet — hit "save" next to any digest above.</div>';
      return;
    }

    listEl.innerHTML = rows.map(r => `
      <div class="history-row" data-id="${r.id}">
        <div class="history-algo">${r.algorithm.toUpperCase()}</div>
        <div class="history-main">
          <div class="history-digest">${r.digest}</div>
          <div class="history-meta">${r.source_type === 'file' ? '📁' : '✏️'} ${escapeHtml(r.source_label || '(empty)')}</div>
        </div>
        <div class="history-time">${formatTimestamp(r.created_at)}</div>
        <button class="icon-btn delete-history" data-id="${r.id}" title="Delete">✕</button>
      </div>
    `).join('');
  } catch (err) {
    listEl.innerHTML = '<div class="history-empty">Could not load history.</div>';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('historyList').addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-history')) {
    const id = e.target.dataset.id;
    await fetch(`${API}/history/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadHistory();
  }
});

document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
  if (!confirm('Delete all saved hashes? This cannot be undone.')) return;
  await fetch(`${API}/history`, { method: 'DELETE', headers: authHeaders() });
  loadHistory();
});

// ===================== Init =====================
renderChips();
renderAlgoRows();
computeAllFromBytes(currentBytes, hasInput);

if (token && username) {
  showApp();
} else {
  showAuth();
}
