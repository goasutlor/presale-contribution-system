import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-gray-700"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? t('theme.light') : t('theme.dark')}
      title={isDark ? t('theme.light') : t('theme.dark')}
    >
      <span
        className={`${
          isDark ? 'translate-x-7' : 'translate-x-1'
        } inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out`}
      >
        <div className="flex h-full w-full items-center justify-center">
          {isDark ? (
            <MoonIcon className="h-4 w-4 text-gray-600" />
          ) : (
            <SunIcon className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      </span>
    </button>
  );
};

export default ThemeToggle;
