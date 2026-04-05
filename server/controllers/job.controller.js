const pool = require('../config/db');

// Get all jobs
async function getJobs(req, res) {
  try {
    const result = await pool.query(
      `SELECT j.*, u.display_name as author_name, u.avatar_url as author_avatar
       FROM jobs j
       JOIN users u ON u.id = j.user_id
       ORDER BY j.created_at DESC`
    );
    res.json({ jobs: result.rows });
  } catch (error) {
    console.error('getJobs error:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
}

// Create a job
async function createJob(req, res) {
  try {
    const { title, company, type, location, description, apply_link } = req.body;
    
    if (!title || !company || !type) {
      return res.status(400).json({ message: 'Title, company, and type are required' });
    }

    const result = await pool.query(
      `INSERT INTO jobs (user_id, title, company, type, location, description, apply_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.userId, title, company, type, location, description, apply_link]
    );
    
    res.status(201).json({ job: result.rows[0] });
  } catch (error) {
    console.error('createJob error:', error);
    res.status(500).json({ message: 'Failed to create job' });
  }
}

// Delete a job (only original poster or admin)
async function deleteJob(req, res) {
  try {
    const { jobId } = req.params;
    
    const jobCheck = await pool.query('SELECT user_id FROM jobs WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Only author or admin can delete
    if (jobCheck.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await pool.query('DELETE FROM jobs WHERE id = $1', [jobId]);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('deleteJob error:', error);
    res.status(500).json({ message: 'Failed to delete job' });
  }
}

module.exports = {
  getJobs,
  createJob,
  deleteJob
};
