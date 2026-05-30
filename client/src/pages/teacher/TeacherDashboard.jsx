import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-toastify';
import { FiKey, FiUsers, FiBook, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [stats, setStats] = useState({ totalStudents: 0, totalSubjects: 0, classesToday: 0 });
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get real teacher details from auth context
  const teacherName = user?.name || 'Teacher';
  const departmentName = user?.department || 'N/A';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teacher/dashboard');
      const data = response.data.data || {};
      
      const subjectsList = data.assignedSubjects || [];
      let uniqueStudentIds = new Set();
      
      // Fetch students for each subject to get exact unique count
      for (const sub of subjectsList) {
        try {
          const res = await api.get('/teacher/students', {
            params: {
              subject_id: sub.subject_id,
              course_id: sub.course_id || 2,
              semester: sub.semester,
              section: sub.section
            }
          });
          const studs = res.data.data || [];
          studs.forEach(s => uniqueStudentIds.add(s.id));
        } catch (e) {
          console.error('Failed to load students for subject', sub.subject_id, e);
        }
      }

      setStats({
        totalStudents: uniqueStudentIds.size,
        totalSubjects: data.totalSubjects || subjectsList.length,
        classesToday: data.classesToday || subjectsList.length // Use subject count as fallback for demo classes today
      });

      // Format Today's Schedule dynamically based on assigned subjects
      const formattedSchedule = subjectsList.map((sub, index) => {
        const times = ['09:00 AM - 10:00 AM', '11:00 AM - 12:00 PM', '02:00 PM - 03:00 PM'];
        return {
          id: sub.subject_id,
          time: times[index % times.length],
          subjectName: sub.name,
          subjectCode: sub.code,
          room: `Room ${101 + index}`,
          classInfo: `${sub.course_name} (Sem ${sub.semester} Sec ${sub.section})`
        };
      });
      setSchedule(formattedSchedule);

    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Failed to update password:', error);
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="teacher">
        <div className="page-loader" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher">
      <div className="teacher-dashboard">
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Welcome back, {teacherName}</h1>
            <p>Department: {departmentName} • Here's an overview of your classes today</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button onClick={() => setShowPasswordModal(true)} variant="ghost" icon={<FiKey />}>Change Password</Button>
            <div className="date-badge">
              <i className="far fa-calendar-alt"></i>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="stats-grid">
          <GlassCard className="stat-card">
            <div className="stat-icon"><FiUsers style={{ color: '#00f2fe' }} /></div>
            <div className="stat-info">
              <h3>Total Students</h3>
              <p className="stat-value">{stats.totalStudents}</p>
            </div>
          </GlassCard>
          
          <GlassCard className="stat-card">
            <div className="stat-icon"><FiBook style={{ color: '#6c63ff' }} /></div>
            <div className="stat-info">
              <h3>Subjects Taught</h3>
              <p className="stat-value">{stats.totalSubjects}</p>
            </div>
          </GlassCard>
          
          <GlassCard className="stat-card">
            <div className="stat-icon"><FiClock style={{ color: '#ff6584' }} /></div>
            <div className="stat-info">
              <h3>Classes Today</h3>
              <p className="stat-value">{stats.classesToday}</p>
            </div>
          </GlassCard>
        </div>

        <div className="dashboard-content">
          <div className="main-col" style={{ width: '100%' }}>
            <GlassCard className="schedule-card">
              <h2>Today's Schedule</h2>
              {schedule.length > 0 ? (
                <div className="schedule-list">
                  {schedule.map((item, index) => (
                    <div key={item.id} className={`schedule-item ${index === 0 ? 'active' : ''}`}>
                      <div className="time">{item.time}</div>
                      <div className="details">
                        <h4>{item.subjectName} ({item.subjectCode})</h4>
                        <p>{item.room} • {item.classInfo}</p>
                      </div>
                      <button className="btn-mark" onClick={() => navigate('/teacher/attendance')}>Mark Now</button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  message="No classes scheduled for today."
                  icon={<FiClock />} 
                />
              )}
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

export default TeacherDashboard;
