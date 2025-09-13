import React, { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import ASC3Logo from './ASC3Logo';

import {
  HomeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const GlobalLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/global-admin/dashboard', icon: HomeIcon },
    { name: 'Contributions', href: '/global-admin/contributions', icon: DocumentTextIcon },
    { name: 'Reports', href: '/global-admin/reports', icon: ChartBarIcon },
    { name: 'Users', href: '/global-admin/users', icon: UserGroupIcon },
    { name: 'Tenant Configuration', href: '/global-admin/tenants', icon: Cog6ToothIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={clsx('fixed inset-0 z-50 lg:hidden', sidebarOpen ? 'block' : 'hidden')}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-2xl border-r border-gray-200">
          <div className="flex h-16 items-center justify-between px-6">
            <ASC3Logo width={120} height={54} simpleMark={true} />
            <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} className={clsx('group flex items-center px-2 py-2 text-sm font-medium rounded-md', location.pathname === item.href ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')} onClick={() => setSidebarOpen(false)}>
                <item.icon className={clsx('mr-3 h-5 w-5 flex-shrink-0', location.pathname === item.href ? 'text-white' : 'text-gray-400 group-hover:text-gray-600')} />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-lg">
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <ASC3Logo width={120} height={54} simpleMark={true} />
          </div>
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} className={clsx('group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150', location.pathname === item.href ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}>
                <item.icon className={clsx('mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-150', location.pathname === item.href ? 'text-white' : 'text-gray-400 group-hover:text-gray-600')} />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center">
            <h2 className="text-lg font-semibold text-gray-900">{navigation.find(n => n.href === location.pathname)?.name || 'Global Admin'}</h2>
          </div>
        </div>
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default GlobalLayout;


