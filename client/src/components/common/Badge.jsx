import React from 'react';
import './Badge.css';

/**
 * Premium Status Badge Component
 * @param {string} status - info | success | warning | error
 */
const Badge = ({ children, status = 'info', className = '' }) => {
  return (
    <span className={`badge badge-${status} ${className}`}>
      <span className="badge-dot"></span>
      {children}
    </span>
  );
};

export default Badge;
