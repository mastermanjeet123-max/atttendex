/**
 * AttendX - GlassCard Component
 * Reusable glassmorphism card with variants.
 */
import './GlassCard.css';

export default function GlassCard({
  children,
  className = '',
  variant = '',       // accent, cyan, teal, gold, success, danger
  size = '',          // sm, lg
  hoverable = false,
  glow = false,
  animated = false,
  style = {},
  onClick,
  ...props
}) {
  const classes = [
    'glass-card',
    variant && `glass-card--${variant}`,
    size && `glass-card--${size}`,
    hoverable && 'glass-card--hoverable',
    glow && 'glass-card--glow',
    animated && 'glass-card--animated',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} style={style} onClick={onClick} {...props}>
      {children}
    </div>
  );
}

/* Sub-components for structured usage */
GlassCard.Header = function GlassCardHeader({ children, className = '', title, subtitle, action }) {
  return (
    <div className={`glass-card__header ${className}`}>
      <div>
        {title && <h3 className="glass-card__title">{title}</h3>}
        {subtitle && <p className="glass-card__subtitle">{subtitle}</p>}
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

GlassCard.Footer = function GlassCardFooter({ children, className = '' }) {
  return (
    <div className={`glass-card__footer ${className}`}>
      {children}
    </div>
  );
};
