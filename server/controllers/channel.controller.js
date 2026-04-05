const pool = require('../config/db');

// ─── List all channels ────────────────────────────────────────────────────────

async function listChannelsController(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM channels ORDER BY id ASC'
    );
    res.json({ channels: result.rows });
  } catch (err) {
    console.error('listChannels error:', err);
    res.status(500).json({ message: 'Failed to fetch channels' });
  }
}

// ─── Get messages for a channel ───────────────────────────────────────────────

async function getMessagesController(req, res) {
  try {
    const { id } = req.params;
    const before = req.query.before; // for cursor-based pagination
    const limit = 50;

    let query;
    let params;

    if (before) {
      query = `
        SELECT m.id, m.content, m.created_at,
               u.id AS user_id, u.display_name, u.avatar_url, u.roll_no,
               s.branch, s.year
        FROM messages m
        JOIN users u ON u.id = m.user_id
        JOIN students s ON s.id = u.student_id
        WHERE m.channel_id = $1 AND m.id < $2
        ORDER BY m.id DESC
        LIMIT $3
      `;
      params = [id, before, limit];
    } else {
      query = `
        SELECT m.id, m.content, m.created_at,
               u.id AS user_id, u.display_name, u.avatar_url, u.roll_no,
               s.branch, s.year
        FROM messages m
        JOIN users u ON u.id = m.user_id
        JOIN students s ON s.id = u.student_id
        WHERE m.channel_id = $1
        ORDER BY m.id DESC
        LIMIT $2
      `;
      params = [id, limit];
    }

    const result = await pool.query(query, params);

    // Return in chronological order (oldest first for display)
    res.json({ messages: result.rows.reverse() });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
}

module.exports = { listChannelsController, getMessagesController };
