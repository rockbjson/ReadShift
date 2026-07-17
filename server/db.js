const { Pool } = require('pg');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'loaded' : 'NOT FOUND');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to ReadShift database');
    release();
  }
});

pool.on('error', (err) => {
  console.error('Database error:', err.message);
});

module.exports = pool;