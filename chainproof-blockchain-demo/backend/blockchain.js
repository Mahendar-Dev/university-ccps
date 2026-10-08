const crypto = require('crypto');

class Block {
  constructor(index, data, timestamp, previousHash = '', nonce = 0) {
    this.index = index;
    this.data = data;
    this.timestamp = timestamp;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = this.computeHash();
  }

  computeHash() {
    return crypto
      .createHash('sha256')
      .update(this.index + this.data + this.timestamp + this.previousHash + this.nonce)
      .digest('hex');
  }

  mine(difficulty) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this.computeHash();
    }
    return this;
  }
}

class Blockchain {
  constructor(difficulty = 2) {
    this.difficulty = difficulty;
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    return new Block(0, 'Genesis Block', new Date().toISOString(), '0'.repeat(64)).mine(this.difficulty);
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data) {
    const prev = this.getLatestBlock();
    const block = new Block(this.chain.length, data, new Date().toISOString(), prev.hash).mine(this.difficulty);
    this.chain.push(block);
    return block;
  }

  // Simulates tampering: edits a block's data WITHOUT re-mining, so the
  // hash no longer matches and the link to the next block breaks. This is
  // intentional — it's how the demo shows why tampering is detectable.
  tamperBlock(index, newData) {
    const block = this.chain[index];
    if (!block) return null;
    block.data = newData;
    block.hash = block.computeHash();
    return block;
  }

  // Re-mines a single block in place (used to "repair" a tampered block).
  remineBlock(index) {
    const block = this.chain[index];
    if (!block) return null;
    if (index > 0) block.previousHash = this.chain[index - 1].hash;
    const fresh = new Block(block.index, block.data, block.timestamp, block.previousHash, 0).mine(this.difficulty);
    this.chain[index] = fresh;
    return fresh;
  }

  isValid() {
    for (let i = 0; i < this.chain.length; i++) {
      const block = this.chain[i];
      if (block.hash !== block.computeHash()) return false;
      if (i > 0 && block.previousHash !== this.chain[i - 1].hash) return false;
      if (!block.hash.startsWith('0'.repeat(this.difficulty))) return false;
    }
    return true;
  }
}

module.exports = { Block, Blockchain };
