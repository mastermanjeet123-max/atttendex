/**
 * AttendX - Dashboard Layout Component
 * Main layout wrapper combining sidebar, navbar, and content area.
 */
import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './DashboardLayout.css';

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const openMobile = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const mainClasses = [
    'dashboard-layout__main',
    sidebarCollapsed ? 'sidebar-collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="dashboard-layout">
      {/* Decorative background orbs */}
      <div className="dashboard-layout__orb dashboard-layout__orb--1" />
      <div className="dashboard-layout__orb dashboard-layout__orb--2" />
      <div className="dashboard-layout__orb dashboard-layout__orb--3" />

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />

      {/* Main Content */}
      <main className={mainClasses}>
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onMobileToggle={openMobile}
        />

        <div className="dashboard-layout__content">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
