const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../services/cloudinary.service');
const { updateProfileController, getProfileController, updateAvatarController } = require('../controllers/user.controller');

router.use(authMiddleware);

router.get('/profile',         getProfileController);
router.put('/profile',         updateProfileController);
router.post('/profile/avatar', uploadAvatar.single('avatar'), updateAvatarController);

module.exports = router;
