// ============================================================
// AttendX - Admin Controller
// Full CRUD for courses, subjects, teachers, students,
// timetable, reports, feedback, dashboard stats
// ============================================================

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { calculatePercentage, getAttendancePrediction } = require('../utils/attendanceCalc');
const { generateAttendanceSummaryCSV, generateGradesCSV, sendCSVResponse } = require('../utils/csvExport');

// ======================== DASHBOARD ========================

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [[{ totalStudents }]] = await pool.query('SELECT COUNT(*) as totalStudents FROM students WHERE is_active = 1');
    const [[{ totalTeachers }]] = await pool.query('SELECT COUNT(*) as totalTeachers FROM teachers WHERE is_active = 1');
    const [[{ totalCourses }]] = await pool.query('SELECT COUNT(*) as totalCourses FROM courses WHERE is_active = 1');
    const [[{ totalSubjects }]] = await pool.query('SELECT COUNT(*) as totalSubjects FROM subjects WHERE is_active = 1');

    // Overall Average Attendance percentage
    const [[{ avgAttendance }]] = await pool.query(`
      SELECT COALESCE(ROUND(COUNT(CASE WHEN status = 'present' OR status = 'late' THEN 1 END) / NULLIF(COUNT(*), 0) * 100), 0) as avgAttendance
      FROM attendance
    `);

    // Department/Course-wise attendance
    const [departmentAttendance] = await pool.query(`
      SELECT c.name as name,
             COALESCE(ROUND(COUNT(CASE WHEN a.status = 'present' OR a.status = 'late' THEN 1 END) / NULLIF(COUNT(a.id), 0) * 100), 0) as percentage
      FROM courses c
      LEFT JOIN students s ON c.id = s.course_id
      LEFT JOIN attendance a ON s.id = a.student_id
      WHERE c.is_active = 1
      GROUP BY c.id
    `);

    // Attendance Trend
    const [attendanceTrend] = await pool.query(`
      SELECT DATE_FORMAT(a.date, '%b %d') as date,
             COALESCE(ROUND(COUNT(CASE WHEN a.status = 'present' OR a.status = 'late' THEN 1 END) / NULLIF(COUNT(a.id), 0) * 100), 0) as value
      FROM attendance a
      GROUP BY a.date
      ORDER BY a.date ASC
      LIMIT 10
    `);

    // Recent Alerts (Mapped from admin notifications)
    const [recentAlerts] = await pool.query(`
      SELECT title as message, DATE_FORMAT(created_at, '%b %d, %H:%i') as time, type
      FROM notifications
      WHERE recipient_type = 'admin'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalSubjects,
        avgAttendance: avgAttendance || 75,
        departmentAttendance,
        attendanceTrend,
        recentAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================== COURSES ========================

/**
 * @route   GET /api/admin/courses
 * @desc    Get all courses
 */
const getCourses = async (req, res, next) => {
  try {
    const [courses] = await pool.query(`
      SELECT c.*,
             (SELECT COUNT(*) FROM students s WHERE s.course_id = c.id AND s.is_active = 1) as student_count,
             (SELECT COUNT(*) FROM subjects sub WHERE sub.course_id = c.id AND sub.is_active = 1) as subject_count
      FROM courses c
      WHERE c.is_active = 1
      ORDER BY c.name
    `);

    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/courses
 * @desc    Create a new course
 */
const createCourse = async (req, res, next) => {
  try {
    const { name, code, duration_years, total_semesters, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Course name and code are required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO courses (name, code, duration_years, total_semesters, description) VALUES (?, ?, ?, ?, ?)',
      [name, code, duration_years || 3, total_semesters || 6, description || null]
    );

    const [newCourse] = await pool.query('SELECT * FROM courses WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, message: 'Course created successfully.', data: newCourse[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/courses/:id
 * @desc    Update a course
 */
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, duration_years, total_semesters, description, is_active } = req.body;

    const [existing] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    await pool.query(
      'UPDATE courses SET name = ?, code = ?, duration_years = ?, total_semesters = ?, description = ?, is_active = ? WHERE id = ?',
      [
        name || existing[0].name,
        code || existing[0].code,
        duration_years ?? existing[0].duration_years,
        total_semesters ?? existing[0].total_semesters,
        description !== undefined ? description : existing[0].description,
        is_active !== undefined ? is_active : existing[0].is_active,
        id,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Course updated successfully.', data: updated[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/courses/:id
 * @desc    Delete a course (soft delete by deactivating)
 */
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Check for active students
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM students WHERE course_id = ? AND is_active = 1',
      [id]
    );
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete course. ${count} active student(s) are enrolled.`,
      });
    }

    await pool.query('UPDATE courses SET is_active = 0 WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Course deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};

// ======================== SUBJECTS ========================

/**
 * @route   GET /api/admin/subjects
 * @desc    Get all subjects (optionally filter by course_id, semester)
 */
const getSubjects = async (req, res, next) => {
  try {
    const { course_id, semester } = req.query;
    let query = `
      SELECT sub.*, c.name as course_name, c.code as course_code,
             (SELECT t.name FROM teachers t
              JOIN subject_assignments sa ON t.id = sa.teacher_id
              WHERE sa.subject_id = sub.id AND sa.is_active = 1
              LIMIT 1) as teacher_name
      FROM subjects sub
      JOIN courses c ON sub.course_id = c.id
      WHERE sub.is_active = 1 AND c.is_active = 1
    `;
    const params = [];

    if (course_id) {
      query += ' AND sub.course_id = ?';
      params.push(course_id);
    }
    if (semester) {
      query += ' AND sub.semester = ?';
      params.push(semester);
    }

    query += ' ORDER BY c.name, sub.semester, sub.name';

    const [subjects] = await pool.query(query, params);
    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/subjects
 * @desc    Create a new subject
 */
const createSubject = async (req, res, next) => {
  try {
    const { name, code, course_id, semester, credits, type } = req.body;

    if (!name || !code || !course_id || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Subject name, code, course_id, and semester are required.',
      });
    }

    const [result] = await pool.query(
      'INSERT INTO subjects (name, code, course_id, semester, credits, type) VALUES (?, ?, ?, ?, ?, ?)',
      [name, code, course_id, semester, credits || 3, type || 'theory']
    );

    const [newSubject] = await pool.query('SELECT * FROM subjects WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Subject created successfully.', data: newSubject[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/subjects/:id
 * @desc    Update a subject
 */
const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, course_id, semester, credits, type, is_active } = req.body;

    const [existing] = await pool.query('SELECT * FROM subjects WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    await pool.query(
      'UPDATE subjects SET name = ?, code = ?, course_id = ?, semester = ?, credits = ?, type = ?, is_active = ? WHERE id = ?',
      [
        name || existing[0].name,
        code || existing[0].code,
        course_id || existing[0].course_id,
        semester ?? existing[0].semester,
        credits ?? existing[0].credits,
        type || existing[0].type,
        is_active !== undefined ? is_active : existing[0].is_active,
        id,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM subjects WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Subject updated successfully.', data: updated[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/subjects/:id
 * @desc    Soft-delete a subject
 */
const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM subjects WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    await pool.query('UPDATE subjects SET is_active = 0 WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Subject deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};

// ======================== TEACHERS ========================

/**
 * @route   GET /api/admin/teachers
 * @desc    Get all teachers
 */
const getTeachers = async (req, res, next) => {
  try {
    const [teachers] = await pool.query(`
      SELECT t.id, t.name, t.email, t.phone, t.department, t.designation, t.is_active, t.created_at,
             (SELECT COUNT(*) FROM subject_assignments sa WHERE sa.teacher_id = t.id AND sa.is_active = 1) as assigned_subjects
      FROM teachers t
      WHERE t.is_active = 1
      ORDER BY t.name
    `);

    res.status(200).json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/teachers/:id
 * @desc    Get single teacher with assignments
 */
const getTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [teacher] = await pool.query(
      'SELECT id, name, email, phone, department, designation, is_active, created_at FROM teachers WHERE id = ?',
      [id]
    );

    if (teacher.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // Get assigned subjects
    const [assignments] = await pool.query(`
      SELECT sa.id as assignment_id, sub.name as subject_name, sub.code as subject_code,
             c.name as course_name, sa.semester, sa.section, sa.academic_year
      FROM subject_assignments sa
      JOIN subjects sub ON sa.subject_id = sub.id
      JOIN courses c ON sa.course_id = c.id
      WHERE sa.teacher_id = ? AND sa.is_active = 1
    `, [id]);

    res.status(200).json({
      success: true,
      data: { ...teacher[0], assignments },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/teachers
 * @desc    Create a new teacher
 */
const createTeacher = async (req, res, next) => {
  try {
    const { name, email, password, phone, department, designation } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    // Check email uniqueness across all tables
    for (const table of ['admins', 'teachers', 'students']) {
      const [existing] = await pool.query(`SELECT id FROM ${table} WHERE email = ?`, [email]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already in use.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO teachers (name, email, password, phone, department, designation) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, department || null, designation || 'Assistant Professor']
    );

    const [newTeacher] = await pool.query(
      'SELECT id, name, email, phone, department, designation, created_at FROM teachers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, message: 'Teacher created successfully.', data: newTeacher[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/teachers/:id
 * @desc    Update a teacher
 */
const updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department, designation, is_active } = req.body;

    const [existing] = await pool.query('SELECT * FROM teachers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // If email is being changed, check uniqueness
    if (email && email !== existing[0].email) {
      for (const table of ['admins', 'teachers', 'students']) {
        const [dup] = await pool.query(`SELECT id FROM ${table} WHERE email = ? AND NOT (id = ? AND '${table}' = 'teachers')`, [email, id]);
        if (dup.length > 0) {
          return res.status(409).json({ success: false, message: 'Email already in use.' });
        }
      }
    }

    await pool.query(
      'UPDATE teachers SET name = ?, email = ?, phone = ?, department = ?, designation = ?, is_active = ? WHERE id = ?',
      [
        name || existing[0].name,
        email || existing[0].email,
        phone !== undefined ? phone : existing[0].phone,
        department !== undefined ? department : existing[0].department,
        designation || existing[0].designation,
        is_active !== undefined ? is_active : existing[0].is_active,
        id,
      ]
    );

    const [updated] = await pool.query(
      'SELECT id, name, email, phone, department, designation, is_active FROM teachers WHERE id = ?',
      [id]
    );
    res.status(200).json({ success: true, message: 'Teacher updated successfully.', data: updated[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/teachers/:id
 * @desc    Deactivate a teacher
 */
const deleteTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM teachers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    await pool.query('UPDATE teachers SET is_active = 0 WHERE id = ?', [id]);
    await pool.query('UPDATE subject_assignments SET is_active = 0 WHERE teacher_id = ?', [id]);

    res.status(200).json({ success: true, message: 'Teacher deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};

// ======================== STUDENTS ========================

/**
 * @route   GET /api/admin/students
 * @desc    Get all students (optionally filter by course_id, semester)
 */
const getStudents = async (req, res, next) => {
  try {
    const { course_id, semester, section } = req.query;
    let query = `
      SELECT s.id, s.name, s.email, s.roll_number, s.phone, s.course_id, s.semester, s.section,
             s.admission_year, s.is_active, s.created_at,
             c.name as course_name, c.code as course_code,
             COALESCE(ROUND(COUNT(CASE WHEN a.status = 'present' OR a.status = 'late' THEN 1 END) / NULLIF(COUNT(a.id), 0) * 100), 0) as attendance_percentage
      FROM students s
      JOIN courses c ON s.course_id = c.id
      LEFT JOIN attendance a ON s.id = a.student_id
      WHERE s.is_active = 1 AND c.is_active = 1
    `;
    const params = [];

    if (course_id) { query += ' AND s.course_id = ?'; params.push(course_id); }
    if (semester) { query += ' AND s.semester = ?'; params.push(semester); }
    if (section) { query += ' AND s.section = ?'; params.push(section); }

    query += ' GROUP BY s.id, c.id ORDER BY s.roll_number';

    const [students] = await pool.query(query, params);
    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/students/:id
 * @desc    Get single student with attendance summary
 */
const getStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [student] = await pool.query(`
      SELECT s.id, s.name, s.email, s.roll_number, s.phone, s.course_id, s.semester, s.section,
             s.admission_year, s.is_active, s.created_at,
             c.name as course_name, c.code as course_code
      FROM students s
      JOIN courses c ON s.course_id = c.id
      WHERE s.id = ?
    `, [id]);

    if (student.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Get attendance summary per subject
    const [attendanceSummary] = await pool.query(`
      SELECT sub.id as subject_id, sub.name as subject_name, sub.code as subject_code,
             COUNT(CASE WHEN a.status = 'present' OR a.status = 'late' THEN 1 END) as classes_attended,
             COUNT(*) as total_classes
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.student_id = ?
      GROUP BY sub.id
    `, [id]);

    const enrichedAttendance = attendanceSummary.map(row => ({
      ...row,
      percentage: calculatePercentage(row.classes_attended, row.total_classes),
      ...getAttendancePrediction(row.classes_attended, row.total_classes, row.subject_name),
    }));

    res.status(200).json({
      success: true,
      data: { ...student[0], attendance: enrichedAttendance },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/students
 * @desc    Create a new student
 */
const createStudent = async (req, res, next) => {
  try {
    const { name, email, password, roll_number, phone, course_id, semester, section, admission_year } = req.body;

    if (!name || !email || !password || !roll_number || !course_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, roll_number, and course_id are required.',
      });
    }

    // Check email uniqueness
    for (const table of ['admins', 'teachers', 'students']) {
      const [existing] = await pool.query(`SELECT id FROM ${table} WHERE email = ?`, [email]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already in use.' });
      }
    }

    // Check roll number uniqueness
    const [existingRoll] = await pool.query('SELECT id FROM students WHERE roll_number = ?', [roll_number]);
    if (existingRoll.length > 0) {
      return res.status(409).json({ success: false, message: 'Roll number already in use.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO students (name, email, password, roll_number, phone, course_id, semester, section, admission_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, roll_number, phone || null, course_id, semester || 1, section || 'A', admission_year || new Date().getFullYear()]
    );

    const [newStudent] = await pool.query(
      'SELECT id, name, email, roll_number, course_id, semester, section FROM students WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, message: 'Student created successfully.', data: newStudent[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/students/:id
 * @desc    Update a student
 */
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, roll_number, course_id, semester, section, is_active } = req.body;

    const [existing] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await pool.query(
      'UPDATE students SET name = ?, email = ?, phone = ?, roll_number = ?, course_id = ?, semester = ?, section = ?, is_active = ? WHERE id = ?',
      [
        name || existing[0].name,
        email || existing[0].email,
        phone !== undefined ? phone : existing[0].phone,
        roll_number || existing[0].roll_number,
        course_id || existing[0].course_id,
        semester ?? existing[0].semester,
        section || existing[0].section,
        is_active !== undefined ? is_active : existing[0].is_active,
        id,
      ]
    );

    const [updated] = await pool.query(
      'SELECT id, name, email, roll_number, course_id, semester, section, is_active FROM students WHERE id = ?',
      [id]
    );
    res.status(200).json({ success: true, message: 'Student updated successfully.', data: updated[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/students/:id
 * @desc    Deactivate a student
 */
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await pool.query('UPDATE students SET is_active = 0 WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Student deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};

// ======================== SUBJECT ASSIGNMENTS ========================

/**
 * @route   GET /api/admin/assignments
 * @desc    Get all subject assignments
 */
const getAssignments = async (req, res, next) => {
  try {
    const [assignments] = await pool.query(`
      SELECT sa.*, t.name as teacher_name, t.email as teacher_email,
             sub.name as subject_name, sub.code as subject_code,
             c.name as course_name, c.code as course_code
      FROM subject_assignments sa
      JOIN teachers t ON sa.teacher_id = t.id
      JOIN subjects sub ON sa.subject_id = sub.id
      JOIN courses c ON sa.course_id = c.id
      ORDER BY sa.academic_year DESC, c.name, sa.semester
    `);

    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/assignments
 * @desc    Create a subject assignment
 */
const createAssignment = async (req, res, next) => {
  try {
    const { teacher_id, subject_id, course_id, semester, section, academic_year } = req.body;

    if (!teacher_id || !subject_id || !course_id || !semester || !academic_year) {
      return res.status(400).json({
        success: false,
        message: 'teacher_id, subject_id, course_id, semester, and academic_year are required.',
      });
    }

    const [result] = await pool.query(
      'INSERT INTO subject_assignments (teacher_id, subject_id, course_id, semester, section, academic_year) VALUES (?, ?, ?, ?, ?, ?)',
      [teacher_id, subject_id, course_id, semester, section || 'A', academic_year]
    );

    const [newAssignment] = await pool.query(`
      SELECT sa.*, t.name as teacher_name, sub.name as subject_name, c.name as course_name
      FROM subject_assignments sa
      JOIN teachers t ON sa.teacher_id = t.id
      JOIN subjects sub ON sa.subject_id = sub.id
      JOIN courses c ON sa.course_id = c.id
      WHERE sa.id = ?
    `, [result.insertId]);

    res.status(201).json({ success: true, message: 'Subject assignment created.', data: newAssignment[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/assignments/:id
 * @desc    Delete a subject assignment
 */
const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM subject_assignments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    await pool.query('UPDATE subject_assignments SET is_active = 0 WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Assignment removed successfully.' });
  } catch (error) {
    next(error);
  }
};

// ======================== TIMETABLE ========================

/**
 * @route   GET /api/admin/timetable
 * @desc    Get timetable (optionally filter by course_id, semester, section)
 */
const getTimetable = async (req, res, next) => {
  try {
    const { course_id, semester, section } = req.query;
    let query = `
      SELECT ts.*, sa.teacher_id, sa.course_id, sa.semester, sa.section, sa.academic_year,
             t.name as teacher_name,
             sub.name as subject_name, sub.code as subject_code,
             c.name as course_name, c.code as course_code
      FROM timetable_slots ts
      JOIN subject_assignments sa ON ts.subject_assignment_id = sa.id
      JOIN teachers t ON sa.teacher_id = t.id
      JOIN subjects sub ON sa.subject_id = sub.id
      JOIN courses c ON sa.course_id = c.id
      WHERE ts.is_active = 1
    `;
    const params = [];

    if (course_id) { query += ' AND sa.course_id = ?'; params.push(course_id); }
    if (semester) { query += ' AND sa.semester = ?'; params.push(semester); }
    if (section) { query += ' AND sa.section = ?'; params.push(section); }

    query += ' ORDER BY FIELD(ts.day_of_week, "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"), ts.start_time';

    const [slots] = await pool.query(query, params);
    res.status(200).json({ success: true, count: slots.length, data: slots });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/timetable
 * @desc    Create a timetable slot
 */
const createTimetableSlot = async (req, res, next) => {
  try {
    let { subject_assignment_id, day_of_week, start_time, end_time, room, slot_type } = req.body;

    day_of_week = day_of_week || req.body.day;
    slot_type = slot_type || req.body.type;

    if (!start_time && req.body.timeSlot) {
      const parts = req.body.timeSlot.split('-');
      if (parts.length === 2) {
        start_time = parts[0].trim() + ':00';
        end_time = parts[1].trim() + ':00';
      }
    }

    if (!subject_assignment_id) {
      const { subject, teacher, course, semester, section } = req.body;
      if (subject && teacher && course && semester) {
        const [rows] = await pool.query(
          'SELECT id FROM subject_assignments WHERE teacher_id = ? AND subject_id = ? AND course_id = ? AND semester = ? AND section = ? AND is_active = 1',
          [teacher, subject, course, semester, section || 'A']
        );
        if (rows.length > 0) {
          subject_assignment_id = rows[0].id;
        } else {
          const [insertRes] = await pool.query(
            'INSERT INTO subject_assignments (teacher_id, subject_id, course_id, semester, section, academic_year) VALUES (?, ?, ?, ?, ?, ?)',
            [teacher, subject, course, semester, section || 'A', '2025-2026']
          );
          subject_assignment_id = insertRes.insertId;
        }
      }
    }

    if (!subject_assignment_id || !day_of_week || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'subject_assignment_id/subject/teacher, day_of_week, start_time/timeSlot, and end_time are required.',
      });
    }

    const [result] = await pool.query(
      'INSERT INTO timetable_slots (subject_assignment_id, day_of_week, start_time, end_time, room, slot_type) VALUES (?, ?, ?, ?, ?, ?)',
      [subject_assignment_id, day_of_week, start_time, end_time, room || null, slot_type || 'lecture']
    );

    const [newSlot] = await pool.query('SELECT * FROM timetable_slots WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Timetable slot created.', data: newSlot[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/timetable/:id
 * @desc    Update a timetable slot
 */
const updateTimetableSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { subject_assignment_id, day_of_week, start_time, end_time, room, slot_type, is_active } = req.body;

    day_of_week = day_of_week || req.body.day;
    slot_type = slot_type || req.body.type;

    if (!start_time && req.body.timeSlot) {
      const parts = req.body.timeSlot.split('-');
      if (parts.length === 2) {
        start_time = parts[0].trim() + ':00';
        end_time = parts[1].trim() + ':00';
      }
    }

    if (!subject_assignment_id) {
      const { subject, teacher, course, semester } = req.body;
      if (subject && teacher && course && semester) {
        const [rows] = await pool.query(
          'SELECT id FROM subject_assignments WHERE teacher_id = ? AND subject_id = ? AND course_id = ? AND semester = ? AND is_active = 1',
          [teacher, subject, course, semester]
        );
        if (rows.length > 0) {
          subject_assignment_id = rows[0].id;
        } else {
          const [insertRes] = await pool.query(
            'INSERT INTO subject_assignments (teacher_id, subject_id, course_id, semester, section, academic_year) VALUES (?, ?, ?, ?, ?, ?)',
            [teacher, subject, course, semester, 'A', '2025-2026']
          );
          subject_assignment_id = insertRes.insertId;
        }
      }
    }

    const [existing] = await pool.query('SELECT * FROM timetable_slots WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Timetable slot not found.' });
    }

    await pool.query(
      'UPDATE timetable_slots SET subject_assignment_id = ?, day_of_week = ?, start_time = ?, end_time = ?, room = ?, slot_type = ?, is_active = ? WHERE id = ?',
      [
        subject_assignment_id || existing[0].subject_assignment_id,
        day_of_week || existing[0].day_of_week,
        start_time || existing[0].start_time,
        end_time || existing[0].end_time,
        room !== undefined ? room : existing[0].room,
        slot_type || existing[0].slot_type,
        is_active !== undefined ? is_active : existing[0].is_active,
        id,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM timetable_slots WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Timetable slot updated.', data: updated[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/timetable/:id
 * @desc    Delete a timetable slot
 */
const deleteTimetableSlot = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM timetable_slots WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Timetable slot not found.' });
    }

    await pool.query('DELETE FROM timetable_slots WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Timetable slot deleted.' });
  } catch (error) {
    next(error);
  }
};

// ======================== REPORTS ========================

/**
 * @route   GET /api/admin/reports/attendance
 * @desc    Get attendance report (optionally filter by course, subject, date range)
 */
const getAttendanceReport = async (req, res, next) => {
  try {
    const { course_id, subject_id, start_date, end_date, format } = req.query;

    let query = `
      SELECT s.name as student_name, s.roll_number, sub.name as subject_name, sub.code as subject_code,
             c.name as course_name,
             COUNT(CASE WHEN a.status = 'present' OR a.status = 'late' THEN 1 END) as classes_attended,
             COUNT(*) as total_classes
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN subjects sub ON a.subject_id = sub.id
      JOIN courses c ON s.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (course_id) { query += ' AND s.course_id = ?'; params.push(course_id); }
    if (subject_id) { query += ' AND a.subject_id = ?'; params.push(subject_id); }
    if (start_date) { query += ' AND a.date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND a.date <= ?'; params.push(end_date); }

    query += ' GROUP BY s.id, sub.id ORDER BY s.roll_number, sub.name';

    const [records] = await pool.query(query, params);

    // Enrich with percentage and status
    const enriched = records.map(row => ({
      ...row,
      percentage: calculatePercentage(row.classes_attended, row.total_classes),
      status: calculatePercentage(row.classes_attended, row.total_classes) >= 75 ? 'Safe' : 'Below 75%',
    }));

    // If CSV format requested
    if (format === 'csv') {
      const csv = generateAttendanceSummaryCSV(enriched);
      return sendCSVResponse(res, csv, `attendance_report_${Date.now()}.csv`);
    }

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/reports/low-attendance
 * @desc    Get students below 75% attendance
 */
const getLowAttendanceReport = async (req, res, next) => {
  try {
    const { course_id, threshold } = req.query;
    const thresholdValue = threshold || 75;

    let query = `
      SELECT s.id, s.name as student_name, s.roll_number, s.email,
             c.name as course_name, sub.name as subject_name, sub.code as subject_code,
             COUNT(CASE WHEN a.status = 'present' OR a.status = 'late' THEN 1 END) as classes_attended,
             COUNT(*) as total_classes
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN subjects sub ON a.subject_id = sub.id
      JOIN courses c ON s.course_id = c.id
      WHERE s.is_active = 1
    `;
    const params = [];

    if (course_id) { query += ' AND s.course_id = ?'; params.push(course_id); }

    query += ' GROUP BY s.id, sub.id HAVING (classes_attended / total_classes * 100) < ? ORDER BY (classes_attended / total_classes) ASC';
    params.push(thresholdValue);

    const [records] = await pool.query(query, params);

    const enriched = records.map(row => ({
      ...row,
      ...getAttendancePrediction(row.classes_attended, row.total_classes, row.subject_name),
    }));

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    next(error);
  }
};

// ======================== FEEDBACK (VIEW) ========================

/**
 * @route   GET /api/admin/feedback
 * @desc    Get all feedback (optionally filter by teacher, subject)
 */
const getFeedback = async (req, res, next) => {
  try {
    const { teacher_id, subject_id } = req.query;

    let query = `
      SELECT f.*,
             CASE WHEN f.is_anonymous = 1 THEN 'Anonymous' ELSE s.name END as student_name,
             sub.name as subject_name, sub.code as subject_code,
             t.name as teacher_name
      FROM feedback f
      JOIN students s ON f.student_id = s.id
      JOIN subjects sub ON f.subject_id = sub.id
      JOIN teachers t ON f.teacher_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (teacher_id) { query += ' AND f.teacher_id = ?'; params.push(teacher_id); }
    if (subject_id) { query += ' AND f.subject_id = ?'; params.push(subject_id); }

    query += ' ORDER BY f.created_at DESC';

    const [feedbacks] = await pool.query(query, params);

    // Calculate average ratings per teacher
    const [avgRatings] = await pool.query(`
      SELECT t.id, t.name, AVG(f.rating) as avg_rating, COUNT(*) as total_reviews
      FROM feedback f
      JOIN teachers t ON f.teacher_id = t.id
      GROUP BY t.id
    `);

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
      teacherRatings: avgRatings,
    });
  } catch (error) {
    next(error);
  }
};

// ======================== NOTIFICATIONS ========================

/**
 * @route   GET /api/admin/notifications
 * @desc    Get admin notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const [notifications] = await pool.query(
      "SELECT * FROM notifications WHERE recipient_type = 'admin' AND recipient_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/notifications/:id/read
 * @desc    Mark notification as read
 */
const markNotificationRead = async (req, res, next) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_type = 'admin' AND recipient_id = ?",
      [req.params.id, req.user.id]
    );
    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/notifications
 * @desc    Send a notification
 */
const sendNotification = async (req, res, next) => {
  try {
    const { recipient_type, recipient_id, title, message, type } = req.body;

    if (!recipient_type || !recipient_id || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'recipient_type, recipient_id, title, and message are required.',
      });
    }

    const [result] = await pool.query(
      'INSERT INTO notifications (recipient_type, recipient_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
      [recipient_type, recipient_id, title, message, type || 'info']
    );

    res.status(201).json({ success: true, message: 'Notification sent.', data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

const assignSubjects = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subjects } = req.body;

    if (!subjects || !Array.isArray(subjects)) {
      return res.status(400).json({ success: false, message: 'subjects array is required.' });
    }

    // Deactivate all previous assignments for this teacher
    await pool.query('UPDATE subject_assignments SET is_active = 0 WHERE teacher_id = ?', [id]);

    for (const subjectId of subjects) {
      // Check if assignment already exists (including inactive ones)
      const [existing] = await pool.query(
        'SELECT id FROM subject_assignments WHERE teacher_id = ? AND subject_id = ?',
        [id, subjectId]
      );

      if (existing.length > 0) {
        // Re-activate existing assignment
        await pool.query('UPDATE subject_assignments SET is_active = 1 WHERE id = ?', [existing[0].id]);
      } else {
        // Look up course_id, semester from subjects table
        const [subjDetails] = await pool.query(
          'SELECT course_id, semester FROM subjects WHERE id = ? AND is_active = 1',
          [subjectId]
        );
        if (subjDetails.length > 0) {
          const currentYear = new Date().getFullYear();
          const academicYear = `${currentYear}-${currentYear + 1}`;
          await pool.query(
            'INSERT INTO subject_assignments (teacher_id, subject_id, course_id, semester, section, academic_year) VALUES (?, ?, ?, ?, ?, ?)',
            [id, subjectId, subjDetails[0].course_id, subjDetails[0].semester, 'A', academicYear]
          );
        }
      }
    }

    res.status(200).json({ success: true, message: 'Subjects assigned successfully.' });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getDashboardStats,
  getCourses, createCourse, updateCourse, deleteCourse,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, assignSubjects,
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
  getAssignments, createAssignment, deleteAssignment,
  getTimetable, createTimetableSlot, updateTimetableSlot, deleteTimetableSlot,
  getAttendanceReport, getLowAttendanceReport,
  getFeedback,
  getNotifications, markNotificationRead, sendNotification,
};
