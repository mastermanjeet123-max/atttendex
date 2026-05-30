import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Loader from '../../components/common/Loader';
import { FiAlertTriangle, FiCheckCircle, FiBook } from 'react-icons/fi';
import './MyAttendance.css';

const MyAttendance = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/attendance');
        setSubjects(res.data.data || []);
      } catch (err) {
        console.error('Failed to load attendance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const getPrediction = (attended, total) => {
    if (total === 0) return { safe: true, msg: 'No classes recorded yet.' };
    const pct = (attended / total) * 100;
    if (pct >= 75) return { safe: true, msg: 'Attendance is safe ✓' };
    const needed = Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));
    return { safe: false, msg: `You need to attend ${needed} more consecutive class${needed !== 1 ? 'es' : ''} to reach 75%.` };
  };

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
      <div className="my-attendance-page">
        <header className="page-header">
          <h1>Subject-wise Attendance</h1>
          <p>Detailed view of your attendance and predictions per subject</p>
        </header>

        {subjects.length === 0 ? (
          <GlassCard style={{ padding: '48px', textAlign: 'center', opacity: 0.6 }}>
            <FiBook style={{ fontSize: '48px', display: 'block', margin: '0 auto 16px' }} />
            <h3>No attendance records found</h3>
            <p>Attendance will appear here once your teacher marks it.</p>
          </GlassCard>
        ) : (
          <div className="attendance-grid">
            {subjects.map((item) => {
              const attended = item.classes_attended || 0;
              const total = item.total_classes || 0;
              const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
              const prediction = getPrediction(attended, total);

              return (
                <GlassCard key={item.subject_id} className="subject-attendance-card">
                  <h3>{item.subject_name} <span style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 400 }}>({item.subject_code})</span></h3>

                  <div className="attendance-stats">
                    <div className="stat">
                      <span className="label">Classes Held</span>
                      <span className="value">{total}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Attended</span>
                      <span className="value" style={{ color: prediction.safe ? '#00ff87' : '#ff3366' }}>{attended}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Absent</span>
                      <span className="value" style={{ color: '#ff6584' }}>{total - attended}</span>
                    </div>
                  </div>

                  <div className="progress-section">
                    <div className="progress-header">
                      <span>Attendance Percentage</span>
                      <span className={`percentage ${percentage < 75 ? 'danger' : 'success'}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className={`progress-bar-fill ${percentage < 75 ? 'danger' : 'success'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    {/* 75% marker */}
                    <div style={{ position: 'relative', height: '8px', marginTop: '4px' }}>
                      <div style={{
                        position: 'absolute', left: '75%', top: 0,
                        width: '2px', height: '8px', background: '#ffa000',
                        borderRadius: '2px'
                      }} title="75% threshold" />
                    </div>
                  </div>

                  <div className={`prediction-alert ${prediction.safe ? 'safe' : 'warning'}`}>
                    {prediction.safe ? <FiCheckCircle /> : <FiAlertTriangle />}
                    <p>{prediction.msg}</p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyAttendance;
