# Chatterbox

> A private developer community platform for college students.
> Built to help tier-3 college students connect, share projects, and grow together.

## What is Chatterbox

Chatterbox is a college-locked social platform for developers — a place where verified students of a single college can build in public, share what they're working on, and discuss tech without the noise of social media algorithms. Only verified students get in. No outsiders.

## Features

- 🔐 **College email + ID card verified signup** (no outsiders can register)
- 📰 **Developer post feed** with likes and comments
- 💬 **Real-time discussion channels** by topic (DSA, WebDev, Placements…)
- 🗺️ **Year-wise dev roadmaps** for 1st–4th year students
- 👤 **Student profiles** with editable bio
- 🛡️ **Admin approval system** for account moderation

## Tech Stack

| Layer      | Technology                                |
|------------|-------------------------------------------|
| Frontend   | React 18 + Vite + SCSS Modules            |
| Backend    | Node.js + Express.js                      |
| Database   | PostgreSQL (via node-postgres)             |
| Auth       | JWT (15min) + Refresh token (7d, httpOnly)|
| OTP Email  | Resend API                                |
| ID Scan    | html5-qrcode                              |
| Real-time  | Socket.io                                 |
| Upload     | Multer                                     |
| Password   | bcrypt (12 rounds)                        |
| Rate Limit | express-rate-limit                        |

## Project Structure

```
chatterbox/
├── client/                    # React frontend (Vite + SCSS)
│   └── src/
│       ├── api/               # Axios instance with interceptors
│       ├── components/
│       │   ├── auth/          # 4-step auth form components
│       │   ├── channels/      # Chat UI (ChannelList, ChatWindow, MessageBubble)
│       │   ├── feed/          # Post feed (PostCard, CreatePost)
│       │   ├── layout/        # Navbar, Sidebar, Layout wrapper
│       │   └── ui/            # Button, Input, Badge, Avatar
│       ├── context/           # AuthContext (global auth state)
│       ├── hooks/             # useAuth, useSocket
│       ├── pages/             # AuthPage, FeedPage, ChannelsPage, etc.
│       ├── styles/            # SCSS variables, mixins, global reset
│       └── utils/             # validators.js (email check, timeAgo, etc.)
│
└── server/                    # Express backend
    ├── config/db.js           # PostgreSQL connection pool
    ├── controllers/           # auth, post, channel, admin, user controllers
    ├── middleware/            # JWT auth, admin check, Multer upload
    ├── routes/                # Route definitions
    ├── services/              # OTP + email via Resend
    ├── socket/                # Socket.io event handlers
    └── sql/schema.sql         # Full DB schema + seed data
```

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL v14+
- A [Resend](https://resend.com) account (free tier) for OTP emails

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/yourname/chatterbox.git
cd chatterbox

# 2. Setup database
psql -U postgres -c "CREATE DATABASE chatterbox;"
psql -U postgres -d chatterbox -f server/sql/schema.sql

# 3. Setup server
cd server
npm install
cp .env.example .env
# Fill in .env with your DB URL, JWT secrets, Resend API key

# 4. Setup client
cd ../client
npm install
# .env is already committed with demo values, update VITE_COLLEGE_DOMAIN if needed

# 5. Run both servers
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev
```

### Make yourself admin (after first signup)

After creating your account through the normal flow:

```sql
UPDATE users SET role = 'admin', is_approved = true WHERE email = 'you@cgc.edu.in';
```

## Environment Variables

### `server/.env`

| Variable              | Description                              |
|-----------------------|------------------------------------------|
| `DATABASE_URL`        | PostgreSQL connection string             |
| `JWT_SECRET`          | Secret for access tokens (15min)        |
| `REFRESH_SECRET`      | Secret for refresh tokens (7 days)      |
| `RESEND_API_KEY`      | Resend API key for OTP emails           |
| `FROM_EMAIL`          | Sender email (must be verified in Resend)|
| `COLLEGE_EMAIL_DOMAIN`| e.g. `cgc.edu.in`                       |
| `COLLEGE_NAME`        | Display name of the college             |
| `PORT`                | Server port (default: 5000)             |
| `CLIENT_URL`          | Frontend URL for CORS (default: localhost:5173) |

### `client/.env`

| Variable               | Description                     |
|------------------------|---------------------------------|
| `VITE_COLLEGE_DOMAIN`  | College email domain            |
| `VITE_COLLEGE_NAME`    | College display name            |

## Authentication Flow

### Signup (4 steps, one-time)
1. **Email** → validates `@cgc.edu.in` domain, sends OTP via Resend
2. **OTP** → 6-digit code, 10-minute expiry, single-use
3. **ID Card scan** → barcode scan via camera (html5-qrcode) OR manual entry
4. **Password** → sets display name + password, creates account (pending approval)

Admin must approve the account before the user can access the platform.

### Login (returning users)
1. Enter email → OTP sent
2. Verify OTP → JWT access token (15min) + refresh token cookie (7 days)

### Token storage
- **Access token**: in React memory (`AuthContext`) — never localStorage
- **Refresh token**: httpOnly cookie — immune to XSS

## Database Schema

| Table            | Purpose                                              |
|------------------|------------------------------------------------------|
| `students`       | Admin-seeded master list of enrolled students        |
| `users`          | Accounts created after full verification             |
| `otp_store`      | OTP codes with expiry and used flag                  |
| `refresh_tokens` | Hashed refresh tokens                                |
| `posts`          | Developer feed posts with tags and like counts       |
| `post_likes`     | Many-to-many: users ↔ liked posts                   |
| `comments`       | Comments on posts                                    |
| `channels`       | Discussion rooms (DSA, WebDev, Placements…)          |
| `messages`       | Real-time channel messages                           |

## API Routes

```
POST  /api/auth/send-otp          → Send OTP email
POST  /api/auth/verify-otp        → Verify OTP, get token or login
POST  /api/auth/verify-roll       → Verify roll number vs student DB
POST  /api/auth/register          → Create account
POST  /api/auth/refresh           → Refresh access token via cookie
POST  /api/auth/logout            → Clear refresh token

GET   /api/posts                  → Paginated feed
POST  /api/posts                  → Create post
GET   /api/posts/:id              → Single post + comments
DELETE /api/posts/:id             → Delete own post
POST  /api/posts/:id/like         → Toggle like
POST  /api/posts/:id/comments     → Add comment

GET   /api/channels               → List channels
GET   /api/channels/:id/messages  → Last 50 messages

GET   /api/users/profile          → Own profile
PUT   /api/users/profile          → Update profile

GET   /api/admin/pending          → List unapproved users
POST  /api/admin/approve/:userId  → Approve user
POST  /api/admin/reject/:userId   → Reject and delete user
GET   /api/admin/students         → All seeded students
```

## Development Workflow

### Adding a new feature
1. Add/modify tables in `server/sql/schema.sql`
2. Write controller in `server/controllers/`
3. Add route in `server/routes/`
4. Build React component in `client/src/components/`
5. Connect via Axios in the page component

### Running in production
```bash
cd client && npm run build   # builds to client/dist/
# Serve client/dist/ with nginx or a static host
# Run server with: NODE_ENV=production node index.js
```

## Roadmap

- [ ] Phase 2: Study resources + semester notes section
- [ ] Phase 2: AI dev assistant chatbot (Gemini integration)
- [ ] Phase 3: Alumni mentor system
- [ ] Phase 3: Internship/job board
- [ ] Phase 4: Multi-college expansion

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Write clean, commented code
4. Test your changes
5. Open a pull request

## License

MIT

## Author

Built out of personal frustration as a tier-3 BTech student.
This is the platform I wish had existed when I started.
