# 🏦 SentryLoan - Roman Urdu Mein Poori Wazahat (CCP Explanation)

Yeh document is project ("Real-Time Bank Loan Fraud Detection System") ko
Roman Urdu mein explain karta hai — taake presentation/viva ke waqt har cheez
apni zabaan mein clearly samjha sako.

---

## 1. Project Kya Hai?

Yeh ek **real-time bank loan fraud detection system** hai. Iska matlab: jab
koi bank agent kisi customer ke liye loan application submit karta hai, to
system **usi waqt** (turant, bina delay ke) check karta hai ke yeh application
fraud to nahi hai.

Agar koi purani manual system hoti — to fraud analyst kal ya parso application
dekhta, tab tak fraud wala bank se paisa nikaal chuka hota. Yahan system
**milliseconds mein** score de deta hai aur officer ki screen pe turant dikha
deta hai.

---

## 2. Real-World Problem Kya Solve Ho Raha Hai?

Banks/NBFCs har din hazaron loan applications process karte hain, jo alag alag
branches/agents se aati hain. Fraud rings (dhoka-baaz group) ek hi phone
number, device, ya identity use karke **kai jagah se ek saath** loan apply
karte hain — is umeed mein ke manual review mein koi pakde nahi.

**Hamara solution:** Har application submit hote hi automatically score hoti
hai, aur turant **Officer Dashboard** pe live dikh jati hai — Socket.IO
(real-time connection) ke through. Isse fraud pakadne ka time hours se
milliseconds tak aa jata hai.

---

## 3. System Mein Kitne Roles Hain?

| Role | Kya Karta Hai |
|---|---|
| **Loan Applicant** | Jiska bank account hai — apni application ka status track karta hai |
| **Bank Agent** | Applicant ki taraf se loan application submit karta hai (PDF document ke saath) |
| **Loan Officer / Admin** | Saari applications review karta hai, risk score dekhta hai, approve/reject karta hai |

---

## 4. Architecture Kaise Kaam Karta Hai (Step by Step)

### a) Frontend (jo user dekhta hai)
- **React + Vite** se bana hai
- Har role ke liye alag screen: Agent Dashboard, Loan Application Form, Officer
  Review, Account Tracking

### b) Backend (jo asal kaam karta hai)
- **Express.js** server — REST API deta hai (login, register, applications
  submit/fetch karna)
- Isi server pe **Socket.IO** bhi chal raha hai — yeh real-time updates ke
  liye hai

### c) Fraud Scoring Engine (`riskEngine.js`)
- Yeh ek chhota, simple JavaScript file hai
- Har naye application ko **7 rules** se check karta hai
- Har rule jo trigger hota hai, uska reason bhi save hota hai — isliye officer
  ko pata chalta hai **exactly kyun** application flag hui, sirf ek number
  nahi milta

### d) Data Storage
- Koi database (MongoDB, MySQL) nahi hai — sab data **RAM mein** (in-memory)
  store hota hai
- Iska fayda: setup bahut simple hai, koi `.env` file, koi cloud account nahi
  chahiye
- Nuksan: backend restart karte hi sara data (users, applications) delete ho
  jata hai — yeh ek demo/college-project ke liye theek hai, real product ke
  liye real database chahiye hoga

### e) File Upload
- Agent jo PDF document attach karta hai, wo **`multer`** library se server
  pe **asli mein save** hoti hai (`backend/uploads/loans/` folder mein)
- Sirf woh officer ya related agent/applicant hi file download kar sakta hai
  — koi bhi random link se file access nahi kar sakta

### f) Authentication (Login/Logout)
- Password **bcrypt** se hash hota hai (kabhi bhi plain text mein store nahi
  hota)
- Login karte waqt ek random **session token** milta hai jo browser mein save
  hota hai
- Har request mein yeh token bheja jata hai taake backend confirm kare "yeh
  banda sach mein logged in hai"
- **Logout** karne pe yeh token backend se bhi delete ho jata hai — matlab
  session sach mein khatam hota hai

---

## 5. RBAC Kya Hai? (Sabse Zaroori Security Wala Hissa)

**RBAC = Role-Based Access Control**

Matlab: har role ko **sirf utna hi data dikhta hai jitni uski zarurat hai**:

