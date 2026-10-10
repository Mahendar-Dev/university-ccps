const express = require('express');
const router = express.Router();
const { getMyReferrals } = require('../controllers/referralController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getMyReferrals);

module.exports = router;
