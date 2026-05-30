import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { FiMessageSquare } from 'react-icons/fi';
import './FeedbackView.css';

const FeedbackView = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/feedback');
      setFeedbacks(response.data.data || []);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  // The database feedbacks have user names or role if populated
  // Since student_name and teacher_name are returned by backend, we can infer roles
  const enrichedFeedbacks = feedbacks.map(fb => {
    const formattedDate = fb.created_at ? new Date(fb.created_at).toLocaleDateString() : 'N/A';
    return {
      id: fb.id,
      user: fb.is_anonymous ? 'Anonymous Student' : (fb.student_name || 'Student'),
      role: 'Student', // Feedback is submitted by students for teachers/subjects
      category: fb.subject_code || 'General',
      subjectName: fb.subject_name || 'N/A',
      teacherName: fb.teacher_name || 'N/A',
      rating: fb.rating,
      comment: fb.comment,
      date: formattedDate
    };
  });

  const filteredFeedback = enrichedFeedbacks.filter(item => 
    filterRole === 'All' || item.role === filterRole
  );

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i key={i} className={`fas fa-star ${i < rating ? 'star-filled' : 'star-empty'}`} style={{ color: i < rating ? '#ffb800' : '#44446a' }}></i>
    ));
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="page-loader" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="feedback-view-page">
        <header className="page-header">
          <h1>User Feedback</h1>
          <p>Review feedback and ratings submitted by students for subjects and teachers</p>
        </header>

        <GlassCard className="filters-card">
          <div className="filter-group">
            <label>Filter by Role</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="All">All Users</option>
              <option value="Student">Students Only</option>
            </select>
          </div>
        </GlassCard>

        {filteredFeedback.length > 0 ? (
          <div className="feedback-grid">
            {filteredFeedback.map(fb => (
              <GlassCard key={fb.id} className="feedback-card">
                <div className="feedback-header">
                  <div className="user-info">
                    <div className="avatar" style={{ background: 'linear-gradient(135deg, #6c63ff, #ff6584)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {fb.user.charAt(0)}
                    </div>
                    <div>
                      <h3>{fb.user}</h3>
                      <span className="user-role">{fb.role}</span>
                    </div>
                  </div>
                  <div className="feedback-date">{fb.date}</div>
                </div>
                <div className="feedback-body">
                  <div className="feedback-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="category-badge" style={{ backgroundColor: 'rgba(108, 99, 255, 0.15)', color: '#a5a1ff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {fb.category}
                      </span>
                      <div className="rating-stars">{renderStars(fb.rating)}</div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#8d8dbe' }}>
                      Teacher: <strong style={{ color: '#fff' }}>{fb.teacherName}</strong>
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#8d8dbe' }}>
                      Subject: <strong style={{ color: '#fff' }}>{fb.subjectName}</strong>
                    </span>
                  </div>
                  <p className="comment" style={{ fontStyle: 'italic', color: '#e0e0fc', marginTop: '8px' }}>
                    "{fb.comment}"
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <EmptyState 
            message={searchTerm => 'No feedback has been submitted in the system yet.'} 
            icon={<FiMessageSquare />} 
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default FeedbackView;
