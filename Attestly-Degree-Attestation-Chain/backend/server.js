// server.js
// Blockchain-Based Degree Attestation System — Backend API
// Pure Node.js core (http/crypto/fs) plus pdfkit for certificate PDFs.
//
// Run:   node server.js
// Port:  process.env.PORT || 4000

const http = require('http');
const url = require('url');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { Blockchain } = require('./blockchain');
const { issueDegreeContract, revokeDegreeContract, verifyDegreeContract, isRevoked } = require('./contracts');
const AC = require('./accessControl');
const { generateCertificatePDF } = require('./pdfCertificate');

const PORT = process.env.PORT || 4000;
const blockchain = new Blockchain();

// Serve the frontend (../frontend) statically so the whole app runs as ONE service.
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res, pathname) {
  let filePath = path.join(FRONTEND_DIR, pathname === '/' ? 'index.html' : pathname);
  // prevent path traversal
  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback to index.html for unknown non-API routes
      return fs.readFile(path.join(FRONTEND_DIR, 'index.html'), (err2, data2) => {
        if (err2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data2);
      });
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ---------- helpers ----------
function send(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = '';
    req.on('data', c => (chunks += c));
    req.on('end', () => {
      if (!chunks) return resolve({});
      try { resolve(JSON.parse(chunks)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function getAuth(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  return AC.verifyToken(token);
}

// Handles GET /api/degrees/:degreeHash/certificate — generates and streams a PDF.
// Any authenticated participant (student/university/employer/admin) may download
// the certificate for a degree that exists on-chain; revoked degrees still download
// but are stamped REVOKED on the PDF itself rather than being blocked outright.
async function handleCertificateDownload(req, res, degreeHash) {
  const auth = requireAuth(req, res);
  if (!auth) return;

  const issuance = blockchain.findBlockByDegreeHash(degreeHash);
  if (!issuance) {
    return send(res, 404, { success: false, error: 'NOT_FOUND', message: 'No degree found with this hash on-chain.' });
  }

  const revoked = isRevoked(blockchain, degreeHash);
  let revocation = null;
  if (revoked) {
    const revBlock = blockchain.chain.find(b => b.type === 'REVOCATION' && b.payload.degreeHash === degreeHash);
    if (revBlock) {
      revocation = { reason: revBlock.payload.reason, revokedBy: revBlock.payload.revokedBy, timestamp: revBlock.timestamp };
    }
  }

  try {
    const pdfBuffer = await generateCertificatePDF({
      degree: issuance.payload,
      block: { index: issuance.index, hash: issuance.hash, previousHash: issuance.previousHash, timestamp: issuance.timestamp },
      revoked,
      revocation
    });

    AC.logAccess({ userId: auth.userId, email: auth.email, event: 'CERTIFICATE_DOWNLOADED', success: true, detail: degreeHash });

    const safeName = (issuance.payload.studentName || 'degree').replace(/[^a-z0-9]+/gi, '_');
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName}_certificate.pdf"`,
      'Content-Length': pdfBuffer.length,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(pdfBuffer);
  } catch (err) {
    console.error('Certificate generation failed:', err);
    send(res, 500, { success: false, error: 'CERTIFICATE_GENERATION_FAILED', message: err.message });
  }
}

function requireAuth(req, res) {
  const auth = getAuth(req);
  if (!auth) {
    send(res, 401, { success: false, error: 'UNAUTHORIZED', message: 'Missing or invalid session token.' });
    return null;
  }
  return auth;
}

function requirePermission(req, res, action) {
  const auth = requireAuth(req, res);
  if (!auth) return null;
  if (!AC.hasPermission(auth.role, action)) {
    AC.logAccess({ userId: auth.userId, email: auth.email, event: 'UNAUTHORIZED_ATTEMPT', action, success: false });
    send(res, 403, { success: false, error: 'FORBIDDEN', message: `Role '${auth.role}' is not permitted to perform '${action}'.` });
    return null;
  }
  return auth;
}

// ---------- route handlers ----------
const routes = {

  // ===== AUTH =====
  'POST /api/auth/register': async (req, res, body) => {
    const { name, email, password, role, orgName } = body;
    if (!name || !email || !password || !role) {
      return send(res, 400, { success: false, error: 'MISSING_FIELDS' });
    }
    if (!['university', 'employer', 'student', 'admin'].includes(role)) {
      return send(res, 400, { success: false, error: 'INVALID_ROLE' });
    }
    const result = AC.createUser({ name, email, password, role, orgName });
    if (!result.success) return send(res, 409, result);
    send(res, 201, result);
  },

  'POST /api/auth/login': async (req, res, body) => {
    const { email, password } = body;
    if (!email || !password) return send(res, 400, { success: false, error: 'MISSING_FIELDS' });
    const result = AC.authenticate(email, password);
    if (!result.success) return send(res, 401, result);
    send(res, 200, result);
  },

  'GET /api/auth/me': async (req, res) => {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const user = AC.findUserById(auth.userId);
    send(res, 200, { success: true, user: user ? AC.sanitize(user) : null });
  },

  // ===== USERS (participants: universities, students, employers) =====
  'GET /api/users': async (req, res) => {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const users = AC.getUsers().map(AC.sanitize);
    send(res, 200, { success: true, users });
  },

  // ===== DEGREE ISSUANCE =====
  'POST /api/degrees/issue': async (req, res, body) => {
    const auth = requirePermission(req, res, 'issue_degree');
    if (!auth) return;
    const { studentId, studentName, program, degreeDate } = body;
    if (!studentId || !studentName || !program || !degreeDate) {
      return send(res, 400, { success: false, error: 'MISSING_FIELDS' });
    }
    const issuer = AC.findUserById(auth.userId);
    const result = issueDegreeContract(blockchain, {
      universityId: auth.userId,
      universityName: issuer.orgName,
      studentId, studentName, program, degreeDate,
      issuedBy: auth.email
    });
    AC.logAccess({ userId: auth.userId, email: auth.email, event: 'DEGREE_ISSUED', success: result.success, detail: result.degreeHash || result.error });
    send(res, result.success ? 201 : 409, result);
  },

  'POST /api/degrees/revoke': async (req, res, body) => {
    const auth = requirePermission(req, res, 'revoke_degree');
    if (!auth) return;
    const { degreeHash, reason } = body;
    if (!degreeHash) return send(res, 400, { success: false, error: 'MISSING_FIELDS' });
    const result = revokeDegreeContract(blockchain, { degreeHash, revokedBy: auth.email, reason });
    AC.logAccess({ userId: auth.userId, email: auth.email, event: 'DEGREE_REVOKED', success: result.success, detail: degreeHash });
    send(res, result.success ? 200 : 404, result);
  },

  'GET /api/degrees': async (req, res) => {
    const auth = requireAuth(req, res);
    if (!auth) return;
    let issuances = blockchain.getBlocksByType('DEGREE_ISSUANCE');
    if (auth.role === 'university') {
      issuances = issuances.filter(b => b.payload.universityId === auth.userId);
    } else if (auth.role === 'student') {
      issuances = issuances.filter(b => b.payload.studentId === auth.userId || b.payload.studentEmail === auth.email);
    }
    const degrees = issuances.map(b => ({
      ...b.payload,
      revoked: isRevoked(blockchain, b.payload.degreeHash),
      blockIndex: b.index,
      blockHash: b.hash,
      issuedAt: b.timestamp
    }));
    send(res, 200, { success: true, degrees });
  },

  // ===== DEGREE VERIFICATION =====
  'POST /api/degrees/verify': async (req, res, body) => {
    const auth = requirePermission(req, res, 'verify_degree');
    if (!auth) return;
    const { degreeHash, studentId } = body;
    if (!degreeHash) return send(res, 400, { success: false, error: 'MISSING_FIELDS' });
    const result = verifyDegreeContract(blockchain, { degreeHash, studentId, requestedBy: auth.email });
    send(res, 200, { success: true, ...result });
  },

  // ===== BLOCKCHAIN / LEDGER =====
  'GET /api/chain': async (req, res) => {
    const auth = requireAuth(req, res);
    if (!auth) return;
    send(res, 200, { success: true, chain: blockchain.chain, length: blockchain.chain.length });
  },

  'GET /api/chain/validate': async (req, res) => {
    const auth = requireAuth(req, res);
    if (!auth) return;
    send(res, 200, { success: true, ...blockchain.isValid() });
  },

  // ===== REPORTS / AUDIT =====
  'GET /api/reports/summary': async (req, res) => {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const issuances = blockchain.getBlocksByType('DEGREE_ISSUANCE');
    const verifications = blockchain.getBlocksByType('DEGREE_VERIFICATION');
    const revocations = blockchain.getBlocksByType('REVOCATION');
    const fraudAttempts = verifications.filter(v => v.payload.result === 'INVALID');
    const logs = AC.getLogs();
    const unauthorized = logs.filter(l => l.event === 'UNAUTHORIZED_ATTEMPT');

    // average "transaction time" — simulated via nonce count as proxy for mining effort
    const avgNonce = blockchain.chain.length
      ? (blockchain.chain.reduce((s, b) => s + (b.nonce || 0), 0) / blockchain.chain.length).toFixed(1)
      : 0;

    send(res, 200, {
      success: true,
      totalDegreesIssued: issuances.length,
      totalRevocations: revocations.length,
      totalVerificationRequests: verifications.length,
      fraudAttemptsDetected: fraudAttempts.length,
      unauthorizedAccessAttempts: unauthorized.length,
      totalBlocks: blockchain.chain.length,
      avgMiningEffortNonce: avgNonce,
      participants: {
        universities: AC.getUsers().filter(u => u.role === 'university').length,
        students: AC.getUsers().filter(u => u.role === 'student').length,
        employers: AC.getUsers().filter(u => u.role === 'employer').length
      }
    });
  },

  'GET /api/reports/logs': async (req, res) => {
    const auth = requireAuth(req, res);
    if (!auth) return;
    send(res, 200, { success: true, logs: AC.getLogs().slice().reverse() });
  },

  // ===== HEALTH =====
  'GET /api/health': async (req, res) => {
    send(res, 200, { success: true, status: 'OK', blocks: blockchain.chain.length, time: Date.now() });
  }
};

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const key = `${req.method} ${parsed.pathname}`;

  if (req.method === 'OPTIONS') {
    return send(res, 204, {});
  }

  // API routes
  if (parsed.pathname.startsWith('/api/')) {
    // Special-case: GET /api/degrees/:degreeHash/certificate (dynamic segment, binary response)
    const certMatch = parsed.pathname.match(/^\/api\/degrees\/([^/]+)\/certificate$/);
    if (req.method === 'GET' && certMatch) {
      try {
        return await handleCertificateDownload(req, res, decodeURIComponent(certMatch[1]));
      } catch (err) {
        console.error(err);
        return send(res, 500, { success: false, error: 'SERVER_ERROR', message: err.message });
      }
    }

    const handler = routes[key];
    if (!handler) {
      return send(res, 404, { success: false, error: 'NOT_FOUND', message: `No route for ${key}` });
    }
    try {
      const body = (req.method === 'POST' || req.method === 'PUT') ? await readBody(req) : {};
      return await handler(req, res, body);
    } catch (err) {
      console.error(err);
      return send(res, 500, { success: false, error: 'SERVER_ERROR', message: err.message });
    }
  }


  // Everything else: serve the frontend
  if (req.method === 'GET') {
    return serveStatic(req, res, parsed.pathname);
  }

  return send(res, 404, { success: false, error: 'NOT_FOUND' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Degree Attestation Blockchain API running on http://localhost:${PORT}`);
  console.log(`  Genesis block hash: ${blockchain.chain[0].hash}`);
  console.log(`  Total blocks on chain: ${blockchain.chain.length}\n`);
});
