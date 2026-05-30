import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import StatCard from '../../components/common/StatCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import AttendanceChart from '../../components/charts/AttendanceChart';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import { toast } from 'react-toastify';
import {
  FiUsers, FiBook, FiCalendar, FiCheckCircle,
  FiAlertCircle, FiTrendingUp, FiAward, FiUserCheck,
  FiBookOpen, FiClipboard, FiArrowRight, FiActivity
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalSubjects: 0,
    avgAttendance: 0
  });
  const [departmentData, setDepartmentData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/stats');
      const data = response.data.data || response.data;
      
      setStats({
        totalStudents: data.totalStudents || 0,
        totalTeachers: data.totalTeachers || 0,
        totalCourses: data.totalCourses || 0,
        totalSubjects: data.totalSubjects || 0,
        avgAttendance: data.avgAttendance || 75
      });
      
      setDepartmentData(data.departmentAttendance || []);
      setTrendData(data.attendanceTrend || []);
      setRecentAlerts(data.recentAlerts || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
      // Set fallback demo data for display
      setStats({
        totalStudents: 0,
        totalTeachers: 0,
        totalCourses: 0,
        totalSubjects: 0,
        avgAttendance: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Quick action navigation handlers
  const quickActions = [
    { label: 'Add Student', icon: FiUsers, path: '/admin/students', color: '#6c63ff' },
    { label: 'Add Course', icon: FiBook, path: '/admin/courses', color: '#00d4ff' },
    { label: 'View Reports', icon: FiClipboard, path: '/admin/reports', color: '#00c9a7' },
    { label: 'Manage Timetable', icon: FiCalendar, path: '/admin/timetable', color: '#f0c27f' },
  ];

  // Chart data for department attendance
  const departmentChartData = {
    labels: departmentData.map(d => d.department || d.name),
    datasets: [{
      label: 'Attendance %',
      data: departmentData.map(d => d.attendance || d.percentage),
      backgroundColor: [
        'rgba(108, 99, 255, 0.7)',
        'rgba(0, 212, 255, 0.7)',
        'rgba(0, 201, 167, 0.7)',
        'rgba(240, 194, 127, 0.7)',
        'rgba(255, 107, 107, 0.7)',
      ],
      borderColor: [
        '#6c63ff',
        '#00d4ff',
        '#00c9a7',
        '#f0c27f',
        '#ff6b6b',
      ],
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  // Chart data for attendance trend
  const trendChartData = {
    labels: trendData.map(d => d.month || d.date),
    datasets: [{
      label: 'Average Attendance %',
      data: trendData.map(d => d.attendance || d.value),
      borderColor: '#6c63ff',
      backgroundColor: 'rgba(108, 99, 255, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6c63ff',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }]
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="admin-dashboard-loader">
          <Loader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">
              <FiActivity className="title-icon" />
              Admin Dashboard
            </h1>
            <p className="dashboard-subtitle">
              Welcome back, {user?.name || 'Admin'}! Here's your institution overview.
            </p>
          </div>
          <div className="header-date">
            <FiCalendar />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            label="Total Students"
            value={stats.totalStudents}
            icon={FiUsers}
            color="accent"
            trend={{ value: '+12%', direction: 'up' }}
          />
          <StatCard
            label="Total Teachers"
            value={stats.totalTeachers}
            icon={FiUserCheck}
            color="cyan"
            trend={{ value: '+3%', direction: 'up' }}
          />
          <StatCard
            label="Total Courses"
            value={stats.totalCourses}
            icon={FiBookOpen}
            color="teal"
            trend={{ value: '+5%', direction: 'up' }}
          />
          <StatCard
            label="Avg Attendance"
            value={`${stats.avgAttendance}%`}
            icon={FiCheckCircle}
            color="gold"
            trend={{ value: '+2.5%', direction: 'up' }}
          />
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <GlassCard className="chart-card">
            <div className="chart-header">
              <h3><FiTrendingUp className="chart-icon" /> Department-wise Attendance</h3>
            </div>
            <div className="chart-body">
              {departmentData.length > 0 ? (
                <BarChart data={departmentChartData} />
              ) : (
                <EmptyState message="No department data available" icon={<FiBook />} />
              )}
            </div>
          </GlassCard>

          <GlassCard className="chart-card">
            <div className="chart-header">
              <h3><FiActivity className="chart-icon" /> Attendance Trend</h3>
            </div>
            <div className="chart-body">
              {trendData.length > 0 ? (
                <LineChart data={trendChartData} />
              ) : (
                <EmptyState message="No trend data available" icon={<FiTrendingUp />} />
              )}
            </div>
          </GlassCard>
        </div>

        {/* Bottom Section: Alerts + Quick Actions */}
        <div className="bottom-section">
          {/* Recent Alerts */}
          <GlassCard className="alerts-card">
            <div className="card-header">
              <h3><FiAlertCircle className="card-icon alert-icon" /> Recent Alerts</h3>
              <Badge text={`${recentAlerts.length} new`} variant="warning" />
            </div>
            <div className="alerts-list">
              {recentAlerts.length > 0 ? (
                recentAlerts.slice(0, 5).map((alert, index) => (
                  <div key={index} className={`alert-item alert-${alert.type || 'info'}`}>
                    <div className="alert-indicator"></div>
                    <div className="alert-content">
                      <p className="alert-message">{alert.message}</p>
                      <span className="alert-time">{alert.time || alert.createdAt}</span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="No recent alerts" icon={<FiCheckCircle />} />
              )}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="quick-actions-card">
            <div className="card-header">
              <h3><FiAward className="card-icon" /> Quick Actions</h3>
            </div>
            <div className="quick-actions-grid">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="quick-action-btn"
                  onClick={() => navigate(action.path)}
                  style={{ '--action-color': action.color }}
                >
                  <div className="action-icon-wrap">
                    <action.icon />
                  </div>
                  <span>{action.label}</span>
                  <FiArrowRight className="action-arrow" />
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
