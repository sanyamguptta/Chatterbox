const { Pool } = require('pg');
require('dotenv').config();

// Connection pool — reuses connections, much more efficient than single client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                  // max 10 concurrent connections
  idleTimeoutMillis: 30000, // close idle connections after 30s
  connectionTimeoutMillis: 2000, // error if can't connect in 2s
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ PostgreSQL connected');
  release();
});

module.exports = pool;
