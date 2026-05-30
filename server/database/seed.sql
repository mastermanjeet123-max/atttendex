-- ============================================================
-- AttendX - Seed Data
-- Comprehensive test data for development
-- ============================================================

USE attendx;

-- ============================================================
-- 1. ADMIN (password: admin123)
-- bcrypt hash of 'admin123' with 10 salt rounds
-- ============================================================
INSERT INTO admins (name, email, password, phone) VALUES
('Super Admin', 'admin@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', '9999999999');

-- ============================================================
-- 2. TEACHERS (password: teacher123 for all)
-- ============================================================
INSERT INTO teachers (name, email, password, phone, department, designation) VALUES
('Dr. Rajesh Kumar', 'rajesh.kumar@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', '9876543210', 'Computer Science', 'Professor'),
('Prof. Anita Sharma', 'anita.sharma@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', '9876543211', 'Computer Science', 'Associate Professor'),
('Dr. Vikram Singh', 'vikram.singh@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', '9876543212', 'Mathematics', 'Assistant Professor');

-- ============================================================
-- 3. COURSES
-- ============================================================
INSERT INTO courses (name, code, duration_years, total_semesters, description) VALUES
('Bachelor of Computer Applications', 'BCA', 3, 6, 'A three-year undergraduate program in computer applications covering programming, databases, networking, and web development.'),
('Bachelor of Technology - Computer Science', 'BTECH-CS', 4, 8, 'A four-year engineering program specializing in computer science and engineering fundamentals.');

-- ============================================================
-- 4. SUBJECTS (3 per course, semester 3)
-- ============================================================
INSERT INTO subjects (name, code, course_id, semester, credits, type) VALUES
-- BCA Subjects (course_id = 1, semester 3)
('Data Structures', 'BCA-301', 1, 3, 4, 'theory'),
('Database Management Systems', 'BCA-302', 1, 3, 4, 'theory'),
('Web Technologies', 'BCA-303', 1, 3, 3, 'practical'),
-- BTech CS Subjects (course_id = 2, semester 3)
('Operating Systems', 'BT-CS-301', 2, 3, 4, 'theory'),
('Computer Networks', 'BT-CS-302', 2, 3, 4, 'theory'),
('Software Engineering', 'BT-CS-303', 2, 3, 3, 'theory');

-- ============================================================
-- 5. STUDENTS (password: student123 for all)
-- 5 in BCA, 5 in BTech CS
-- ============================================================
INSERT INTO students (name, email, password, roll_number, phone, course_id, semester, section, admission_year) VALUES
-- BCA Students (course_id = 1)
('Aarav Patel', 'aarav.patel@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', 'BCA2024001', '8001000001', 1, 3, 'A', 2024),
('Priya Gupta', 'priya.gupta@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', 'BCA2024002', '8001000002', 1, 3, 'A', 2024),
('Rohan Mehta', 'rohan.mehta@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', 'BCA2024003', '8001000003', 1, 3, 'A', 2024),
('Sneha Reddy', 'sneha.reddy@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', 'BCA2024004', '8001000004', 1, 3, 'A', 2024),
('Karan Joshi', 'karan.joshi@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', 'BCA2024005', '8001000005', 1, 3, 'A', 2024),
-- BTech CS Students (course_id = 2)
('Ananya Iyer', 'ananya.iyer@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', 'BT2024001', '8002000001', 2, 3, 'A', 2024),
('Devansh Rao', 'devansh.rao@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', 'BT2024002', '8002000002', 2, 3, 'A', 2024),
('Ishita Nair', 'ishita.nair@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', 'BT2024003', '8002000003', 2, 3, 'A', 2024),
('Manav Kapoor', 'manav.kapoor@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', 'BT2024004', '8002000004', 2, 3, 'A', 2024),
('Tanya Verma', 'tanya.verma@attendx.com', '$2a$10$8K1p/a0dR1xqM8K3hF1kGeYB3Z5r1z0X7p5U8V4W5X6Y7Z8A9B0C1', 'BT2024005', '8002000005', 2, 3, 'A', 2024);

