import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { toast } from 'react-toastify';
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiClock, FiAlertTriangle } from 'react-icons/fi';
import './TimetableManagement.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
  '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
  '15:00 - 16:00', '16:00 - 17:00'
];

const TimetableManagement = () => {
  const [timetable, setTimetable] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [formData, setFormData] = useState({
    day: '', timeSlot: '', subject: '', teacher: '', room: '', course: '', semester: '', section: 'A', type: 'lecture'
  });

  useEffect(() => { fetchData(); }, [selectedCourse, selectedSemester, selectedSection]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetableRes, coursesRes, subjectsRes, teachersRes] = await Promise.all([
        api.get('/admin/timetable', { params: { course_id: selectedCourse, semester: selectedSemester, section: selectedSection } }),
        api.get('/admin/courses'),
        api.get('/admin/subjects'),
        api.get('/admin/teachers')
      ]);

      const formatTime = (t) => {
        if (!t) return '';
        const parts = t.split(':');
        if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
        return t;
      };

      const rawTimetable = timetableRes.data.data || timetableRes.data.timetable || timetableRes.data || [];
      const mappedTimetable = (Array.isArray(rawTimetable) ? rawTimetable : []).map(s => {
        const start = formatTime(s.start_time);
        const end = formatTime(s.end_time);
        return {
          ...s,
          _id: s.id,
          day: s.day_of_week,
          timeSlot: start && end ? `${start} - ${end}` : '09:00 - 10:00',
          course: s.course_id,
          semester: s.semester,
          section: s.section || 'A',
          subject: {
            _id: s.subject_id,
            name: s.subject_name,
            code: s.subject_code
          },
          teacher: {
            _id: s.teacher_id,
            name: s.teacher_name
          },
          type: s.slot_type || 'lecture'
        };
      });

      const rawCourses = coursesRes.data.data || coursesRes.data.courses || coursesRes.data || [];
      const mappedCourses = (Array.isArray(rawCourses) ? rawCourses : []).map(c => ({
        ...c,
        _id: c.id
      }));

      const rawSubjects = subjectsRes.data.data || subjectsRes.data.subjects || subjectsRes.data || [];
      const mappedSubjects = (Array.isArray(rawSubjects) ? rawSubjects : []).map(s => ({
        ...s,
        _id: s.id
      }));

      const rawTeachers = teachersRes.data.data || teachersRes.data.teachers || teachersRes.data || [];
      const mappedTeachers = (Array.isArray(rawTeachers) ? rawTeachers : []).map(t => ({
        ...t,
        _id: t.id
      }));

      setTimetable(mappedTimetable);
      setCourses(mappedCourses);
      setSubjects(mappedSubjects);
      setTeachers(mappedTeachers);
    } catch (error) {
      toast.error('Failed to load timetable data');
    } finally {
      setLoading(false);
    }
  };

  // Conflict detection: check if teacher or room is already booked at same day+time
  const detectConflicts = (day, timeSlot, teacher, room, excludeId = null) => {
    const conflictList = [];
    timetable.forEach(slot => {
      if (excludeId && String(slot._id) === String(excludeId)) return;
      if (slot.day === day && slot.timeSlot === timeSlot) {
        if (teacher && String(slot.teacher?._id || slot.teacher) === String(teacher)) {
          conflictList.push({ type: 'teacher', message: 'Teacher already has a class at this time' });
        }
        if (room && slot.room === room) {
          conflictList.push({ type: 'room', message: `Room ${room} is already occupied at this time` });
        }
      }
    });
    return conflictList;
  };

  const handleFormChange = (field, value) => {
    const newForm = { ...formData, [field]: value };
    setFormData(newForm);
    // Live conflict detection
    if (newForm.day && newForm.timeSlot && (newForm.teacher || newForm.room)) {
      const detected = detectConflicts(
        newForm.day, newForm.timeSlot, newForm.teacher, newForm.room,
        editMode ? selectedSlot?._id : null
      );
      setConflicts(detected);
    } else {
      setConflicts([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (conflicts.length > 0) {
      toast.error('Please resolve conflicts before saving');
      return;
    }
    try {
      if (editMode && selectedSlot) {
        await api.put(`/admin/timetable/${selectedSlot._id}`, formData);
        toast.success('Slot updated successfully');
      } else {
        await api.post('/admin/timetable', formData);
        toast.success('Slot added successfully');
      }
      
      const courseChanged = formData.course !== selectedCourse;
      const semesterChanged = String(formData.semester) !== selectedSemester;
      const sectionChanged = formData.section !== selectedSection;

      if (formData.course) setSelectedCourse(formData.course);
      if (formData.semester) setSelectedSemester(String(formData.semester));
      if (formData.section) setSelectedSection(formData.section);

      setShowModal(false);
      resetForm();
      
      if (!courseChanged && !semesterChanged && !sectionChanged) {
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save slot');
    }
  };

  const handleCellClick = (day, timeSlot) => {
    // Check if there's an existing entry
    const existing = getSlotEntry(day, timeSlot);
    if (existing) {
      handleEditSlot(existing);
    } else {
      resetForm();
      setFormData(prev => ({ ...prev, day, timeSlot, course: selectedCourse, semester: selectedSemester, section: selectedSection }));
      setShowModal(true);
    }
  };

  const handleEditSlot = (slot) => {
    setSelectedSlot(slot);
    setFormData({
      day: slot.day, timeSlot: slot.timeSlot,
      subject: slot.subject?._id || slot.subject || '',
      teacher: slot.teacher?._id || slot.teacher || '',
      room: slot.room || '', course: slot.course?._id || slot.course || '',
      semester: slot.semester || '', section: slot.section || 'A', type: slot.type || 'lecture'
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this time slot?')) return;
    try {
      await api.delete(`/admin/timetable/${slotId}`);
      toast.success('Slot deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete slot');
    }
  };

  const resetForm = () => {
    setFormData({ day: '', timeSlot: '', subject: '', teacher: '', room: '', course: '', semester: '', section: 'A', type: 'lecture' });
    setEditMode(false);
    setSelectedSlot(null);
    setConflicts([]);
  };

  // Get timetable entry for a specific day+time combination
  const getSlotEntry = (day, timeSlot) => {
    return timetable.find(s =>
      s.day === day && s.timeSlot === timeSlot &&
      (!selectedCourse || String(s.course?._id || s.course) === String(selectedCourse)) &&
      (!selectedSemester || String(s.semester) === String(selectedSemester)) &&
      (!selectedSection || String(s.section) === String(selectedSection))
    );
  };

  if (loading) return <DashboardLayout><div className="page-loader"><Loader /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="timetable-management">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title"><FiCalendar className="page-title-icon" /> Timetable Management</h1>
            <p className="page-subtitle">Visual weekly schedule management with conflict detection</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }} variant="primary" icon={<FiPlus />}>Add Slot</Button>
        </div>

        {/* Course/Semester Filter */}
        <GlassCard className="timetable-filters">
          <div className="filter-row">
            <select className="filter-select" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select className="filter-select" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
              <option value="">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <select className="filter-select" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
              <option value="A">Division A</option>
              <option value="B">Division B</option>
              <option value="C">Division C</option>
            </select>
          </div>
        </GlassCard>

        {/* Weekly Grid */}
        <GlassCard className="timetable-grid-card">
          <div className="timetable-grid-wrapper">
            <table className="timetable-grid">
              <thead>
                <tr>
                  <th className="time-header"><FiClock /> Time</th>
                  {DAYS.map(day => <th key={day} className="day-header">{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(time => (
                  <tr key={time}>
                    <td className="time-cell">{time}</td>
                    {DAYS.map(day => {
                      const entry = getSlotEntry(day, time);
                      return (
                        <td key={`${day}-${time}`} className={`slot-cell ${entry ? 'has-entry' : 'empty-cell'}`}
                          onClick={() => handleCellClick(day, time)}>
                          {entry ? (
                            <div className={`slot-content type-${entry.type || 'lecture'}`}>
                              <span className="slot-subject">{entry.subject?.name || entry.subjectName || 'Subject'}</span>
                              <span className="slot-teacher">{entry.teacher?.name || entry.teacherName || ''}</span>
                              <span className="slot-room">{entry.room || ''}</span>
                              <button className="slot-delete" onClick={(e) => { e.stopPropagation(); handleDeleteSlot(entry._id); }}>
                                <FiTrash2 />
                              </button>
                            </div>
                          ) : (
                            <div className="empty-slot">
                              <FiPlus className="empty-plus" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Add/Edit Modal */}
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}
          title={editMode ? 'Edit Time Slot' : 'Add Time Slot'} size="lg">
          <form onSubmit={handleSubmit} className="timetable-form">
            {/* Conflict Warnings */}
            {conflicts.length > 0 && (
              <div className="conflict-warnings">
                {conflicts.map((c, i) => (
                  <div key={i} className="conflict-item">
                    <FiAlertTriangle /> {c.message}
                  </div>
                ))}
              </div>
            )}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Day</label>
                <select className="form-select" value={formData.day} onChange={(e) => handleFormChange('day', e.target.value)} required>
                  <option value="">Select Day</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Time Slot</label>
                <select className="form-select" value={formData.timeSlot} onChange={(e) => handleFormChange('timeSlot', e.target.value)} required>
                  <option value="">Select Time</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Course</label>
                <select className="form-select" value={formData.course} onChange={(e) => handleFormChange('course', e.target.value)} required>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select className="form-select" value={formData.semester} onChange={(e) => handleFormChange('semester', e.target.value)} required>
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Division / Section</label>
                <select className="form-select" value={formData.section} onChange={(e) => handleFormChange('section', e.target.value)} required>
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                  <option value="C">Division C</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-select" value={formData.subject} onChange={(e) => handleFormChange('subject', e.target.value)} required>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Teacher</label>
                <select className="form-select" value={formData.teacher} onChange={(e) => handleFormChange('teacher', e.target.value)} required>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Room</label>
                <input type="text" className="form-input" value={formData.room}
                  onChange={(e) => handleFormChange('room', e.target.value)} placeholder="e.g. CS-101" required />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={formData.type} onChange={(e) => handleFormChange('type', e.target.value)}>
                  <option value="lecture">Lecture</option>
                  <option value="lab">Lab</option>
                  <option value="tutorial">Tutorial</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={conflicts.length > 0}>
                {editMode ? 'Update Slot' : 'Add Slot'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default TimetableManagement;
