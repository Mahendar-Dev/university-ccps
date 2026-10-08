// accessControl.js
// Identity management + Role-Based Access Control (RBAC).
// Each participant (University / Student / Employer / Admin) gets a
// self-signed "digital certificate" record (public identity + signature)
// stored in users.json, simulating PKI-based identity on a permissioned chain.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const SESSIONS_FILE = path.join(DB_DIR, 'sessions.json');
const LOGS_FILE = path.join(DB_DIR, 'auditlogs.json');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// Server-side signing secret for session tokens (HMAC) — generated once and persisted
const SECRET_FILE = path.join(DB_DIR, '.secret');
let SERVER_SECRET;
if (fs.existsSync(SECRET_FILE)) {
  SERVER_SECRET = fs.readFileSync(SECRET_FILE, 'utf-8');
} else {
  SERVER_SECRET = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, SERVER_SECRET);
}

function readJSON(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch (e) { return fallback; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---- Password hashing (PBKDF2, no external deps) ----
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}
function verifyPassword(password, salt, hash) {
  const check = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(hash, 'hex'));
}

// ---- "Digital certificate" — self-signed identity record ----
function issueDigitalCertificate(userId, role, name) {
  const keypair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 1024, // small for speed; illustrative only
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  const certData = { userId, role, name, issuedAt: Date.now() };
  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(certData));
  sign.end();
  const signature = sign.sign(keypair.privateKey, 'hex');

  return {
    certificate: certData,
    publicKey: keypair.publicKey,
    signature,
    fingerprint: crypto.createHash('sha256').update(keypair.publicKey).digest('hex').substring(0, 16)
  };
}

// ---- Token (signed session, HMAC — JWT-equivalent, zero deps) ----
function signToken(payload, expiresInMs = 1000 * 60 * 60 * 8) {
  const body = { ...payload, exp: Date.now() + expiresInMs };
  const json = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = crypto.createHmac('sha256', SERVER_SECRET).update(json).digest('hex');
  return `${json}.${sig}`;
}
function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [json, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SERVER_SECRET).update(json).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
  try {
    const payload = JSON.parse(Buffer.from(json, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// ---- RBAC permission matrix ----
const PERMISSIONS = {
  university: ['issue_degree', 'revoke_degree', 'view_own_degrees', 'view_dashboard'],
  employer: ['verify_degree', 'view_dashboard'],
  student: ['view_own_records', 'view_dashboard'],
  admin: ['issue_degree', 'revoke_degree', 'verify_degree', 'view_all', 'view_dashboard', 'manage_users']
};

function hasPermission(role, action) {
  return (PERMISSIONS[role] || []).includes(action);
}

// ---- Users store ----
function getUsers() { return readJSON(USERS_FILE, []); }
function saveUsers(users) { writeJSON(USERS_FILE, users); }

function createUser({ name, email, password, role, orgName }) {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return { success: false, error: 'EMAIL_EXISTS' };
  }
  const userId = crypto.randomUUID();
  const { salt, hash } = hashPassword(password);
  const cert = issueDigitalCertificate(userId, role, name);

  const user = {
    userId,
    name,
    email,
    role, // 'university' | 'employer' | 'student' | 'admin'
    orgName: orgName || name,
    salt,
    passwordHash: hash,
    certificate: cert.certificate,
    publicKey: cert.publicKey,
    fingerprint: cert.fingerprint,
    createdAt: Date.now(),
    status: 'ACTIVE'
  };
  users.push(user);
  saveUsers(users);
  return { success: true, user: sanitize(user) };
}

function authenticate(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) return { success: false, error: 'INVALID_CREDENTIALS' };
  if (user.status !== 'ACTIVE') return { success: false, error: 'ACCOUNT_DISABLED' };
  if (!verifyPassword(password, user.salt, user.passwordHash)) {
    logAccess({ userId: user.userId, email, event: 'LOGIN_FAILED', success: false });
    return { success: false, error: 'INVALID_CREDENTIALS' };
  }
  const token = signToken({ userId: user.userId, role: user.role, email: user.email });
  logAccess({ userId: user.userId, email, event: 'LOGIN_SUCCESS', success: true });
  return { success: true, token, user: sanitize(user) };
}

function sanitize(user) {
  const { salt, passwordHash, ...rest } = user;
  return rest;
}

function findUserById(userId) {
  return getUsers().find(u => u.userId === userId);
}

// ---- Audit logging (unauthorized attempts, smart contract exec logs, etc.) ----
function getLogs() { return readJSON(LOGS_FILE, []); }
function logAccess(entry) {
  const logs = getLogs();
  logs.push({ id: crypto.randomUUID(), timestamp: Date.now(), ...entry });
  writeJSON(LOGS_FILE, logs);
  return logs[logs.length - 1];
}

module.exports = {
  createUser, authenticate, sanitize, findUserById, getUsers,
  signToken, verifyToken, hasPermission, PERMISSIONS,
  logAccess, getLogs
};