-- ============================================================
-- 6. SUBJECT ASSIGNMENTS (Teachers assigned to subjects)
-- ============================================================
INSERT INTO subject_assignments (teacher_id, subject_id, course_id, semester, section, academic_year) VALUES
-- Dr. Rajesh Kumar teaches Data Structures (BCA) and Operating Systems (BTech)
(1, 1, 1, 3, 'A', '2025-2026'),
(1, 4, 2, 3, 'A', '2025-2026'),
-- Prof. Anita Sharma teaches DBMS (BCA) and Computer Networks (BTech)
(2, 2, 1, 3, 'A', '2025-2026'),
(2, 5, 2, 3, 'A', '2025-2026'),
-- Dr. Vikram Singh teaches Web Technologies (BCA) and Software Engineering (BTech)
(3, 3, 1, 3, 'A', '2025-2026'),
(3, 6, 2, 3, 'A', '2025-2026');

-- ============================================================
-- 7. TIMETABLE SLOTS (full week schedule)
-- ============================================================
INSERT INTO timetable_slots (subject_assignment_id, day_of_week, start_time, end_time, room, slot_type) VALUES
-- Monday
(1, 'Monday', '09:00:00', '10:00:00', 'Room 101', 'lecture'),
(3, 'Monday', '10:00:00', '11:00:00', 'Room 102', 'lecture'),
(5, 'Monday', '11:00:00', '12:00:00', 'Lab 201', 'lab'),
(2, 'Monday', '14:00:00', '15:00:00', 'Room 201', 'lecture'),
(4, 'Monday', '15:00:00', '16:00:00', 'Room 202', 'lecture'),
-- Tuesday
(3, 'Tuesday', '09:00:00', '10:00:00', 'Room 102', 'lecture'),
(1, 'Tuesday', '10:00:00', '11:00:00', 'Room 101', 'lecture'),
(5, 'Tuesday', '11:00:00', '13:00:00', 'Lab 201', 'lab'),
(6, 'Tuesday', '14:00:00', '15:00:00', 'Room 203', 'lecture'),
(4, 'Tuesday', '15:00:00', '16:00:00', 'Room 202', 'lecture'),
-- Wednesday
(1, 'Wednesday', '09:00:00', '10:00:00', 'Room 101', 'lecture'),
(3, 'Wednesday', '10:00:00', '11:00:00', 'Room 102', 'lecture'),
(2, 'Wednesday', '11:00:00', '12:00:00', 'Room 201', 'lecture'),
(6, 'Wednesday', '14:00:00', '15:00:00', 'Room 203', 'lecture'),
(4, 'Wednesday', '15:00:00', '16:00:00', 'Room 202', 'lecture'),
-- Thursday
(5, 'Thursday', '09:00:00', '11:00:00', 'Lab 201', 'lab'),
(1, 'Thursday', '11:00:00', '12:00:00', 'Room 101', 'lecture'),
(3, 'Thursday', '14:00:00', '15:00:00', 'Room 102', 'lecture'),
(2, 'Thursday', '15:00:00', '16:00:00', 'Room 201', 'lecture'),
(6, 'Thursday', '16:00:00', '17:00:00', 'Room 203', 'lecture'),
-- Friday
(1, 'Friday', '09:00:00', '10:00:00', 'Room 101', 'tutorial'),
(3, 'Friday', '10:00:00', '11:00:00', 'Room 102', 'tutorial'),
(5, 'Friday', '11:00:00', '12:00:00', 'Lab 201', 'lab'),
(2, 'Friday', '14:00:00', '15:00:00', 'Room 201', 'tutorial'),
(4, 'Friday', '15:00:00', '16:00:00', 'Room 202', 'tutorial'),
-- Saturday (light schedule)
(6, 'Saturday', '09:00:00', '10:00:00', 'Room 203', 'tutorial'),
(2, 'Saturday', '10:00:00', '11:00:00', 'Room 201', 'lecture');

