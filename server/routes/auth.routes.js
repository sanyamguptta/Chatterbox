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

// Limiter for sending OTPs — disabling for testing (increased to 10k/hr)
const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10000, 
  keyGenerator: (req) => (req.body.email || req.ip).toLowerCase(),
  message: { message: 'OTP limits (DEV MODE: Currently 10k allowed)' },
  standardHeaders: true,
  legacyHeaders: false,
});


// Limiter for verifying OTPs — disabling for testing (increased to 10k/15min)
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, 
  message: { message: 'Verification limits (DEV MODE: Currently 10k allowed)' },
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
