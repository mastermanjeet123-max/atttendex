import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import { FiKey, FiCheckCircle, FiAlertTriangle, FiClock, FiActivity } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [stats, setStats] = useState({ overallPercentage: 0, attendedClasses: 0, totalClasses: 0 });
  const [recentClasses, setRecentClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentName = user?.name || 'Student';
  const courseName = user?.course?.name || user?.department || 'Student';
  const rollNumber = user?.roll_number || '';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/dashboard');
        const data = res.data.data || {};
        setStats({
          overallPercentage: data.overallPercentage || 0,
          attendedClasses: data.attendedClasses || 0,
          totalClasses: data.totalClasses || 0,
        });
        setRecentClasses(data.recentClasses || []);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      await api.put('/auth/update-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  const overallAttendance = Number(stats.overallPercentage.toFixed(1));
  const classesNeeded = stats.totalClasses > 0
    ? Math.max(0, Math.ceil((0.75 * stats.totalClasses - stats.attendedClasses) / 0.25))
    : 0;

  const statusColor = (status) => {
    if (status === 'present') return '#00ff87';
    if (status === 'late') return '#ffa000';
    return '#ff3366';
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
      <div className="student-dashboard">
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Welcome, {studentName}</h1>
            <p>{courseName}{rollNumber && ` • Roll: ${rollNumber}`}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button onClick={() => setShowPasswordModal(true)} variant="ghost" icon={<FiKey />}>Change Password</Button>
            <div className="date-badge">
              <FiClock />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Overview Column */}
          <div className="overview-col">
            <GlassCard className="attendance-overview-card">
              <h2>Overall Attendance</h2>
              <div className="circular-progress">
                <svg viewBox="0 0 100 100">
                  <circle className="bg-circle" cx="50" cy="50" r="45"></circle>
                  <circle
                    className={`progress-circle ${overallAttendance < 75 ? 'danger' : 'success'}`}
                    cx="50" cy="50" r="45"
                    style={{ strokeDashoffset: 283 - (283 * overallAttendance) / 100 }}
                  ></circle>
                </svg>
                <div className="progress-text">
                  <span className="percentage">{overallAttendance}%</span>
                  <span style={{ fontSize: '12px', opacity: 0.6 }}>{stats.attendedClasses}/{stats.totalClasses}</span>
                </div>
              </div>

              <div className="prediction-box">
                {stats.totalClasses === 0 ? (
                  <p style={{ opacity: 0.6, textAlign: 'center' }}>No attendance records yet.</p>
                ) : overallAttendance >= 75 ? (
                  <p className="status-safe"><FiCheckCircle /> You have safe attendance!</p>
                ) : (
                  <p className="status-warning">
                    <FiAlertTriangle />
                    {classesNeeded > 0
                      ? `Attend ${classesNeeded} more consecutive classes to reach 75%.`
                      : 'Attendance is very low — attend all classes.'}
                  </p>
                )}
              </div>

              <button
                className="btn-view-details"
                onClick={() => navigate('/student/attendance')}
                style={{
                  marginTop: '16px', width: '100%',
                  padding: '10px', borderRadius: '8px',
                  background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)',
                  color: '#6c63ff', cursor: 'pointer', fontWeight: 600
                }}
              >
                View Subject-wise Details
              </button>
            </GlassCard>

            <GlassCard className="alerts-card">
              <h2>Recent Activity</h2>
              {recentClasses.length > 0 ? (
                <ul className="alerts-list">
                  {recentClasses.map((cls, i) => (
                    <li key={i} className={`alert-item ${cls.status === 'absent' ? 'warning' : 'info'}`}>
                      <FiActivity />
                      <span>
                        <strong>{cls.subject_name}</strong> — {cls.status} on {new Date(cls.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ opacity: 0.5, textAlign: 'center', padding: '24px 0' }}>No recent classes found.</p>
              )}
            </GlassCard>
          </div>

          {/* Quick Links Column */}
          <div className="schedule-col">
            <GlassCard className="upcoming-classes-card">
              <h2>Quick Links</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {[
                  { label: 'My Attendance', path: '/student/attendance', color: '#00f2fe', desc: 'Subject-wise attendance & predictions' },
                  { label: 'My Grades', path: '/student/grades', color: '#6c63ff', desc: 'View marks for all subjects' },
                  { label: 'My Timetable', path: '/student/timetable', color: '#00ff87', desc: 'Weekly class schedule' },
                  { label: 'Submit Feedback', path: '/student/feedback', color: '#ffa000', desc: 'Rate your teachers and subjects' },
                  { label: 'Notifications', path: '/student/notifications', color: '#ff6584', desc: 'View alerts and messages' },
                ].map(link => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 18px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.04)', border: `1px solid ${link.color}33`,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                      color: '#fff'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${link.color}15`}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  >
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: link.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{link.label}</div>
                      <div style={{ fontSize: '0.78rem', opacity: 0.55 }}>{link.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Change Password Modal */}
        <Modal isOpen={showPasswordModal} onClose={() => { setShowPasswordModal(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} title="Change Password">
          <form onSubmit={handlePasswordChange} className="password-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#8888aa', textTransform: 'uppercase' }}>Current Password</label>
              <input type="password" className="form-input" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', color: '#e4e4f0' }} value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#8888aa', textTransform: 'uppercase' }}>New Password</label>
              <input type="password" className="form-input" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', color: '#e4e4f0' }} value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} minLength={6} required />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#8888aa', textTransform: 'uppercase' }}>Confirm New Password</label>
              <input type="password" className="form-input" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', color: '#e4e4f0' }} value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} minLength={6} required />
            </div>
            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
              <Button type="button" variant="ghost" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Update Password</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
