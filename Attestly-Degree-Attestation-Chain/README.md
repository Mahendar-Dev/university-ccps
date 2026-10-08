# 🎓 Attestly: Serverless Degree Attestation & Trust Chain

[![Node.js](https://img.shields.io/badge/Node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/) [![Blockchain](https://img.shields.io/badge/Blockchain-%23363636.svg?style=for-the-badge&logo=blockchain-dot-com&logoColor=white)](https://en.wikipedia.org/wiki/Blockchain) [![PDFKit](https://img.shields.io/badge/PDFKit-%23F40F02.svg?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](https://pdfkit.org/) [![JavaScript](https://img.shields.io/badge/JavaScript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

🔴 **LIVE PREVIEW:** [Attestly Command Center (Deployed on Onrender.com)](https://degree-attestation-4jvk.onrender.com)

**Attestly** is a private blockchain simulation that solves a **Real-World Problem**: universities issuing fake-proof, instantly verifiable degrees without relying on a central, trust-based database that can be edited after the fact.

This repository contains the complete source code and documentation for the Degree Attestation Chain — a Complex Computing Problem (CCP) style project for a Software Engineering / OS Theory course.

---

## 🌍 The Real-World Problem Solved

Fake degrees and forged transcripts are a real, ongoing hiring risk. Employers currently have no fast way to confirm a degree is real short of calling the university directly and waiting days for a reply — and universities have no tamper-evident way to prove a record hasn't been altered after issuance.

- **The Challenge:** A traditional database record can be silently edited, backdated, or deleted by anyone with admin access — there's no cryptographic proof the record you're looking at today is the same one that was issued.
- **The Attestly Solution:** Every degree issuance, verification, and revocation becomes a SHA-256 hash-linked block on an append-only ledger. Tampering with any past record breaks the hash chain and is instantly detectable via a built-in integrity check — giving employers a verify button instead of a phone call.

---

## 🚀 Architecture Overview

The system is designed as a **single-service, zero-framework** architecture — no Express, no external blockchain node, no database server.

1. **Frontend (UI):** A dark, terminal-styled login/dashboard interface built with **vanilla HTML/CSS/JavaScript** — no build step required.
2. **Backend / API:** A **pure Node.js `http` server** (no Express) handles routing, static file serving, and all `/api/*` endpoints.
3. **"Blockchain" Ledger:** A custom `Blockchain` class (`blockchain.js`) hash-links every transaction with SHA-256 + a lightweight proof-of-work step, and exposes `isValid()` for full chain tamper detection.
4. **Smart Contracts:** Business rules (issue / revoke / verify a degree) live as plain JS functions in `contracts.js`, written so the same logic is portable to a real Solidity or Hyperledger Fabric chaincode later.
5. **Identity & Access:** `accessControl.js` implements PBKDF2 password hashing, HMAC-signed session tokens (a JWT-equivalent with zero dependencies), and role-based access control (RBAC) across four roles.
6. **Storage:** Flat JSON files (`backend/data/`) act as the persistence layer for the chain, users, sessions, and audit logs.
7. **Certificates:** `pdfCertificate.js` (via `pdfkit`) generates downloadable PDF degree certificates, auto-stamped "REVOKED" where applicable.

---

## 📁 Repository Structure

```
📦 Attestly-Degree-Attestation
 ┣ 📂 backend                  # Node.js core (pure http/crypto/fs)
 ┃ ┣ 📜 server.js              # HTTP server, routing, static file serving
 ┃ ┣ 📜 blockchain.js          # Block + Blockchain classes, hashing, integrity check
 ┃ ┣ 📜 contracts.js           # Smart-contract-style issue/revoke/verify logic
 ┃ ┣ 📜 accessControl.js       # RBAC, password hashing, session tokens, digital certs
 ┃ ┣ 📜 pdfCertificate.js      # PDF certificate generation (pdfkit)
 ┃ ┣ 📜 seed.js                # Demo simulation scenario (universities/students/employers)
 ┃ ┣ 📜 package.json           # Node dependencies
 ┃ ┗ 📂 data                   # Generated at runtime: chain.json, users.json, logs
 ┣ 📂 frontend                 # Vanilla JS Tactical UI
 ┃ ┣ 📜 index.html             # Login + dashboard shell
 ┃ ┣ 📜 styles.css             # Dark-themed styling
 ┃ ┗ 📜 app.js                 # API calls, dashboard rendering
 ┗ 📜 README.md                # Documentation
```

---

## 🛡️ CCP Assignment Rubric Checklist

- [x] **Ledger / Blockchain Simulation:** Hash-linked, append-only, tamper-evident chain (`blockchain.js`).
- [x] **Smart-Contract-Style Logic:** Issue / Revoke / Verify degree modules (`contracts.js`).
- [x] **Backend & Compute:** Pure Node.js `http` server, zero framework dependencies.
- [x] **Authentication (RBAC):** PBKDF2 password hashing, HMAC session tokens, 4-role permission matrix.
- [x] **Digital Identity:** Self-signed RSA "digital certificate" issued per participant, simulating PKI.
- [x] **Document Generation:** PDF certificate download per degree, with revocation stamping.
- [x] **Fraud Detection:** Verification correctly rejects fabricated/unknown degree hashes.
- [x] **Audit Logging:** Full login, issuance, verification, and unauthorized-access logs.
- [x] **Simulation Scenario:** Seed script covering 2 universities, 3 students, 2 employers, 5 degrees, 3 verifications, 1 fraud attempt.

---

## 🛠️ Deployment Instructions (For a Fresh Clone)

If you are downloading this repository to run locally, follow these foolproof steps:

### Prerequisites

1. **Node.js:** v18 or higher installed (`node -v` to check).
2. **npm:** Comes bundled with Node.js.

### Step 1: Install Dependencies

```bash
git clone https://github.com/MuhammadAfnanSolangi/degree-attestation.git
cd degree-attestation/backend
npm install
```

### Step 2: Seed the Demo Simulation (Optional but Recommended)

This wipes `backend/data/` and rebuilds a fresh demo scenario — 2 universities, 3 students, 2 employers, 5 issued degrees, 3 verifications, and 1 simulated fraud attempt.

```bash
npm run seed
```

### Step 3: Run the Server

```bash
npm start
```

The entire app (API + frontend) runs as **one service** at `http://localhost:4000` — there is no separate frontend server to start.

### System Access

Log in with one of the following demo accounts (created by `npm run seed`):

| Role | Email | Password |
|---|---|---|
| University — Iqra | admin@iqra.edu.pk | University@123 |
| University — NUST | admin@nust.edu.pk | University@123 |
| Student — Ali Raza | ali.raza@student.edu | Student@123 |
| Employer — Systems Ltd | hr@systemslimited.com | Employer@123 |
| Employer — Devsinc | talent@devsinc.com | Employer@123 |

- **University accounts** can issue and revoke degrees.
- **Employer accounts** can verify a degree hash instantly against the ledger.
- **Student accounts** can view their own issued degrees and download PDF certificates.

---

*Developed for the Software Engineering / OS Theory course as a Complex Computing Problem (CCP) solution.*
