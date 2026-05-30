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
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Return rows as plain objects instead of RowDataPacket
  typeCast: true,
});

// Test connection on startup
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
