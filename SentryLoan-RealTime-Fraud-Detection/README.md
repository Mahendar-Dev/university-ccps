# 🏦 SentryLoan: Real-Time Bank Loan Fraud Detection System

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=%23232a2e)](https://react.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**SentryLoan** is a full-stack, real-time fraud detection platform for bank loan
applications. It solves a genuine operational problem for lending institutions:
**flagging fraudulent or high-risk loan applications the instant they're
submitted**, instead of hours or days later during manual batch review.

This repository contains the complete source code, a rule-based fraud scoring
engine, and full documentation for the Complex Computing Problem (CCP)
assignment.

---

## 🌍 The Real-World Problem Solved

Banks and NBFCs process thousands of loan applications, often submitted by
distributed agents/branches. Manual fraud review is slow, and by the time a
fraud analyst looks at an application, the applicant may have already
disbursed funds through a duplicate or fraudulent identity across multiple
branches.

- **The Challenge:** Fraud rings exploit the *lag* between application
  submission and manual review — reusing a phone number, device, or identity
  across several applications within minutes, before any human notices the
  pattern.
- **The Solution:** SentryLoan scores every application **the moment it's
  submitted**, using a transparent rule-based engine (not an opaque black-box
  model), and pushes the result to every connected loan officer's dashboard in
  real time over WebSockets — closing that fraud window from hours to
  milliseconds.

---

## 🚀 Architecture Overview

The system follows a simple, self-contained **client-server architecture** —
deliberately free of external cloud dependencies so it can be cloned and run
anywhere with just Node.js installed.

1. **Frontend (UI):** A React 19 + Vite single-page app with role-based views
   for Bank Agents, Loan Applicants, and Loan Officers/Admins.
2. **Backend (API + Realtime):** A single Express.js server exposes a REST API
   for auth, accounts, and loan applications, and hosts a Socket.IO server on
   the same port for live, bidirectional updates.
3. **Fraud Scoring Engine:** A pure, dependency-free JavaScript module
   (`riskEngine.js`) that evaluates seven weighted fraud rules against each new
   application and returns a 0–100 risk score with a human-readable
   explanation for every point.
4. **Session & Storage Layer:** Passwords are hashed with `bcrypt`; sessions
   use signed random tokens (not JWT, kept deliberately simple) stored
   server-side. All application data lives in memory — no database
   installation required to run the project.
5. **File Handling:** Supporting documents are uploaded via `multer`,
   persisted to local disk, and served back only through an authenticated,
   ownership-checked download route — never a public static path.
6. **Authentication (RBAC):** Role-Based Access Control is enforced on **both**
   the REST layer and the Socket.IO handshake — an Agent or Applicant socket
   can never join the `officers` room that receives full risk data.

---

## 📁 Repository Structure

```
📦 RealTime-Bank-Loan-Fraud-Detection
 ┣ 📂 backend                      # Express + Socket.IO API
 ┃ ┣ 📜 server.js                  # Routes, RBAC, Socket.IO rooms, file upload
 ┃ ┣ 📜 store.js                   # In-memory data store (users, accounts, applications)
 ┃ ┣ 📜 auth.js                    # Password hashing + session token management
 ┃ ┣ 📜 riskEngine.js              # Rule-based fraud scoring engine (7 rules)
 ┃ ┣ 📂 uploads/loans              # Uploaded supporting PDFs
 ┃ ┗ 📜 package.json
 ┣ 📂 frontend                     # React (Vite) tactical UI
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📜 App.jsx                  # Role-based routing shell
 ┃ ┃ ┣ 📜 socket.js                # Session-authenticated Socket.IO client
 ┃ ┃ ┣ 📂 context                  # AuthContext (login/register/logout)
 ┃ ┃ ┣ 📂 utils                    # api.js - fetch wrapper + file upload support
 ┃ ┃ ┗ 📂 components
 ┃ ┃   ┣ 📜 Login.jsx              # Login / Register
 ┃ ┃   ┣ 📜 LoanApplicationForm.jsx # Agent's application form + PDF upload
 ┃ ┃   ┣ 📜 AgentDashboard.jsx      # Agent's submitted applications (live)
 ┃ ┃   ┣ 📜 OfficerReview.jsx       # Live risk queue, approve/reject, downloads
 ┃ ┃   ┗ 📜 AccountTracking.jsx     # Applicant's account + application history (live)
 ┃ ┗ 📜 package.json
 ┣ 📜 install.bat / run.bat        # Windows one-click setup/run
 ┣ 📜 run.sh                       # Mac/Linux/Git Bash one-command run
 ┗ 📜 README.md
```

---

## 🛡️ Project Checklist

- [x] **Real-Time Processing:** Socket.IO pushes fraud scores and status
      changes to every connected client instantly.
- [x] **Rule-Based Fraud Engine:** 7 transparent, explainable fraud rules —
      no black-box scoring.
- [x] **Authentication (RBAC):** Real register/login/logout with 4 distinct
      roles and server-side session invalidation.
- [x] **File Handling:** Authenticated PDF upload/download tied to
      application ownership.
- [x] **Role-Based Data Redaction:** Agents/Applicants never receive risk
      scores or triggered rules over the API or the socket — only Officers/Admins do.
- [x] **Zero External Dependencies:** No database, no cloud account, no
      `.env` file required to run.

---

## 🛠️ Deployment Instructions (For a Fresh Clone)

### Prerequisites

1. **Node.js** v18 or newer — [download here](https://nodejs.org/).

That's the entire prerequisite list — no database, no API keys, no cloud
account.

### Step 1: Install & Start the Backend

```bash
cd backend
npm install
npm start
```
The API + Socket.IO server starts on **http://localhost:4000**.

### Step 2: Install & Start the Frontend

In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
The app is now available at **http://localhost:5173**.

### Step 3 (Windows alternative)

Double-click **`install.bat`** once, then **`run.bat`** every time you want to
start both servers together.

### System Access

- **Register** as a **Bank Agent** or **Loan Applicant** directly from the
  login screen — no pre-approval needed for these roles.
- **Officer / Admin** accounts are pre-seeded (not self-registrable, by design):

  | Role    | Email                    | Password         |
  |---------|---------------------------|--------------------|
  | Admin   | `admin@bankfraud.test`   | `Admin@12345`     |
  | Officer | `officer@bankfraud.test` | `Officer@12345`   |

---

## 🧠 Fraud Detection Rules

Every rule that fires is logged and shown to the reviewing officer — full
explainability, zero black-box guessing:

| # | Rule | Signal |
|---|------|--------|
| 1 | KYC/Account Expiry | Applicant's account verification had already expired |
| 2 | Credit Limit Breach | Loan amount exceeds the pre-approved credit limit |
| 3 | Near-Limit Amount | Loan amount is suspiciously close to the credit limit |
| 4 | Duplicate Application | Same loan purpose filed on the same account within 7 days |
| 5 | Agent Velocity | Same agent submitted 3+ applications within 10 minutes |
| 6 | Round-Number Heuristic | Suspiciously round loan amount (e.g. exact multiples of 1000) |
| 7 | New-Account Spike | High-value loan requested shortly after account activation |

---

## 🌐 Getting a Live Demo Link (Free Deployment)

The backend can serve the built frontend itself, so the **entire app deploys
as a single web service** — one URL, no separate frontend/backend hosting to
coordinate.

### Deploy on Render.com (free tier, supports WebSockets)

1. Push this project to a GitHub repository.
2. Go to [render.com](https://render.com) → sign in with GitHub → **New +** →
   **Web Service** → select your repo.
3. Configure:
   | Setting | Value |
   |---|---|
   | **Root Directory** | *(leave blank)* |
   | **Build Command** | `cd frontend && npm install && npm run build && cd ../backend && npm install` |
   | **Start Command** | `node backend/server.js` |
   | **Instance Type** | Free |
4. Click **Create Web Service**. Render builds the frontend, then starts the
   backend — which now also serves the built frontend as static files (see
   `backend/server.js`) — all from the one URL Render gives you (e.g.
   `https://sentryloan.onrender.com`).
5. That URL is now your live demo link.

**Notes:**
- The free tier spins down after ~15 minutes of inactivity — the first
  request after that will be slow (cold start) and **all in-memory data
  resets** on every spin-down/restart, same as restarting it locally.
- Any other host that runs a persistent Node.js process works the same way
  (Railway, Fly.io, a VPS, etc.) — just use the same build/start commands.

### Link it from your GitHub profile

- Add a line near the top of this README (like the one many project READMEs
  have): `🔴 **LIVE PREVIEW:** [SentryLoan](https://your-app.onrender.com)` —
  then pin this repository on your GitHub profile so it's one of the first
  things visitors see, with the live link right there in the README.
- Alternatively, add the link directly in your GitHub profile README
  (`your-username/your-username` repo) under a "Projects" section.

---

*Developed as a Complex Computing Problem (CCP) solution — real-time,
explainable fraud detection without the operational overhead of a database or
cloud account.*


-----> Mahendar Dev <-----
