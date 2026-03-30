const express = require('express');
const rateLimit = require('express-rate-limit');
const { authController } = require('../controllers');
const { protect, validate } = require('../middleware');
const { registerRules, loginRules } = require('../middleware/validators/auth.validators');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many attempts, please try again in 15 minutes' },
});

router.post('/register', authLimiter, validate(registerRules), authController.register);
router.post('/login', authLimiter, validate(loginRules), authController.login);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