- **Agent/Applicant** ko sirf application ka **status** dikhta hai (pending,
  approved, rejected) — unhe **kabhi risk score ya triggered rules nahi
  dikhte**
- **Sirf Officer/Admin** ko poora risk data dikhta hai

Yeh REST API mein bhi hai aur **real-time Socket.IO mein bhi** — matlab
agent/applicant ka connection kabhi bhi "officers" wale room mein join nahi ho
sakta, chahe wo kuch bhi try kare.

---

## 6. Fraud Detection Ke 7 Rules

| # | Rule | Kya Check Karta Hai |
|---|---|---|
| 1 | **KYC/Account Expiry** | Applicant ka account verification expire to nahi ho gaya |
| 2 | **Credit Limit Breach** | Loan amount, pre-approved credit limit se zyada to nahi |
| 3 | **Near-Limit Amount** | Loan amount credit limit ke bahut kareeb to nahi |
| 4 | **Duplicate Application** | Same purpose ka loan usi account pe pichle 7 din mein already to nahi liya gaya |
| 5 | **Agent Velocity** | Kya ek hi agent ne 10 minute mein 3+ applications submit ki hain (fraud ring ka sign) |
| 6 | **Round-Number Heuristic** | Loan amount ek suspiciously round number to nahi (jaise exactly 15000) |
| 7 | **New-Account Spike** | Account newly bana hai aur turant bada loan maanga ja raha hai |

Har rule ka apna **score** hai (jaise 40, 35, 25, wagairah). Sab scores jod ke
final **0-100** ka number banta hai, aur uske hisab se **Low / Medium / High**
risk level milta hai.

---

## 7. Poora Workflow — Ek Example Ke Saath

1. **Register:** Koi "Loan Applicant" ke roop mein register karta hai → uska
   automatically ek bank account ban jata hai (jaise `ACC-4821`, credit limit
   $50,000)

2. **Bank Agent** register/login karta hai, aur us applicant ke Account ID pe
   loan application submit karta hai — Purpose, Amount, aur ek PDF document ke
   saath

3. Submit hote hi backend:
   - Account ID check karta hai (valid hai ya nahi)
   - `riskEngine.js` se score nikalta hai
   - Application ko save karta hai
   - **Socket.IO se turant broadcast karta hai** 3 jagah:
     - Officers ko → poora data (risk score sahit)
     - Agent ko → sirf status (redacted)
     - Applicant ko → sirf status (redacted)

4. **Officer** apni screen pe application turant dekhta hai (bina refresh
   kiye), "Details" click karke triggered rules aur PDF dekh sakta hai

5. Officer **Approve** ya **Reject** dabata hai → yeh update phir se
   Socket.IO se agent aur applicant ki screen pe turant chala jata hai

---

## 8. Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO |
| Auth | bcrypt (password hashing) + custom session tokens |
| File Upload | Multer |
| Data Storage | In-memory (JavaScript arrays) |

---

## 9. Yeh Project Kyun "Advanced" Hai (Simple Version Se)

Shuru mein sirf ek simple version tha jisme:
- Login nahi tha (sirf role-select buttons the)
- File upload sirf dikhawe ke liye tha (kuch save nahi hota tha)

Ab is version mein:
- ✅ Asli Register/Login/Logout (server pe sessions sach mein manage hote hain)
- ✅ Asli File Upload (PDF sach mein save hoti hai, download bhi ho sakti hai)
- ✅ RBAC har jagah enforce hota hai (REST + Socket.IO dono mein)
- ✅ Phir bhi koi database ya cloud account setup nahi chahiye — bas
  `npm install` aur chal jata hai

---

## 10. Kaise Chalayen (Quick Recap)

```bash
# Backend
cd backend
npm install
npm start          # http://localhost:4000

# Frontend (naya terminal)
cd frontend
npm install
npm run dev         # http://localhost:5173
```

**Demo Officer/Admin login:**
- Admin: `admin@bankfraud.test` / `Admin@12345`
- Officer: `officer@bankfraud.test` / `Officer@12345`

Agent/Applicant khud "Register" se apna account bana sakte hain.

---

*Yeh explanation viva/presentation ke liye hai — agar koi part aur detail mein
samajhna ho (jaise koi specific rule ya code ka hissa), pooch lena.*
