const chainEl = document.getElementById('chain');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const apiUrlInput = document.getElementById('apiUrl');
const apiKeyInput = document.getElementById('apiKey');
const connectBtn = document.getElementById('connectBtn');

let baseUrl = localStorage.getItem('chainproof_baseUrl') || 'http://localhost:4000';
let apiKey = localStorage.getItem('chainproof_apiKey') || '';
apiUrlInput.value = baseUrl;
apiKeyInput.value = apiKey;

async function api(path, options = {}) {
  const res = await fetch(baseUrl + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

function shortHash(h) {
  return h ? h.slice(0, 16) + '…' + h.slice(-8) : '';
}

function connectorSVG(valid) {
  const stroke = valid ? '#35D399' : '#FF5C5C';
  const dash = valid ? '' : 'stroke-dasharray="4 3"';
  return `<svg viewBox="0 0 14 44"><line x1="7" y1="0" x2="7" y2="34" stroke="${stroke}" stroke-width="2" ${dash}/><path d="M2 28 L7 36 L12 28" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

async function refresh() {
  try {
    const { chain, difficulty, valid } = await api('/api/chain');
    statusDot.className = 'status-dot ' + (valid ? 'ok' : 'bad');
    statusText.textContent = valid
      ? 'Connected — chain intact and every block validated by the backend.'
      : 'Connected — chain is broken. Re-mine the invalid block to repair it.';
    render(chain, difficulty);
  } catch (err) {
    statusDot.className = 'status-dot bad';
    statusText.textContent = 'Error: ' + err.message;
    chainEl.innerHTML = '';
  }
}

function render(chain, difficulty) {
  chainEl.innerHTML = '';
  chain.forEach((block, i) => {
    const meetsDiff = block.hash.startsWith('0'.repeat(difficulty));
    const linkOk = i === 0 || block.previousHash === chain[i - 1].hash;
    const valid = meetsDiff && linkOk;

    if (i > 0) {
      const linkSlot = document.createElement('div');
      linkSlot.className = 'link';
      linkSlot.innerHTML = connectorSVG(linkOk) + `<div class="link-label" style="color:${linkOk ? '#35D399' : '#FF5C5C'}">${linkOk ? 'LINKED' : 'BROKEN'}</div>`;
      chainEl.appendChild(linkSlot);
    }

    const slot = document.createElement('div');
    slot.className = 'block-slot';
    const b = document.createElement('div');
    b.className = 'block ' + (valid ? 'valid' : 'invalid');
    b.innerHTML = `
      <div class="block-head">
        <div class="block-index">${i === 0 ? 'Genesis' : 'Block'} <span>#${block.index}</span></div>
        <div class="pill ${valid ? 'valid' : 'invalid'}">${valid ? 'Valid' : 'Invalid'}</div>
      </div>
      <div class="row"><label>Data</label>
        <textarea class="data-input" data-idx="${i}">${block.data}</textarea>
      </div>
      <div class="row"><label>Timestamp</label>
        <div class="hashfield">${new Date(block.timestamp).toLocaleString()}</div>
      </div>
      <div class="row"><label>Previous hash</label>
        <div class="hashfield">${i === 0 ? shortHash(block.previousHash) + ' (genesis)' : shortHash(block.previousHash)}</div>
      </div>
      <div class="row"><label>Nonce</label>
        <div class="hashfield">${block.nonce}</div>
      </div>
      <div class="row"><label>Transaction hash ${meetsDiff ? '· meets difficulty' : '· below difficulty'}</label>
        <div class="hashfield self ${meetsDiff ? 'valid-hash' : 'invalid-hash'}">${shortHash(block.hash)}</div>
      </div>
      <button class="mine-btn" data-idx="${i}">Re-mine this block</button>
    `;
    slot.appendChild(b);
    chainEl.appendChild(slot);
  });

  const addSlot = document.createElement('div');
  addSlot.className = 'add-slot';
  addSlot.innerHTML = `<button class="btn btn-add" id="addBlockBtn">+ Add block</button>`;
  chainEl.appendChild(addSlot);

  chainEl.querySelectorAll('.data-input').forEach((el) => {
    el.addEventListener('change', async (e) => {
      const block = chain[parseInt(e.target.dataset.idx)];
      try {
        await api(`/api/blocks/${block.index}`, { method: 'PUT', body: JSON.stringify({ data: e.target.value }) });
        refresh();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  chainEl.querySelectorAll('.mine-btn').forEach((el) => {
    el.addEventListener('click', async (e) => {
      const block = chain[parseInt(e.target.dataset.idx)];
      el.textContent = 'Mining…';
      el.disabled = true;
      try {
        await api(`/api/blocks/${block.index}/mine`, { method: 'POST' });
        refresh();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  const addBtn = document.getElementById('addBlockBtn');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const data = prompt('Data for the new block:', 'New transaction');
      if (data === null) return;
      addBtn.textContent = 'Mining…';
      try {
        await api('/api/blocks', { method: 'POST', body: JSON.stringify({ data }) });
        refresh();
      } catch (err) {
        alert(err.message);
      }
    });
  }
}

connectBtn.addEventListener('click', () => {
  baseUrl = apiUrlInput.value.trim().replace(/\/$/, '');
  apiKey = apiKeyInput.value.trim();
  localStorage.setItem('chainproof_baseUrl', baseUrl);
  localStorage.setItem('chainproof_apiKey', apiKey);
  refresh();
});

if (apiKey) refresh();
