import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CourseManagement from './pages/admin/CourseManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import TeacherManagement from './pages/admin/TeacherManagement';
import StudentManagement from './pages/admin/StudentManagement';
import TimetableManagement from './pages/admin/TimetableManagement';
import AttendanceRules from './pages/admin/AttendanceRules';
import Reports from './pages/admin/Reports';
import FeedbackView from './pages/admin/FeedbackView';
import AdminNotifications from './pages/admin/AdminNotifications';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MySubjects from './pages/teacher/MySubjects';
import MarkAttendance from './pages/teacher/MarkAttendance';
import GradeManagement from './pages/teacher/GradeManagement';
import TeacherReports from './pages/teacher/TeacherReports';
import TeacherNotifications from './pages/teacher/TeacherNotifications';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyAttendance from './pages/student/MyAttendance';
import MyGrades from './pages/student/MyGrades';
import StudentTimetable from './pages/student/StudentTimetable';
import FeedbackForm from './pages/student/FeedbackForm';
import StudentNotifications from './pages/student/StudentNotifications';

/**
 * Protected Route Wrapper
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="courses" element={<CourseManagement />} />
        <Route path="subjects" element={<SubjectManagement />} />
        <Route path="teachers" element={<TeacherManagement />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="timetable" element={<TimetableManagement />} />
        <Route path="attendance-rules" element={<AttendanceRules />} />
        <Route path="reports" element={<Reports />} />
        <Route path="feedback" element={<FeedbackView />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="subjects" element={<MySubjects />} />
        <Route path="attendance" element={<MarkAttendance />} />
        <Route path="grades" element={<GradeManagement />} />
        <Route path="reports" element={<TeacherReports />} />
        <Route path="notifications" element={<TeacherNotifications />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="grades" element={<MyGrades />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="feedback" element={<FeedbackForm />} />
        <Route path="notifications" element={<StudentNotifications />} />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </AuthProvider>
  );
}

export default App;
