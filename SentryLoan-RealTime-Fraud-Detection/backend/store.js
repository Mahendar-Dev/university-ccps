// store.js
// Everything lives in memory (plain arrays) - resets if the server restarts.
// No database setup required; this is intentionally simple for a demo/college project.
import crypto from "crypto";

export const users = [];
export const accounts = [];
export const loanApplications = [];

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function generateReadableId(prefix) {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

// Every loan applicant gets a starter bank account/credit profile automatically
// on registration - this is what a real bank's KYC/credit-line record stands in for.
export function createAccountForHolder(holderId) {
  const account = {
    id: crypto.randomUUID(),
    accountId: generateReadableId("ACC"),
    holderId,
    creditLimit: 50000,
    kycExpiryDate: Date.now() + ONE_YEAR_MS,
    createdAt: Date.now(),
    status: "active",
  };
  accounts.push(account);
  return account;
}

export function findUserByEmail(email) {
  return users.find((u) => u.email === email.toLowerCase());
}

export function findAccountByAccountId(accountId) {
  return accounts.find((a) => a.accountId === accountId.trim().toUpperCase());
}

export function findAccountByHolder(holderId) {
  return accounts.find((a) => a.holderId === holderId);
}

// Seed default officer/admin accounts so there's always a way to log in as staff
// (public registration only ever creates agent/applicant accounts - see server.js).
export function seedDefaultAccounts(hashPassword) {
  const defaults = [
    { name: "Default Admin", email: "admin@bankfraud.test", password: "Admin@12345", role: "admin" },
    { name: "Default Officer", email: "officer@bankfraud.test", password: "Officer@12345", role: "officer" },
  ];
  for (const d of defaults) {
    if (findUserByEmail(d.email)) continue;
    users.push({
      id: crypto.randomUUID(),
      name: d.name,
      email: d.email,
      password: hashPassword(d.password),
      role: d.role,
      createdAt: Date.now(),
    });
    console.log(`[seed] ${d.role} ready: ${d.email} / ${d.password}`);
  }
}
