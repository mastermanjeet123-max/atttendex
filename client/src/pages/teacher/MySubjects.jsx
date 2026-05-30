import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { FiBookOpen } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './MySubjects.css';

const MySubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teacher/subjects');
      setSubjects(response.data.data || []);
    } catch (error) {
      console.error('Failed to load assigned subjects:', error);
    } finally {
      setLoading(false);
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
      <div className="my-subjects-page">
        <header className="page-header">
          <h1>My Subjects</h1>
          <p>Manage your assigned subjects, view active students, and mark attendance</p>
        </header>

        {subjects.length > 0 ? (
          <div className="subjects-grid">
            {subjects.map(subject => (
              <GlassCard key={subject.assignment_id} className="subject-card">
                <div className="subject-header">
                  <span className="subject-code">{subject.code}</span>
                  <h2>{subject.name}</h2>
                </div>
                
                <div className="subject-details">
                  <div className="detail-item">
                    <i className="fas fa-users"></i>
                    <span>{subject.course_name} (Semester {subject.semester} - Sec {subject.section})</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-calendar-alt"></i>
                    <span>Academic Year: {subject.academic_year}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-clock"></i>
                    <span>Status: Active assignment</span>
                  </div>
                </div>

                <div className="subject-actions">
                  <button 
                    className="btn-action primary" 
                    onClick={() => navigate('/teacher/attendance')}
                  >
                    View Attendance
                  </button>
                  <button 
                    className="btn-action secondary" 
                    onClick={() => navigate('/teacher/grades')}
                  >
                    Manage Grades
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <EmptyState 
            message="You have no subjects assigned by the administrator yet."
            icon={<FiBookOpen />} 
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default MySubjects;
