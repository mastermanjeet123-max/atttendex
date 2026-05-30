// ============================================================
// AttendX - Authentication & Authorization Middleware
// JWT verification + role-based access control
// ============================================================

const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Middleware: Verify JWT token from Authorization header
 * Attaches decoded user info to req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from "Bearer <token>" header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Determine which table to query based on role
    const tableMap = {
      admin: 'admins',
      teacher: 'teachers',
      student: 'students',
    };

    const table = tableMap[decoded.role];
    if (!table) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Unknown role.',
      });
    }

    // Fetch user from database to ensure they still exist
    const [rows] = await pool.query(
      `SELECT id, name, email FROM ${table} WHERE id = ?`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: rows[0].name,
      email: rows[0].email,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }
    next(error);
  }
};

/**
 * Middleware factory: Restrict access to specific roles
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'teacher', 'student')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user?.role}' is not authorized.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
