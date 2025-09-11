import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import ASC3Logo from './ASC3Logo';
import Tooltip from './Tooltip';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  console.log('🔍 Layout rendering with language:', language);
  console.log('🔍 Translation test:', t('nav.dashboard'));

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: HomeIcon },
    { name: t('nav.contributions'), href: '/my-contributions', icon: DocumentTextIcon },
    { name: t('nav.reports'), href: '/reports', icon: ChartBarIcon },
    { name: t('nav.userManagement'), href: '/user-management', icon: UserGroupIcon },
    ...(user?.role === 'admin' ? [
      { name: t('nav.functionalTest'), href: '/functional-test', icon: Cog6ToothIcon }
    ] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800 shadow-2xl border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center justify-between px-6">
            <ASC3Logo width={120} height={54} simpleMark={true} />
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                  location.pathname === item.href
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={clsx(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    location.pathname === item.href
                      ? 'text-white'
                      : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  )}
                />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center px-2 py-2">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-md"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <ASC3Logo width={120} height={54} simpleMark={true} />
          </div>
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150',
                  location.pathname === item.href
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <item.icon
                  className={clsx(
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-150',
                    location.pathname === item.href
                      ? 'text-white'
                      : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  )}
                />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center px-2 py-2">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-md transition-colors duration-150"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="hidden md:flex items-center">
              <ASC3Logo width={96} height={44} simpleMark={true} />
            </div>
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:bg-gray-600" />
              <div className="flex items-center gap-x-4">
                <ThemeToggle />
                <LanguageToggle />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('dashboard.welcome')}, {user?.fullName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