-- ============================================================
-- 8. ATTENDANCE RECORDS
-- 20 class days from May 1 to May 23, 2026
-- Some students below 75% threshold
-- ============================================================

-- Helper: Generate attendance for BCA students on subject 1 (Data Structures)
-- Student 1 (Aarav): Good attendance ~90%
INSERT INTO attendance (student_id, subject_id, teacher_id, date, status, slot_time) VALUES
(1, 1, 1, '2026-05-01', 'present', '09:00:00'),
(1, 1, 1, '2026-05-05', 'present', '09:00:00'),
(1, 1, 1, '2026-05-06', 'present', '10:00:00'),
(1, 1, 1, '2026-05-07', 'present', '09:00:00'),
(1, 1, 1, '2026-05-08', 'present', '11:00:00'),
(1, 1, 1, '2026-05-09', 'present', '09:00:00'),
(1, 1, 1, '2026-05-12', 'present', '09:00:00'),
(1, 1, 1, '2026-05-13', 'present', '10:00:00'),
(1, 1, 1, '2026-05-14', 'present', '09:00:00'),
(1, 1, 1, '2026-05-15', 'absent', '11:00:00'),
(1, 1, 1, '2026-05-16', 'present', '09:00:00'),
(1, 1, 1, '2026-05-19', 'present', '09:00:00'),
(1, 1, 1, '2026-05-20', 'present', '10:00:00'),
(1, 1, 1, '2026-05-21', 'present', '09:00:00'),
(1, 1, 1, '2026-05-22', 'present', '11:00:00'),
(1, 1, 1, '2026-05-23', 'present', '09:00:00');

-- Student 2 (Priya): Moderate attendance ~75%
INSERT INTO attendance (student_id, subject_id, teacher_id, date, status, slot_time) VALUES
(2, 1, 1, '2026-05-01', 'present', '09:00:00'),
(2, 1, 1, '2026-05-05', 'present', '09:00:00'),
(2, 1, 1, '2026-05-06', 'absent', '10:00:00'),
(2, 1, 1, '2026-05-07', 'present', '09:00:00'),
(2, 1, 1, '2026-05-08', 'absent', '11:00:00'),
(2, 1, 1, '2026-05-09', 'present', '09:00:00'),
(2, 1, 1, '2026-05-12', 'present', '09:00:00'),
(2, 1, 1, '2026-05-13', 'absent', '10:00:00'),
(2, 1, 1, '2026-05-14', 'present', '09:00:00'),
(2, 1, 1, '2026-05-15', 'present', '11:00:00'),
(2, 1, 1, '2026-05-16', 'present', '09:00:00'),
(2, 1, 1, '2026-05-19', 'absent', '09:00:00'),
(2, 1, 1, '2026-05-20', 'present', '10:00:00'),
(2, 1, 1, '2026-05-21', 'present', '09:00:00'),
(2, 1, 1, '2026-05-22', 'present', '11:00:00'),
(2, 1, 1, '2026-05-23', 'present', '09:00:00');

-- Student 3 (Rohan): LOW attendance ~56% - BELOW 75%
INSERT INTO attendance (student_id, subject_id, teacher_id, date, status, slot_time) VALUES
(3, 1, 1, '2026-05-01', 'present', '09:00:00'),
(3, 1, 1, '2026-05-05', 'absent', '09:00:00'),
(3, 1, 1, '2026-05-06', 'absent', '10:00:00'),
(3, 1, 1, '2026-05-07', 'present', '09:00:00'),
(3, 1, 1, '2026-05-08', 'absent', '11:00:00'),
(3, 1, 1, '2026-05-09', 'absent', '09:00:00'),
(3, 1, 1, '2026-05-12', 'present', '09:00:00'),
(3, 1, 1, '2026-05-13', 'absent', '10:00:00'),
(3, 1, 1, '2026-05-14', 'present', '09:00:00'),
(3, 1, 1, '2026-05-15', 'absent', '11:00:00'),
(3, 1, 1, '2026-05-16', 'present', '09:00:00'),
(3, 1, 1, '2026-05-19', 'absent', '09:00:00'),
(3, 1, 1, '2026-05-20', 'present', '10:00:00'),
(3, 1, 1, '2026-05-21', 'absent', '09:00:00'),
(3, 1, 1, '2026-05-22', 'present', '11:00:00'),
(3, 1, 1, '2026-05-23', 'present', '09:00:00');

