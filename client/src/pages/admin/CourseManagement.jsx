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
import { FiBook, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import './CourseManagement.css';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    duration: '',
    totalSemesters: '',
    description: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/courses');
      const rawCourses = response.data.data || response.data.courses || response.data || [];
      const mappedCourses = (Array.isArray(rawCourses) ? rawCourses : []).map(c => ({
        ...c,
        _id: c.id,
        duration: c.duration_years,
        totalSemesters: c.total_semesters,
        department: c.department || 'Computer Science'
      }));
      setCourses(mappedCourses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      code: formData.code,
      duration_years: Number(formData.duration),
      total_semesters: Number(formData.totalSemesters),
      description: formData.description,
      department: formData.department
    };
    try {
      if (editMode && selectedCourse) {
        await api.put(`/admin/courses/${selectedCourse._id}`, payload);
        toast.success('Course updated successfully');
      } else {
        await api.post('/admin/courses', payload);
        toast.success('Course created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Failed to save course:', error);
      toast.error(error.response?.data?.message || 'Failed to save course');
    }
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name || '',
      code: course.code || '',
      department: course.department || '',
      duration: course.duration || '',
      totalSemesters: course.totalSemesters || '',
      description: course.description || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/admin/courses/${courseId}`);
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('Failed to delete course');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', department: '', duration: '', totalSemesters: '', description: '' });
    setEditMode(false);
    setSelectedCourse(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredCourses = courses.filter(course =>
    course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Code', accessor: 'code', render: (val) => <Badge text={val} variant="primary" /> },
    { header: 'Course Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Duration', accessor: 'duration', render: (val) => `${val} years` },
    { header: 'Semesters', accessor: 'totalSemesters' },
    {
      header: 'Actions',
      accessor: '_id',
      render: (val, row) => (
        <div className="action-buttons">
          <button className="action-btn edit-btn" onClick={() => handleEdit(row)} title="Edit">
            <FiEdit2 />
          </button>
          <button className="action-btn delete-btn" onClick={() => handleDelete(val)} title="Delete">
            <FiTrash2 />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-loader"><Loader /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="course-management">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">
              <FiBook className="page-title-icon" />
              Course Management
            </h1>
            <p className="page-subtitle">Manage all courses and departments</p>
          </div>
          <Button onClick={openAddModal} variant="primary" icon={<FiPlus />}>
            Add Course
          </Button>
        </div>

        {/* Search Bar */}
        <GlassCard className="search-card">
          <div className="search-input-wrap">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, code, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')}>
                <FiX />
              </button>
            )}
          </div>
        </GlassCard>

        {/* Course Table */}
        <GlassCard className="table-card">
          {filteredCourses.length > 0 ? (
            <DataTable columns={columns} data={filteredCourses} />
          ) : (
            <EmptyState
              message={searchTerm ? 'No courses match your search' : 'No courses found. Add your first course!'}
              icon={<FiBook />}
            />
          )}
        </GlassCard>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); resetForm(); }}
          title={editMode ? 'Edit Course' : 'Add New Course'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="course-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Course Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bachelor of Technology"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Course Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. BTECH"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Computer Science"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (Years)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 4"
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Semesters</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.totalSemesters}
                  onChange={(e) => setFormData({ ...formData, totalSemesters: e.target.value })}
                  placeholder="e.g. 8"
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="form-group full-width">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the course..."
                rows={3}
              />
            </div>
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editMode ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default CourseManagement;
