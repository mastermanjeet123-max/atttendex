/**
 * AttendX - Theme Context
 * Dark/light theme toggle with localStorage persistence.
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext(null);

const THEME_KEY = 'attendx_theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, default to dark
    const saved = localStorage.getItem(THEME_KEY);
    return saved || 'dark';
  });

  /**
   * Apply theme to document on change.
   */
  useEffect(() => {
    const root = document.documentElement;

    // Set data-theme attribute for CSS variable switching
    root.setAttribute('data-theme', theme);

    // Persist choice
    localStorage.setItem(THEME_KEY, theme);

    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0a0a1a' : '#f0f2f8');
    }
  }, [theme]);

  /**
   * Toggle between dark and light themes.
   */
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const isDark = theme === 'dark';

  const value = useMemo(() => ({
    theme,
    isDark,
    toggleTheme,
    setTheme,
  }), [theme, isDark, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
