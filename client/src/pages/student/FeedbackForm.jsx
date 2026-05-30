import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import { FiStar, FiSend, FiCheck, FiBook } from 'react-icons/fi';
import './FeedbackForm.css';

const CURRENT_ACADEMIC_YEAR = (() => {
  const y = new Date().getFullYear();
  const month = new Date().getMonth(); // 0-indexed; academic year starts June
  return month >= 5 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
})();

const FeedbackForm = () => {
  const [subjects, setSubjects] = useState([]);   // [{subject_id, subject_name, subject_code, teacher_id, teacher_name}]
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    subject_id: '',
    teacher_id: '',
    teacher_name: '',
    category: 'academic',
    rating: 0,
    comment: '',
    is_anonymous: false,
  });
  const [hover, setHover] = useState(0);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        // Use the new endpoint that returns subjects WITH teacher info
        const res = await api.get('/student/subjects');
        const data = res.data.data || [];
        setSubjects(data);
        // Pre-select first subject and auto-fill teacher
        if (data.length > 0) {
          setForm(f => ({
            ...f,
            subject_id: String(data[0].subject_id),
            teacher_id: String(data[0].teacher_id || ''),
            teacher_name: data[0].teacher_name || '',
          }));
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
        toast.error('Failed to load subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  // When subject changes, auto-update the teacher
  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    const selected = subjects.find(s => String(s.subject_id) === subId);
    setForm(f => ({
      ...f,
      subject_id: subId,
      teacher_id: selected ? String(selected.teacher_id || '') : '',
      teacher_name: selected ? (selected.teacher_name || '') : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject_id) { toast.warn('Please select a subject.'); return; }
    if (form.rating === 0) { toast.warn('Please give a star rating (1–5).'); return; }
    if (!form.comment.trim()) { toast.warn('Please write a comment before submitting.'); return; }

    setSubmitting(true);
    try {
      await api.post('/student/feedback', {
        subject_id: Number(form.subject_id),
        teacher_id: form.teacher_id ? Number(form.teacher_id) : null,
        rating: form.rating,
        comment: form.comment.trim(),
        is_anonymous: form.is_anonymous,
        academic_year: CURRENT_ACADEMIC_YEAR,
      });
      toast.success('Feedback submitted successfully! Thank you.');
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit feedback. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    const first = subjects[0];
    setForm({
      subject_id: first ? String(first.subject_id) : '',
      teacher_id: first ? String(first.teacher_id || '') : '',
      teacher_name: first ? (first.teacher_name || '') : '',
      category: 'academic',
      rating: 0,
      comment: '',
      is_anonymous: false,
    });
    setHover(0);
    setSubmitted(false);
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
      <div className="feedback-form-page">
        <header className="page-header">
          <h1>Submit Feedback</h1>
          <p>Help us improve teaching quality and academic experience</p>
        </header>

        <GlassCard className="form-card">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <FiCheck style={{
                  color: '#00ff87', background: 'rgba(0,255,135,0.1)',
                  borderRadius: '50%', padding: '12px', fontSize: '48px',
                  boxSizing: 'content-box'
                }} />
              </div>
              <h2 style={{ marginBottom: '8px' }}>Feedback Submitted!</h2>
              <p style={{ opacity: 0.6, marginBottom: '24px' }}>Thank you for helping us improve.</p>
              <button
                onClick={resetForm}
                style={{
                  padding: '11px 28px', borderRadius: '8px',
                  background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.4)',
                  color: '#6c63ff', cursor: 'pointer', fontWeight: 600
                }}
              >
                Submit Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="feedback-form">

              {/* Subject Selection */}
              <div className="form-group">
                <label>Subject *</label>
                {subjects.length === 0 ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '16px', borderRadius: '8px',
                    background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)',
                    color: '#ff6584', fontSize: '0.9rem'
                  }}>
                    <FiBook />
                    No subjects found. Your timetable may not be configured yet — contact your administrator.
                  </div>
                ) : (
                  <select value={form.subject_id} onChange={handleSubjectChange} required>
                    <option value="">-- Select Subject --</option>
                    {subjects.map(s => (
                      <option key={`${s.subject_id}-${s.teacher_id}`} value={s.subject_id}>
                        {s.subject_name} ({s.subject_code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Teacher info (auto-filled, read-only) */}
              {form.teacher_name && (
                <div className="form-group">
                  <label>Teacher</label>
                  <div style={{
                    padding: '12px 16px', borderRadius: '8px',
                    background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)',
                    color: '#c0b8ff', fontSize: '0.95rem'
                  }}>
                    {form.teacher_name}
                  </div>
                </div>
              )}

              {/* Category */}
              <div className="form-group">
                <label>Feedback Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="academic">Teaching Quality / Academic</option>
                  <option value="app_issue">App / Technical Issue</option>
                  <option value="feature">Feature Request</option>
                  <option value="infrastructure">Infrastructure / Facilities</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Star Rating */}
              <div className="form-group">
                <label>Overall Rating *</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(index => (
                    <button
                      type="button"
                      key={index}
                      className={index <= (hover || form.rating) ? 'on' : 'off'}
                      onClick={() => setForm(f => ({ ...f, rating: index }))}
                      onMouseEnter={() => setHover(index)}
                      onMouseLeave={() => setHover(0)}
                      title={['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][index]}
                    >
                      <FiStar />
                    </button>
                  ))}
                  {form.rating > 0 && (
                    <span style={{ fontSize: '0.85rem', opacity: 0.6, marginLeft: '8px' }}>
                      {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="form-group">
                <label>Comments *</label>
                <textarea
                  rows="5"
                  placeholder="Share your experience, suggestions, or concerns..."
                  value={form.comment}
                  onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                  required
                />
              </div>

              {/* Anonymous toggle */}
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="anon-checkbox"
                  checked={form.is_anonymous}
                  onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6c63ff' }}
                />
                <label htmlFor="anon-checkbox" style={{ cursor: 'pointer', fontSize: '0.9rem', opacity: 0.8 }}>
                  Submit anonymously (your name won't be shown to the teacher)
                </label>
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={submitting || subjects.length === 0}
              >
                <FiSend /> {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default FeedbackForm;
