import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { FiAward, FiUsers, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './GradeManagement.css';

const GradeManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [saving, setSaving] = useState(false);

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
        fetchGradesAndStudents(data[0]);
      }
    } catch (error) {
      toast.error('Failed to load assigned subjects');
      console.error(error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchGradesAndStudents = async (subjectAssignment) => {
    if (!subjectAssignment) return;
    try {
      setLoadingGrades(true);
      const { subject_id, course_id, semester, section } = subjectAssignment;

      // 1. Fetch class student roll
      const studentsRes = await api.get('/teacher/students', {
        params: { subject_id, course_id, semester, section }
      });
      const studentList = studentsRes.data.data || [];

      // 2. Fetch existing grades
      const gradesRes = await api.get('/teacher/grades', {
        params: { subject_id }
      });
      const gradesList = gradesRes.data.data || [];

      // 3. Merge them on student id
      const enrichedStudents = studentList.map(s => {
        const studentGrades = gradesList.filter(g => g.student_id === s.id);
        const assignmentGrade = studentGrades.find(g => g.exam_type === 'assignment');
        const internal1Grade = studentGrades.find(g => g.exam_type === 'internal_1');
        const internal2Grade = studentGrades.find(g => g.exam_type === 'internal_2');
        const finalGrade = studentGrades.find(g => g.exam_type === 'final');

        const attendancePct = s.total_classes > 0 ? (s.attended_classes / s.total_classes) * 100 : 0;

        return {
          id: s.id,
          rollNo: s.roll_number,
          name: s.name,
          attendedClasses: s.attended_classes || 0,
          totalClasses: s.total_classes || 0,
          attendancePct: Number(attendancePct.toFixed(2)),
          assignment: assignmentGrade ? Number(assignmentGrade.marks_obtained) : 0,
          internal_1: internal1Grade ? Number(internal1Grade.marks_obtained) : 0,
          internal_2: internal2Grade ? Number(internal2Grade.marks_obtained) : 0,
          final: finalGrade ? Number(finalGrade.marks_obtained) : 0
        };
      });

      setStudents(enrichedStudents);
    } catch (error) {
      toast.error('Failed to load grades data');
      console.error(error);
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleSubjectChange = (e) => {
    const index = e.target.value;
    setSelectedSubjectIndex(index);
    if (index !== '') {
      fetchGradesAndStudents(subjects[Number(index)]);
    } else {
      setStudents([]);
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    let numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) numValue = 0;

    // Check bounds
    if (field === 'assignment' && numValue > 10) numValue = 10;
    if (field === 'internal_1' && numValue > 20) numValue = 20;
    if (field === 'internal_2' && numValue > 20) numValue = 20;
    if (field === 'final' && numValue > 50) numValue = 50;

    setStudents(students.map(s => {
      if (s.id === studentId) {
        const updated = { ...s, [field]: numValue };
        
        // Dynamic eligibility check in-memory
        const totalInternals = (field === 'assignment' ? numValue : s.assignment) +
                               (field === 'internal_1' ? numValue : s.internal_1) +
                               (field === 'internal_2' ? numValue : s.internal_2);
        
        const isEligibleScore = totalInternals >= 20;
        const isEligibleAtt = s.attendancePct >= 75;
        
        if (!isEligibleScore || !isEligibleAtt) {
          updated.final = 0;
        }
        return updated;
      }
      return s;
    }));
  };

  const handleSave = async () => {
    if (selectedSubjectIndex === '') {
      toast.warn('Select a subject first');
      return;
    }

    try {
      setSaving(true);
      const currentSubject = subjects[Number(selectedSubjectIndex)];

      // Post grades for all students
      for (const s of students) {
        // Post assignment (project work out of 10)
        await api.post('/teacher/grades', {
          student_id: s.id,
          subject_id: currentSubject.subject_id,
          exam_type: 'assignment',
          marks_obtained: s.assignment,
          total_marks: 10
        });

        // Post internal_1
        await api.post('/teacher/grades', {
          student_id: s.id,
          subject_id: currentSubject.subject_id,
          exam_type: 'internal_1',
          marks_obtained: s.internal_1,
          total_marks: 20
        });

        // Post internal_2
        await api.post('/teacher/grades', {
          student_id: s.id,
          subject_id: currentSubject.subject_id,
          exam_type: 'internal_2',
          marks_obtained: s.internal_2,
          total_marks: 20
        });

        const isEligible = s.attendancePct >= 75 && (s.assignment + s.internal_1 + s.internal_2) >= 20;

        // Post final (only if eligible, else reset to 0 in database)
        await api.post('/teacher/grades', {
          student_id: s.id,
          subject_id: currentSubject.subject_id,
          exam_type: 'final',
          marks_obtained: isEligible ? s.final : 0,
          total_marks: 50
        });
      }

      toast.success('Grades saved successfully!');
    } catch (error) {
      toast.error('Failed to save some grades');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (students.length === 0) return;
    const subjectLabel = selectedSubject
      ? `${selectedSubject.name} (${selectedSubject.code}) - Sem ${selectedSubject.semester}`
      : 'Grade Report';

    const headers = [
      'Roll No', 'Student Name', 'Attendance %',
      'Assignment/10', 'Internal 1/20', 'Internal 2/20',
      'End Sem/50', 'Total/100', 'Status'
    ];

    const rows = students.map(s => {
      const isEligibleAtt = s.attendancePct >= 75;
      const totalInternals = s.assignment + s.internal_1 + s.internal_2;
      const isEligible = isEligibleAtt && totalInternals >= 20;
      const total = Number((s.assignment + s.internal_1 + s.internal_2 + (isEligible ? s.final : 0)).toFixed(2));
      const status = isEligible ? 'ELIGIBLE'
        : (!isEligibleAtt && totalInternals < 20) ? 'INELIGIBLE (Both)'
        : !isEligibleAtt ? 'INELIGIBLE (Low Att)'
        : 'INELIGIBLE (Low Score)';
      return [
        `"${s.rollNo}"`,
        `"${s.name}"`,
        s.attendancePct,
        s.assignment,
        s.internal_1,
        s.internal_2,
        isEligible ? s.final : 0,
        total,
        `"${status}"`
      ].join(',');
    });

    const csvContent = [
      `# ${subjectLabel}`,
      headers.join(','),
      ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filename = `grades_${selectedSubject?.code || 'export'}_sem${selectedSubject?.semester || ''}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="grade-management-page">
        <header className="page-header">
          <h1>Grade Management</h1>
          <p>Update assignments, midterms, and final exam scores for your classes</p>
        </header>

        {subjects.length > 0 ? (
          <>
            <GlassCard className="subject-selector" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ color: '#8d8dbe' }}>Select Subject:</label>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn-save-grades" onClick={handleSave} disabled={saving || students.length === 0} style={{ padding: '10px 20px', borderRadius: '6px' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={exportCSV}
                  disabled={students.length === 0}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', borderRadius: '6px',
                    background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.3)',
                    color: '#00f2fe', cursor: students.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: students.length === 0 ? 0.4 : 1, fontWeight: 600, fontSize: '0.9rem'
                  }}
                >
                  <FiDownload /> Export CSV
                </button>
              </div>
            </GlassCard>

            {loadingGrades ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <Loader />
              </div>
            ) : students.length > 0 ? (
              <GlassCard className="grades-card">
                <div className="table-responsive">
                  <table className="grades-table">
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Attendance (%)</th>
                        <th>Assignment/Project (10)</th>
                        <th>Internal 1 (20)</th>
                        <th>Internal 2 (20)</th>
                        <th>End Sem (50)</th>
                        <th>Status</th>
                        <th>Total (100)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => {
                        const isEligibleAtt = student.attendancePct >= 75;
                        const totalInternalsCombined = student.assignment + student.internal_1 + student.internal_2;
                        const isEligibleScore = totalInternalsCombined >= 20;
                        const isEligible = isEligibleAtt && isEligibleScore;
                        
                        const totalScore = Number((student.assignment + student.internal_1 + student.internal_2 + (isEligible ? student.final : 0)).toFixed(2));
                        
                        // Formulate descriptive status text for tooltip/badge
                        let statusText = 'ELIGIBLE';
                        let badgeColor = '#00ff87';
                        let badgeBg = 'rgba(0, 255, 135, 0.1)';
                        
                        if (!isEligible) {
                          badgeColor = '#ff3366';
                          badgeBg = 'rgba(255, 51, 102, 0.1)';
                          if (!isEligibleAtt && !isEligibleScore) {
                            statusText = 'INELIGIBLE (Both)';
                          } else if (!isEligibleAtt) {
                            statusText = 'INELIGIBLE (Low Att)';
                          } else {
                            statusText = 'INELIGIBLE (Low Score)';
                          }
                        }

                        return (
                          <tr key={student.id}>
                            <td>{student.rollNo}</td>
                            <td className="student-name" style={{ fontWeight: 600 }}>{student.name}</td>
                            <td>
                              <span style={{ 
                                fontWeight: 'bold', 
                                color: isEligibleAtt ? '#00f2fe' : '#ff3366',
                                background: isEligibleAtt ? 'rgba(0, 242, 254, 0.05)' : 'rgba(255, 51, 102, 0.05)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '13px'
                              }}>
                                {student.attendancePct}%
                              </span>
                              <span style={{ fontSize: '11px', opacity: 0.6, display: 'block', marginTop: '2px' }}>
                                ({student.attendedClasses}/{student.totalClasses} classes)
                              </span>
                            </td>
                            <td>
                              <input 
                                type="number" 
                                value={student.assignment} 
                                max="10" 
                                min="0" 
                                onChange={(e) => handleGradeChange(student.id, 'assignment', e.target.value)}
                                className="grade-input" 
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                value={student.internal_1} 
                                max="20" 
                                min="0" 
                                onChange={(e) => handleGradeChange(student.id, 'internal_1', e.target.value)}
                                className="grade-input" 
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                value={student.internal_2} 
                                max="20" 
                                min="0" 
                                onChange={(e) => handleGradeChange(student.id, 'internal_2', e.target.value)}
                                className="grade-input" 
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                value={isEligible ? student.final : 0} 
                                max="50" 
                                min="0" 
                                disabled={!isEligible}
                                onChange={(e) => handleGradeChange(student.id, 'final', e.target.value)}
                                className={`grade-input ${!isEligible ? 'disabled' : ''}`} 
                                style={!isEligible ? { opacity: 0.4, cursor: 'not-allowed', backgroundColor: 'rgba(255,0,0,0.1)' } : {}}
                              />
                            </td>
                            <td>
                              <span style={{ color: badgeColor, background: badgeBg, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                {statusText}
                              </span>
                            </td>
                            <td className="total-score" style={{ fontWeight: 600, color: isEligible ? '#00f2fe' : '#ff3366' }}>
                              {totalScore}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
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
            icon={<FiAward />} 
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default GradeManagement;
