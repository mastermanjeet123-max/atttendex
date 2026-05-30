// ============================================================
// AttendX - Auth Routes
// ============================================================

const express = require('express');
const router = express.Router();
const { login, register, getMe, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register); // For student self-registration

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.put('/update-password', updatePassword);

module.exports = router;