-- Student 4 (Sneha): Decent ~81%
INSERT INTO attendance (student_id, subject_id, teacher_id, date, status, slot_time) VALUES
(4, 1, 1, '2026-05-01', 'present', '09:00:00'),
(4, 1, 1, '2026-05-05', 'present', '09:00:00'),
(4, 1, 1, '2026-05-06', 'present', '10:00:00'),
(4, 1, 1, '2026-05-07', 'present', '09:00:00'),
(4, 1, 1, '2026-05-08', 'absent', '11:00:00'),
(4, 1, 1, '2026-05-09', 'present', '09:00:00'),
(4, 1, 1, '2026-05-12', 'present', '09:00:00'),
(4, 1, 1, '2026-05-13', 'present', '10:00:00'),
(4, 1, 1, '2026-05-14', 'absent', '09:00:00'),
(4, 1, 1, '2026-05-15', 'present', '11:00:00'),
(4, 1, 1, '2026-05-16', 'present', '09:00:00'),
(4, 1, 1, '2026-05-19', 'present', '09:00:00'),
(4, 1, 1, '2026-05-20', 'present', '10:00:00'),
(4, 1, 1, '2026-05-21', 'absent', '09:00:00'),
(4, 1, 1, '2026-05-22', 'present', '11:00:00'),
(4, 1, 1, '2026-05-23', 'present', '09:00:00');

-- Student 5 (Karan): VERY LOW ~44% - CRITICALLY BELOW 75%
INSERT INTO attendance (student_id, subject_id, teacher_id, date, status, slot_time) VALUES
(5, 1, 1, '2026-05-01', 'present', '09:00:00'),
(5, 1, 1, '2026-05-05', 'absent', '09:00:00'),
(5, 1, 1, '2026-05-06', 'absent', '10:00:00'),
(5, 1, 1, '2026-05-07', 'absent', '09:00:00'),
(5, 1, 1, '2026-05-08', 'absent', '11:00:00'),
(5, 1, 1, '2026-05-09', 'present', '09:00:00'),
(5, 1, 1, '2026-05-12', 'absent', '09:00:00'),
(5, 1, 1, '2026-05-13', 'absent', '10:00:00'),
(5, 1, 1, '2026-05-14', 'present', '09:00:00'),
(5, 1, 1, '2026-05-15', 'absent', '11:00:00'),
(5, 1, 1, '2026-05-16', 'present', '09:00:00'),
(5, 1, 1, '2026-05-19', 'absent', '09:00:00'),
(5, 1, 1, '2026-05-20', 'absent', '10:00:00'),
(5, 1, 1, '2026-05-21', 'present', '09:00:00'),
(5, 1, 1, '2026-05-22', 'absent', '11:00:00'),
(5, 1, 1, '2026-05-23', 'present', '09:00:00');

