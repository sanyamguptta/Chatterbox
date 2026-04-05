const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const {
  getFeedController,
  createPostController,
  getPostController,
  deletePostController,
  toggleLikeController,
  addCommentController,
} = require('../controllers/post.controller');

router.use(authMiddleware); // All post routes require auth

router.get('/',                    getFeedController);
router.post('/',   upload.single('image'), createPostController);
router.get('/:id',                 getPostController);
router.delete('/:id',              deletePostController);
router.post('/:id/like',           toggleLikeController);
router.post('/:id/comments',       addCommentController);

module.exports = router;
