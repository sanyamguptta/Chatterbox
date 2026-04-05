const pool = require('../config/db');

// ── Update profile ────────────────────────────────────────────────────────────

async function updateProfileController(req, res) {
  try {
    const { display_name, bio } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE users SET display_name = $1, bio = $2 WHERE id = $3
       RETURNING id, display_name, bio, avatar_url, role, is_approved`,
      [display_name?.trim() || req.user.display_name, bio?.trim() || '', userId]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
}

// ── Get own profile ───────────────────────────────────────────────────────────

async function getProfileController(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.roll_no, u.display_name, u.bio, u.avatar_url, u.role, u.is_approved, u.created_at,
              s.branch, s.year
       FROM users u
       JOIN students s ON s.id = u.student_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
}

async function updateAvatarController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const imageUrl = req.file.path;
    const userId = req.user.id;

    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING avatar_url',
      [imageUrl, userId]
    );

    res.json({ avatar_url: result.rows[0].avatar_url });
  } catch (err) {
    console.error('updateAvatar error:', err);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
}

module.exports = { updateProfileController, getProfileController, updateAvatarController };
