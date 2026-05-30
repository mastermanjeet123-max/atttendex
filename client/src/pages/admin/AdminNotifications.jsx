import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import {
  FiBell, FiAlertTriangle, FiInfo, FiCheckCircle,
  FiCheck, FiSend, FiUsers, FiUser
} from 'react-icons/fi';
import './AdminNotifications.css';

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
    case 'success':  return <FiCheckCircle />;
    default:         return <FiInfo />;
  }
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    recipient_type: 'teacher',
    recipient_id: '',
    title: '',
    message: '',
    type: 'info',
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Load teachers and students for the send form
    Promise.all([
      api.get('/admin/teachers'),
      api.get('/admin/students'),
    ]).then(([tRes, sRes]) => {
      setTeachers(tRes.data.data || []);
      setStudents(sRes.data.data || []);
    }).catch(() => {});
  }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await api.put(`/admin/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map(n => api.put(`/admin/notifications/${n.id}/read`)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.recipient_id) {
      toast.warn('Please select a recipient.');
      return;
    }
    setSending(true);
    try {
      await api.post('/admin/notifications', {
        recipient_type: form.recipient_type,
        recipient_id: Number(form.recipient_id),
        title: form.title,
        message: form.message,
        type: form.type,
      });
      toast.success('Notification sent successfully!');
      setForm(prev => ({ ...prev, title: '', message: '', recipient_id: '' }));
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const recipientList = form.recipient_type === 'teacher' ? teachers : students;

  return (
    <DashboardLayout role="admin">
      <div className="admin-notifications-page">
        <header className="page-header">
          <div>
            <h1><FiBell style={{ marginRight: 10, verticalAlign: 'middle' }} />Notifications</h1>
            <p>View your alerts and send notifications to teachers or students</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn-mark-all" onClick={markAllRead} disabled={markingAll}>
              <FiCheck /> {markingAll ? 'Marking...' : `Mark all read (${unreadCount})`}
            </button>
          )}
        </header>

        {/* Send Notification Panel */}
        <GlassCard className="send-notif-card" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiSend /> Send Notification
          </h2>
          <form onSubmit={handleSend} className="send-notif-form">
            <div className="send-form-grid">
              <div className="form-group">
                <label>Send To</label>
                <select
                  value={form.recipient_type}
                  onChange={e => setForm(f => ({ ...f, recipient_type: e.target.value, recipient_id: '' }))}
                >
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div className="form-group">
                <label>Select {form.recipient_type === 'teacher' ? 'Teacher' : 'Student'}</label>
                <select
                  value={form.recipient_id}
                  onChange={e => setForm(f => ({ ...f, recipient_id: e.target.value }))}
                  required
                >
                  <option value="">-- Select --</option>
                  {recipientList.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="info">Info</option>
                  <option value="alert">Alert</option>
                  <option value="warning">Warning</option>
                  <option value="reminder">Reminder</option>
                  <option value="success">Success</option>
                </select>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Notification title..."
                  required
                />
              </div>
              <div className="form-group form-group--full">
                <label>Message</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Write your notification message here..."
                  rows={3}
                  required
                />
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: '12px' }}>
              <button type="submit" className="btn-send" disabled={sending}>
                <FiSend /> {sending ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </form>
        </GlassCard>

        {/* Received Notifications */}
        <h2 style={{ marginBottom: '16px', opacity: 0.8 }}>Your Notifications</h2>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader />
          </div>
        ) : notifications.length === 0 ? (
          <GlassCard>
            <div style={{ textAlign: 'center', padding: '48px', opacity: 0.6 }}>
              <FiBell style={{ fontSize: '48px', display: 'block', margin: '0 auto 16px' }} />
              <h3>No Notifications</h3>
              <p>You're all caught up!</p>
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
                {!notif.is_read && <div className="unread-dot" />}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminNotifications;