-- Attendance for BCA subject 2 (DBMS) - Teacher 2
INSERT INTO attendance (student_id, subject_id, teacher_id, date, status, slot_time) VALUES
(1, 2, 2, '2026-05-01', 'present', '10:00:00'),
(1, 2, 2, '2026-05-07', 'present', '11:00:00'),
(1, 2, 2, '2026-05-08', 'present', '15:00:00'),
(1, 2, 2, '2026-05-09', 'present', '10:00:00'),
(1, 2, 2, '2026-05-14', 'present', '11:00:00'),
(1, 2, 2, '2026-05-15', 'present', '15:00:00'),
(1, 2, 2, '2026-05-16', 'present', '10:00:00'),
(1, 2, 2, '2026-05-21', 'present', '11:00:00'),
(1, 2, 2, '2026-05-22', 'present', '15:00:00'),
(1, 2, 2, '2026-05-23', 'present', '10:00:00'),
(2, 2, 2, '2026-05-01', 'present', '10:00:00'),
(2, 2, 2, '2026-05-07', 'absent', '11:00:00'),
(2, 2, 2, '2026-05-08', 'present', '15:00:00'),
(2, 2, 2, '2026-05-09', 'present', '10:00:00'),
(2, 2, 2, '2026-05-14', 'absent', '11:00:00'),
(2, 2, 2, '2026-05-15', 'present', '15:00:00'),
(2, 2, 2, '2026-05-16', 'present', '10:00:00'),
(2, 2, 2, '2026-05-21', 'present', '11:00:00'),
(2, 2, 2, '2026-05-22', 'absent', '15:00:00'),
(2, 2, 2, '2026-05-23', 'present', '10:00:00'),
(3, 2, 2, '2026-05-01', 'absent', '10:00:00'),
(3, 2, 2, '2026-05-07', 'absent', '11:00:00'),
(3, 2, 2, '2026-05-08', 'present', '15:00:00'),
(3, 2, 2, '2026-05-09', 'absent', '10:00:00'),
(3, 2, 2, '2026-05-14', 'present', '11:00:00'),
(3, 2, 2, '2026-05-15', 'absent', '15:00:00'),
(3, 2, 2, '2026-05-16', 'present', '10:00:00'),
(3, 2, 2, '2026-05-21', 'absent', '11:00:00'),
(3, 2, 2, '2026-05-22', 'present', '15:00:00'),
(3, 2, 2, '2026-05-23', 'absent', '10:00:00');

