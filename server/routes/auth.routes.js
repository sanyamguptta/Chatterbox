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

// Limiter for sending OTPs — max 3 per email per hour
const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => (req.body.email || req.ip).toLowerCase(),
  message: { message: 'Too many OTP requests. Please try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for verifying OTPs — max 10 attempts per IP per 15 minutes
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many verification attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/send-otp',    otpSendLimiter,   sendOTPController);
router.post('/verify-otp',  otpVerifyLimiter, verifyOTPController);
router.post('/verify-roll',                   verifyRollController);
router.post('/register',                      registerController);
router.post('/login',       otpSendLimiter,   loginController);
router.post('/refresh',                       refreshController);
router.post('/logout',                        logoutController);

module.exports = router;
