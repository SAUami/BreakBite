const express = require('express');
const router = express.Router();
const { register, login, getMe, getDemoAccounts } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.get('/demo-credentials', getDemoAccounts);

module.exports = router;