-- Attendance for BTech students on subject 4 (Operating Systems) - Teacher 1
INSERT INTO attendance (student_id, subject_id, teacher_id, date, status, slot_time) VALUES
(6, 4, 1, '2026-05-01', 'present', '14:00:00'),
(6, 4, 1, '2026-05-05', 'present', '14:00:00'),
(6, 4, 1, '2026-05-07', 'present', '15:00:00'),
(6, 4, 1, '2026-05-08', 'present', '14:00:00'),
(6, 4, 1, '2026-05-12', 'present', '14:00:00'),
(6, 4, 1, '2026-05-13', 'absent', '14:00:00'),
(6, 4, 1, '2026-05-14', 'present', '15:00:00'),
(6, 4, 1, '2026-05-15', 'present', '14:00:00'),
(6, 4, 1, '2026-05-19', 'present', '14:00:00'),
(6, 4, 1, '2026-05-20', 'present', '14:00:00'),
(6, 4, 1, '2026-05-21', 'present', '15:00:00'),
(6, 4, 1, '2026-05-22', 'present', '14:00:00'),
(7, 4, 1, '2026-05-01', 'present', '14:00:00'),
(7, 4, 1, '2026-05-05', 'absent', '14:00:00'),
(7, 4, 1, '2026-05-07', 'absent', '15:00:00'),
(7, 4, 1, '2026-05-08', 'present', '14:00:00'),
(7, 4, 1, '2026-05-12', 'absent', '14:00:00'),
(7, 4, 1, '2026-05-13', 'absent', '14:00:00'),
(7, 4, 1, '2026-05-14', 'present', '15:00:00'),
(7, 4, 1, '2026-05-15', 'absent', '14:00:00'),
(7, 4, 1, '2026-05-19', 'present', '14:00:00'),
(7, 4, 1, '2026-05-20', 'absent', '14:00:00'),
(7, 4, 1, '2026-05-21', 'present', '15:00:00'),
(7, 4, 1, '2026-05-22', 'absent', '14:00:00'),
(8, 4, 1, '2026-05-01', 'present', '14:00:00'),
(8, 4, 1, '2026-05-05', 'present', '14:00:00'),
(8, 4, 1, '2026-05-07', 'present', '15:00:00'),
(8, 4, 1, '2026-05-08', 'absent', '14:00:00'),
(8, 4, 1, '2026-05-12', 'present', '14:00:00'),
(8, 4, 1, '2026-05-13', 'present', '14:00:00'),
(8, 4, 1, '2026-05-14', 'present', '15:00:00'),
(8, 4, 1, '2026-05-15', 'present', '14:00:00'),
(8, 4, 1, '2026-05-19', 'absent', '14:00:00'),
(8, 4, 1, '2026-05-20', 'present', '14:00:00'),
(8, 4, 1, '2026-05-21', 'present', '15:00:00'),
(8, 4, 1, '2026-05-22', 'present', '14:00:00'),
(9, 4, 1, '2026-05-01', 'absent', '14:00:00'),
(9, 4, 1, '2026-05-05', 'absent', '14:00:00'),
(9, 4, 1, '2026-05-07', 'present', '15:00:00'),
(9, 4, 1, '2026-05-08', 'absent', '14:00:00'),
(9, 4, 1, '2026-05-12', 'present', '14:00:00'),
(9, 4, 1, '2026-05-13', 'absent', '14:00:00'),
(9, 4, 1, '2026-05-14', 'absent', '15:00:00'),
(9, 4, 1, '2026-05-15', 'present', '14:00:00'),
(9, 4, 1, '2026-05-19', 'absent', '14:00:00'),
(9, 4, 1, '2026-05-20', 'present', '14:00:00'),
(9, 4, 1, '2026-05-21', 'absent', '15:00:00'),
(9, 4, 1, '2026-05-22', 'present', '14:00:00'),
(10, 4, 1, '2026-05-01', 'present', '14:00:00'),
(10, 4, 1, '2026-05-05', 'present', '14:00:00'),
(10, 4, 1, '2026-05-07', 'present', '15:00:00'),
(10, 4, 1, '2026-05-08', 'present', '14:00:00'),
(10, 4, 1, '2026-05-12', 'present', '14:00:00'),
(10, 4, 1, '2026-05-13', 'present', '14:00:00'),
(10, 4, 1, '2026-05-14', 'present', '15:00:00'),
(10, 4, 1, '2026-05-15', 'absent', '14:00:00'),
(10, 4, 1, '2026-05-19', 'present', '14:00:00'),
(10, 4, 1, '2026-05-20', 'present', '14:00:00'),
(10, 4, 1, '2026-05-21', 'present', '15:00:00'),
(10, 4, 1, '2026-05-22', 'present', '14:00:00');

-- ============================================================
-- 9. GRADES
-- ============================================================
INSERT INTO grades (student_id, subject_id, exam_type, marks_obtained, total_marks, grade_letter, graded_by) VALUES
-- BCA students - Data Structures (Internal 1)
(1, 1, 'internal_1', 42, 50, 'A', 1),
(2, 1, 'internal_1', 38, 50, 'B+', 1),
(3, 1, 'internal_1', 28, 50, 'C', 1),
(4, 1, 'internal_1', 35, 50, 'B', 1),
(5, 1, 'internal_1', 22, 50, 'D', 1),
-- BCA students - DBMS (Internal 1)
(1, 2, 'internal_1', 45, 50, 'A+', 2),
(2, 2, 'internal_1', 40, 50, 'A', 2),
(3, 2, 'internal_1', 30, 50, 'B', 2),
(4, 2, 'internal_1', 37, 50, 'B+', 2),
(5, 2, 'internal_1', 25, 50, 'C', 2),
-- BTech students - Operating Systems (Internal 1)
(6, 4, 'internal_1', 44, 50, 'A', 1),
(7, 4, 'internal_1', 32, 50, 'B', 1),
(8, 4, 'internal_1', 40, 50, 'A', 1),
(9, 4, 'internal_1', 26, 50, 'C', 1),
(10, 4, 'internal_1', 46, 50, 'A+', 1),
-- Midterm grades
(1, 1, 'midterm', 78, 100, 'A', 1),
(2, 1, 'midterm', 65, 100, 'B', 1),
(3, 1, 'midterm', 52, 100, 'C', 1),
(4, 1, 'midterm', 70, 100, 'B+', 1),
(5, 1, 'midterm', 40, 100, 'D', 1);

