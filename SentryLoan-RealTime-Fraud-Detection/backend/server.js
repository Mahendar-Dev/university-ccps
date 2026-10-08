// server.js
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

import { users, accounts, loanApplications, createAccountForHolder, findUserByEmail, findAccountByAccountId, findAccountByHolder, seedDefaultAccounts } from "./store.js";
import { hashPassword, comparePassword, createSession, destroySession, protect, authorize, verifySessionToken, publicUser } from "./auth.js";
import { scoreLoanApplication, DUPLICATE_WINDOW_MS, VELOCITY_WINDOW_MS } from "./riskEngine.js";

seedDefaultAccounts(hashPassword);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- Socket.IO auth: every socket must present a valid session token ---
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const user = token ? verifySessionToken(token) : null;
  if (!user) return next(new Error("Authentication required"));
  socket.user = user;
  next();
});

io.on("connection", (socket) => {
  console.log(`[socket] client connected: ${socket.id} (role: ${socket.user.role})`);

  // RBAC via Socket.IO rooms: only officers/admins get the full live risk feed.
  if (["officer", "admin"].includes(socket.user.role)) socket.join("officers");
  if (socket.user.role === "agent") socket.join(`agent:${socket.user.id}`);
  if (socket.user.role === "applicant") socket.join(`applicant:${socket.user.id}`);

  socket.on("disconnect", () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ============================= AUTH =============================

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  // Public registration only ever creates agent/applicant accounts.
  // Officer/admin accounts are pre-seeded (see store.js).
  const safeRole = ["agent", "applicant"].includes(role) ? role : "applicant";

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "Email is already registered" });
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    password: hashPassword(password),
    role: safeRole,
    createdAt: Date.now(),
  };
  users.push(user);

  let account = null;
  if (safeRole === "applicant") {
    // Every loan applicant gets a starter bank account/credit profile automatically for this demo.
    account = createAccountForHolder(user.id);
  }

  const token = createSession(user.id);
  res.status(201).json({ token, user: publicUser(user), account });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const user = findUserByEmail(email);
  if (!user || !comparePassword(password, user.password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = createSession(user.id);
  res.json({ token, user: publicUser(user) });
});

app.post("/api/auth/logout", protect, (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) destroySession(token);
  res.json({ ok: true });
});

app.get("/api/auth/me", protect, (req, res) => {
  res.json({ user: req.user });
});

// ============================ BANK ACCOUNTS ============================

app.get("/api/accounts/mine", protect, authorize("applicant"), (req, res) => {
  const account = findAccountByHolder(req.user.id);
  if (!account) return res.status(404).json({ error: "No account found for this user" });
  res.json(account);
});

app.get("/api/accounts/lookup/:accountId", protect, authorize("agent", "officer", "admin"), (req, res) => {
  const account = findAccountByAccountId(req.params.accountId);
  if (!account) return res.status(404).json({ error: "Account not found" });
  const isExpired = account.kycExpiryDate <= Date.now();
  res.json({
    accountId: account.accountId,
    creditLimit: account.creditLimit,
    kycExpiryDate: account.kycExpiryDate,
    status: isExpired ? "expired" : account.status,
  });
});

// ============================= LOAN APPLICATIONS =============================

const uploadDir = path.resolve("uploads/loans");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      const err = new Error("Only PDF documents are accepted");
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

function toOfficerView(application) {
  const { documentPath, ...rest } = application;
  return rest;
}

// Agents/applicants never see the risk score or triggered rules.
function toRedactedView(application) {
  const { id, applicationId, agentName, accountIdText, purpose, loanAmount, status, officerNote, submittedAt, documentOriginalName } = application;
  return {
    id, applicationId, agentName, accountIdText, purpose, loanAmount, status, officerNote, submittedAt,
    hasDocument: Boolean(documentOriginalName),
    documentOriginalName,
  };
}

