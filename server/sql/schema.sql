-- ============================================================
-- Chatterbox Database Schema
-- Run: psql -U postgres -d chatterbox -f sql/schema.sql
-- ============================================================

-- Students master table (seeded by admin, verified real students)
CREATE TABLE IF NOT EXISTS students (
  id            SERIAL PRIMARY KEY,
  roll_no       VARCHAR(20) UNIQUE NOT NULL,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  branch        VARCHAR(50) NOT NULL,
  year          INTEGER NOT NULL,  -- 1, 2, 3, 4
  is_registered BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- User accounts (created after full verification)
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  student_id    INTEGER UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  roll_no       VARCHAR(20) UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100),
  bio           TEXT,
  avatar_url    VARCHAR(255),
  role          VARCHAR(20) DEFAULT 'student',  -- 'student' | 'admin'
  is_approved   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- OTP store
CREATE TABLE IF NOT EXISTS otp_store (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(100) NOT NULL,
  otp_code   VARCHAR(6) NOT NULL,
  purpose    VARCHAR(20) NOT NULL,  -- 'signup' | 'login'
  used       BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Refresh token store
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Posts (dev feed)
CREATE TABLE IF NOT EXISTS posts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  image_url   VARCHAR(255),
  tags        TEXT[],  -- e.g. ARRAY['react', 'project']
  like_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Post likes
CREATE TABLE IF NOT EXISTS post_likes (
  user_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  post_id  INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  post_id    INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Discussion channels
CREATE TABLE IF NOT EXISTS channels (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Channel messages
CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default channels (only if not already seeded)
INSERT INTO channels (name, description)
SELECT * FROM (VALUES
  ('general',    'Open discussion for everyone'),
  ('dsa',        'Data Structures & Algorithms'),
  ('webdev',     'Web development discussion'),
  ('projects',   'Show off what you are building'),
  ('placements', 'Internships, jobs, interview prep'),
  ('resources',  'Share useful links and tools')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM channels LIMIT 1);

-- Seed sample students for testing
INSERT INTO students (roll_no, name, email, branch, year)
SELECT * FROM (VALUES
  ('2320101', 'Aditya Raj',    'aditya@cgc.edu.in',                 'CSE', 2),
  ('2320102', 'Priya Sharma',  'priya@cgc.edu.in',                  'CSE', 2),
  ('2320103', 'Rahul Verma',   'rahul@cgc.edu.in',                  'ECE', 2),
  ('2220101', 'Neha Singh',    'neha@cgc.edu.in',                   'CSE', 3),
  ('2120101', 'Amit Kumar',    'amit@cgc.edu.in',                   'IT',  4),
  ('2320164', 'Sanyam Gupta',  '2320164.cse.coe@cgc.edu.in',        'CSE', 3)
) AS v(roll_no, name, email, branch, year)
WHERE NOT EXISTS (SELECT 1 FROM students LIMIT 1);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_user    ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_chan ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_otp_email     ON otp_store(email);
