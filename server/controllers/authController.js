// ============================================================
// AttendX - Auth Controller
// Handles login (unified across all 3 roles), register, getMe
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Generate JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user (checks admins, teachers, students tables)
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Check all three tables in order: admin -> teacher -> student
    const tables = [
      { table: 'admins', role: 'admin' },
      { table: 'teachers', role: 'teacher' },
      { table: 'students', role: 'student' },
    ];

    let user = null;
    let userRole = null;

    for (const { table, role } of tables) {
      let queryStr = `SELECT * FROM ${table} WHERE email = ?`;
      let queryParams = [email];

      if (role === 'student') {
        queryStr = `SELECT * FROM ${table} WHERE email = ? OR roll_number = ?`;
        queryParams = [email, email];
      }

      const [rows] = await pool.query(queryStr, queryParams);
      if (rows.length > 0) {
        user = rows[0];
        userRole = role;
        break;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if account is active (teachers and students have is_active flag)
    if (user.is_active !== undefined && !user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate token
    const token = generateToken(user.id, userRole);

    // Build response (exclude password)
    const { password: _, ...userData } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: { ...userData, role: userRole },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student (admin can also register teachers via admin routes)
 * @access  Public (for student self-registration)
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, roll_number, phone, course_id, semester, section, admission_year } = req.body;

    // Validate required fields
    if (!name || !email || !password || !roll_number || !course_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, roll_number, and course_id.',
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Check if email already exists across all tables
    for (const table of ['admins', 'teachers', 'students']) {
      const [existing] = await pool.query(
        `SELECT id FROM ${table} WHERE email = ?`,
        [email]
      );
      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }
    }

    // Check if roll number exists
    const [existingRoll] = await pool.query(
      'SELECT id FROM students WHERE roll_number = ?',
      [roll_number]
    );
    if (existingRoll.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A student with this roll number already exists.',
      });
    }

    // Verify course exists
    const [course] = await pool.query('SELECT id FROM courses WHERE id = ? AND is_active = 1', [course_id]);
    if (course.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course selected.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert student
    const [result] = await pool.query(
      `INSERT INTO students (name, email, password, roll_number, phone, course_id, semester, section, admission_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, roll_number, phone || null, course_id, semester || 1, section || 'A', admission_year || new Date().getFullYear()]
    );

    // Generate token
    const token = generateToken(result.insertId, 'student');

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: {
          id: result.insertId,
          name,
          email,
          roll_number,
          course_id,
          semester: semester || 1,
          section: section || 'A',
          role: 'student',
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user's profile
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const { id, role } = req.user;

    const tableMap = {
      admin: 'admins',
      teacher: 'teachers',
      student: 'students',
    };

    const table = tableMap[role];

    const [rows] = await pool.query(
      `SELECT * FROM ${table} WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Exclude password from response
    const { password, ...userData } = rows[0];

    // If student, also fetch course info
    let courseInfo = null;
    if (role === 'student') {
      const [courseRows] = await pool.query(
        'SELECT id, name, code FROM courses WHERE id = ?',
        [userData.course_id]
      );
      if (courseRows.length > 0) {
        courseInfo = courseRows[0];
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...userData,
        role,
        ...(courseInfo && { course: courseInfo }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/update-password
 * @desc    Update current user's password
 * @access  Private
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id, role } = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const tableMap = { admin: 'admins', teacher: 'teachers', student: 'students' };
    const table = tableMap[role];

    // Get current password hash
    const [rows] = await pool.query(`SELECT password FROM ${table} WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [hashedPassword, id]);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, getMe, updatePassword };
