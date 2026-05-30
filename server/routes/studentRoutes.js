// ============================================================
// AttendX - Student Routes
// ============================================================

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

// All student routes are protected and restricted to 'student' role
router.use(protect, authorize('student'));

// Dashboard
router.get('/dashboard', studentController.getDashboardStats);

// Attendance
router.get('/attendance', studentController.getAttendanceOverview);
router.get('/attendance/:subject_id', studentController.getAttendanceDetails);

// Subjects with teacher info (for feedback form)
router.get('/subjects', studentController.getSubjectsWithTeachers);

// Timetable
router.get('/timetable', studentController.getTimetable);

// Grades
router.get('/grades', studentController.getGrades);

// Feedback
router.post('/feedback', studentController.submitFeedback);

// Notifications
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationRead);

module.exports = router;
