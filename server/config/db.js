// ============================================================
// AttendX - MySQL Connection Pool Configuration
// Uses mysql2/promise for async/await support
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'attendx',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  // Serverless: keep low connection limit; local dev uses more
  connectionLimit: process.env.NODE_ENV === 'production' ? 2 : 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  typeCast: true,
});

// Test connection on startup (only in non-serverless envs)
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL Database connection failed:', error.message);
    // Don't process.exit in serverless — just log
    if (process.env.NODE_ENV !== 'production') process.exit(1);
  }
};

module.exports = { pool, testConnection };

