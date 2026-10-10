// Jab browser mein multiple wallet extensions installed hon (MetaMask + Coinbase Wallet + 
// browser ka apna built-in wallet jaise Brave Wallet), window.ethereum kisi bhi ek ko point
// kar sakta hai - isliye hum specifically MetaMask ko dhoondte hain, random wallet ko nahi.
export function getMetaMaskProvider() {
  if (!window.ethereum) return null;

  // Kai wallets ek saath installed hon to window.ethereum.providers array mein sab list hote hain
  if (Array.isArray(window.ethereum.providers)) {
    const metamask = window.ethereum.providers.find((p) => p.isMetaMask);
    if (metamask) return metamask;
  }

  // Sirf ek hi wallet installed hai aur wo MetaMask hai
  if (window.ethereum.isMetaMask) return window.ethereum;

  return null; // MetaMask nahi mila (koi doosra wallet ho sakta hai window.ethereum pe)
}

// MetaMask se connect karta hai - wallet_requestPermissions use karta hai taake
// HAR baar account-selection popup zaroor khule (eth_requestAccounts kabhi kabhi
// silently purani permission use kar leta hai, popup dikhaye bina)
export async function connectMetaMask() {
  const provider = getMetaMaskProvider();
  if (!provider) {
    throw new Error('MetaMask nahi mila. Extension install karo metamask.io se.');
  }

  await provider.request({
    method: 'wallet_requestPermissions',
    params: [{ eth_accounts: {} }]
  });

  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}
