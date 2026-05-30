/**
 * AttendX - Navbar Component
 * Top navbar with user info, notifications, theme toggle, and search.
 */
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  FiSearch,
  FiBell,
  FiMoon,
  FiSun,
  FiMenu,
  FiSettings,
  FiUser,
  FiLogOut,
} from 'react-icons/fi';
import './Navbar.css';

export default function Navbar({ sidebarCollapsed, onMobileToggle }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  /* Get greeting based on time of day */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  /* Get user initials for avatar */
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  /* Fetch unread notification count */
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.role) return;
      try {
        const res = await api.get(`/${user.role}/notifications`);
        const notifications = res.data.data || [];
        setUnreadCount(notifications.filter(n => !n.is_read).length);
      } catch {
        // Silently fail — non-critical
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user?.role]);

  /* Navigate to notifications page by role */
  const handleNotificationsClick = () => {
    if (!user?.role) return;
    navigate(`/${user.role}/notifications`);
  };

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navbarClasses = [
    'navbar',
    sidebarCollapsed ? 'sidebar-collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <header className={navbarClasses}>
      {/* Left Section */}
      <div className="navbar__left">
        <button className="navbar__mobile-toggle" onClick={onMobileToggle}>
          <FiMenu />
        </button>

        <div className="navbar__greeting">
          <span className="navbar__greeting-text">{getGreeting()}</span>
          <span className="navbar__greeting-name">{user?.name || 'User'}</span>
        </div>

        {/* Search Bar */}
        <div className="navbar__search">
          <FiSearch className="navbar__search-icon" />
          <input
            type="text"
            className="navbar__search-input"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="navbar__right">
        {/* Notifications Bell */}
        <button
          className="navbar__icon-btn navbar__notif-btn"
          title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          onClick={handleNotificationsClick}
        >
          <FiBell />
          {unreadCount > 0 && (
            <span className="navbar__badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          className={`navbar__theme-toggle ${!isDark ? 'light' : ''}`}
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span className="navbar__theme-toggle-knob">
            {isDark ? <FiMoon /> : <FiSun />}
          </span>
        </button>

        <span className="navbar__divider" />

        {/* User Menu */}
        <div className="navbar__user-container" ref={dropdownRef}>
          <div
            className="navbar__user"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="navbar__avatar">
              {getInitials(user?.name)}
            </div>
            <div className="navbar__user-info">
              <span className="navbar__user-name">{user?.name || 'User'}</span>
              <span className="navbar__user-role">{user?.role || 'Guest'}</span>
            </div>
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="navbar__dropdown">
              <button className="navbar__dropdown-item">
                <FiUser />
                Profile
              </button>
              <button className="navbar__dropdown-item">
                <FiSettings />
                Settings
              </button>
              <div className="navbar__dropdown-divider" />
              <button className="navbar__dropdown-item danger" onClick={logout}>
                <FiLogOut />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
