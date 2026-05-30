import React from 'react';
import './Button.css';

/**
 * Premium Button component with multiple variants and states.
 * Supports loading state, full-width, and custom sizing.
 */
const Button = ({
  children,
  variant = 'primary', // primary | secondary | danger | ghost
  size = 'md',         // sm | md | lg
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClass = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`;
  
  return (
    <button
      type={type}
      className={baseClass}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? <span className="btn-loader"></span> : children}
    </button>
  );
};

export default Button;
