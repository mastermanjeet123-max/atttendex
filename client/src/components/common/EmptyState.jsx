import React from 'react';
import './EmptyState.css';

/**
 * EmptyState Component
 * Displays a futuristic placeholder when no data is available.
 */
const EmptyState = ({ title, description, icon, action }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon || (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 6v12c0 1.1.9 2 2 2h14v-8H4z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <h3 className="empty-state-title">{title || 'No data found'}</h3>
      <p className="empty-state-desc">
        {description || 'There is no data to display at this time.'}
      </p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

export default EmptyState;
