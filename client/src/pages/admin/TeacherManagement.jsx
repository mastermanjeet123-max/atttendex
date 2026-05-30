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
import { FiUserCheck, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiMail, FiPhone, FiBookOpen } from 'react-icons/fi';


const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', department: '', employeeId: '', qualification: '', password: ''
  });
  const [assignData, setAssignData] = useState({ subjects: [] });
  const [assignFilter, setAssignFilter] = useState({ course: 'all', semester: 'all' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teachersRes, subjectsRes] = await Promise.all([
        api.get('/admin/teachers'),
        api.get('/admin/subjects')
      ]);
      const rawTeachers = teachersRes.data.data || teachersRes.data.teachers || teachersRes.data || [];
      const mappedTeachers = (Array.isArray(rawTeachers) ? rawTeachers : []).map(t => ({
        ...t,
        _id: t.id,
        employeeId: `TCH00${t.id}`,
        qualification: 'Ph.D. in CS',
        subjects: t.subjects || []
      }));

      const rawSubjects = subjectsRes.data.data || subjectsRes.data.subjects || subjectsRes.data || [];
      const mappedSubjects = (Array.isArray(rawSubjects) ? rawSubjects : []).map(s => ({
        ...s,
        _id: s.id
      }));

      setTeachers(mappedTeachers);
      setSubjects(mappedSubjects);
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
      department: formData.department,
      designation: formData.designation || 'Assistant Professor',
      password: formData.password
    };
    try {
      if (editMode && selectedTeacher) {
        const { password, ...updateData } = payload;
        await api.put(`/admin/teachers/${selectedTeacher._id}`, formData.password ? payload : updateData);
        toast.success('Teacher updated successfully');
      } else {
        await api.post('/admin/teachers', payload);
        toast.success('Teacher created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save teacher');
    }
  };

  const handleAssignSubjects = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/teachers/${selectedTeacher._id}/subjects`, { subjects: assignData.subjects });
      toast.success('Subjects assigned successfully');
      setShowAssignModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to assign subjects');
    }
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name || '', email: teacher.email || '', phone: teacher.phone || '',
      department: teacher.department || '', employeeId: teacher.employeeId || '',
      qualification: teacher.qualification || '', password: ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleAssign = async (teacher) => {
    setSelectedTeacher(teacher);
    setAssignFilter({ course: 'all', semester: 'all' });
    try {
      const response = await api.get(`/admin/teachers/${teacher._id}`);
      const teacherDetails = response.data.data;
      const assignedIds = (teacherDetails.assignments || []).map(a => a.subject_id || a.subject || a);
      setAssignData({ subjects: assignedIds });
    } catch (error) {
      console.error('Failed to load teacher details:', error);
      setAssignData({ subjects: [] });
    }
    setShowAssignModal(true);
  };

  const handleDelete = async (teacherId) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await api.delete(`/admin/teachers/${teacherId}`);
      toast.success('Teacher deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete teacher');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', department: '', employeeId: '', qualification: '', password: '' });
    setEditMode(false);
    setSelectedTeacher(null);
  };

  const toggleSubjectAssign = (subjectId) => {
    setAssignData(prev => ({
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(id => id !== subjectId)
        : [...prev.subjects, subjectId]
    }));
  };

  const filteredTeachers = teachers.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* Get unique courses and semesters from subjects list for filter dropdowns */
  const uniqueCourses = ['all', ...new Set(subjects.map(s => s.course_name).filter(Boolean))];
  const uniqueSemesters = ['all', ...new Set(
    subjects
      .filter(s => assignFilter.course === 'all' || s.course_name === assignFilter.course)
      .map(s => String(s.semester))
      .filter(Boolean)
  ).values()].sort((a, b) => a === 'all' ? -1 : Number(a) - Number(b));

  const filteredAssignSubjects = subjects.filter(s => {
    if (assignFilter.course !== 'all' && s.course_name !== assignFilter.course) return false;
    if (assignFilter.semester !== 'all' && String(s.semester) !== assignFilter.semester) return false;
    return true;
  });

  const columns = [
    { header: 'ID', accessor: 'employeeId', render: (val) => <Badge text={val || 'N/A'} variant="primary" /> },
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email', render: (val) => <span className="email-cell"><FiMail className="cell-icon" /> {val}</span> },
    { header: 'Department', accessor: 'department' },
    { header: 'Subjects', accessor: 'assigned_subjects', render: (val) => (
      <span className="subjects-count">{val || 0} assigned</span>
    )},
    {
      header: 'Actions', accessor: '_id',
      render: (val, row) => (
        <div className="action-buttons">
          <button className="action-btn assign-btn" onClick={() => handleAssign(row)} title="Assign Subjects">
            <FiBookOpen />
          </button>
          <button className="action-btn edit-btn" onClick={() => handleEdit(row)} title="Edit"><FiEdit2 /></button>
          <button className="action-btn delete-btn" onClick={() => handleDelete(val)} title="Delete"><FiTrash2 /></button>
        </div>
      )
    }
  ];

  if (loading) return <DashboardLayout><div className="page-loader"><Loader /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="teacher-management">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title"><FiUserCheck className="page-title-icon" /> Teacher Management</h1>
            <p className="page-subtitle">Manage faculty members and their subject assignments</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }} variant="primary" icon={<FiPlus />}>Add Teacher</Button>
        </div>

        <GlassCard className="search-card">
          <div className="search-input-wrap">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search teachers..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
            {searchTerm && <button className="search-clear" onClick={() => setSearchTerm('')}><FiX /></button>}
          </div>
        </GlassCard>

        <GlassCard className="table-card">
          {filteredTeachers.length > 0 ? (
            <DataTable columns={columns} data={filteredTeachers} />
          ) : (
            <EmptyState message="No teachers found" icon={<FiUserCheck />} />
          )}
        </GlassCard>

        {/* Add/Edit Teacher Modal */}
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}
          title={editMode ? 'Edit Teacher' : 'Add New Teacher'} size="lg">
          <form onSubmit={handleSubmit} className="teacher-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dr. John Doe" required />
              </div>
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input type="text" className="form-input" value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="TCH001" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@college.edu" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" className="form-input" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210" />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input type="text" className="form-input" value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Computer Science" required />
              </div>
              <div className="form-group">
                <label className="form-label">Qualification</label>
                <input type="text" className="form-input" value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="Ph.D. in CS" />
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
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" variant="primary">{editMode ? 'Update' : 'Create'} Teacher</Button>
            </div>
          </form>
        </Modal>

        {/* Assign Subjects Modal */}
        <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)}
          title={`Assign Subjects to ${selectedTeacher?.name || ''}`} size="lg">
          <form onSubmit={handleAssignSubjects} className="assign-form">
            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 600 }}>Filter by Course</label>
                <select
                  value={assignFilter.course}
                  onChange={e => setAssignFilter(f => ({ ...f, course: e.target.value, semester: 'all' }))}
                  style={{ background: '#1a1932', color: '#fff', border: '1px solid #3d3b6e', borderRadius: '6px', padding: '8px 12px', minWidth: '180px' }}
                >
                  {uniqueCourses.map(c => (
                    <option key={c} value={c}>{c === 'all' ? 'All Courses' : c}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 600 }}>Filter by Semester</label>
                <select
                  value={assignFilter.semester}
                  onChange={e => setAssignFilter(f => ({ ...f, semester: e.target.value }))}
                  style={{ background: '#1a1932', color: '#fff', border: '1px solid #3d3b6e', borderRadius: '6px', padding: '8px 12px', minWidth: '140px' }}
                >
                  {uniqueSemesters.map(s => (
                    <option key={s} value={s}>{s === 'all' ? 'All Semesters' : `Semester ${s}`}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="assign-hint" style={{ marginBottom: '12px', opacity: 0.7, fontSize: '0.85rem' }}>
              {filteredAssignSubjects.length} subject{filteredAssignSubjects.length !== 1 ? 's' : ''} shown — {assignData.subjects.length} selected total
            </p>
            <div className="subjects-checklist">
              {filteredAssignSubjects.length > 0 ? filteredAssignSubjects.map(subject => (
                <label key={subject._id} className={`subject-check-item ${assignData.subjects.includes(subject._id) ? 'selected' : ''}`}>
                  <input type="checkbox" checked={assignData.subjects.includes(subject._id)}
                    onChange={() => toggleSubjectAssign(subject._id)} />
                  <div className="subject-check-info">
                    <span className="subject-check-name">{subject.name}</span>
                    <span className="subject-check-code">
                      {subject.code} &bull; {subject.course_name} &bull; Sem {subject.semester}
                    </span>
                  </div>
                </label>
              )) : (
                <EmptyState message="No subjects match the selected filters" icon={<FiBookOpen />} />
              )}
            </div>
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => setShowAssignModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save Assignments</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default TeacherManagement;
