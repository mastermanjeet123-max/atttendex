// ============================================================
// AttendX - Local Development Server Entry Point
// This file starts the Express server for local dev.
// For Vercel production, see /api/index.js
// ============================================================

const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 AttendX Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

start();
