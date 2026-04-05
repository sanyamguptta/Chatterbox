const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { sendOTP, verifyOTP } = require('../services/otp.service');
const { sendWelcomeEmail } = require('../services/email.service');

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// ─── Helper: issue both tokens ───────────────────────────────────────────────

function issueAccessToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

async function issueRefreshToken(userId) {
  const rawToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return rawToken;
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: '/api/auth/refresh',
  });
}

// ─── Step 1: Send OTP ─────────────────────────────────────────────────────────

async function sendOTPController(req, res) {
  try {
    const { email, purpose = 'signup' } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Domain check
    const domain = process.env.COLLEGE_EMAIL_DOMAIN || 'cgc.edu.in';
    if (!email.endsWith(`@${domain}`)) {
      return res.status(400).json({
        message: `Only @${domain} email addresses are allowed`,
      });
    }

    if (purpose === 'signup') {
      // Check if user already exists in users table
      const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userRes.rows.length > 0) {
        return res.status(409).json({
          message: 'An account with this email already exists. Please log in.',
        });
      }

    } else if (purpose === 'login') {
      // For login, user must already have an account
      const userResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'No account found with this email' });
      }
    }

    await sendOTP(email, purpose);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('sendOTP error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
}

// ─── Step 2: Verify OTP ───────────────────────────────────────────────────────

async function verifyOTPController(req, res) {
  try {
    const { email, otp, purpose = 'signup' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    await verifyOTP(email, otp, purpose);

    if (purpose === 'login') {
      // Log the user in directly
      const userResult = await pool.query(
        'SELECT id, role, is_approved, display_name FROM users WHERE email = $1',
        [email]
      );
      const user = userResult.rows[0];

      const accessToken = issueAccessToken(user.id, user.role);
      const refreshToken = await issueRefreshToken(user.id);
      setRefreshCookie(res, refreshToken);

      return res.json({
        accessToken,
        user: {
          id: user.id,
          email,
          role: user.role,
          is_approved: user.is_approved,
          display_name: user.display_name,
        },
      });
    }

    // For signup: return a short-lived OTP-verified token
    // This proves the OTP step was passed, required for register endpoint
    const otpVerifiedToken = jwt.sign(
      { email, otpVerified: true },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({ otpVerifiedToken, message: 'OTP verified' });
  } catch (err) {
    console.error('verifyOTP error:', err);
    res.status(400).json({ message: err.message || 'OTP verification failed' });
  }
}

// ─── Step 3: Verify Roll Number ───────────────────────────────────────────────

async function verifyRollController(req, res) {
  try {
    const { email, rollNo, otpVerifiedToken } = req.body;

    if (!email || !rollNo || !otpVerifiedToken) {
      return res.status(400).json({ message: 'Email, roll number, and OTP token required' });
    }

    // Verify the OTP token is still valid
    let decoded;
    try {
      decoded = jwt.verify(otpVerifiedToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'OTP session expired. Please start again.' });
    }

    if (!decoded.otpVerified || decoded.email !== email) {
      return res.status(401).json({ message: 'Invalid OTP session' });
    }

    // Auto-approve the roll number regardless of pre-seeding
    // We will capture it here and let them proceed
    const result = await pool.query('SELECT * FROM students WHERE roll_no = $1', [rollNo]);
    
    if (result.rows.length > 0 && result.rows[0].is_registered) {
      return res.status(409).json({ message: 'This roll number is already registered' });
    }

    res.json({
      message: 'Roll number accepted',
      student: { name: 'Student', branch: 'TBD', year: 1, rollNo },
    });
  } catch (err) {
    console.error('verifyRoll error:', err);
    res.status(500).json({ message: 'Server error during roll verification' });
  }
}

// ─── Step 4: Register Account ─────────────────────────────────────────────────

async function registerController(req, res) {
  try {
    const { email, rollNo, password, displayName, otpVerifiedToken } = req.body;

    if (!email || !rollNo || !password || !otpVerifiedToken) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Verify the OTP token
    let decoded;
    try {
      decoded = jwt.verify(otpVerifiedToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Session expired. Please restart signup.' });
    }

    if (!decoded.otpVerified || decoded.email !== email) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user account inside a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let studentId;
      const studentRes = await client.query('SELECT id FROM students WHERE email = $1', [email]);
      
      if (studentRes.rows.length === 0) {
        const newStudent = await client.query(
          `INSERT INTO students (roll_no, name, email, branch, year, is_registered) 
           VALUES ($1, $2, $3, 'TBD', 1, TRUE) RETURNING id`,
          [rollNo, displayName, email]
        );
        studentId = newStudent.rows[0].id;
      } else {
        studentId = studentRes.rows[0].id;
        await client.query('UPDATE students SET is_registered = TRUE WHERE id = $1', [studentId]);
      }

      const userResult = await client.query(
        `INSERT INTO users (student_id, roll_no, email, password_hash, display_name, is_approved)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING id, role`,
        [studentId, rollNo, email, passwordHash, displayName]
      );

      await client.query('COMMIT');

      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, displayName).catch(console.error);

      res.status(201).json({
        message: 'Account created and automatically approved!',
        userId: userResult.rows[0].id,
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('register error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Account already exists' });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function loginController(req, res) {
  // Login is OTP-based — handled entirely in verifyOTPController with purpose='login'
  // This endpoint is just an alias to make the flow clearer from frontend
  req.body.purpose = 'login';
  return verifyOTPController(req, res);
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

async function refreshController(req, res) {
  try {
    const rawToken = req.cookies.refreshToken;

    if (!rawToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const result = await pool.query(
      `SELECT rt.*, u.role, u.is_approved, u.display_name, u.email
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.expires_at > NOW()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      res.clearCookie('refreshToken');
      return res.status(401).json({ message: 'Refresh token invalid or expired' });
    }

    const record = result.rows[0];
    const accessToken = issueAccessToken(record.user_id, record.role);

    res.json({
      accessToken,
      user: {
        id: record.user_id,
        email: record.email,
        role: record.role,
        is_approved: record.is_approved,
        display_name: record.display_name,
      },
    });
  } catch (err) {
    console.error('refresh error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

async function logoutController(req, res) {
  try {
    const rawToken = req.cookies.refreshToken;

    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    }

    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('logout error:', err);
    res.status(500).json({ message: 'Logout failed' });
  }
}

module.exports = {
  sendOTPController,
  verifyOTPController,
  verifyRollController,
  registerController,
  loginController,
  refreshController,
  logoutController,
};
