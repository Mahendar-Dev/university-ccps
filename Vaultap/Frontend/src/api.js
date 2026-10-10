// Ye file backend ke saath baat karne ke saare functions rakhti hai
// Taake baaki components mein baar baar fetch likhna na pade

const API_URL = 'https://vaultap-backend.onrender.com/api';

// Signup - naya account banane ke liye (referralCode optional hai)
export async function signup(username, email, password, referralCode) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, referralCode })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Signup fail ho gaya');
  return data;
}

// Login - existing account mein enter karne ke liye (email + password)
export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login fail ho gaya');
  return data;
}

// Tap - coin kamane ke liye (token zaroori hai, warna backend reject karega)
export async function tap(token) {
  const res = await fetch(`${API_URL}/game/tap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Tap fail ho gaya');
  return data;
}

// Current balance/energy dekhne ke liye
export async function getStatus(token) {
  const res = await fetch(`${API_URL}/game/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Status fetch fail ho gaya');
  return data;
}

// Quests ki list dekhne ke liye (progress ke saath)
export async function getQuests(token) {
  const res = await fetch(`${API_URL}/quests`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Quests fetch fail ho gayi');
  return data;
}

// Quest complete hone ke baad reward claim karne ke liye
export async function claimQuest(token, questId) {
  const res = await fetch(`${API_URL}/quests/${questId}/claim`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Claim fail ho gaya');
  return data;
}

// Apna referral code aur invited users dekhne ke liye
export async function getReferrals(token) {
  const res = await fetch(`${API_URL}/referrals`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Referrals fetch fail ho gayi');
  return data;
}

// Wallet address ko account se link karna
export async function connectWallet(token, walletAddress) {
  const res = await fetch(`${API_URL}/wallet/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ walletAddress })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Wallet connect fail ho gaya');
  return data;
}

// Wallet status aur USDT balance dekhne ke liye
export async function getWalletStatus(token) {
  const res = await fetch(`${API_URL}/wallet/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Wallet status fetch fail ho gayi');
  return data;
}

// Coins ko USDT mein convert karna
export async function convertCoins(token, coinAmount) {
  const res = await fetch(`${API_URL}/wallet/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ coinAmount })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Conversion fail ho gaya');
  return data;
}

// USDT ko connected wallet mein withdraw karna
export async function withdrawUsdt(token, usdtAmount) {
  const res = await fetch(`${API_URL}/wallet/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ usdtAmount })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Withdrawal fail ho gaya');
  return data;
}
