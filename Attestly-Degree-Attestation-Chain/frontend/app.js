// app.js — Attestly frontend logic. Pure vanilla JS, no build step.

// ----- API base: same-origin by default since the backend serves this frontend too.
// Override by setting window.ATTESTLY_API_BASE before this script loads (e.g. if you
// split frontend/backend onto different hosts).
const API_BASE = window.ATTESTLY_API_BASE || '/api';

let state = {
  token: localStorage.getItem('attestly_token') || null,
  user: null
};

// ----- generic fetch helper -----
async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || `Request failed (${res.status})`);
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

function toast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderColor = isError ? 'var(--danger)' : 'var(--verified)';
  t.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), 3500);
}

function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function shortHash(h, n = 14) {
  if (!h) return '—';
  return h.length > n ? h.substring(0, n) + '…' : h;
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).then(() => toast('Copied to clipboard'));
}

// =====================================================================
// AUTH SCREEN
// =====================================================================
const authScreen = document.getElementById('authScreen');
const appShell = document.getElementById('appShell');
const userBadge = document.getElementById('userBadge');

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const isLogin = btn.dataset.tab === 'login';
    document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
    document.getElementById('registerForm').classList.toggle('hidden', isLogin);
  });
});

document.querySelectorAll('.demo-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('loginEmail').value = btn.dataset.email;
    document.getElementById('loginPassword').value = btn.dataset.pass;
    document.querySelector('.tab-btn[data-tab="login"]').click();
  });
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  try {
    const data = await api('POST', '/auth/login', { email, password });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('attestly_token', data.token);
    enterApp();
  } catch (err) {
    errorEl.textContent = err.data?.error === 'INVALID_CREDENTIALS'
      ? 'Incorrect email or password.'
      : (err.message || 'Login failed.');
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('registerError');
  const successEl = document.getElementById('registerSuccess');
  errorEl.textContent = ''; successEl.textContent = '';
  const payload = {
    name: document.getElementById('regName').value.trim(),
    orgName: document.getElementById('regOrg').value.trim(),
    email: document.getElementById('regEmail').value.trim(),
    password: document.getElementById('regPassword').value,
    role: document.getElementById('regRole').value
  };
  try {
    await api('POST', '/auth/register', payload);
    successEl.textContent = 'Account created — a digital certificate has been issued. You can log in now.';
    document.getElementById('registerForm').reset();
  } catch (err) {
    errorEl.textContent = err.data?.error === 'EMAIL_EXISTS'
      ? 'That email is already registered.'
      : (err.message || 'Registration failed.');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  state.token = null; state.user = null;
  localStorage.removeItem('attestly_token');
  authScreen.classList.remove('hidden');
  appShell.classList.add('hidden');
  userBadge.classList.add('hidden');
});

// =====================================================================
// APP SHELL / NAVIGATION
// =====================================================================
function enterApp() {
  authScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  userBadge.classList.remove('hidden');
  document.getElementById('userName').textContent = state.user.orgName || state.user.name;
  document.getElementById('userRole').textContent = state.user.role;

  // role-based nav visibility
  document.getElementById('navIssue').style.display =
    (state.user.role === 'university' || state.user.role === 'admin') ? '' : 'none';
  document.getElementById('navVerify').style.display =
    (state.user.role === 'employer' || state.user.role === 'admin') ? '' : 'none';

  loadOverview();
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${btn.dataset.view}`).classList.add('active');

    if (btn.dataset.view === 'overview') loadOverview();
    if (btn.dataset.view === 'issue') loadMyDegrees();
    if (btn.dataset.view === 'degrees') loadAllDegrees();
    if (btn.dataset.view === 'ledger') loadFullChain();
    if (btn.dataset.view === 'audit') loadAuditLog();
  });
});

// =====================================================================
// CHAIN STATUS (top bar pulse)
// =====================================================================
async function checkChainStatus() {
  try {
    const health = await api('GET', '/health');
    document.getElementById('chainStatusText').textContent = `${health.blocks} blocks on chain`;
  } catch (e) {
    document.getElementById('chainStatusText').textContent = 'API unreachable';
    document.querySelector('.pulse-dot').style.background = 'var(--danger)';
  }
}

// =====================================================================
// OVERVIEW
// =====================================================================
async function loadOverview() {
  try {
    const summary = await api('GET', '/reports/summary');
    document.getElementById('statGrid').innerHTML = `
      ${statCard(summary.totalDegreesIssued, 'Degrees issued')}
      ${statCard(summary.totalVerificationRequests, 'Verification requests')}
      ${statCard(summary.fraudAttemptsDetected, 'Fraud attempts caught')}
      ${statCard(summary.totalBlocks, 'Total blocks on chain')}
    `;
  } catch (e) { /* not logged in or error — ignore on overview */ }

  try {
    const chainData = await api('GET', '/chain');
    const recent = chainData.chain.slice(-6).reverse();
    document.getElementById('recentBlocks').innerHTML = recent.map(blockCard).join(joinerHTML());
  } catch (e) {}

  try {
    const validity = await api('GET', '/chain/validate');
    const box = document.getElementById('integrityPanel');
    if (validity.valid) {
      box.innerHTML = `<span class="integrity-ok">✔ VALID</span> — every block's hash matches its content, and each link to the previous block holds. The ledger has not been tampered with.`;
    } else {
      box.innerHTML = `<span class="integrity-bad">✘ BROKEN</span> — integrity check failed at block ${validity.brokenAt}: ${validity.reason}`;
    }
  } catch (e) {}
}

