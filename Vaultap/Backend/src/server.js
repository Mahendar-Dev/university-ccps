require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const questRoutes = require('./routes/questRoutes');
const referralRoutes = require('./routes/referralRoutes');
const walletRoutes = require('./routes/walletRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes - inhi URLs pe frontend requests bhejega
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/wallet', walletRoutes);

// Simple health check - server chal raha hai ya nahi, verify karne ke liye
app.get('/', (req, res) => {
  res.json({ status: 'Vaultap backend chal raha hai' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chal raha hai: http://localhost:${PORT}`);
});
