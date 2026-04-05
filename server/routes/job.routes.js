const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { getJobs, createJob, deleteJob } = require('../controllers/job.controller');

// Require authentication for all job routes
router.use(authMiddleware);

router.get('/', getJobs);
router.post('/', createJob);
router.delete('/:jobId', deleteJob);

module.exports = router;
