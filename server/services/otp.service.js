const crypto = require('crypto');
const pool = require('../config/db');
const { sendOTPEmail } = require('./email.service');

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates an OTP, stores it in DB, and sends it via email.
 * @param {string} email - recipient email
 * @param {string} purpose - 'signup' | 'login'
 */
async function sendOTP(email, purpose) {
  const otp = generateOTP();

  // Expire any existing unused OTPs for this email+purpose
  await pool.query(
    `UPDATE otp_store SET used = TRUE
     WHERE email = $1 AND purpose = $2 AND used = FALSE`,
    [email, purpose]
  );

  // Store new OTP (expires in 10 minutes)
  await pool.query(
    `INSERT INTO otp_store (email, otp_code, purpose, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
    [email, otp, purpose]
  );

  // Send email
  await sendOTPEmail(email, otp);

  return true;
}

/**
 * Verifies an OTP. Returns true if valid, throws if not.
 * @param {string} email
 * @param {string} code - the OTP entered by user
 * @param {string} purpose - 'signup' | 'login'
 */
async function verifyOTP(email, code, purpose) {
  const result = await pool.query(
    `SELECT * FROM otp_store
     WHERE email = $1
       AND purpose = $2
       AND used = FALSE
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, purpose]
  );

  if (result.rows.length === 0) {
    throw new Error('OTP expired or not found');
  }

  const record = result.rows[0];

  if (record.otp_code !== code) {
    throw new Error('Invalid OTP');
  }

  // Mark as used immediately — prevents replay attacks
  await pool.query(
    `UPDATE otp_store SET used = TRUE WHERE id = $1`,
    [record.id]
  );

  return true;
}

module.exports = { sendOTP, verifyOTP };
