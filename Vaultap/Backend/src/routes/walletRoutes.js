const express = require('express');
const router = express.Router();
const { connectWallet, getWalletStatus, convertCoins, withdraw } = require('../controllers/walletController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/connect', verifyToken, connectWallet);
router.get('/status', verifyToken, getWalletStatus);
router.post('/convert', verifyToken, convertCoins);
router.post('/withdraw', verifyToken, withdraw);

module.exports = router;
