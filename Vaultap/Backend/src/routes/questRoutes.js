const express = require('express');
const router = express.Router();
const { listQuests, claimQuest } = require('../controllers/questController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, listQuests);
router.post('/:questId/claim', verifyToken, claimQuest);

module.exports = router;
