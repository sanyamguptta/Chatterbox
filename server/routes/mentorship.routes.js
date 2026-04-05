const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { getAlumni, requestMentorship, getOwnRequests, updateRequestStatus } = require('../controllers/mentorship.controller');

router.use(authMiddleware);

router.get('/alumni', getAlumni);
router.post('/requests', requestMentorship);
router.get('/requests/me', getOwnRequests);
router.put('/requests/:requestId', updateRequestStatus);

module.exports = router;