app.post("/api/loan-applications", protect, authorize("agent"), upload.single("document"), (req, res) => {
  const { accountId, purpose, loanAmount } = req.body;

  if (!accountId || !purpose || !loanAmount) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "accountId, purpose and loanAmount are required" });
  }

  const account = findAccountByAccountId(accountId);
  if (!account) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(404).json({ error: "Account not found. Check the Account ID and try again." });
  }

  const amount = Number(loanAmount);
  const since = Date.now() - Math.max(DUPLICATE_WINDOW_MS, VELOCITY_WINDOW_MS);
  const recent = loanApplications.filter((a) => a.submittedAt >= since);

  const { score, level, triggeredRules } = scoreLoanApplication(
    { purpose, loanAmount: amount, accountId: account.id, agentId: req.user.id },
    account,
    recent
  );

  const application = {
    id: crypto.randomUUID(),
    applicationId: (() => {
      const num = Math.floor(1000 + Math.random() * 9000);
      return `LN-${num}`;
    })(),
    agentId: req.user.id,
    agentName: req.user.name,
    accountId: account.id,
    applicantId: account.holderId,
    accountIdText: account.accountId,
    purpose,
    loanAmount: amount,
    documentPath: req.file ? req.file.path : null,
    documentOriginalName: req.file ? req.file.originalname : null,
    submittedAt: Date.now(),
    status: "pending", // pending | approved | rejected
    officerNote: "",
    riskScore: score,
    riskLevel: level,
    triggeredRules,
  };
  loanApplications.unshift(application);

  io.to("officers").emit("application:new", toOfficerView(application));
  io.to(`agent:${req.user.id}`).emit("application:new", toRedactedView(application));
  io.to(`applicant:${account.holderId}`).emit("application:new", toRedactedView(application));

  res.status(201).json(toRedactedView(application));
});

app.get("/api/loan-applications", protect, authorize("officer", "admin"), (req, res) => {
  res.json(loanApplications.map(toOfficerView));
});

app.get("/api/loan-applications/mine", protect, authorize("agent", "applicant"), (req, res) => {
  const mine =
    req.user.role === "agent"
      ? loanApplications.filter((a) => a.agentId === req.user.id)
      : loanApplications.filter((a) => a.applicantId === req.user.id);
  res.json(mine.map(toRedactedView));
});

app.get("/api/loan-applications/:id", protect, (req, res) => {
  const application = loanApplications.find((a) => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: "Not found" });

  const isOwner = application.agentId === req.user.id || application.applicantId === req.user.id;
  const isStaff = ["officer", "admin"].includes(req.user.role);
  if (!isOwner && !isStaff) return res.status(403).json({ error: "Forbidden" });

  res.json(isStaff ? toOfficerView(application) : toRedactedView(application));
});

app.patch("/api/loan-applications/:id", protect, authorize("officer", "admin"), (req, res) => {
  const { status, officerNote } = req.body;
  const allowed = ["pending", "approved", "rejected", "escalated"];
  if (status && !allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const application = loanApplications.find((a) => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: "Not found" });

  if (status) application.status = status;
  if (officerNote !== undefined) application.officerNote = officerNote;
  application.decidedBy = req.user.id;
  application.decidedAt = Date.now();

  io.to("officers").emit("application:update", toOfficerView(application));
  io.to(`agent:${application.agentId}`).emit("application:update", toRedactedView(application));
  io.to(`applicant:${application.applicantId}`).emit("application:update", toRedactedView(application));

  res.json(toOfficerView(application));
});

// Serves the uploaded PDF only to the owning agent/applicant or staff -
// never a public static path.
app.get("/api/loan-applications/:id/document", protect, (req, res) => {
  const application = loanApplications.find((a) => a.id === req.params.id);
  if (!application) return res.status(404).json({ error: "Not found" });

  const isOwner = application.agentId === req.user.id || application.applicantId === req.user.id;
  const isStaff = ["officer", "admin"].includes(req.user.role);
  if (!isOwner && !isStaff) return res.status(403).json({ error: "Forbidden" });

  if (!application.documentPath || !fs.existsSync(application.documentPath)) {
    return res.status(404).json({ error: "No document attached to this application" });
  }

  res.download(path.resolve(application.documentPath), application.documentOriginalName || "document.pdf");
});

// In production, serve the built frontend (npm run build inside /frontend) from
// this same server, so the whole app is reachable from a single URL/service
// (e.g. one Render/Railway/Fly.io web service instead of two).
const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback: any non-API GET route serves the React app, which then
  // handles its own client-side routing.
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Real-Time Bank Loan Fraud Detection backend running on http://localhost:${PORT}`);
});
