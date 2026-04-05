const pool = require('../config/db');

// ─── Get paginated feed ───────────────────────────────────────────────────────

async function getFeedController(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT
         p.id,
         p.content,
         p.image_url,
         p.tags,
         p.like_count,
         p.created_at,
         u.id          AS user_id,
         u.display_name,
         u.avatar_url,
         u.roll_no,
         s.branch,
         s.year,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
         (SELECT EXISTS(
           SELECT 1 FROM post_likes pl
           WHERE pl.post_id = p.id AND pl.user_id = $3
         )) AS is_liked
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN students s ON s.id = u.student_id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, req.user.id]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM posts');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      posts: result.rows,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + limit < total,
    });
  } catch (err) {
    console.error('getFeed error:', err);
    res.status(500).json({ message: 'Failed to fetch feed' });
  }
}

// ─── Create a post ────────────────────────────────────────────────────────────

async function createPostController(req, res) {
  try {
    const { content, tags } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ message: 'Post too long (max 2000 characters)' });
    }

    // Parse tags — accept comma-separated string or array
    let tagsArray = [];
    if (tags) {
      if (Array.isArray(tags)) {
        tagsArray = tags.map(t => t.trim().toLowerCase()).filter(Boolean);
      } else {
        tagsArray = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      }
    }

    const result = await pool.query(
      `INSERT INTO posts (user_id, content, image_url, tags)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, image_url, tags, like_count, created_at`,
      [req.user.id, content.trim(), imageUrl, tagsArray]
    );

    res.status(201).json({ post: result.rows[0] });
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ message: 'Failed to create post' });
  }
}

// ─── Get single post with comments ───────────────────────────────────────────

async function getPostController(req, res) {
  try {
    const { id } = req.params;

    const postResult = await pool.query(
      `SELECT
         p.*,
         u.display_name, u.avatar_url, u.roll_no,
         s.branch, s.year,
         (SELECT EXISTS(
           SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $2
         )) AS is_liked
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN students s ON s.id = u.student_id
       WHERE p.id = $1`,
      [id, req.user.id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const commentsResult = await pool.query(
      `SELECT c.*, u.display_name, u.avatar_url, u.roll_no
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.json({
      post: postResult.rows[0],
      comments: commentsResult.rows,
    });
  } catch (err) {
    console.error('getPost error:', err);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
}

// ─── Delete a post ────────────────────────────────────────────────────────────

async function deletePostController(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found or not yours to delete' });
    }

    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('deletePost error:', err);
    res.status(500).json({ message: 'Failed to delete post' });
  }
}

// ─── Toggle like ──────────────────────────────────────────────────────────────

async function toggleLikeController(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if already liked
    const existing = await pool.query(
      'SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2',
      [userId, id]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2',
        [userId, id]
      );
      await pool.query(
        'UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
        [id]
      );
      return res.json({ liked: false });
    } else {
      // Like
      await pool.query(
        'INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)',
        [userId, id]
      );
      await pool.query(
        'UPDATE posts SET like_count = like_count + 1 WHERE id = $1',
        [id]
      );
      return res.json({ liked: true });
    }
  } catch (err) {
    console.error('toggleLike error:', err);
    res.status(500).json({ message: 'Failed to toggle like' });
  }
}

// ─── Add comment ──────────────────────────────────────────────────────────────

async function addCommentController(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    // Check post exists
    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at`,
      [id, req.user.id, content.trim()]
    );

    res.status(201).json({
      comment: {
        ...result.rows[0],
        display_name: req.user.display_name,
        avatar_url: req.user.avatar_url,
      },
    });
  } catch (err) {
    console.error('addComment error:', err);
    res.status(500).json({ message: 'Failed to add comment' });
  }
}

module.exports = {
  getFeedController,
  createPostController,
  getPostController,
  deletePostController,
  toggleLikeController,
  addCommentController,
};
