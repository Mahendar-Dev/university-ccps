// auth.js
// Simple in-memory session auth: no JWT, no database. A logged-in user gets a
// random token that maps to their user id in the `sessions` Map below - the
// same idea as a server-side session, just kept in RAM for this demo project.
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { users } from "./store.js";

const sessions = new Map(); // token -> userId

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

export function comparePassword(plain, hashed) {
  return bcrypt.compareSync(plain, hashed);
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, userId);
  return token;
}

export function destroySession(token) {
  sessions.delete(token);
}

function publicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// Attaches req.user if a valid session token is present; otherwise 401.
export function protect(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = sessions.get(token);
  const user = users.find((u) => u.id === userId);
  if (!user) {
    sessions.delete(token);
    return res.status(401).json({ error: "Session expired" });
  }

  req.user = publicUser(user);
  next();
}

// Role-based access control: authorize("officer", "admin") etc.
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

// Used by the Socket.IO handshake, which isn't an Express request.
export function verifySessionToken(token) {
  const userId = sessions.get(token);
  if (!userId) return null;
  const user = users.find((u) => u.id === userId);
  return user ? publicUser(user) : null;
}

export { publicUser };
