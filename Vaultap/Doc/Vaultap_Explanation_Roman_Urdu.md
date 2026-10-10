# Vaultap — Poori Explanation (Roman Urdu Mein)

## Ye Project Kya Hai?

Vaultap ek **Play-to-Earn (P2E) blockchain game** hai — matlab user game khelta hai (tap karta hai), coins kamata hai, aur chahe tou wo coins ko **real blockchain token** mein convert kar sakta hai apne crypto wallet mein.

Simple lafzon mein: **ek aisi app jahan game khelo aur asli blockchain coins kamao.**

---

## Poora Workflow (Shuru Se Aakhir Tak)

1. **User app kholta hai** → ek animated Splash screen dikhti hai (logo, tagline)
2. **Signup/Login karta hai** → username, email, password (referral code optional)
3. **Tap-to-earn game khelta hai** → button dabata hai, coins milte hain (energy limited hoti hai)
4. **Quests complete karta hai** → 25+ tasks (daily login, tap milestones, social tasks) — inse bonus coins milte hain
5. **Referral karta hai** → apna unique code doston ko deta hai, jab wo signup karte hain, dono ko bonus milta hai
6. **Wallet connect karta hai** → MetaMask (crypto wallet) se connect hota hai
7. **Coins ko USDT mein convert karta hai** → yahan **asli blockchain transaction** hoti hai — backend user ke wallet mein **real VaultCoin (VLTC) token mint** kar deta hai Sepolia blockchain pe
8. **Withdraw karta hai** → USDT ko wallet mein nikalta hai (abhi ye simulated hai, real nahi)

---

## Teen Bade Hisse (Architecture)

Poori app **teen layers** mein bani hai:

### 1. Frontend (Jo User Dekhta Hai)
- **React (Vite)** se bana hai
- Isme sab screens hain: Login, Game, Quests, Referrals, Wallet
- User jo bhi button dabata hai, ye backend ko request bhejta hai

### 2. Backend (Dimaag)
- **Node.js + Express** se bana hai
- Ye decide karta hai kya hoga — jaise "energy hai ya nahi", "quest complete hui ya nahi"
- Database se baat karta hai, aur blockchain se bhi

### 3. Database (Data Store Karne Ki Jagah)
- **PostgreSQL** (Supabase pe hosted) use hoti hai
- Isme users, coins, transactions, quests — sab kuch save hota hai
- **Prisma** naam ka tool database ke saath baat karne mein madad karta hai

### 4. Blockchain Layer (Asli Cryptocurrency Wala Hissa)
- Ek **smart contract** (Solidity mein likha hua code) hai jiska naam **VaultCoin.sol** hai
- Ye Ethereum ke **Sepolia testnet** pe deploy kiya gaya hai (testnet matlab practice/test wala blockchain, jahan asli paisa nahi lagta)
- Jab user coins convert karta hai, backend **Ethers.js** naam ki library use kar ke is contract ko call karta hai aur **real tokens mint karta hai**

---

## Har Feature Ki Detail

### Authentication (Login/Signup)
- Password kabhi seedha save nahi hota — **bcrypt** se "hash" kiya jata hai (encrypt jaisa, taake koi dekh na sake)
- Login hone pe ek **JWT token** milta hai — ye ek digital pass hai jo har request ke saath bhejna padta hai taake backend jaan sake "ye wahi user hai"

### Tap-to-Earn
- Har tap pe **backend check karta hai** ke energy bachi hai ya nahi (client/frontend pe bharosa nahi karte, warna koi cheat kar sakta hai)
- Agar energy hai, tou coin add hota hai aur ek "transaction" (record) bhi banta hai

### Quests
- 3 types: **Daily** (roz naya), **Milestone** (jaise 500 taps karo), **Social** (jaise dost invite karo)
- Har quest complete hone pe "Claim" button dabana padta hai, tab reward milta hai

### Referral System
- Har user ka apna unique code hota hai
- Jab koi naya user us code se signup kare, **dono ko bonus coins** milte hain

### Wallet Aur Blockchain
- **MetaMask** ek browser extension hai jo crypto wallet ki tarah kaam karta hai
- User "Connect MetaMask" dabata hai, apna wallet link karta hai
- Jab coins ko USDT mein convert karta hai:
  1. Pehle database mein coins minus hote hain, USDT plus hota hai (off-chain, fast)
  2. Agar wallet connected hai, backend **real blockchain transaction** bhejta hai — user ke wallet mein VLTC tokens mint hote hain
  3. Ye transaction **Etherscan** (blockchain explorer website) pe **publicly verify** ki ja sakti hai — koi bhi dekh sakta hai ye asli hai

---

## Kya "Real" Hai Aur Kya "Simulated" Hai?

| Feature | Status |
|---|---|
| MetaMask wallet connect | ✅ 100% Real |
| Coins earn karna (tap, quests) | Database mein (off-chain) |
| Coin → USDT convert | Database + **real blockchain mint** (agar wallet connected) |
| USDT withdraw | ⚠️ Simulated (fake transaction hash, real transfer nahi) |

---

## Poora Tech Stack (Ek Nazar Mein)

- **Frontend**: React (Vite)
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Supabase), Prisma ORM
- **Authentication**: bcrypt, JWT
- **Blockchain**: Solidity, OpenZeppelin, Ethereum Sepolia Testnet
- **Blockchain Bridge**: Ethers.js, Alchemy (RPC provider)
- **Wallet**: MetaMask
- **Hosting**: Backend → Render, Frontend → Netlify, Database → Supabase
- **Version Control**: GitHub

---

## Deployment (Live Kaise Hua)

1. Code **GitHub** pe push kiya (2 alag repos: backend, frontend — phir baad mein ek monorepo bhi banaya)
2. **Backend** ko **Render.com** pe deploy kiya — ye free hai, GitHub se connect hota hai
3. **Frontend** ko **Netlify** pe deploy kiya — ye bhi free hai
4. **Database** already **Supabase** pe thi (cloud PostgreSQL)
5. Smart contract **Remix IDE** (browser-based tool) se deploy kiya Sepolia testnet pe

---

## Zaroori Security Baatein

- `.env` file mein saare **secrets** (database password, JWT secret, blockchain private key) hote hain
- Ye file **kabhi GitHub pe push nahi ki** — `.gitignore` mein daal ke exclude ki gayi
- Isse koi bhi in secrets ko dekh ya misuse nahi kar sakta

---

## Proof Ke Liye Zaroori Links

- **Live App**: snazzy-brigadeiros-601eaf.netlify.app
- **GitHub Code**: github.com/Mahendar-Dev/Vaultap
- **Smart Contract**: 0x46A69108BFF85a0b64708d00184502cEf0D0B2De (Sepolia)
- **Blockchain Proof**: sepolia.etherscan.io pe is address ko search kar ke dekh sakte ho asli transactions

---

*Ye file sirf samajhne ke liye Roman Urdu mein banai gayi hai — agar koi viva/interview mein sawal ho, isko reference ki tarah use kar sakte ho.*
