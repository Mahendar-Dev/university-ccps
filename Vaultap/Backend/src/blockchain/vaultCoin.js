const { ethers } = require('ethers');

// VaultCoin contract ka minimal ABI - sirf jo functions hume chahiye
// (poora ABI zaroori nahi, sirf mint aur balanceOf ke liye interface kaafi hai)
const VAULT_COIN_ABI = [
  'function mint(address to, uint256 amount) public',
  'function balanceOf(address account) public view returns (uint256)',
  'function decimals() public view returns (uint8)'
];

let provider = null;
let wallet = null;
let contract = null;

// Provider/wallet/contract sirf ek baar setup karte hain (lazy init)
// Taake agar blockchain env vars missing hon to poora server crash na ho
function getContract() {
  if (contract) return contract;

  const rpcUrl = process.env.ALCHEMY_RPC_URL;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const contractAddress = process.env.VAULT_COIN_CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error('Blockchain environment variables set nahi hain (.env check karo)');
  }

  provider = new ethers.JsonRpcProvider(rpcUrl);
  wallet = new ethers.Wallet(privateKey, provider);
  contract = new ethers.Contract(contractAddress, VAULT_COIN_ABI, wallet);

  return contract;
}

// User ke wallet address pe naye VaultCoin tokens mint karta hai (real Sepolia transaction)
// amount ek normal number hai (jaise 5.2) - andar hi decimals handle ho jata hai
async function mintTokens(toAddress, amount) {
  const c = getContract();
  const amountInWei = ethers.parseUnits(amount.toString(), 18); // ERC20 default 18 decimals
  const tx = await c.mint(toAddress, amountInWei);
  const receipt = await tx.wait(); // block mein confirm hone ka wait karo
  return { txHash: receipt.hash };
}

// Kisi wallet ka on-chain VaultCoin balance check karne ke liye (optional use)
async function getOnChainBalance(address) {
  const c = getContract();
  const balance = await c.balanceOf(address);
  return ethers.formatUnits(balance, 18);
}

module.exports = { mintTokens, getOnChainBalance };
