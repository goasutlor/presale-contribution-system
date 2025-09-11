import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  const isDark = theme === 'dark';

  useEffect(() => {
    // Apply theme to document and body for complete theme switching
    const root = document.documentElement;
    const body = document.body;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
    body.classList.add(theme);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#ffffff');
    }
    
    // Force re-render of all elements by adding a data attribute
    root.setAttribute('data-theme', theme);
    
    // Update CSS custom properties for theme colors
    const rootStyle = root.style;
    if (theme === 'dark') {
      rootStyle.setProperty('--bg-primary', '#1f2937');
      rootStyle.setProperty('--bg-secondary', '#374151');
      rootStyle.setProperty('--text-primary', '#f9fafb');
      rootStyle.setProperty('--text-secondary', '#d1d5db');
      rootStyle.setProperty('--border-color', '#4b5563');
    } else {
      rootStyle.setProperty('--bg-primary', '#ffffff');
      rootStyle.setProperty('--bg-secondary', '#f9fafb');
      rootStyle.setProperty('--text-primary', '#111827');
      rootStyle.setProperty('--text-secondary', '#6b7280');
      rootStyle.setProperty('--border-color', '#e5e7eb');
    }
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
