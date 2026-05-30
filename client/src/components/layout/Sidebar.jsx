/**
 * AttendX - Sidebar Component
 * Animated sidebar with role-based navigation, collapsible, glassmorphism.
 */
import { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid,
  FiBook,
  FiBookOpen,
  FiUsers,
  FiUser,
  FiCalendar,
  FiCheckSquare,
  FiBarChart2,
  FiMessageSquare,
  FiBell,
  FiAward,
  FiFileText,
  FiChevronsLeft,
  FiShield,
  FiClock,
} from 'react-icons/fi';
import './Sidebar.css';

/* Navigation config by role */
const NAV_CONFIG = {
  admin: [
    {
      label: 'Main',
      items: [
        { to: '/admin/dashboard', icon: FiGrid, text: 'Dashboard' },
        { to: '/admin/courses', icon: FiBook, text: 'Courses' },
        { to: '/admin/subjects', icon: FiBookOpen, text: 'Subjects' },
        { to: '/admin/teachers', icon: FiUsers, text: 'Teachers' },
        { to: '/admin/students', icon: FiUser, text: 'Students' },
      ],
    },
    {
      label: 'Management',
      items: [
        { to: '/admin/timetable', icon: FiCalendar, text: 'Timetable' },
        { to: '/admin/attendance-rules', icon: FiShield, text: 'Attendance Rules' },
        { to: '/admin/reports', icon: FiBarChart2, text: 'Reports' },
        { to: '/admin/feedback', icon: FiMessageSquare, text: 'Feedback' },
      ],
    },
  ],
  teacher: [
    {
      label: 'Main',
      items: [
        { to: '/teacher/dashboard', icon: FiGrid, text: 'Dashboard' },
        { to: '/teacher/subjects', icon: FiBookOpen, text: 'My Subjects' },
        { to: '/teacher/attendance', icon: FiCheckSquare, text: 'Mark Attendance' },
      ],
    },
    {
      label: 'More',
      items: [
        { to: '/teacher/grades', icon: FiAward, text: 'Grades' },
        { to: '/teacher/reports', icon: FiBarChart2, text: 'Reports' },
        { to: '/teacher/notifications', icon: FiBell, text: 'Notifications' },
      ],
    },
  ],
  student: [
    {
      label: 'Main',
      items: [
        { to: '/student/dashboard', icon: FiGrid, text: 'Dashboard' },
        { to: '/student/attendance', icon: FiCheckSquare, text: 'My Attendance' },
        { to: '/student/grades', icon: FiAward, text: 'Grades' },
      ],
    },
    {
      label: 'More',
      items: [
        { to: '/student/timetable', icon: FiClock, text: 'Timetable' },
        { to: '/student/feedback', icon: FiMessageSquare, text: 'Feedback' },
        { to: '/student/notifications', icon: FiBell, text: 'Notifications' },
      ],
    },
  ],
};

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { user } = useAuth();
  const location = useLocation();

  /* Get nav items for current user role */
  const navGroups = useMemo(() => {
    if (!user?.role) return [];
    return NAV_CONFIG[user.role] || [];
  }, [user?.role]);

  const sidebarClasses = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar__overlay" onClick={onCloseMobile} />
      )}

      <aside className={sidebarClasses}>
        {/* Brand / Logo */}
        <div className="sidebar__brand">
          <div className="sidebar__logo-icon">A</div>
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">AttendX</span>
            <span className="sidebar__brand-tagline">Smart Campus</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {navGroups.map((group, groupIdx) => (
            <div className="sidebar__nav-group" key={groupIdx}>
              <div className="sidebar__nav-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to ||
                  location.pathname.startsWith(item.to + '/');

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`sidebar__link ${isActive ? 'active' : ''}`}
                    onClick={onCloseMobile}
                  >
                    <span className="sidebar__link-icon">
                      <Icon />
                    </span>
                    <span className="sidebar__link-text">{item.text}</span>
                    <span className="sidebar__tooltip">{item.text}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer with collapse toggle */}
        <div className="sidebar__footer">
          <button className="sidebar__toggle-btn" onClick={onToggle}>
            <FiChevronsLeft className="sidebar__toggle-icon" />
            <span className="sidebar__toggle-text">Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}
