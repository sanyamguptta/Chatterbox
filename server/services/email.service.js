const { Resend } = require('resend');
require('dotenv').config();

const IS_DEV = process.env.NODE_ENV !== 'production';
const HAS_RESEND_KEY = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_xxx');

const resend = HAS_RESEND_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * In development mode WITHOUT a real Resend key:
 * → OTP is printed to the server terminal instead of emailed.
 * In production with a real key → sends via Resend.
 */
async function sendOTPEmail(to, otp) {
  const collegeName = process.env.COLLEGE_NAME || 'College';

  if (!HAS_RESEND_KEY) {
    // ── DEV MODE: log OTP to terminal ────────────────────────────────────────
    console.log('\n' + '─'.repeat(50));
    console.log('📧  DEV MODE — OTP Email (not sent via Resend)');
    console.log(`    To     : ${to}`);
    console.log(`    OTP    : \x1b[33m${otp}\x1b[0m`);   // yellow in terminal
    console.log(`    Expires: 10 minutes`);
    console.log('─'.repeat(50) + '\n');
    return; // skip Resend call entirely
  }

  // ── PRODUCTION: send via Resend ───────────────────────────────────────────
  const { error } = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to,
    subject: `Your Chatterbox OTP — ${otp}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #E5E7EB; border-radius: 8px;">
        <h2 style="color: #111111; margin-bottom: 8px;">Chatterbox — ${collegeName}</h2>
        <p style="color: #6B7280; margin-bottom: 24px; font-size: 14px;">Your one-time verification code</p>
        <div style="background: #F9FAFB; border: 2px dashed #1D9E75; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1D9E75;">${otp}</span>
        </div>
        <p style="color: #6B7280; font-size: 13px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 16px;">If you did not request this, ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error('Resend error:', error);
    // Return specific error message from Resend for easier debugging
    throw new Error(error.message || 'Failed to send OTP email via Resend');
  }
}

/**
 * Sends a welcome email after successful registration.
 */
async function sendWelcomeEmail(to, displayName) {
  const collegeName = process.env.COLLEGE_NAME || 'College';

  if (!HAS_RESEND_KEY) {
    console.log('\n📧  DEV MODE — Welcome email skipped for:', to);
    return;
  }

  const { error } = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to,
    subject: `Welcome to Chatterbox, ${displayName}!`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #E5E7EB; border-radius: 8px;">
        <h2 style="color: #111111;">Welcome to Chatterbox! 🎉</h2>
        <p style="color: #374151;">Hey ${displayName}, your account has been created successfully.</p>
        <p style="color: #6B7280; font-size: 14px;">Your account is pending admin approval. You'll be able to access all features once approved. This usually takes less than 24 hours.</p>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">— The Chatterbox Team, ${collegeName}</p>
      </div>
    `,
  });

  if (error) {
    console.error('Resend welcome email error:', error);
    // Non-fatal — don't throw, account is already created
  }
}

module.exports = { sendOTPEmail, sendWelcomeEmail };
