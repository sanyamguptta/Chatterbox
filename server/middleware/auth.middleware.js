const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Verifies the JWT access token from the Authorization header.
 * Also checks that the user is approved by admin.
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT signature + expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Fetch user from DB to check is_approved (token could be stale)
    const result = await pool.query(
      'SELECT id, email, role, is_approved, display_name, avatar_url FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Admin approval gate — unapproved users cannot access protected routes
    if (!user.is_approved) {
      return res.status(403).json({
        message: 'Your account is pending approval. You will be notified once approved.',
        code: 'PENDING_APPROVAL',
      });
    }

    req.user = user; // attach user to request for downstream handlers
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = authMiddleware;
