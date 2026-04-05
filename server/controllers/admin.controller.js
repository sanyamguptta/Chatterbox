const pool = require('../config/db');

// ─── Get pending users ────────────────────────────────────────────────────────

async function getPendingUsersController(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.roll_no, u.display_name, u.created_at,
              s.name, s.branch, s.year
       FROM users u
       JOIN students s ON s.id = u.student_id
       WHERE u.is_approved = FALSE AND u.role = 'student'
       ORDER BY u.created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('getPending error:', err);
    res.status(500).json({ message: 'Failed to fetch pending users' });
  }
}

// ─── Approve a user ───────────────────────────────────────────────────────────

async function approveUserController(req, res) {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `UPDATE users SET is_approved = TRUE WHERE id = $1 RETURNING id, email, display_name`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User approved', user: result.rows[0] });
  } catch (err) {
    console.error('approveUser error:', err);
    res.status(500).json({ message: 'Failed to approve user' });
  }
}

// ─── Reject and delete a user ─────────────────────────────────────────────────

async function rejectUserController(req, res) {
  try {
    const { userId } = req.params;

    // Also mark student as not registered so they can re-register if needed
    const userResult = await pool.query(
      'SELECT student_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const studentId = userResult.rows[0].student_id;

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.query(
      'UPDATE students SET is_registered = FALSE WHERE id = $1',
      [studentId]
    );

    res.json({ message: 'User rejected and account deleted' });
  } catch (err) {
    console.error('rejectUser error:', err);
    res.status(500).json({ message: 'Failed to reject user' });
  }
}

// ─── List all seeded students ─────────────────────────────────────────────────

async function listStudentsController(req, res) {
  try {
    const result = await pool.query(
      `SELECT s.*, u.id AS user_id, u.is_approved, u.role, u.created_at AS registered_at
       FROM students s
       LEFT JOIN users u ON u.student_id = s.id
       ORDER BY s.created_at DESC`
    );
    res.json({ students: result.rows });
  } catch (err) {
    console.error('listStudents error:', err);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
}

// ─── Update user role ─────────────────────────────────────────────────────────

async function updateRoleController(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['student', 'admin', 'alumni'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role`,
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `Role updated to ${role}`, user: result.rows[0] });
  } catch (err) {
    console.error('updateRole error:', err);
    res.status(500).json({ message: 'Failed to update role' });
  }
}

// ─── Manually Add Student / Alumni ──────────────────────────────────────────────

async function addStudentController(req, res) {
  try {
    const { name, email, roll_no, branch, year } = req.body;

    if (!name || !email || !roll_no || !branch || !year) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const check = await pool.query('SELECT * FROM students WHERE email = $1 OR roll_no = $2', [email, roll_no]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email or roll number already exists in master DB' });
    }

    const result = await pool.query(
      `INSERT INTO students (name, email, roll_no, branch, year)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, roll_no, branch, year]
    );

    res.status(201).json({ message: 'Added successfully', student: result.rows[0] });
  } catch (err) {
    console.error('addStudent error:', err);
    res.status(500).json({ message: 'Failed to add record' });
  }
}

module.exports = {
  getPendingUsersController,
  approveUserController,
  rejectUserController,
  listStudentsController,
  updateRoleController,
  addStudentController,
};
