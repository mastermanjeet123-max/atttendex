import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { FiCheckSquare, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './MarkAttendance.css';

const MarkAttendance = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotTime, setSlotTime] = useState('09:00:00');
  const [isExtraClass, setIsExtraClass] = useState(false);

  useEffect(() => {
    fetchAssignedSubjects();
  }, []);

  const fetchAssignedSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const response = await api.get('/teacher/subjects');
      const data = response.data.data || [];
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubjectIndex('0');
        fetchStudentsForSubject(data[0]);
      }
    } catch (error) {
      toast.error('Failed to load assigned subjects');
      console.error(error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchStudentsForSubject = async (subjectAssignment) => {
    if (!subjectAssignment) return;
    try {
      setLoadingStudents(true);
      const { subject_id, course_id, semester, section } = subjectAssignment;
      const response = await api.get('/teacher/students', {
        params: { subject_id, course_id, semester, section }
      });
      const studentList = response.data.data || [];
      // Enrich students list with a default present status
      setStudents(studentList.map(s => ({ ...s, status: 'present' })));
    } catch (error) {
      toast.error('Failed to load class students');
      console.error(error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSubjectChange = (e) => {
    const index = e.target.value;
    setSelectedSubjectIndex(index);
    if (index !== '') {
      fetchStudentsForSubject(subjects[Number(index)]);
    } else {
      setStudents([]);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setStudents(students.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const markAll = (status) => {
    setStudents(students.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    if (selectedSubjectIndex === '') {
      toast.warn('Please select a subject first.');
      return;
    }
    if (students.length === 0) {
      toast.warn('No student records available.');
      return;
    }

    try {
      setSaving(true);
      const currentSubject = subjects[Number(selectedSubjectIndex)];
      const attendanceData = students.map(s => ({
        student_id: s.id,
        status: s.status,
        remarks: isExtraClass ? 'Extra Class' : ''
      }));

      await api.post('/teacher/attendance', {
        subject_id: currentSubject.subject_id,
        date,
        slot_time: slotTime,
        attendanceData
      });

      toast.success('Attendance saved successfully!');
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to save attendance';
      toast.error(errMsg);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loadingSubjects) {
    return (
      <DashboardLayout role="teacher">
        <div className="page-loader" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader />
        </div>
      </DashboardLayout>
    );
  }

  const selectedSubject = selectedSubjectIndex !== '' ? subjects[Number(selectedSubjectIndex)] : null;

  return (
    <DashboardLayout role="teacher">
      <div className="mark-attendance-page">
        <header className="page-header">
          <h1>Mark Attendance</h1>
          <p>Record daily class attendance for your assigned subjects</p>
        </header>

        {subjects.length > 0 ? (
          <>
            <GlassCard className="subject-selector" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ marginRight: '8px', color: '#8d8dbe' }}>Subject:</label>
                  <select 
                    value={selectedSubjectIndex} 
                    onChange={handleSubjectChange}
                    style={{ backgroundColor: '#1a1932', color: '#fff', border: '1px solid #3d3b6e', borderRadius: '6px', padding: '8px 12px' }}
                  >
                    {subjects.map((sub, index) => (
                      <option key={sub.assignment_id} value={index}>
                        {sub.name} ({sub.code}) - Sem {sub.semester} Sec {sub.section}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ marginRight: '8px', color: '#8d8dbe' }}>Date:</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    style={{ backgroundColor: '#1a1932', color: '#fff', border: '1px solid #3d3b6e', borderRadius: '6px', padding: '8px 12px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ marginRight: '8px', color: '#8d8dbe' }}>Slot:</label>
                  <select 
                    value={slotTime} 
                    onChange={(e) => setSlotTime(e.target.value)}
                    style={{ backgroundColor: '#1a1932', color: '#fff', border: '1px solid #3d3b6e', borderRadius: '6px', padding: '8px 12px' }}
                  >
                    <option value="09:00:00">09:00 AM</option>
                    <option value="10:00:00">10:00 AM</option>
                    <option value="11:00:00">11:00 AM</option>
                    <option value="12:00:00">12:00 PM</option>
                    <option value="14:00:00">02:00 PM</option>
                    <option value="15:00:00">03:00 PM</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="extra-class-checkbox"
                    checked={isExtraClass}
                    onChange={(e) => setIsExtraClass(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ff6584' }}
                  />
                  <label htmlFor="extra-class-checkbox" style={{ color: '#ff6584', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', userSelect: 'none' }}>⚡ Extra Class</label>
                </div>
              </div>
              <div className="save-actions">
                <button className="btn-save" onClick={handleSave} disabled={saving || students.length === 0} style={{ padding: '10px 20px', borderRadius: '6px' }}>
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </GlassCard>

            {loadingStudents ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <Loader />
              </div>
            ) : students.length > 0 ? (
              <>
                <GlassCard className="attendance-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '16px 20px' }}>
                  <div className="bulk-actions">
                    <span className="actions-label" style={{ marginRight: '12px', color: '#8d8dbe' }}>Bulk Mark:</span>
                    <button className="btn-bulk present" onClick={() => markAll('present')} style={{ marginRight: '8px' }}>All Present</button>
                    <button className="btn-bulk absent" onClick={() => markAll('absent')}>All Absent</button>
                  </div>
                  <span style={{ color: '#8d8dbe', fontSize: '0.9rem' }}>Enrolled Students: <strong style={{ color: '#fff' }}>{students.length}</strong></span>
                </GlassCard>

                <GlassCard className="student-list-card">
                  <div className="table-responsive">
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th className="text-center">Present</th>
                          <th className="text-center">Absent</th>
                          <th className="text-center">Late</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(student => (
                          <tr key={student.id} className={student.status}>
                            <td>{student.roll_number}</td>
                            <td className="student-name">{student.name}</td>
                            <td className="text-center">
                              <label className="radio-container">
                                <input 
                                  type="radio" 
                                  name={`status-${student.id}`} 
                                  checked={student.status === 'present'}
                                  onChange={() => handleStatusChange(student.id, 'present')}
                                />
                                <span className="checkmark present"></span>
                              </label>
                            </td>
                            <td className="text-center">
                              <label className="radio-container">
                                <input 
                                  type="radio" 
                                  name={`status-${student.id}`} 
                                  checked={student.status === 'absent'}
                                  onChange={() => handleStatusChange(student.id, 'absent')}
                                />
                                <span className="checkmark absent"></span>
                              </label>
                            </td>
                            <td className="text-center">
                              <label className="radio-container">
                                <input 
                                  type="radio" 
                                  name={`status-${student.id}`} 
                                  checked={student.status === 'late'}
                                  onChange={() => handleStatusChange(student.id, 'late')}
                                />
                                <span className="checkmark late"></span>
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </>
            ) : (
              <EmptyState 
                message={`No students found enrolled in ${selectedSubject?.course_name || 'this class'}.`}
                icon={<FiUsers />} 
              />
            )}
          </>
        ) : (
          <EmptyState 
            message="You have no subjects assigned by the administrator yet."
            icon={<FiCheckSquare />} 
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;
