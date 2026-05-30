import React from 'react';
import './Loader.css';

/**
 * Animated Loader component
 * Can display a spinning ring animation or a skeleton loading state.
 */
const Loader = ({ type = 'spinner', text = 'Loading...' }) => {
  if (type === 'skeleton') {
    return <div className="loader-skeleton"></div>;
  }

  return (
    <div className="loader-container">
      <div className="loader-spinner">
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
      </div>
      {text && <span className="loader-text">{text}</span>}
    </div>
  );
};

export default Loader;
