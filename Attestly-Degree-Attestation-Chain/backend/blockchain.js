// blockchain.js
// Lightweight private-blockchain simulation engine.
// Mirrors core concepts of Hyperledger Fabric / Ethereum Private Network:
//  - Append-only, hash-linked ledger (immutability)
//  - Each block = one validated transaction (degree issuance, verification, access event)
//  - SHA-256 hashing + simple proof-of-work for realism
//  - Full chain integrity validation (tamper detection)

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const CHAIN_FILE = path.join(DB_DIR, 'chain.json');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

function sha256(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

class Block {
  constructor(index, timestamp, type, payload, previousHash) {
    this.index = index;
    this.timestamp = timestamp;
    this.type = type;       // 'GENESIS' | 'DEGREE_ISSUANCE' | 'DEGREE_VERIFICATION' | 'REVOCATION' | 'ACCESS_EVENT'
    this.payload = payload; // transaction data
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.mine();
  }

  computeHash() {
    return sha256({
      index: this.index,
      timestamp: this.timestamp,
      type: this.type,
      payload: this.payload,
      previousHash: this.previousHash,
      nonce: this.nonce
    });
  }

  // Lightweight proof-of-work (difficulty kept low so it stays instant — this is a
  // private/permissioned chain, so PoW is illustrative, not the consensus mechanism)
  mine(difficulty = 2) {
    const target = '0'.repeat(difficulty);
    let hash = this.computeHash();
    while (hash.substring(0, difficulty) !== target) {
      this.nonce++;
      hash = this.computeHash();
    }
    return hash;
  }
}

class Blockchain {
  constructor() {
    this.chain = [];
    this.load();
  }

  load() {
    if (fs.existsSync(CHAIN_FILE)) {
      try {
        const raw = JSON.parse(fs.readFileSync(CHAIN_FILE, 'utf-8'));
        this.chain = raw.map(b => Object.assign(new Block(0, 0, '', {}, ''), b));
        if (this.chain.length === 0) this.initGenesis();
      } catch (e) {
        this.initGenesis();
      }
    } else {
      this.initGenesis();
    }
  }

  save() {
    fs.writeFileSync(CHAIN_FILE, JSON.stringify(this.chain, null, 2));
  }

  initGenesis() {
    const genesis = new Block(0, Date.now(), 'GENESIS', { message: 'Degree Attestation Chain Genesis Block' }, '0');
    this.chain = [genesis];
    this.save();
  }

  latest() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(type, payload) {
    const prev = this.latest();
    const block = new Block(this.chain.length, Date.now(), type, payload, prev.hash);
    this.chain.push(block);
    this.save();
    return block;
  }

  // Validates the full chain — used to demonstrate tamper detection
  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const prev = this.chain[i - 1];

      const recomputed = sha256({
        index: current.index,
        timestamp: current.timestamp,
        type: current.type,
        payload: current.payload,
        previousHash: current.previousHash,
        nonce: current.nonce
      });

      if (current.hash !== recomputed) {
        return { valid: false, brokenAt: i, reason: 'Block hash does not match its content (tampered payload)' };
      }
      if (current.previousHash !== prev.hash) {
        return { valid: false, brokenAt: i, reason: 'Chain link broken (previousHash mismatch)' };
      }
    }
    return { valid: true };
  }

  getBlocksByType(type) {
    return this.chain.filter(b => b.type === type);
  }

  findBlockByDegreeHash(degreeHash) {
    return this.chain.find(
      b => b.type === 'DEGREE_ISSUANCE' && b.payload.degreeHash === degreeHash
    );
  }
}

module.exports = { Blockchain, sha256 };
