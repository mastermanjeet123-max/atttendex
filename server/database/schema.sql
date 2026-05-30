-- ============================================================
-- AttendX - College Attendance Management System
-- Database Schema
-- ============================================================

-- Drop database if exists and recreate
DROP DATABASE IF EXISTS attendx;
CREATE DATABASE attendx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE attendx;

-- ============================================================
-- 1. ADMINS TABLE
-- ============================================================
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- 2. COURSES TABLE
-- ============================================================
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    duration_years INT NOT NULL DEFAULT 3,
    total_semesters INT NOT NULL DEFAULT 6,
    description TEXT DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course_code (code),
    INDEX idx_course_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- 3. TEACHERS TABLE
-- ============================================================
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    department VARCHAR(100) DEFAULT NULL,
    designation VARCHAR(100) DEFAULT 'Assistant Professor',
    avatar VARCHAR(255) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teacher_email (email),
    INDEX idx_teacher_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- 4. STUDENTS TABLE
-- ============================================================
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    roll_number VARCHAR(30) NOT NULL UNIQUE,
    phone VARCHAR(20) DEFAULT NULL,
    course_id INT NOT NULL,
    semester INT NOT NULL DEFAULT 1,
    section VARCHAR(10) DEFAULT 'A',
    admission_year INT NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_student_email (email),
    INDEX idx_student_roll (roll_number),
    INDEX idx_student_course (course_id),
    INDEX idx_student_semester (semester),
    INDEX idx_student_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- 5. SUBJECTS TABLE
-- ============================================================
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    course_id INT NOT NULL,
    semester INT NOT NULL,
    credits INT NOT NULL DEFAULT 3,
    type ENUM('theory', 'practical', 'elective') NOT NULL DEFAULT 'theory',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_subject_code (code),
    INDEX idx_subject_course (course_id),
    INDEX idx_subject_semester (semester),
    INDEX idx_subject_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- 6. SUBJECT ASSIGNMENTS TABLE (Teacher <-> Subject mapping)
-- ============================================================
CREATE TABLE subject_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    course_id INT NOT NULL,
    semester INT NOT NULL,
    section VARCHAR(10) DEFAULT 'A',
    academic_year VARCHAR(10) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_assignment (teacher_id, subject_id, course_id, semester, section, academic_year),
    INDEX idx_assign_teacher (teacher_id),
    INDEX idx_assign_subject (subject_id),
    INDEX idx_assign_course (course_id),
    INDEX idx_assign_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- 7. TIMETABLE SLOTS TABLE
-- ============================================================
CREATE TABLE timetable_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_assignment_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(30) DEFAULT NULL,
    slot_type ENUM('lecture', 'lab', 'tutorial') NOT NULL DEFAULT 'lecture',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_assignment_id) REFERENCES subject_assignments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_timetable_assignment (subject_assignment_id),
    INDEX idx_timetable_day (day_of_week),
    INDEX idx_timetable_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- 8. ATTENDANCE TABLE
-- ============================================================
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late') NOT NULL DEFAULT 'present',
    slot_time TIME DEFAULT NULL,
    remarks VARCHAR(255) DEFAULT NULL,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_attendance (student_id, subject_id, date, slot_time),
    INDEX idx_attendance_student (student_id),
    INDEX idx_attendance_subject (subject_id),
    INDEX idx_attendance_teacher (teacher_id),
    INDEX idx_attendance_date (date),
    INDEX idx_attendance_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 9. GRADES TABLE
-- ============================================================
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    exam_type ENUM('internal_1', 'internal_2', 'internal_3', 'midterm', 'final', 'assignment', 'practical') NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL DEFAULT 0,
    total_marks DECIMAL(5,2) NOT NULL DEFAULT 100,
    grade_letter VARCHAR(5) DEFAULT NULL,
    remarks VARCHAR(255) DEFAULT NULL,
    graded_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES teachers(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY uk_grade (student_id, subject_id, exam_type),
    INDEX idx_grade_student (student_id),
    INDEX idx_grade_subject (subject_id),
    INDEX idx_grade_exam (exam_type)
) ENGINE=InnoDB;

-- ============================================================
-- 10. FEEDBACK TABLE
-- ============================================================
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT NULL,
    is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
    academic_year VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_feedback (student_id, subject_id, teacher_id, academic_year),
    INDEX idx_feedback_student (student_id),
    INDEX idx_feedback_subject (subject_id),
    INDEX idx_feedback_teacher (teacher_id)
) ENGINE=InnoDB;

-- ============================================================
-- 11. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_type ENUM('admin', 'teacher', 'student') NOT NULL,
    recipient_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'alert', 'success') NOT NULL DEFAULT 'info',
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    link VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_notif_recipient (recipient_type, recipient_id),
    INDEX idx_notif_read (is_read),
    INDEX idx_notif_type (type),
    INDEX idx_notif_created (created_at)
) ENGINE=InnoDB;