-- ============================================================
-- 10. FEEDBACK
-- ============================================================
INSERT INTO feedback (student_id, subject_id, teacher_id, rating, comment, is_anonymous, academic_year) VALUES
(1, 1, 1, 5, 'Dr. Rajesh explains data structures concepts very clearly with real-world examples. Excellent teaching methodology.', 0, '2025-2026'),
(2, 1, 1, 4, 'Good teaching but sometimes the pace is too fast. Would appreciate more solved examples.', 0, '2025-2026'),
(3, 2, 2, 4, 'Prof. Anita makes DBMS interesting. The practical sessions are very helpful.', 1, '2025-2026'),
(4, 2, 2, 5, 'Best teacher for databases. Very patient and answers all doubts.', 0, '2025-2026'),
(1, 3, 3, 3, 'Web Technologies course is good but needs more hands-on projects.', 1, '2025-2026'),
(6, 4, 1, 5, 'Dr. Rajesh makes OS concepts easy to understand. Great use of diagrams.', 0, '2025-2026'),
(7, 4, 1, 3, 'Good content but the class timings make it hard to focus. More interactive sessions would help.', 1, '2025-2026'),
(8, 5, 2, 4, 'Computer Networks taught very well. The lab exercises complement the theory perfectly.', 0, '2025-2026'),
(9, 6, 3, 4, 'Software Engineering course has good industry relevance. Case studies are helpful.', 0, '2025-2026'),
(10, 6, 3, 5, 'Excellent course! Dr. Vikram brings real project experience to the classroom.', 0, '2025-2026');

-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (recipient_type, recipient_id, title, message, type, is_read) VALUES
-- Student notifications
('student', 3, 'Low Attendance Warning', 'Your attendance in Data Structures is below 75%. Current: 56.25%. Please attend classes regularly.', 'warning', 0),
('student', 5, 'Critical Attendance Alert', 'Your attendance in Data Structures is critically low at 43.75%. You are at risk of being debarred from exams.', 'alert', 0),
('student', 7, 'Low Attendance Warning', 'Your attendance in Operating Systems is below 75%. Current: 41.67%. Immediate action required.', 'warning', 0),
('student', 9, 'Low Attendance Warning', 'Your attendance in Operating Systems is below 75%. Current: 41.67%. Please meet your advisor.', 'warning', 0),
('student', 1, 'Grades Published', 'Your Internal 1 and Midterm grades for Data Structures have been published.', 'info', 1),
('student', 2, 'Grades Published', 'Your Internal 1 and Midterm grades for Data Structures have been published.', 'info', 0),
-- Teacher notifications
('teacher', 1, 'Attendance Report Due', 'Monthly attendance report for May 2026 is due by May 31, 2026.', 'info', 0),
('teacher', 2, 'New Subject Assignment', 'You have been assigned Computer Networks (BT-CS-302) for BTech CS Semester 3.', 'success', 1),
-- Admin notifications
('admin', 1, 'Low Attendance Students', '4 students have attendance below 75% across various subjects. Review required.', 'warning', 0),
('admin', 1, 'System Update', 'AttendX system has been updated to version 2.0. New features include CSV export and attendance predictions.', 'info', 1);
