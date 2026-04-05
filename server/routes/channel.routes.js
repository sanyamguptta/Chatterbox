const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { listChannelsController, getMessagesController } = require('../controllers/channel.controller');

router.use(authMiddleware);

router.get('/',               listChannelsController);
router.get('/:id/messages',   getMessagesController);

module.exports = router;
