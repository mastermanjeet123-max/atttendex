import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { toast } from 'react-toastify';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiMail, FiHash } from 'react-icons/fi';
import './StudentManagement.css';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', rollNumber: '', course: '',
    semester: '', section: '', parentPhone: '', address: '', password: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, coursesRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/courses')
      ]);
      const rawStudents = studentsRes.data.data || studentsRes.data.students || studentsRes.data || [];
      const mappedStudents = (Array.isArray(rawStudents) ? rawStudents : []).map(s => ({
        ...s,
        _id: s.id,
        rollNumber: s.roll_number,
        course: {
          _id: s.course_id,
          name: s.course_name,
          code: s.course_code
        },
        attendancePercentage: s.attendance_percentage || 0
      }));

      const rawCourses = coursesRes.data.data || coursesRes.data.courses || coursesRes.data || [];
      const mappedCourses = (Array.isArray(rawCourses) ? rawCourses : []).map(c => ({
        ...c,
        _id: c.id
      }));

      setStudents(mappedStudents);
      setCourses(mappedCourses);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      roll_number: formData.rollNumber,
      course_id: formData.course,
      semester: Number(formData.semester),
      section: formData.section || 'A',
      admission_year: new Date().getFullYear(),
      password: formData.password
    };
    try {
      if (editMode && selectedStudent) {
        const { password, ...updateData } = payload;
        await api.put(`/admin/students/${selectedStudent._id}`, formData.password ? payload : updateData);
        toast.success('Student updated successfully');
      } else {
        await api.post('/admin/students', payload);
        toast.success('Student created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save student');
    }
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name || '', email: student.email || '', phone: student.phone || '',
      rollNumber: student.rollNumber || '', course: student.course?._id || student.course || '',
      semester: student.semester || '', section: student.section || '',
      parentPhone: student.parentPhone || '', address: student.address || '', password: ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Student deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', rollNumber: '', course: '', semester: '', section: '', parentPhone: '', address: '', password: '' });
    setEditMode(false);
    setSelectedStudent(null);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !filterCourse || String(s.course?._id || s.course) === String(filterCourse);
    const matchesSemester = !filterSemester || String(s.semester) === filterSemester;
    return matchesSearch && matchesCourse && matchesSemester;
  });

  const getAttendanceBadge = (percentage) => {
    if (percentage >= 75) return <Badge text={`${percentage}%`} variant="success" />;
    if (percentage >= 65) return <Badge text={`${percentage}%`} variant="warning" />;
    return <Badge text={`${percentage}%`} variant="danger" />;
  };

  const columns = [
    { header: 'Roll No.', accessor: 'rollNumber', render: (val) => <Badge text={val || 'N/A'} variant="primary" /> },
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email', render: (val) => <span className="email-cell"><FiMail className="cell-icon" /> {val}</span> },
    { header: 'Course', accessor: 'course', render: (val) => val?.name || val || 'N/A' },
    { header: 'Semester', accessor: 'semester' },
    { header: 'Attendance', accessor: 'attendancePercentage', render: (val) => getAttendanceBadge(val || 0) },
    {
      header: 'Actions', accessor: '_id',
      render: (val, row) => (
        <div className="action-buttons">
          <button className="action-btn edit-btn" onClick={() => handleEdit(row)}><FiEdit2 /></button>
          <button className="action-btn delete-btn" onClick={() => handleDelete(val)}><FiTrash2 /></button>
        </div>
      )
    }
  ];

  if (loading) return <DashboardLayout><div className="page-loader"><Loader /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="student-management">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title"><FiUsers className="page-title-icon" /> Student Management</h1>
            <p className="page-subtitle">Manage student enrollment and course assignments</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }} variant="primary" icon={<FiPlus />}>Add Student</Button>
        </div>

        {/* Filters */}
        <GlassCard className="filters-card">
          <div className="filters-row">
            <div className="search-input-wrap">
              <FiSearch className="search-icon" />
              <input type="text" placeholder="Search by name, email, or roll number..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
              {searchTerm && <button className="search-clear" onClick={() => setSearchTerm('')}><FiX /></button>}
            </div>
            <select className="filter-select" value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select className="filter-select" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
              <option value="">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
        </GlassCard>

        {/* Student stats summary */}
        <div className="student-stats-row">
          <GlassCard className="mini-stat">
            <span className="mini-stat-value">{students.length}</span>
            <span className="mini-stat-label">Total Students</span>
          </GlassCard>
          <GlassCard className="mini-stat">
            <span className="mini-stat-value good">{students.filter(s => (s.attendancePercentage || 0) >= 75).length}</span>
            <span className="mini-stat-label">Above 75%</span>
          </GlassCard>
          <GlassCard className="mini-stat">
            <span className="mini-stat-value warning">{students.filter(s => (s.attendancePercentage || 0) >= 65 && (s.attendancePercentage || 0) < 75).length}</span>
            <span className="mini-stat-label">65-74%</span>
          </GlassCard>
          <GlassCard className="mini-stat">
            <span className="mini-stat-value danger">{students.filter(s => (s.attendancePercentage || 0) < 65).length}</span>
            <span className="mini-stat-label">Below 65%</span>
          </GlassCard>
        </div>

        <GlassCard className="table-card">
          {filteredStudents.length > 0 ? (
            <DataTable columns={columns} data={filteredStudents} />
          ) : (
            <EmptyState message="No students found" icon={<FiUsers />} />
          )}
        </GlassCard>

        {/* Add/Edit Student Modal */}
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}
          title={editMode ? 'Edit Student' : 'Add New Student'} size="lg">
          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Jane Doe" required />
              </div>
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input type="text" className="form-input" value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })} placeholder="2024CS001" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jane@college.edu" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" className="form-input" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 9876543210" />
              </div>
              <div className="form-group">
                <label className="form-label">Course</label>
                <select className="form-select" value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })} required>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select className="form-select" value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })} required>
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <input type="text" className="form-input" value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })} placeholder="A" />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Phone</label>
                <input type="tel" className="form-input" value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })} placeholder="+91 9876543210" />
              </div>
              {!editMode && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters" required={!editMode} minLength={6} />
                </div>
              )}
            </div>
            <div className="form-group full-width">
              <label className="form-label">Address</label>
              <textarea className="form-textarea" value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Full address..." rows={2} />
            </div>
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" variant="primary">{editMode ? 'Update' : 'Create'} Student</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StudentManagement;
