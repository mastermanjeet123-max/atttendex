/**
 * AttendX - StatCard Component
 * Dashboard stat card with icon, value, label, and trend indicator.
 */
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import './StatCard.css';

export default function StatCard({
  icon: Icon,
  value,
  label,
  trend,           // { value: '+12%', direction: 'up' | 'down' | 'neutral' }
  color = 'accent', // accent, cyan, teal, gold, success, danger, warning
  className = '',
  style = {},
}) {
  const trendDirection = trend?.direction || 'neutral';

  const TrendIcon = {
    up: FiTrendingUp,
    down: FiTrendingDown,
    neutral: FiMinus,
  }[trendDirection];

  return (
    <div className={`stat-card ${className}`} style={style}>
      <div className="stat-card__top">
        {/* Icon */}
        {Icon && (
          <div className={`stat-card__icon stat-card__icon--${color}`}>
            <Icon />
          </div>
        )}

        {/* Trend */}
        {trend && (
          <div className={`stat-card__trend stat-card__trend--${trendDirection}`}>
            <TrendIcon size={12} />
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="stat-card__value">{value}</div>

      {/* Label */}
      <div className="stat-card__label">{label}</div>

      {/* Bottom accent line */}
      <div className={`stat-card__accent-line stat-card__accent-line--${color}`} />
    </div>
  );
}
