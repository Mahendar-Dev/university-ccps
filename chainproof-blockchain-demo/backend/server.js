require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Blockchain, Block } = require('./blockchain');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const DIFFICULTY = parseInt(process.env.DIFFICULTY || '2', 10);
const DATA_FILE = path.join(__dirname, 'data', 'chain.json');

// Generate a random API key on first run if none is set in .env
let API_KEY = process.env.API_KEY;
if (!API_KEY) {
  API_KEY = crypto.randomBytes(24).toString('hex');
  console.log('\nNo API_KEY found in .env — generated one for this session:');
  console.log(API_KEY);
  console.log('Add it to your .env file to keep it stable across restarts.\n');
}

let blockchain = new Blockchain(DIFFICULTY);

function loadChain() {
  if (!fs.existsSync(DATA_FILE)) return;
  try {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    blockchain.difficulty = saved.difficulty ?? DIFFICULTY;
    blockchain.chain = saved.chain.map(
      (b) => new Block(b.index, b.data, b.timestamp, b.previousHash, b.nonce)
    );
    console.log(`Loaded existing chain from disk (${blockchain.chain.length} blocks).`);
  } catch (err) {
    console.warn('Could not load saved chain, starting fresh:', err.message);
  }
}

function persist() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({ difficulty: blockchain.difficulty, chain: blockchain.chain }, null, 2)
  );
}

loadChain();
persist();

function requireApiKey(req, res, next) {
  const key = req.header('x-api-key');
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key. Send it in the x-api-key header.' });
  }
  next();
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/chain', requireApiKey, (req, res) => {
  res.json({ chain: blockchain.chain, difficulty: blockchain.difficulty, valid: blockchain.isValid() });
});

app.post('/api/blocks', requireApiKey, (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'data field is required' });
  const block = blockchain.addBlock(data);
  persist();
  res.status(201).json({ block, valid: blockchain.isValid() });
});

// Tamper a block's data without re-mining (demonstrates detection)
app.put('/api/blocks/:index', requireApiKey, (req, res) => {
  const index = parseInt(req.params.index, 10);
  const { data } = req.body;
  if (!blockchain.chain[index]) return res.status(404).json({ error: 'Block not found' });
  const block = blockchain.tamperBlock(index, data ?? '');
  persist();
  res.json({ block, valid: blockchain.isValid() });
});

// Re-mine a block to repair it
app.post('/api/blocks/:index/mine', requireApiKey, (req, res) => {
  const index = parseInt(req.params.index, 10);
  if (!blockchain.chain[index]) return res.status(404).json({ error: 'Block not found' });
  const block = blockchain.remineBlock(index);
  persist();
  res.json({ block, valid: blockchain.isValid() });
});

app.get('/api/validate', requireApiKey, (req, res) => {
  res.json({ valid: blockchain.isValid() });
});

app.listen(PORT, () => {
  console.log(`Chainproof backend running at http://localhost:${PORT}`);
  if (process.env.API_KEY) console.log('Using API key from .env');
});
