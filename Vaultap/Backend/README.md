# Vaultap Backend

## Ye kya hai
Ye Vaultap (Play-to-Earn game) ka backend hai. Isme signup/login aur tap-to-earn
ka logic ready hai.

## Setup karne ke steps

1. Is folder ko terminal mein khol kar ye command chalao:
   ```
   npm install
   ```
   (Ye saari zaroori libraries download karega)

2. `.env.example` file ka naam copy karke `.env` rakho, aur usme:
   - `DATABASE_URL` mein apna Supabase/PostgreSQL connection string daalo
   - `JWT_SECRET` mein koi bhi random lamba text daal do

3. Database mein tables banane ke liye:
   ```
   npx prisma migrate dev --name init
   ```
   (Ye command Prisma schema se automatically tables bana degi)

4. Server chalane ke liye:
   ```
   npm run dev
   ```
   Agar sab sahi hai to terminal mein likha aayega:
   `Server chal raha hai: http://localhost:5000`

## Test kaise karein

Signup:
```
POST http://localhost:5000/api/auth/signup
Body: { "username": "ali123", "email": "ali@test.com", "password": "test123" }
```

Login:
```
POST http://localhost:5000/api/auth/login
Body: { "username": "ali123", "password": "test123" }
```

Tap (login token chahiye Authorization header mein):
```
POST http://localhost:5000/api/game/tap
Headers: Authorization: Bearer <login se mila token>
```

Postman ya Thunder Client (VS Code extension) use karo in requests ko test karne ke liye.

## Naye Features: Quests aur Referral

### Update karne ke steps (agar pehle se backend chal raha hai):
1. Naya migration chalao (Referral tables banane ke liye):
   ```
   npx prisma migrate dev --name add_referrals_quests
   ```
2. Sample quests database mein daalo (sirf ek baar chalana hai):
   ```
   node prisma/seed.js
   ```
3. Server dobara start karo:
   ```
   npm run dev
   ```

### Naye API Endpoints

**Quests dekhna:**
```
GET /api/quests
Headers: Authorization: Bearer <token>
```

**Quest reward claim karna:**
```
POST /api/quests/<questId>/claim
Headers: Authorization: Bearer <token>
```

**Apna referral status dekhna:**
```
GET /api/referrals
Headers: Authorization: Bearer <token>
```

**Signup referral code ke saath:**
```
POST /api/auth/signup
Body: { "username": "...", "email": "...", "password": "...", "referralCode": "ABC12345" }
```
(referralCode optional hai — agar diya jaye to referrer ko 500 coins aur naye user ko 200 coins bonus milega)

## Naya Feature: Wallet Connect + Coin-to-USDT Conversion

**Zaroori note:** Withdrawal abhi **simulated** hai — real blockchain transaction nahi bhejta
(fake transaction hash generate hota hai). Real crypto transfer ke liye funded wallet aur
Web3.js/Ethers.js integration chahiye hogi jo abhi risk/cost ki wajah se skip ki hai.

### Update karne ke steps:
```
npx prisma migrate dev --name add_wallet_conversion
npm run dev
```

### Naye API Endpoints

**Wallet connect karna:**
```
POST /api/wallet/connect
Body: { "walletAddress": "0x..." }
```

**Wallet status/balance dekhna:**
```
GET /api/wallet/status
```

**Coins ko USDT mein convert karna:**
```
POST /api/wallet/convert
Body: { "coinAmount": 1000 }
```
(1000 coins = 1 USDT, 3% conversion fee lagti hai)

**USDT withdraw karna (connected wallet mein):**
```
POST /api/wallet/withdraw
Body: { "usdtAmount": 0.5 }
```
(1% withdrawal fee lagti hai, simulated tx hash milega)
