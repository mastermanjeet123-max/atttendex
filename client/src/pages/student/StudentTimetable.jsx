import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Loader from '../../components/common/Loader';
import { FiCalendar } from 'react-icons/fi';
import './StudentTimetable.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = Number(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${ampm}`;
};

const StudentTimetable = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/timetable');
        setSlots(res.data.data || []);
      } catch (err) {
        console.error('Failed to load timetable:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  // Build a map: day → [slots]
  const slotsByDay = {};
  DAYS.forEach(d => { slotsByDay[d] = []; });
  slots.forEach(slot => {
    const day = slot.day_of_week;
    if (slotsByDay[day]) slotsByDay[day].push(slot);
  });

  // Get unique time ranges for rows
  const uniqueTimes = [...new Set(slots.map(s => `${s.start_time}-${s.end_time}`))].sort();

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

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
      <div className="student-timetable-page">
        <header className="page-header">
          <h1>My Timetable</h1>
          <p>Weekly class schedule generated from your course and section</p>
        </header>

        {slots.length === 0 ? (
          <GlassCard style={{ padding: '48px', textAlign: 'center', opacity: 0.6 }}>
            <FiCalendar style={{ fontSize: '48px', display: 'block', margin: '0 auto 16px' }} />
            <h3>No timetable found</h3>
            <p>Ask your administrator to configure the timetable for your course and section.</p>
          </GlassCard>
        ) : (
          <GlassCard className="timetable-card">
            <div className="table-responsive">
              <table className="timetable">
                <thead>
                  <tr>
                    <th>Time</th>
                    {DAYS.filter(d => slotsByDay[d].length > 0 || true).map(day => (
                      <th key={day} style={{ background: day === today ? 'rgba(108,99,255,0.15)' : '' }}>
                        {day}
                        {day === today && <span style={{ display: 'block', fontSize: '10px', color: '#6c63ff', fontWeight: 400 }}>Today</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uniqueTimes.map(timeRange => {
                    const [start, end] = timeRange.split('-');
                    return (
                      <tr key={timeRange}>
                        <td className="time-col">
                          {formatTime(start)}<br />
                          <span style={{ fontSize: '11px', opacity: 0.5 }}>to {formatTime(end)}</span>
                        </td>
                        {DAYS.map(day => {
                          const slot = slotsByDay[day].find(s => s.start_time === start && s.end_time === end);
                          const isToday = day === today;
                          return (
                            <td key={`${day}-${timeRange}`}
                              className={slot ? 'has-class' : ''}
                              style={{ background: isToday && slot ? 'rgba(108,99,255,0.08)' : '' }}
                            >
                              {slot ? (
                                <div className="class-cell">
                                  <span className="subject">{slot.subject_name}</span>
                                  <span style={{ fontSize: '11px', opacity: 0.6, display: 'block' }}>{slot.subject_code}</span>
                                  {slot.room && <span style={{ fontSize: '10px', opacity: 0.5, display: 'block' }}>Room: {slot.room}</span>}
                                  {slot.teacher_name && <span style={{ fontSize: '10px', opacity: 0.5, display: 'block' }}>{slot.teacher_name}</span>}
                                </div>
                              ) : (
                                <span className="empty-cell">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentTimetable;
