import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { FiDownload, FiUsers, FiFileText } from 'react-icons/fi';
import './Reports.css';

const Reports = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [department, setDepartment] = useState('All');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/students');
      const rawStudents = response.data.data || [];
      const mappedStudents = rawStudents.map(s => {
        const attendance = Number(s.attendance_percentage) || 0;
        let status = 'Safe';
        if (attendance < 65) status = 'Critical';
        else if (attendance < 75) status = 'Shortage';

        return {
          id: s.id || s._id,
          name: s.name,
          rollNo: s.roll_number,
          department: s.course_name || 'N/A',
          attendance,
          status
        };
      });
      setStudents(mappedStudents);
    } catch (error) {
      console.error('Failed to load reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = students.filter(student => {
    if (filter !== 'All' && student.status !== filter) return false;
    if (department !== 'All' && student.department !== department) return false;
    return true;
  });

  const exportCSV = () => {
    // Client-side CSV from current filtered table
    const headers = ['Name', 'Roll No', 'Course', 'Attendance %', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row =>
        `"${row.name}","${row.rollNo}","${row.department}",${row.attendance},"${row.status}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDetailedCSV = async () => {
    try {
      // Use the server-generated detailed attendance report CSV
      const response = await api.get('/admin/reports/attendance', {
        params: { format: 'csv' },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `detailed_attendance_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Detailed CSV export failed:', error);
    }
  };

  // Get list of unique departments/courses dynamically from loaded students
  const departments = ['All', ...new Set(students.map(s => s.department).filter(Boolean))];

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
      <div className="reports-page">
        <header className="page-header">
          <div className="header-content">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><FiUsers style={{ color: '#6c63ff' }} /> Analytics & Reports</h1>
            <p>Generate and export comprehensive attendance reports from live student data</p>
          </div>
          {filteredData.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn-export" onClick={exportCSV}>
                <FiDownload /> Export CSV
              </button>
              <button className="btn-export" onClick={exportDetailedCSV}
                style={{ background: 'rgba(108,99,255,0.15)', borderColor: 'rgba(108,99,255,0.4)', color: '#6c63ff' }}
              >
                <FiFileText /> Detailed Report CSV
              </button>
            </div>
          )}
        </header>

        <GlassCard className="filters-card">
          <div className="filters-container">
            <div className="filter-group">
              <label>Status Filter</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="All">All Students</option>
                <option value="Safe">Safe (&gt;=75%)</option>
                <option value="Shortage">Shortage (65%-74%)</option>
                <option value="Critical">Critical (&lt;65%)</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Course / Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="report-table-card">
          <div className="table-responsive">
            {filteredData.length > 0 ? (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Course / Department</th>
                    <th>Attendance %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((student) => (
                    <tr key={student.id}>
                      <td>{student.rollNo}</td>
                      <td style={{ fontWeight: 600 }}>{student.name}</td>
                      <td>{student.department}</td>
                      <td>
                        <div className="progress-bar-container">
                          <div className="progress-bar-track">
                            <div 
                              className={`progress-bar-fill ${student.attendance < 75 ? 'danger' : 'success'}`} 
                              style={{ width: `${student.attendance}%` }}
                            ></div>
                          </div>
                          <span style={{ fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>{student.attendance}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${student.status.toLowerCase()}`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState 
                message={searchTerm => 'No student records match your filters.'} 
                icon={<FiUsers />} 
              />
            )}
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
