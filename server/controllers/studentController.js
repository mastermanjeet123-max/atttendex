// ============================================================
// AttendX - Student Controller
// Operations: dashboard stats, attendance overview, prediction, 
// timetable, grades, feedback, notifications
// ============================================================

const { pool } = require('../config/db');
const { calculatePercentage, getAttendancePrediction } = require('../utils/attendanceCalc');

// ======================== DASHBOARD ========================
const getDashboardStats = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Get basic stats: overall attendance
    const [[totalAttendance]] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END) as attended,
        COUNT(*) as total
      FROM attendance
      WHERE student_id = ?
    `, [studentId]);

    const overallPercentage = calculatePercentage(totalAttendance.attended, totalAttendance.total);

    // Get unread notifications
    const [[{ unreadNotifications }]] = await pool.query(
      "SELECT COUNT(*) as unreadNotifications FROM notifications WHERE recipient_type = 'student' AND recipient_id = ? AND is_read = 0",
      [studentId]
    );

    // Get recent classes (last 5)
    const [recentClasses] = await pool.query(`
      SELECT a.date, a.status, sub.name as subject_name
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.student_id = ?
      ORDER BY a.date DESC, a.marked_at DESC
      LIMIT 5
    `, [studentId]);

    res.status(200).json({
      success: true,
      data: {
        overallPercentage,
        attendedClasses: totalAttendance.attended,
        totalClasses: totalAttendance.total,
        unreadNotifications,
        recentClasses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================== ATTENDANCE ========================
const getAttendanceOverview = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Get attendance per subject
    const [subjectStats] = await pool.query(`
      SELECT sub.id as subject_id, sub.name as subject_name, sub.code as subject_code,
             COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) as classes_attended,
             COUNT(*) as total_classes
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.student_id = ?
      GROUP BY sub.id
    `, [studentId]);

    const enrichedStats = subjectStats.map(stat => ({
      ...stat,
      ...getAttendancePrediction(stat.classes_attended, stat.total_classes, stat.subject_name)
    }));

    res.status(200).json({
      success: true,
      data: enrichedStats,
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceDetails = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { subject_id } = req.params;

    const [details] = await pool.query(`
      SELECT date, status, slot_time, remarks
      FROM attendance
      WHERE student_id = ? AND subject_id = ?
      ORDER BY date DESC
    `, [studentId, subject_id]);

    res.status(200).json({
      success: true,
      count: details.length,
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

// ======================== TIMETABLE ========================
const getTimetable = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Get student course, semester, section
    const [[student]] = await pool.query(
      'SELECT course_id, semester, section FROM students WHERE id = ?',
      [studentId]
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const [slots] = await pool.query(`
      SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.slot_type,
             sub.name as subject_name, sub.code as subject_code,
             t.name as teacher_name
      FROM timetable_slots ts
      JOIN subject_assignments sa ON ts.subject_assignment_id = sa.id
      JOIN subjects sub ON sa.subject_id = sub.id
      JOIN teachers t ON sa.teacher_id = t.id
      WHERE sa.course_id = ? AND sa.semester = ? AND sa.section = ? AND ts.is_active = 1
      ORDER BY FIELD(ts.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), ts.start_time
    `, [student.course_id, student.semester, student.section]);

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

// ======================== GRADES ========================
const getGrades = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { semester } = req.query;

    let query = `
      SELECT g.id, g.exam_type, g.marks_obtained, g.total_marks, g.grade_letter, g.remarks, g.created_at,
             sub.name as subject_name, sub.code as subject_code, sub.semester
      FROM grades g
      JOIN subjects sub ON g.subject_id = sub.id
      WHERE g.student_id = ?
    `;
    const params = [studentId];

    if (semester) {
      query += ' AND sub.semester = ?';
      params.push(semester);
    }

    query += ' ORDER BY sub.semester DESC, sub.name, g.created_at DESC';

    const [grades] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: grades.length,
      data: grades,
    });
  } catch (error) {
    next(error);
  }
};

// ======================== FEEDBACK ========================
const submitFeedback = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { subject_id, teacher_id, rating, comment, is_anonymous, academic_year } = req.body;

    if (!subject_id || !teacher_id || !rating || !academic_year) {
      return res.status(400).json({ success: false, message: 'subject_id, teacher_id, rating, and academic_year are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM feedback WHERE student_id = ? AND subject_id = ? AND teacher_id = ? AND academic_year = ?',
      [studentId, subject_id, teacher_id, academic_year]
    );

    if (existing.length > 0) {
      // Update feedback
      await pool.query(
        'UPDATE feedback SET rating = ?, comment = ?, is_anonymous = ? WHERE id = ?',
        [rating, comment || null, is_anonymous ? 1 : 0, existing[0].id]
      );
      return res.status(200).json({ success: true, message: 'Feedback updated successfully.' });
    }

    // Insert new feedback
    await pool.query(
      'INSERT INTO feedback (student_id, subject_id, teacher_id, rating, comment, is_anonymous, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [studentId, subject_id, teacher_id, rating, comment || null, is_anonymous ? 1 : 0, academic_year]
    );

    res.status(201).json({ success: true, message: 'Feedback submitted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ======================== NOTIFICATIONS ========================
const getNotifications = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const [notifications] = await pool.query(
      "SELECT * FROM notifications WHERE recipient_type = 'student' AND recipient_id = ? ORDER BY created_at DESC LIMIT 50",
      [studentId]
    );
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    
    await pool.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_type = 'student' AND recipient_id = ?",
      [id, studentId]
    );
    
    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAttendanceOverview,
  getAttendanceDetails,
  getTimetable,
  getGrades,
  submitFeedback,
  getNotifications,
  markNotificationRead
};
