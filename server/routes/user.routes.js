const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { updateProfileController, getProfileController } = require('../controllers/user.controller');

router.use(authMiddleware);

router.get('/profile',  getProfileController);
router.put('/profile',  updateProfileController);

module.exports = router;
