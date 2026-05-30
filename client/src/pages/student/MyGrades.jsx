import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import AttendanceChart from '../../components/charts/AttendanceChart';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { FiAward, FiAlertTriangle, FiCheckCircle, FiLock, FiBookOpen } from 'react-icons/fi';
import './MyGrades.css';

const MyGrades = () => {
  const [subjectsData, setSubjectsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGradesAndAttendance();
  }, []);

  const fetchGradesAndAttendance = async () => {
    try {
      setLoading(true);
      // Fetch both grades and attendance concurrently
      const [gradesRes, attendanceRes] = await Promise.all([
        api.get('/student/grades'),
        api.get('/student/attendance')
      ]);

      const grades = gradesRes.data.data || [];
      const attendance = attendanceRes.data.data || [];

      // Group grades by subject code
      const gradesBySubject = {};
      grades.forEach(g => {
        if (!gradesBySubject[g.subject_code]) {
          gradesBySubject[g.subject_code] = {};
        }
        gradesBySubject[g.subject_code][g.exam_type] = Number(g.marks_obtained);
      });

      // Merge attendance and grades
      const merged = attendance.map(att => {
        const subGrades = gradesBySubject[att.subject_code] || {};
        const assignment = subGrades['assignment'] !== undefined ? subGrades['assignment'] : 0;
        const internal_1 = subGrades['internal_1'] !== undefined ? subGrades['internal_1'] : 0;
        const internal_2 = subGrades['internal_2'] !== undefined ? subGrades['internal_2'] : 0;
        const final = subGrades['final'] !== undefined ? subGrades['final'] : null;

        const attendancePct = att.total_classes > 0 ? (att.classes_attended / att.total_classes) * 100 : 0;
        const totalInternals = assignment + internal_1 + internal_2;

        const isEligibleAtt = attendancePct >= 75;
        const isEligibleScore = totalInternals >= 20;
        const isEligible = isEligibleAtt && isEligibleScore;

        // Calculate total marks out of 100
        const totalCurrent = Number((assignment + internal_1 + internal_2 + (isEligible && final !== null ? final : 0)).toFixed(2));

        return {
          id: att.subject_id,
          subjectName: att.subject_name,
          subjectCode: att.subject_code,
          classesAttended: att.classes_attended,
          totalClasses: att.total_classes,
          attendancePct: Number(attendancePct.toFixed(2)),
          assignment,
          internal_1,
          internal_2,
          final,
          isEligibleAtt,
          isEligibleScore,
          isEligible,
          totalCurrent,
          totalInternals
        };
      });

      setSubjectsData(merged);
    } catch (error) {
      console.error('Failed to load grades data', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = subjectsData.map(s => ({
    label: s.subjectCode,
    value: s.totalCurrent,
    color: s.isEligible ? 'var(--primary-color)' : '#ff3366'
  }));

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="my-grades-page">
        <header className="page-header">
          <h1>Academic Grades Report</h1>
          <p>Strict 100-mark schema: 10 Project/Assignment, 40 Internals (ISA 1 & 2), and 50 End Sem.</p>
        </header>

        {subjectsData.length > 0 ? (
          <div className="grades-content">
            <div className="grades-list">
              {subjectsData.map(grade => (
                <GlassCard key={grade.id} className={`grade-card ${!grade.isEligible ? 'ineligible-card' : ''}`}>
                  <div className="grade-card-header">
                    <div>
                      <h2>{grade.subjectName}</h2>
                      <span className="subject-code">{grade.subjectCode}</span>
                    </div>
                    <div>
                      {grade.isEligible ? (
                        <span className="badge-status eligible-badge">
                          <FiCheckCircle /> Eligible
                        </span>
                      ) : (
                        <span className="badge-status ineligible-badge">
                          <FiAlertTriangle /> Not Eligible
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="scores-grid">
                    <div className="score-item">
                      <span className="score-label">Attendance</span>
                      <div className="score-value">
                        <span className="earned" style={{ color: grade.isEligibleAtt ? 'var(--primary-color)' : '#ff3366' }}>
                          {grade.attendancePct}%
                        </span>
                      </div>
                      <span className="score-detail">({grade.classesAttended}/{grade.totalClasses} classes)</span>
                    </div>

                    <div className="score-item">
                      <span className="score-label">Assignment (10)</span>
                      <div className="score-value">
                        <span className="earned">{grade.assignment}</span>
                        <span className="max">/10</span>
                      </div>
                    </div>

                    <div className="score-item">
                      <span className="score-label">ISA 1 (20)</span>
                      <div className="score-value">
                        <span className="earned">{grade.internal_1}</span>
                        <span className="max">/20</span>
                      </div>
                    </div>

                    <div className="score-item">
                      <span className="score-label">ISA 2 (20)</span>
                      <div className="score-value">
                        <span className="earned">{grade.internal_2}</span>
                        <span className="max">/20</span>
                      </div>
                    </div>

                    <div className="score-item">
                      <span className="score-label">End Sem (50)</span>
                      <div className="score-value">
                        {!grade.isEligible ? (
                          <span className="earned ineligible-text">
                            <FiLock style={{ fontSize: '16px', marginRight: '4px' }} /> Locked
                          </span>
                        ) : (
                          <>
                            <span className="earned">{grade.final !== null ? grade.final : '-'}</span>
                            <span className="max">/50</span>
                          </>
                        )}
                      </div>
                      <span className="score-detail">
                        {!grade.isEligible ? 'Locked' : grade.final !== null ? 'Graded' : 'Not Graded Yet'}
                      </span>
                    </div>
                  </div>

                  {!grade.isEligible && (
                    <div className="eligibility-warning">
                      <FiAlertTriangle className="warn-icon" />
                      <div className="warn-content">
                        <strong>Academic Lockout: Ineligible for End Sem Exam</strong>
                        <p>
                          {!grade.isEligibleAtt && !grade.isEligibleScore ? (
                            <>Your attendance is <strong>{grade.attendancePct}%</strong> (requires &ge; 75%) and your combined internals and project score is <strong>{grade.totalInternals}/50</strong> (requires &ge; 20).</>
                          ) : !grade.isEligibleAtt ? (
                            <>Your attendance is <strong>{grade.attendancePct}%</strong> (below the minimum required <strong>75%</strong> overall in this subject).</>
                          ) : (
                            <>Your combined internals and project score is <strong>{grade.totalInternals}/50</strong> (below the minimum required <strong>20/50</strong> to qualify).</>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="total-score">
                    <span>Overall Grade Total:</span>
                    <strong style={{ color: grade.isEligible ? '#00f2fe' : '#ff3366' }}>
                      {grade.totalCurrent} / 100 Marks
                    </strong>
                  </div>
                </GlassCard>
              ))}
            </div>

            <div className="performance-chart">
              <GlassCard className="chart-card">
                <h2>100-Mark Performance</h2>
                <p className="chart-desc">Your overall marks scaled out of 100 per subject</p>
                <div className="chart-container">
                  <AttendanceChart data={chartData} type="bar" height={300} />
                </div>
                <div className="chart-legend" style={{ marginTop: '20px', fontSize: '13px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary-color)' }}></span> Eligible
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ff3366' }}></span> Ineligible
                  </span>
                </div>
              </GlassCard>
            </div>
          </div>
        ) : (
          <EmptyState 
            message="No subjects or academic records found."
            icon={<FiBookOpen />} 
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyGrades;
