const express = require('express');
const router = express.Router();
const { tap, getStatus } = require('../controllers/gameController');
const { verifyToken } = require('../middleware/authMiddleware');

// verifyToken pehle chalega - agar login nahi hai to yahin rok dega
router.post('/tap', verifyToken, tap);
router.get('/status', verifyToken, getStatus);

module.exports = router;
