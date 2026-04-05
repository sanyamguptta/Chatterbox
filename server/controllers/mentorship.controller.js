const pool = require('../config/db');

// List all alumni
async function getAlumni(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.display_name, u.bio, u.avatar_url, s.branch
       FROM users u
       JOIN students s ON u.student_id = s.id
       WHERE u.role = 'alumni' AND u.is_approved = true`
    );
    res.json({ alumni: result.rows });
  } catch (err) {
    console.error('getAlumni error:', err);
    res.status(500).json({ message: 'Failed to fetch alumni' });
  }
}

// Request mentorship
async function requestMentorship(req, res) {
  try {
    const { alumniId, message } = req.body;
    
    // check if already requested
    const check = await pool.query(
      'SELECT id FROM mentorship_requests WHERE student_id = $1 AND alumni_id = $2',
      [req.user.userId, alumniId]
    );
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Request already sent to this alumni' });
    }

    const result = await pool.query(
      `INSERT INTO mentorship_requests (student_id, alumni_id, message) 
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.userId, alumniId, message]
    );
    res.status(201).json({ request: result.rows[0], message: 'Mentorship request sent!' });
  } catch (err) {
    console.error('requestMentorship error:', err);
    res.status(500).json({ message: 'Failed to send request' });
  }
}

// Get received and sent requests for the current user
async function getOwnRequests(req, res) {
  try {
    const userId = req.user.userId;

    const sent = await pool.query(
      `SELECT r.*, u.display_name as alumni_name, u.avatar_url as alumni_avatar 
       FROM mentorship_requests r
       JOIN users u ON u.id = r.alumni_id
       WHERE r.student_id = $1`,
      [userId]
    );

    const received = await pool.query(
      `SELECT r.*, u.display_name as student_name, u.avatar_url as student_avatar 
       FROM mentorship_requests r
       JOIN users u ON u.id = r.student_id
       WHERE r.alumni_id = $1`,
      [userId]
    );

    res.json({ sent: sent.rows, received: received.rows });
  } catch (err) {
    console.error('getOwnRequests error:', err);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
}

// Accept or reject mentorship
async function updateRequestStatus(req, res) {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE mentorship_requests SET status = $1 
       WHERE id = $2 AND alumni_id = $3 RETURNING *`,
      [status, requestId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found or you are not authorized' });
    }

    res.json({ request: result.rows[0], message: `Request ${status}` });
  } catch (err) {
    console.error('updateRequestStatus error:', err);
    res.status(500).json({ message: 'Failed to update request' });
  }
}

module.exports = {
  getAlumni,
  requestMentorship,
  getOwnRequests,
  updateRequestStatus
};
