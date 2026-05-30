import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Loader from '../../components/common/Loader';
import { FiBell, FiAlertTriangle, FiInfo, FiClock, FiCheckCircle, FiCheck } from 'react-icons/fi';
import './TeacherNotifications.css';

/* Convert ISO date to relative time string */
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const typeIcon = (type) => {
  switch (type) {
    case 'alert':    return <FiAlertTriangle />;
    case 'warning':  return <FiAlertTriangle />;
    case 'reminder': return <FiClock />;
    case 'success':  return <FiCheckCircle />;
    default:         return <FiInfo />;
  }
};

const TeacherNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await api.put(`/teacher/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map(n => api.put(`/teacher/notifications/${n.id}/read`)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <DashboardLayout role="teacher">
      <div className="teacher-notifications-page">
        <header className="page-header">
          <div>
            <h1><FiBell style={{ marginRight: 10, verticalAlign: 'middle' }} />Notifications</h1>
            <p>Stay updated with system alerts and reminders</p>
          </div>
          {unreadCount > 0 && (
            <button
              className="btn-mark-all"
              onClick={markAllRead}
              disabled={markingAll}
            >
              <FiCheck /> {markingAll ? 'Marking...' : `Mark all read (${unreadCount})`}
            </button>
          )}
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader />
          </div>
        ) : notifications.length === 0 ? (
          <GlassCard className="empty-notif">
            <div style={{ textAlign: 'center', padding: '48px', opacity: 0.6 }}>
              <FiBell style={{ fontSize: '48px', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
              <h3>No Notifications</h3>
              <p>You're all caught up! Check back later.</p>
            </div>
          </GlassCard>
        ) : (
          <div className="notifications-list">
            {notifications.map(notif => (
              <GlassCard
                key={notif.id}
                className={`notification-card ${notif.is_read ? 'read' : 'unread'}`}
                style={{ cursor: notif.is_read ? 'default' : 'pointer' }}
                onClick={() => !notif.is_read && markRead(notif.id)}
              >
                <div className={`notif-icon ${notif.type || 'info'}`}>
                  {typeIcon(notif.type)}
                </div>
                <div className="notif-content">
                  <div className="notif-header">
                    <h3>{notif.title}</h3>
                    <span className="notif-time">{timeAgo(notif.created_at)}</span>
                  </div>
                  <p>{notif.message}</p>
                </div>
                {!notif.is_read && <div className="unread-dot" title="Mark as read" />}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherNotifications;
