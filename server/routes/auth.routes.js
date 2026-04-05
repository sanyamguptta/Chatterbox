const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  sendOTPController,
  verifyOTPController,
  verifyRollController,
  registerController,
  loginController,
  refreshController,
  logoutController,
} = require('../controllers/auth.controller');

// Rate limit OTP requests: max 5 per 15 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP requests. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/send-otp',    otpLimiter, sendOTPController);
router.post('/verify-otp',              verifyOTPController);
router.post('/verify-roll',             verifyRollController);
router.post('/register',                registerController);
router.post('/login',       otpLimiter, loginController);
router.post('/refresh',                 refreshController);
router.post('/logout',                  logoutController);

module.exports = router;
