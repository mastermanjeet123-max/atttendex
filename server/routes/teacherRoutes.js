// ============================================================
// AttendX - Teacher Routes
// ============================================================

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');

// All teacher routes are protected and restricted to 'teacher' role
router.use(protect, authorize('teacher'));

// Dashboard
router.get('/dashboard', teacherController.getDashboardStats);

// Subjects & Students
router.get('/subjects', teacherController.getAssignedSubjects);
router.get('/students', teacherController.getStudentsBySubject);

// Attendance
router.post('/attendance', teacherController.markAttendance);
router.put('/attendance/:id', teacherController.updateAttendance);

// Grades
router.route('/grades')
  .get(teacherController.getGradesBySubject)
  .post(teacherController.addOrUpdateGrade);

// Notifications
router.get('/notifications', teacherController.getNotifications);
router.put('/notifications/:id/read', teacherController.markNotificationRead);

module.exports = router;
