import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import { FiDownload, FiUsers, FiAward } from 'react-icons/fi';
import './TeacherReports.css';

const TeacherReports = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attSubjectIdx, setAttSubjectIdx] = useState('');
  const [gradeSubjectIdx, setGradeSubjectIdx] = useState('');
  const [exporting, setExporting] = useState({ att: false, grade: false });

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/teacher/subjects');
        const data = res.data.data || [];
        setSubjects(data);
        if (data.length > 0) {
          setAttSubjectIdx('0');
          setGradeSubjectIdx('0');
        }
      } catch (err) {
        toast.error('Failed to load assigned subjects');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const exportAttendanceCSV = async () => {
    if (attSubjectIdx === '') { toast.warn('Select a subject first'); return; }
    const sub = subjects[Number(attSubjectIdx)];
    setExporting(e => ({ ...e, att: true }));
    try {
      // Fetch students for that subject
      const studRes = await api.get('/teacher/students', {
        params: { subject_id: sub.subject_id, course_id: sub.course_id, semester: sub.semester, section: sub.section }
      });
      const students = studRes.data.data || [];
      if (students.length === 0) { toast.info('No students enrolled in this subject.'); return; }

      const headers = ['Roll No', 'Student Name', 'Classes Attended', 'Total Classes', 'Attendance %', 'Status'];
      const rows = students.map(s => {
        const pct = s.total_classes > 0 ? ((s.attended_classes / s.total_classes) * 100).toFixed(1) : 0;
        const status = Number(pct) >= 75 ? 'SAFE' : 'LOW ATTENDANCE';
        return [`"${s.roll_number}"`, `"${s.name}"`, s.attended_classes || 0, s.total_classes || 0, pct, `"${status}"`].join(',');
      });

      const subjectLabel = `${sub.name} (${sub.code}) - Sem ${sub.semester} Sec ${sub.section}`;
      const csv = [`# Attendance Report: ${subjectLabel}`, `# Exported on: ${new Date().toLocaleString()}`, headers.join(','), ...rows].join('\n');

      downloadCSV(csv, `attendance_${sub.code}_sem${sub.semester}.csv`);
      toast.success('Attendance report exported!');
    } catch (err) {
      toast.error('Failed to export attendance report');
    } finally {
      setExporting(e => ({ ...e, att: false }));
    }
  };

  const exportGradesCSV = async () => {
    if (gradeSubjectIdx === '') { toast.warn('Select a subject first'); return; }
    const sub = subjects[Number(gradeSubjectIdx)];
    setExporting(e => ({ ...e, grade: true }));
    try {
      const [studRes, gradesRes] = await Promise.all([
        api.get('/teacher/students', {
          params: { subject_id: sub.subject_id, course_id: sub.course_id, semester: sub.semester, section: sub.section }
        }),
        api.get('/teacher/grades', { params: { subject_id: sub.subject_id } })
      ]);

      const students = studRes.data.data || [];
      const grades = gradesRes.data.data || [];
      if (students.length === 0) { toast.info('No students found for this subject.'); return; }

      const headers = ['Roll No', 'Student Name', 'Attendance %', 'Assignment/10', 'Internal 1/20', 'Internal 2/20', 'End Sem/50', 'Total/100', 'Status'];

      const rows = students.map(s => {
        const subGrades = grades.filter(g => g.student_id === s.id);
        const get = (type) => {
          const g = subGrades.find(g => g.exam_type === type);
          return g ? Number(g.marks_obtained) : 0;
        };
        const assignment = get('assignment');
        const int1 = get('internal_1');
        const int2 = get('internal_2');
        const final = get('final');
        const attPct = s.total_classes > 0 ? Number(((s.attended_classes / s.total_classes) * 100).toFixed(1)) : 0;
        const totalInternals = assignment + int1 + int2;
        const isEligible = attPct >= 75 && totalInternals >= 20;
        const total = (assignment + int1 + int2 + (isEligible ? final : 0)).toFixed(2);
        const status = isEligible ? 'ELIGIBLE' : attPct < 75 ? 'INELIGIBLE (Low Att)' : 'INELIGIBLE (Low Score)';
        return [`"${s.roll_number}"`, `"${s.name}"`, attPct, assignment, int1, int2, isEligible ? final : 0, total, `"${status}"`].join(',');
      });

      const subjectLabel = `${sub.name} (${sub.code}) - Sem ${sub.semester} Sec ${sub.section}`;
      const csv = [`# Grade Report: ${subjectLabel}`, `# Exported on: ${new Date().toLocaleString()}`, headers.join(','), ...rows].join('\n');

      downloadCSV(csv, `grades_${sub.code}_sem${sub.semester}.csv`);
      toast.success('Grades report exported!');
    } catch (err) {
      toast.error('Failed to export grades report');
    } finally {
      setExporting(e => ({ ...e, grade: false }));
    }
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <DashboardLayout role="teacher">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher">
      <div className="teacher-reports-page">
        <header className="page-header">
          <h1>Export Reports</h1>
          <p>Download attendance and grade reports for your assigned subjects</p>
        </header>

        {subjects.length === 0 ? (
          <GlassCard style={{ padding: '48px', textAlign: 'center', opacity: 0.6 }}>
            <h3>No subjects assigned</h3>
            <p>You have no subjects assigned. Contact the administrator.</p>
          </GlassCard>
        ) : (
          <div className="reports-grid">
            {/* Attendance Report Card */}
            <GlassCard className="report-card">
              <div className="report-icon"><FiUsers /></div>
              <h2>Attendance Report</h2>
              <p>Export detailed daily attendance records for all students in a subject.</p>
              <div className="report-actions">
                <select
                  className="report-select"
                  value={attSubjectIdx}
                  onChange={e => setAttSubjectIdx(e.target.value)}
                >
                  {subjects.map((sub, i) => (
                    <option key={sub.assignment_id} value={i}>
                      {sub.name} ({sub.code}) — Sem {sub.semester} {sub.section}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-export"
                  onClick={exportAttendanceCSV}
                  disabled={exporting.att}
                >
                  <FiDownload /> {exporting.att ? 'Exporting...' : 'Download CSV'}
                </button>
              </div>
            </GlassCard>

            {/* Grades Report Card */}
            <GlassCard className="report-card">
              <div className="report-icon"><FiAward /></div>
              <h2>Grades Report</h2>
              <p>Export comprehensive grade sheets including assignments, internals, and end-sem.</p>
              <div className="report-actions">
                <select
                  className="report-select"
                  value={gradeSubjectIdx}
                  onChange={e => setGradeSubjectIdx(e.target.value)}
                >
                  {subjects.map((sub, i) => (
                    <option key={sub.assignment_id} value={i}>
                      {sub.name} ({sub.code}) — Sem {sub.semester} {sub.section}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-export"
                  onClick={exportGradesCSV}
                  disabled={exporting.grade}
                >
                  <FiDownload /> {exporting.grade ? 'Exporting...' : 'Download CSV'}
                </button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherReports;
