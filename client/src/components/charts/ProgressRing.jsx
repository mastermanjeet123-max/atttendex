import React from 'react';
import './ProgressRing.css';

/**
 * Animated SVG Progress Ring Component
 */
const ProgressRing = ({ radius = 60, stroke = 8, progress = 0, color = 'var(--accent-cyan, #00d4ff)' }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Cap progress at 100
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="progress-ring-container" style={{ width: radius * 2, height: radius * 2 }}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="progress-ring"
      >
        <circle
          className="progress-ring-bg"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className="progress-ring-circle"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="progress-ring-text">
        <span className="progress-ring-value">{Math.round(safeProgress)}%</span>
      </div>
    </div>
  );
};

export default ProgressRing;
