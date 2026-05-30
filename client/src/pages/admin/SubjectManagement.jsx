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
import { FiBookOpen, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiClock } from 'react-icons/fi';
import './SubjectManagement.css';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    course: '',
    semester: '',
    totalClasses: '',
    duration: '',
    credits: '',
    type: 'theory'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, coursesRes] = await Promise.all([
        api.get('/admin/subjects'),
        api.get('/admin/courses')
      ]);
      const rawSubjects = subjectsRes.data.data || subjectsRes.data.subjects || subjectsRes.data || [];
      const mappedSubjects = (Array.isArray(rawSubjects) ? rawSubjects : []).map(s => ({
        ...s,
        _id: s.id,
        course: {
          _id: s.course_id,
          name: s.course_name,
          code: s.course_code
        },
        totalClasses: s.credits * 10 || 30
      }));

      const rawCourses = coursesRes.data.data || coursesRes.data.courses || coursesRes.data || [];
      const mappedCourses = (Array.isArray(rawCourses) ? rawCourses : []).map(c => ({
        ...c,
        _id: c.id
      }));

      setSubjects(mappedSubjects);
      setCourses(mappedCourses);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      code: formData.code,
      course_id: formData.course,
      semester: Number(formData.semester),
      credits: Number(formData.credits || 3),
      type: formData.type || 'theory'
    };
    try {
      if (editMode && selectedSubject) {
        await api.put(`/admin/subjects/${selectedSubject._id}`, payload);
        toast.success('Subject updated successfully');
      } else {
        await api.post('/admin/subjects', payload);
        toast.success('Subject created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save subject');
    }
  };

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      course: subject.course?._id || subject.course || '',
      semester: subject.semester || '',
      totalClasses: subject.totalClasses || '',
      duration: subject.duration || '',
      credits: subject.credits || '',
      type: subject.type || 'theory'
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.delete(`/admin/subjects/${subjectId}`);
      toast.success('Subject deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete subject');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', course: '', semester: '', totalClasses: '', duration: '', credits: '', type: 'theory' });
    setEditMode(false);
    setSelectedSubject(null);
  };

  const filteredSubjects = subjects.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Code', accessor: 'code', render: (val) => <Badge text={val} variant="primary" /> },
    { header: 'Subject Name', accessor: 'name' },
    { header: 'Course', accessor: 'course', render: (val) => val?.name || val || 'N/A' },
    { header: 'Semester', accessor: 'semester' },
    { header: 'Total Classes', accessor: 'totalClasses' },
    { header: 'Credits', accessor: 'credits' },
    { header: 'Type', accessor: 'type', render: (val) => (
      <Badge text={val || 'theory'} variant={val === 'practical' ? 'warning' : 'info'} />
    )},
    {
      header: 'Actions',
      accessor: '_id',
      render: (val, row) => (
        <div className="action-buttons">
          <button className="action-btn edit-btn" onClick={() => handleEdit(row)}><FiEdit2 /></button>
          <button className="action-btn delete-btn" onClick={() => handleDelete(val)}><FiTrash2 /></button>
        </div>
      )
    }
  ];

  if (loading) {
    return <DashboardLayout><div className="page-loader"><Loader /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="subject-management">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              <FiBookOpen className="page-title-icon" />
              Subject Management
            </h1>
            <p className="page-subtitle">Manage subjects, credits, and class schedules</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }} variant="primary" icon={<FiPlus />}>
            Add Subject
          </Button>
        </div>

        <GlassCard className="search-card">
          <div className="search-input-wrap">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && <button className="search-clear" onClick={() => setSearchTerm('')}><FiX /></button>}
          </div>
        </GlassCard>

        <GlassCard className="table-card">
          {filteredSubjects.length > 0 ? (
            <DataTable columns={columns} data={filteredSubjects} />
          ) : (
            <EmptyState message={searchTerm ? 'No subjects match your search' : 'No subjects found'} icon={<FiBookOpen />} />
          )}
        </GlassCard>

        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); resetForm(); }}
          title={editMode ? 'Edit Subject' : 'Add New Subject'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="subject-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input type="text" className="form-input" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Data Structures" required />
              </div>
              <div className="form-group">
                <label className="form-label">Subject Code</label>
                <input type="text" className="form-input" value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. CS201" required />
              </div>
              <div className="form-group">
                <label className="form-label">Course</label>
                <select className="form-select" value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })} required>
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <input type="number" className="form-input" value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  placeholder="e.g. 3" min="1" required />
              </div>
              <div className="form-group">
                <label className="form-label">Total Classes</label>
                <input type="number" className="form-input" value={formData.totalClasses}
                  onChange={(e) => setFormData({ ...formData, totalClasses: e.target.value })}
                  placeholder="e.g. 40" min="1" required />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (hours/class)</label>
                <input type="number" className="form-input" value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 1" min="1" />
              </div>
              <div className="form-group">
                <label className="form-label">Credits</label>
                <input type="number" className="form-input" value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  placeholder="e.g. 4" min="1" />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="theory">Theory</option>
                  <option value="practical">Practical</option>
                  <option value="elective">Elective</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" variant="primary">{editMode ? 'Update Subject' : 'Create Subject'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default SubjectManagement;
