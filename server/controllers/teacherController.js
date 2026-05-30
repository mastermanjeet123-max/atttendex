// ============================================================
// AttendX - Teacher Controller
// Operations: dashboard stats, assigned subjects, mark attendance,
// grades, notifications, reports
// ============================================================

const { pool } = require('../config/db');

// ======================== DASHBOARD ========================
const getDashboardStats = async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    // Total assigned subjects
    const [[{ totalSubjects }]] = await pool.query(
      'SELECT COUNT(*) as totalSubjects FROM subject_assignments WHERE teacher_id = ? AND is_active = 1',
      [teacherId]
    );

    // Total classes taken by teacher today
    const [[{ classesToday }]] = await pool.query(
      'SELECT COUNT(DISTINCT subject_id, slot_time) as classesToday FROM attendance WHERE teacher_id = ? AND date = CURDATE()',
      [teacherId]
    );

    // Get unread notifications
    const [[{ unreadNotifications }]] = await pool.query(
      "SELECT COUNT(*) as unreadNotifications FROM notifications WHERE recipient_type = 'teacher' AND recipient_id = ? AND is_read = 0",
      [teacherId]
    );

    // Get list of assigned subjects with basic details
    const [assignedSubjects] = await pool.query(`
      SELECT sa.id as assignment_id, sub.id as subject_id, sub.name, sub.code, c.name as course_name, sa.semester, sa.section
      FROM subject_assignments sa
      JOIN subjects sub ON sa.subject_id = sub.id
      JOIN courses c ON sa.course_id = c.id
      WHERE sa.teacher_id = ? AND sa.is_active = 1
    `, [teacherId]);

    res.status(200).json({
      success: true,
      data: {
        totalSubjects,
        classesToday,
        unreadNotifications,
        assignedSubjects,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================== SUBJECTS ========================
const getAssignedSubjects = async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    const [subjects] = await pool.query(`
      SELECT sa.id as assignment_id, sub.id as subject_id, sub.name, sub.code, 
             c.name as course_name, c.id as course_id, sa.semester, sa.section, sa.academic_year
      FROM subject_assignments sa
      JOIN subjects sub ON sa.subject_id = sub.id
      JOIN courses c ON sa.course_id = c.id
      WHERE sa.teacher_id = ? AND sa.is_active = 1
      ORDER BY c.name, sa.semester, sub.name
    `, [teacherId]);

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentsBySubject = async (req, res, next) => {
  try {
    const { subject_id, course_id, semester, section } = req.query;
    
    if (!subject_id || !course_id || !semester) {
      return res.status(400).json({ success: false, message: 'subject_id, course_id, and semester are required.' });
    }

    let query = `
      SELECT s.id, s.name, s.roll_number, s.email,
             COALESCE((
               SELECT COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)
               FROM attendance a
               WHERE a.student_id = s.id AND a.subject_id = ?
             ), 0) as attended_classes,
             COALESCE((
               SELECT COUNT(*)
               FROM attendance a
               WHERE a.student_id = s.id AND a.subject_id = ?
             ), 0) as total_classes
      FROM students s
      WHERE s.course_id = ? AND s.semester = ? AND s.is_active = 1
    `;
    const params = [Number(subject_id), Number(subject_id), Number(course_id), Number(semester)];

    if (section) {
      query += ' AND s.section = ?';
      params.push(section);
    }
    
    query += ' ORDER BY s.roll_number';

    const [students] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// ======================== ATTENDANCE ========================
const markAttendance = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    // attendanceData is an array of { student_id, status, remarks }
    const { subject_id, date, slot_time, attendanceData } = req.body;

    if (!subject_id || !date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ success: false, message: 'subject_id, date, and attendanceData array are required.' });
    }

    // Begin transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if attendance already marked for this subject, date, slot
      const [existing] = await connection.query(
        'SELECT id FROM attendance WHERE subject_id = ? AND date = ? AND slot_time <=> ? LIMIT 1',
        [subject_id, date, slot_time || null]
      );
      
      if (existing.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: 'Attendance already marked for this date and slot.' });
      }

      // Insert attendance records
      const values = attendanceData.map(record => [
        record.student_id,
        subject_id,
        teacherId,
        date,
        record.status || 'present',
        slot_time || null,
        record.remarks || null
      ]);

      if (values.length > 0) {
        await connection.query(
          'INSERT INTO attendance (student_id, subject_id, teacher_id, date, status, slot_time, remarks) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      connection.release();

      res.status(201).json({ success: true, message: 'Attendance marked successfully.' });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params; // attendance record id
    const { status, remarks } = req.body;
    const teacherId = req.user.id;

    const [existing] = await pool.query('SELECT * FROM attendance WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    // Optional: Check if the current teacher is authorized to edit this record
    // Usually, either admin or the teacher who marked it can edit.
    if (existing[0].teacher_id !== teacherId) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this record.' });
    }

    await pool.query(
      'UPDATE attendance SET status = ?, remarks = ? WHERE id = ?',
      [status || existing[0].status, remarks !== undefined ? remarks : existing[0].remarks, id]
    );

    res.status(200).json({ success: true, message: 'Attendance updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// ======================== GRADES ========================
const getGradesBySubject = async (req, res, next) => {
  try {
    const { subject_id, exam_type } = req.query;
    if (!subject_id) {
      return res.status(400).json({ success: false, message: 'subject_id is required.' });
    }

    let query = `
      SELECT g.*, s.name as student_name, s.roll_number
      FROM grades g
      JOIN students s ON g.student_id = s.id
      WHERE g.subject_id = ?
    `;
    const params = [subject_id];

    if (exam_type) {
      query += ' AND g.exam_type = ?';
      params.push(exam_type);
    }
    
    query += ' ORDER BY s.roll_number';

    const [grades] = await pool.query(query, params);

    res.status(200).json({ success: true, count: grades.length, data: grades });
  } catch (error) {
    next(error);
  }
};

const addOrUpdateGrade = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const { student_id, subject_id, exam_type, marks_obtained, total_marks, grade_letter, remarks } = req.body;

    if (!student_id || !subject_id || !exam_type || marks_obtained === undefined) {
      return res.status(400).json({ success: false, message: 'student_id, subject_id, exam_type, and marks_obtained are required.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM grades WHERE student_id = ? AND subject_id = ? AND exam_type = ?',
      [student_id, subject_id, exam_type]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE grades SET marks_obtained = ?, total_marks = ?, grade_letter = ?, remarks = ?, graded_by = ? WHERE id = ?',
        [marks_obtained, total_marks || 100, grade_letter || null, remarks || null, teacherId, existing[0].id]
      );
      res.status(200).json({ success: true, message: 'Grade updated successfully.' });
    } else {
      await pool.query(
        'INSERT INTO grades (student_id, subject_id, exam_type, marks_obtained, total_marks, grade_letter, remarks, graded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [student_id, subject_id, exam_type, marks_obtained, total_marks || 100, grade_letter || null, remarks || null, teacherId]
      );
      res.status(201).json({ success: true, message: 'Grade added successfully.' });
    }
  } catch (error) {
    next(error);
  }
};

// ======================== NOTIFICATIONS ========================
const getNotifications = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const [notifications] = await pool.query(
      "SELECT * FROM notifications WHERE recipient_type = 'teacher' AND recipient_id = ? ORDER BY created_at DESC LIMIT 50",
      [teacherId]
    );
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;
    
    await pool.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_type = 'teacher' AND recipient_id = ?",
      [id, teacherId]
    );
    
    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAssignedSubjects,
  getStudentsBySubject,
  markAttendance,
  updateAttendance,
  getGradesBySubject,
  addOrUpdateGrade,
  getNotifications,
  markNotificationRead
};
