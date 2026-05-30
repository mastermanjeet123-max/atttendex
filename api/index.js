// ============================================================
// AttendX - Vercel Serverless Entry Point
// Vercel calls this file for all /api/* requests.
// It re-uses the Express app from server/app.js
// ============================================================

const app = require('../server/app');

module.exports = app;
