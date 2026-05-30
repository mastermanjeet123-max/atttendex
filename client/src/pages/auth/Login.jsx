import React, { useState } from 'react';
import './Login.css';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const [role, setRole] = useState('student'); // admin, teacher, student
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { id: 'student', label: 'Student', icon: '👨‍🎓' },
    { id: 'teacher', label: 'Teacher', icon: '👨‍🏫' },
    { id: 'admin', label: 'Admin', icon: '🛡️' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      const result = await login(
        { email: formData.identifier, password: formData.password },
        role
      );
      if (!result.success) {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated background elements */}
      <div className="login-bg-shape shape-1"></div>
      <div className="login-bg-shape shape-2"></div>
      <div className="login-bg-shape shape-3"></div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-icon">✨</span>
            <h1>AttendX</h1>
          </div>
          <p className="login-subtitle">Welcome back to the future of education</p>
        </div>

        <div className="role-selector">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`role-btn ${role === r.id ? 'active' : ''}`}
              onClick={() => setRole(r.id)}
            >
              <span className="role-icon">{r.icon}</span>
              <span className="role-label">{r.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="login-error-message" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.95rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: '500'
          }}>
            <span>❌</span> {error}
          </div>
        )}
 
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="identifier">
              {role === 'student' ? 'Roll Number / Email' : 'Email Address'}
            </label>
            <div className="input-wrapper">
              <input
                type={role === 'student' ? 'text' : 'email'}
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                placeholder="Enter your credentials"
                required
              />
              <div className="input-glow"></div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
              />
              <div className="input-glow"></div>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-wrapper">
              <input type="checkbox" />
              <span className="checkmark"></span>
              Remember me
            </label>
            <a href="#forgot" className="forgot-password">Forgot Password?</a>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            isLoading={isLoading}
            className="login-submit-btn"
          >
            Sign In to Dashboard
          </Button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <a href="#contact">Contact Administrator</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
