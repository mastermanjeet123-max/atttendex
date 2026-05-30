import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import './AttendanceRules.css';

const AttendanceRules = () => {
  const [minPercentage, setMinPercentage] = useState(75);
  
  const handleSave = (e) => {
    e.preventDefault();
    alert('Attendance rules updated successfully!');
  };

  return (
    <DashboardLayout role="admin">
      <div className="attendance-rules-page">
        <header className="page-header">
          <h1>Attendance Rules Configuration</h1>
          <p>Configure minimum attendance criteria and rules for the institution</p>
        </header>

        <div className="rules-content">
          <GlassCard className="rule-card">
            <h2>Minimum Attendance Criteria</h2>
            <form onSubmit={handleSave} className="rule-form">
              <div className="form-group">
                <label>Minimum Percentage Required (%)</label>
                <input 
                  type="number" 
                  value={minPercentage} 
                  onChange={(e) => setMinPercentage(e.target.value)} 
                  min="0" 
                  max="100" 
                />
              </div>
              <p className="rule-help">Students falling below this percentage will be flagged in reports and shortages.</p>
              
              <div className="form-group checkbox-group">
                <input type="checkbox" id="auto-notify" defaultChecked />
                <label htmlFor="auto-notify">Automatically notify students falling below threshold</label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Save Configuration</button>
              </div>
            </form>
          </GlassCard>

          <GlassCard className="rule-card">
            <h2>Shortage Actions</h2>
            <div className="actions-list">
              <div className="action-item">
                <div className="action-info">
                  <h3>Exam Hall Ticket Generation</h3>
                  <p>Block hall tickets for students with attendance shortage</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="action-item">
                <div className="action-info">
                  <h3>Parent Notifications</h3>
                  <p>Send automated SMS/Email to parents for consecutive absences</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceRules;
