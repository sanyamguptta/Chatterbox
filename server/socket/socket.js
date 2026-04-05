const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const xss = require('xss');

/**
 * Socket.io handler for real-time channel messaging.
 * Called from index.js: setupSocket(io)
 */
function setupSocket(io) {
  // Authenticate socket connection via JWT in handshake
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return next(new Error('Invalid or expired token'));
      }

      // Fetch user from DB
      const result = await pool.query(
        'SELECT id, display_name, avatar_url, role, is_approved FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return next(new Error('User not found'));
      }

      const user = result.rows[0];

      if (!user.is_approved) {
        return next(new Error('Account pending approval'));
      }

      socket.user = user; // attach user to socket for event handlers
      next();
    } catch (err) {
      next(new Error('Socket auth failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: user ${socket.user.id} (${socket.user.display_name})`);

    // ── Join a channel room ───────────────────────────────────────────────────
    socket.on('join_channel', (channelId) => {
      // Leave any previous channel rooms first (user can only be in one channel at a time)
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      socket.join(`channel:${channelId}`);
      console.log(`User ${socket.user.id} joined channel ${channelId}`);
    });

    // ── Leave a channel room ──────────────────────────────────────────────────
    socket.on('leave_channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    // ── Send a message ────────────────────────────────────────────────────────
    socket.on('send_message', async ({ channelId, content }) => {
      try {
        if (!content || content.trim().length === 0) return;
        if (content.length > 1000) return;

        // Save message to DB
        const result = await pool.query(
          `INSERT INTO messages (channel_id, user_id, content)
           VALUES ($1, $2, $3)
           RETURNING id, content, created_at`,
          [channelId, socket.user.id, xss(content.trim())]
        );

        const message = {
          ...result.rows[0],
          user_id: socket.user.id,
          display_name: socket.user.display_name,
          avatar_url: socket.user.avatar_url,
          channel_id: channelId,
        };

        // Broadcast to everyone in the channel room (including sender)
        io.to(`channel:${channelId}`).emit('new_message', message);
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: user ${socket.user.id} — ${reason}`);
    });
  });
}

module.exports = setupSocket;
