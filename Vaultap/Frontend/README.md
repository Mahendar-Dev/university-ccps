# Vaultap Frontend

## Ye kya hai
Ye Vaultap ka frontend hai — Login/Signup screen aur Tap-to-earn game screen.
Ye backend (jo pehle diya tha) ke saath connect hota hai.

## Zaroori: Backend pehle chalao
Is frontend ko chalane se pehle, backend server chalu hona chahiye
(`npm run dev` us folder mein jahan backend hai) — warna login/signup kaam nahi karega.

## Setup

1. Is folder ko terminal (Git Bash) mein kholo, phir:
   ```
   npm install
   ```

2. Server chalao:
   ```
   npm run dev
   ```

3. Terminal mein ek link milega (kuch aisa: `http://localhost:5173`) —
   ise Ctrl+Click karo ya browser mein paste karo.

4. Browser mein Vaultap ki login screen dikhegi. Signup kar ke tap-to-earn try karo.

## Structure
- `src/api.js` — backend ke saath saari communication (signup, login, tap, status)
- `src/components/Auth.jsx` — Login/Signup screen
- `src/components/Game.jsx` — Tap-to-earn screen (login ke baad)
- `src/App.jsx` — decide karta hai konsi screen dikhani hai
