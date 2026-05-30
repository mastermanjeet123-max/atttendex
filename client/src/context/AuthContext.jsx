/**
 * AttendX - Authentication Context
 * Manages user auth state, login/logout, token persistence, and role-based access.
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

/* Roles for the system */
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

/**
 * AuthProvider wraps the app and provides authentication state.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('attendx_token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /**
   * Load user profile when token exists on mount or token changes.
   */
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Set token in axios defaults
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        setUser(response.data.data || response.data.user || response.data);
      } catch (error) {
        console.error('Failed to load user:', error);
        // Token is invalid or expired
        localStorage.removeItem('attendx_token');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  /**
   * Login with credentials and role.
   */
  const login = useCallback(async (credentials, selectedRole) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', credentials);
      const responseData = response.data.data || response.data;
      const { token: newToken, user: userData } = responseData;

      if (selectedRole && userData.role !== selectedRole) {
        const mismatchMessage = 'Selected role does not match this account';
        toast.error(mismatchMessage);
        return { success: false, message: mismatchMessage };
      }

      // Persist token
      localStorage.setItem('attendx_token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      setToken(newToken);
      setUser(userData);

      toast.success(`Welcome back, ${userData.name || 'User'}!`);

      // Navigate to role-based dashboard
      const dashboardPath = `/${userData.role}/dashboard`;
      navigate(dashboardPath, { replace: true });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Logout the user.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('attendx_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.info('You have been logged out.');
    navigate('/login', { replace: true });
  }, [navigate]);

  /**
   * Check if the user has a specific role.
   */
  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  /**
   * Check if the user is authenticated.
   */
  const isAuthenticated = useMemo(() => !!user && !!token, [user, token]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated,
  }), [user, token, loading, login, logout, hasRole, isAuthenticated]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
