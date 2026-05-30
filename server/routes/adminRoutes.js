// ============================================================
// AttendX - Admin Routes
// ============================================================

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All admin routes are protected and restricted to 'admin' role
router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);
router.get('/dashboard/stats', adminController.getDashboardStats);

// Courses
router.route('/courses')
  .get(adminController.getCourses)
  .post(adminController.createCourse);
router.route('/courses/:id')
  .put(adminController.updateCourse)
  .delete(adminController.deleteCourse);

// Subjects
router.route('/subjects')
  .get(adminController.getSubjects)
  .post(adminController.createSubject);
router.route('/subjects/:id')
  .put(adminController.updateSubject)
  .delete(adminController.deleteSubject);

// Teachers
router.route('/teachers')
  .get(adminController.getTeachers)
  .post(adminController.createTeacher);
router.route('/teachers/:id')
  .get(adminController.getTeacher)
  .put(adminController.updateTeacher)
  .delete(adminController.deleteTeacher);
router.put('/teachers/:id/subjects', adminController.assignSubjects);

// Students
router.route('/students')
  .get(adminController.getStudents)
  .post(adminController.createStudent);
router.route('/students/:id')
  .get(adminController.getStudent)
  .put(adminController.updateStudent)
  .delete(adminController.deleteStudent);

// Subject Assignments
router.route('/assignments')
  .get(adminController.getAssignments)
  .post(adminController.createAssignment);
router.delete('/assignments/:id', adminController.deleteAssignment);

// Timetable
router.route('/timetable')
  .get(adminController.getTimetable)
  .post(adminController.createTimetableSlot);
router.route('/timetable/:id')
  .put(adminController.updateTimetableSlot)
  .delete(adminController.deleteTimetableSlot);

// Reports
router.get('/reports/attendance', adminController.getAttendanceReport);
router.get('/reports/low-attendance', adminController.getLowAttendanceReport);

// Feedback
router.get('/feedback', adminController.getFeedback);

// Notifications
router.route('/notifications')
  .get(adminController.getNotifications)
  .post(adminController.sendNotification);
router.put('/notifications/:id/read', adminController.markNotificationRead);

module.exports = router;
