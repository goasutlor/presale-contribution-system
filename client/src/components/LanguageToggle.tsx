import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageIcon } from '@heroicons/react/24/outline';

const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage, isThai, t } = useLanguage();

  const handleToggle = () => {
    console.log('🔍 Language toggle clicked, current language:', language);
    toggleLanguage();
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center space-x-2 rounded-full bg-slate-50 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-100 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-gray-600 border border-slate-300 dark:border-gray-600 shadow-sm"
      aria-label={isThai ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
      title={isThai ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
    >
      <span className="text-lg">
        {isThai ? '🇺🇸' : '🇹🇭'}
      </span>
      <span>
        {isThai ? 'EN' : 'ไทย'}
      </span>
    </button>
  );
};

export default LanguageToggle;