function statCard(num, label) {
  return `<div class="stat-card"><div class="stat-num">${num ?? 0}</div><div class="stat-label">${label}</div></div>`;
}

function joinerHTML() {
  return `<div class="chain-link">⛓</div>`;
}

function blockCard(b) {
  return `
    <div class="block-card">
      <div class="block-idx">BLOCK #${b.index}</div>
      <span class="block-type type-${b.type}">${b.type.replace(/_/g, ' ')}</span>
      <div class="block-hash">
        <span class="hash-label">hash</span>${shortHash(b.hash, 22)}
      </div>
      <div class="block-meta">${fmtDate(b.timestamp)}</div>
    </div>
  `;
}

// =====================================================================
// ISSUE DEGREE
// =====================================================================
document.getElementById('issueForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultBox = document.getElementById('issueResult');
  resultBox.classList.add('hidden');
  const payload = {
    studentId: document.getElementById('issueStudentId').value.trim(),
    studentName: document.getElementById('issueStudentName').value.trim(),
    program: document.getElementById('issueProgram').value.trim(),
    degreeDate: document.getElementById('issueDate').value
  };
  try {
    const result = await api('POST', '/degrees/issue', payload);
    resultBox.className = 'result-box success';
    resultBox.innerHTML = `✔ Degree mined to block #${result.block.index}.
      <div class="hash-line">Degree hash (give this to the student/employer):<br>${result.degreeHash}
      <button class="btn-copy" onclick="copyToClipboard('${result.degreeHash}')" style="margin-left:8px;">Copy</button></div>
      <button class="btn-small" style="margin-top:10px;border-color:var(--accent);color:var(--accent);" onclick="downloadCertificate('${result.degreeHash}')">Download Certificate (PDF)</button>`;
    resultBox.classList.remove('hidden');
    document.getElementById('issueForm').reset();
    loadMyDegrees();
    toast('Degree issued and added to the chain');
  } catch (err) {
    resultBox.className = 'result-box error';
    resultBox.innerHTML = `✘ ${err.message}`;
    resultBox.classList.remove('hidden');
  }
});

async function loadMyDegrees() {
  try {
    const data = await api('GET', '/degrees');
    renderDegreeTable('myDegreesTable', data.degrees, true);
  } catch (e) {
    document.getElementById('myDegreesTable').innerHTML = emptyRow('Log in as a university to issue and view degrees.');
  }
}

async function loadAllDegrees() {
  try {
    const data = await api('GET', '/degrees');
    renderDegreeTable('allDegreesTable', data.degrees, state.user.role === 'university');
  } catch (e) {
    document.getElementById('allDegreesTable').innerHTML = emptyRow('Unable to load degrees.');
  }
}

function emptyRow(msg) {
  return `<table><tbody><tr class="empty-row"><td>${msg}</td></tr></tbody></table>`;
}

function renderDegreeTable(elId, degrees, allowRevoke) {
  const el = document.getElementById(elId);
  if (!degrees || degrees.length === 0) {
    el.innerHTML = emptyRow('No degrees yet.');
    return;
  }
  const rows = degrees.map(d => `
    <tr>
      <td>${escapeHtml(d.studentName)}<br><span class="mono-cell">${escapeHtml(d.studentId)}</span></td>
      <td>${escapeHtml(d.program)}</td>
      <td>${escapeHtml(d.universityName)}</td>
      <td>${d.degreeDate}</td>
      <td><span class="status-pill ${d.revoked ? 'status-revoked' : 'status-active'}">${d.revoked ? 'Revoked' : 'Active'}</span></td>
      <td class="mono-cell">${shortHash(d.degreeHash)} <button class="btn-copy" onclick="copyToClipboard('${d.degreeHash}')">copy</button></td>
      <td>
        <button class="btn-small" style="border-color:var(--accent);color:var(--accent);" onclick="downloadCertificate('${d.degreeHash}')">Certificate</button>
        ${allowRevoke && !d.revoked ? `<button class="btn-small" onclick="revokeDegree('${d.degreeHash}')">Revoke</button>` : ''}
      </td>
    </tr>
  `).join('');
  el.innerHTML = `
    <table>
      <thead><tr><th>Student</th><th>Program</th><th>University</th><th>Date</th><th>Status</th><th>Degree hash</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function revokeDegree(hash) {
  const reason = prompt('Reason for revocation:');
  if (reason === null) return;
  try {
    await api('POST', '/degrees/revoke', { degreeHash: hash, reason });
    toast('Degree revoked');
    loadMyDegrees(); loadAllDegrees();
  } catch (err) {
    toast(err.message, true);
  }
}

async function downloadCertificate(hash) {
  try {
    const headers = {};
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    const res = await fetch(`${API_BASE}/degrees/${encodeURIComponent(hash)}/certificate`, { headers });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Could not generate certificate (${res.status})`);
    }
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="(.+)"/);
    const filename = match ? match[1] : 'degree_certificate.pdf';

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Certificate downloaded');
  } catch (err) {
    toast(err.message, true);
  }
}

