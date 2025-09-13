import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './styles/global.css';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import SimpleContributions from './pages/SimpleContributions';
import AllContributions from './pages/AllContributions';
import MyContributions from './pages/MyContributions';
import FunctionalTest from './pages/FunctionalTest';
import GlobalAdmin from './pages/GlobalAdmin';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const TenantBinder: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams();
  const prefix = params.tenantPrefix as string | undefined;
  if (prefix) {
    try { localStorage.setItem('tenantPrefix', prefix); } catch {}
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // Avoid redirecting while auth is resolving so refresh keeps the current page
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/t/:tenantPrefix/login" element={<TenantBinder><Login /></TenantBinder>} />
        <Route path="/t/:tenantPrefix/signup" element={<TenantBinder><Signup /></TenantBinder>} />
        {/* Allow access to Global Admin without tenant auth; it uses its own token */}
        <Route path="/global-admin" element={<GlobalAdmin />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={user?.role === 'admin' ? <AdminDashboard /> : <Dashboard />} />
        <Route path="my-contributions" element={
          user?.role === 'admin' ? <AllContributions /> : <MyContributions />
        } />
        <Route path="reports" element={<Reports />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="functional-test" element={<FunctionalTest />} />
        <Route path="global-admin" element={<GlobalAdmin />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <div className="min-h-screen theme-transition">
              <AppRoutes />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
