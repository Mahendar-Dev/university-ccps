# ⛓️ Chainproof: A Tamper-Evident Blockchain Demo

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![SHA--256](https://img.shields.io/badge/Hashing-SHA--256-4B32C3?style=for-the-badge)](https://en.wikipedia.org/wiki/SHA-2)

**Chainproof** is a full-stack, hands-on demonstration of how a blockchain actually works under the hood — real SHA-256 proof-of-work mining, a persisted chain, and a live UI that shows exactly how tampering with one block breaks every link after it.

This repository contains the complete source for a **Node.js/Express backend** with an authenticated REST API, and a **vanilla JS frontend** that visualizes the chain and lets you mine, edit, and repair blocks in real time.

---

## 🧩 The Problem It Demonstrates

Blockchains are usually explained in the abstract — "blocks linked by hashes" — without anything to actually click on. Chainproof makes the concept tangible:

- **The Challenge:** It's hard to *feel* why blockchains are tamper-evident just by reading about hash pointers.
- **The Solution:** Chainproof lets you edit a block's data directly and watch, in real time, its hash change, its link to the next block turn red, and the "Invalid" status cascade down the chain — then lets you re-mine it to repair the break.

---

## 🚀 Architecture Overview

![Architecture diagram](docs/architecture-diagram.svg)

The system is a simple two-tier client/server setup:

1. **Frontend (UI):** Plain **HTML/CSS/JS** — no build step. Renders the chain as a vertical, column-wise stack of block cards with live status indicators.
2. **Backend (API):** **Node.js + Express** serving a small REST API for reading the chain, adding blocks, tampering with a block, and re-mining it.
3. **Blockchain Engine:** A real `Block` / `Blockchain` implementation (`backend/blockchain.js`) using Node's built-in `crypto` module for SHA-256 proof-of-work mining.
4. **Persistence:** The chain is written to `backend/data/chain.json` after every change, so it survives server restarts.
5. **Authentication:** Every API route (except `/api/health`) requires an `x-api-key` header. A key is auto-generated on first run if none is set.

---

## 🖼️ Screenshots

**Chain intact — every block valid and correctly linked:**

![Valid chain screenshot](docs/screenshot-valid-chain.svg)

**After editing a block's data — the hash changes and the link breaks downstream:**

![Tampered chain screenshot](docs/screenshot-tampered.svg)

---

## 📁 Repository Structure

```
📦 chainproof-project
 ┣ 📂 backend                 # Node.js + Express API
 ┃ ┣ 📜 blockchain.js         # Block / Blockchain classes, SHA-256 proof-of-work
 ┃ ┣ 📜 server.js             # REST API routes, API key middleware, persistence
 ┃ ┣ 📜 package.json          # Node dependencies (express, cors, dotenv)
 ┃ ┗ 📜 .env.example          # PORT, DIFFICULTY, API_KEY template
 ┣ 📂 frontend                # Vanilla JS UI
 ┃ ┣ 📜 index.html            # Page shell
 ┃ ┣ 📜 style.css             # Dark, technical styling
 ┃ ┗ 📜 app.js                # Talks to the backend via fetch()
 ┗ 📜 README.md               # This file
```

---

## ✅ Feature Checklist

- [x] **Real cryptographic hashing:** SHA-256 via Node's `crypto` module, not a simulation.
- [x] **Proof-of-work mining:** adjustable difficulty (leading zero count).
- [x] **Tamper detection:** editing a block's data breaks its hash and its link to the next block.
- [x] **Repair flow:** a "Re-mine" action recomputes a block's hash and nonce to restore validity.
- [x] **Persistence:** chain state is saved to disk and reloaded on restart.
- [x] **API key authentication:** every write/read route is gated by an `x-api-key` header.
- [x] **Zero external services:** runs entirely on `localhost`, no cloud account needed.

---

## 🛠️ Setup Instructions (For a Fresh Copy)

If you've just downloaded or extracted this project, follow these steps exactly.

### Prerequisites

1. **Node.js & npm:** v18+ recommended. Install from [nodejs.org](https://nodejs.org) if `node -v` doesn't work.
2. **A terminal:** Git Bash, PowerShell, or any shell works the same way here.

### Step 1: Start the Backend

Open a terminal in the project's root folder and run:

```bash
cd backend
npm install
cp .env.example .env
npm start
```

On first run, the terminal will print a generated API key:

```
No API_KEY found in .env — generated one for this session:
9f3a1c8b7e2d4a6f0c1b3e5d7a9f2c4e6b8a1d3f5c7e9b0a
```

**Copy this key** — you'll need it in Step 3. Leave this terminal window running; it's your live server at `http://localhost:4000`.

### Step 2: Open the Frontend

In a **new** terminal window (don't close the one from Step 1):

```bash
cd frontend
explorer.exe index.html
```

*(On macOS: `open index.html`. On Linux: `xdg-open index.html`. Or just double-click the file in your file manager.)*

### Step 3: Connect

In the browser page that opens:

1. Leave **Backend URL** as `http://localhost:4000`.
2. Paste the **API Key** from Step 1 into the **API Key** field.
3. Click **Connect**.

The chain will load, showing each block stacked vertically with its data, timestamp, previous hash, nonce, and transaction hash.

### Running It Again Later

Once set up, you only need:

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && explorer.exe index.html
```

---

## 🔑 API Reference

All routes below (except `/api/health`) require the header `x-api-key: <your key>`.

| Method | Route                      | Description                                    |
|--------|-----------------------------|------------------------------------------------|
| GET    | `/api/health`               | Basic liveness check (no auth required)        |
| GET    | `/api/chain`                 | Returns the full chain and its validity        |
| POST   | `/api/blocks`                 | `{ "data": "..." }` — mines and appends a block|
| PUT    | `/api/blocks/:index`         | `{ "data": "..." }` — tampers a block's data   |
| POST   | `/api/blocks/:index/mine`   | Re-mines a block to repair it                  |
| GET    | `/api/validate`              | `{ "valid": true/false }`                      |

---

## ⚠️ Notes on Production Use

This is an educational project, not production-ready infrastructure:

- The single shared API key is fine for local demos but not for multi-user production — swap in per-user auth for anything public-facing.
- CORS is currently open to all origins in `server.js` — restrict it to your frontend's domain before deploying publicly.
- The "blockchain" here is a single-node demo (no peer-to-peer consensus) — it illustrates the data structure and hashing, not distributed consensus mechanisms like those in Bitcoin or Ethereum.

---

*Built as a hands-on teaching tool for understanding blockchain data structures — hashing, proof-of-work, and tamper-evidence — from the ground up.*
