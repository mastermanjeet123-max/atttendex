// ============================================================
// AttendX - Main Express Server Entry Point
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Database connection check
const { pool } = require('./config/db');

// Import middlewares
const errorHandler = require('./middleware/errorHandler');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');

// Initialize Express App
const app = express();

// ======================== MIDDLEWARE ========================
// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static files (like avatars if any)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======================== ROUTES ========================
// API Health Check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', message: 'AttendX API is running. Database connected.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'API is running but Database connection failed.' });
  }
});

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// Catch 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// ======================== ERROR HANDLING ========================
app.use(errorHandler);

// ======================== SERVER START ========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AttendX Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
