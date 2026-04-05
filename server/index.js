require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');

const authRoutes    = require('./routes/auth.routes');
const postRoutes    = require('./routes/post.routes');
const channelRoutes = require('./routes/channel.routes');
const adminRoutes   = require('./routes/admin.routes');
const userRoutes    = require('./routes/user.routes');
const jobRoutes     = require('./routes/job.routes');
const mentorshipRoutes = require('./routes/mentorship.routes');
const setupSocket   = require('./socket/socket');

const app = express();
const server = http.createServer(app); // wrap Express in Node HTTP server for Socket.io

// ─── Socket.io setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});
setupSocket(io);

// ─── Global middleware ────────────────────────────────────────────────────────
// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images to load
}));

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'https://chatterbox-six-mauve.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked for origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // required to read refresh token cookie



// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/posts',    postRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/jobs',       jobRoutes);
app.use('/api/mentorship', mentorshipRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler (must be after all routes)
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Cleanup job: delete expired OTPs and refresh tokens every 6 hours ───────
const pool = require('./config/db');
setInterval(async () => {
  try {
    const otpResult = await pool.query('DELETE FROM otp_store WHERE expires_at < NOW()');
    const tokenResult = await pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    console.log(`🧹 Cleanup: removed ${otpResult.rowCount} expired OTPs, ${tokenResult.rowCount} expired tokens`);
  } catch (err) {
    console.error('Cleanup job error:', err);
  }
}, 6 * 60 * 60 * 1000);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`\n🚀 Chatterbox server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Client URL:  ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});
