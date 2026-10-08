// ---------- Web Crypto hashes ----------
async function webCryptoHash(algo, bytes) {
  const buf = await crypto.subtle.digest(algo, bytes);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function strToBytes(str) {
  return new TextEncoder().encode(str);
}

// ---------- MD5 (Web Crypto has no MD5) ----------
function md5Bytes(bytes) {
  function rotl(x, c) { return (x << c) | (x >>> (32 - c)); }
  const K = new Int32Array([
    -680876936,-389564586,606105819,-1044525330,-176418897,1200080426,-1473231341,-45705983,
    1770035416,-1958414417,-42063,-1990404162,1804603682,-40341101,-1502002290,1236535329,
    -165796510,-1069501632,643717713,-373897302,-701558691,38016083,-660478335,-405537848,
    568446438,-1019803690,-187363961,1163531501,-1444681467,-51403784,1735328473,-1926607734,
    -378558,-2022574463,1839030562,-35309556,-1530992060,1272893353,-155497632,-1094730640,
    681279174,-358537222,-722521979,76029189,-640364487,-421815835,530742520,-995338651,
    -198630844,1126891415,-1416354905,-57434055,1700485571,-1894986606,-1051523,-2054922799,
    1873313359,-30611744,-1560198380,1309151649,-145523070,-1120210379,718787259,-343485551
  ]);
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
             5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
             4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
             6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];

  const origLenBits = bytes.length * 8;
  let withOne = new Uint8Array(((bytes.length + 8) >> 6) * 64 + 64);
  withOne.set(bytes);
  withOne[bytes.length] = 0x80;
  const dv = new DataView(withOne.buffer);
  dv.setUint32(withOne.length - 8, origLenBits >>> 0, true);
  dv.setUint32(withOne.length - 4, Math.floor(origLenBits / 4294967296), true);

  let a0 = 1732584193, b0 = -271733879, c0 = -1732584194, d0 = 271733878;

  for (let chunk = 0; chunk < withOne.length; chunk += 64) {
    const M = new Int32Array(16);
    for (let i = 0; i < 16; i++) M[i] = dv.getInt32(chunk + i * 4, true);
    let [A, B, C, D] = [a0, b0, c0, d0];
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) | 0;
      A = D; D = C; C = B;
      B = (B + rotl(F, S[i])) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }
  function toHexLE(n) {
    let out = [];
    for (let i = 0; i < 4; i++) out.push((n >>> (i * 8)) & 0xFF);
    return out.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return toHexLE(a0) + toHexLE(b0) + toHexLE(c0) + toHexLE(d0);
}

const ALGOS = [
  { id: 'md5',     label: 'MD5',     bits: '128-bit', legacy: true },
  { id: 'sha-1',   label: 'SHA-1',   bits: '160-bit', legacy: true },
  { id: 'sha-256', label: 'SHA-256', bits: '256-bit' },
  { id: 'sha-384', label: 'SHA-384', bits: '384-bit' },
  { id: 'sha-512', label: 'SHA-512', bits: '512-bit' },
];

async function computeDigest(algoId, bytes) {
  if (algoId === 'md5') return md5Bytes(bytes);
  return webCryptoHash(algoId.toUpperCase(), bytes);
}