function escapeHtml(s) {
  return (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// =====================================================================
// VERIFY DEGREE
// =====================================================================
document.getElementById('verifyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const resultBox = document.getElementById('verifyResult');
  resultBox.classList.add('hidden');
  const payload = {
    degreeHash: document.getElementById('verifyHash').value.trim(),
    studentId: document.getElementById('verifyStudentId').value.trim() || undefined
  };
  try {
    const result = await api('POST', '/degrees/verify', payload);
    resultBox.className = `result-box ${result.matched ? 'success' : 'error'}`;
    if (result.matched) {
      resultBox.innerHTML = `✔ VALID — ${result.detail}
        <div class="hash-line">
          Student: ${escapeHtml(result.record.studentName)} (${escapeHtml(result.record.studentId)})<br>
          Program: ${escapeHtml(result.record.program)}<br>
          University: ${escapeHtml(result.record.universityName)}<br>
          Conferred: ${result.record.degreeDate}
        </div>
        <button class="btn-small" style="margin-top:10px;border-color:var(--accent);color:var(--accent);" onclick="downloadCertificate('${payload.degreeHash}')">Download Certificate (PDF)</button>`;
    } else {
      resultBox.innerHTML = `✘ NOT VALID (${result.reason}) — ${result.detail}`;
    }
    resultBox.classList.remove('hidden');
  } catch (err) {
    resultBox.className = 'result-box error';
    resultBox.innerHTML = `✘ ${err.message}`;
    resultBox.classList.remove('hidden');
  }
});

document.getElementById('fakeHashSample').addEventListener('click', () => {
  document.getElementById('verifyHash').value = document.getElementById('fakeHashSample').textContent;
});

// =====================================================================
// LEDGER EXPLORER
// =====================================================================
async function loadFullChain() {
  try {
    const data = await api('GET', '/chain');
    document.getElementById('fullChainVisual').innerHTML = data.chain.map(blockCard).join(joinerHTML());
  } catch (e) {
    document.getElementById('fullChainVisual').innerHTML = '<p style="padding:20px;color:var(--slate)">Unable to load chain.</p>';
  }
}

// =====================================================================
// AUDIT LOG
// =====================================================================
async function loadAuditLog() {
  try {
    const data = await api('GET', '/reports/logs');
    const el = document.getElementById('auditTable');
    if (!data.logs.length) { el.innerHTML = emptyRow('No log entries yet.'); return; }
    const rows = data.logs.map(l => `
      <tr>
        <td class="mono-cell">${fmtDate(l.timestamp)}</td>
        <td>${escapeHtml(l.email || l.userId)}</td>
        <td>${escapeHtml(l.event)}</td>
        <td>${l.success ? '<span class="status-pill status-active">OK</span>' : '<span class="status-pill status-revoked">Flagged</span>'}</td>
        <td class="mono-cell">${escapeHtml((l.detail || l.action || '').toString()).substring(0, 40)}</td>
      </tr>
    `).join('');
    el.innerHTML = `<table><thead><tr><th>Time</th><th>Actor</th><th>Event</th><th>Result</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>`;
  } catch (e) {
    document.getElementById('auditTable').innerHTML = emptyRow('Unable to load audit log.');
  }
}

// =====================================================================
// BOOTSTRAP
// =====================================================================
async function bootstrap() {
  checkChainStatus();
  setInterval(checkChainStatus, 15000);

  if (state.token) {
    try {
      const me = await api('GET', '/auth/me');
      state.user = me.user;
      enterApp();
      return;
    } catch (e) {
      localStorage.removeItem('attestly_token');
      state.token = null;
    }
  }
  authScreen.classList.remove('hidden');
}

bootstrap();
