import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import ProfessionalLoginHandler from '../components/ProfessionalLoginHandler';
import ProfessionalNotification from '../components/ProfessionalNotification';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<any>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { login, loading } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsRetrying(false);
    setLoginSuccess(false);
    
    if (!email.trim()) {
      setLoginError({ message: t('login.emailRequired'), response: { status: 400 } });
      return;
    }
    if (!password.trim()) {
      setLoginError({ message: t('login.passwordRequired'), response: { status: 400 } });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError({
        message: t('login.invalidEmail'),
        response: { status: 400 },
      });
      return;
    }
    
    try {
      // Auto-detect: try Global Admin first; if it fails, fall back to tenant login
      try {
        const { apiService } = await import('../services/api');
        const res = await apiService.globalLogin(email, password);
        if (res.success && (res as any).data?.token) {
          localStorage.setItem('globalToken', (res as any).data.token);
          setLoginSuccess(true);
          setLoginError(null);
          window.location.href = '/global-admin';
          return;
        }
      } catch (e: any) {
        // If global route missing (404), surface clear message; otherwise fall back to tenant login
        if (e && (e.status === 404 || /Cannot POST \/api\/global\/login/i.test(e.message || ''))) {
          setLoginError({ message: 'Global Admin is not enabled on this server build (404). Please redeploy backend with /api/global routes.', response: { status: 404 } });
          return;
        }
      }

      await login(email, password);
      setLoginSuccess(true);
      setLoginError(null);
    } catch (error: any) {
      console.error('🔴 Login Error:', error);
      
      // Determine error message based on error type (security-focused)
      let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง';
      let errorStatus = 500;
      
      if (error.message) {
        // Authentication errors - use generic message for security
        if (error.message.includes('Invalid credentials') || 
            error.message.includes('User not found') ||
            error.message.includes('Unauthorized') ||
            error.status === 401) {
          errorMessage = 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง กรุณาตรวจสอบอีเมลและรหัสผ่าน';
          errorStatus = 401;
        } 
        // Network/Connection errors - can be specific
        else if (error.message.includes('Network error') || error.isNetworkError) {
          errorMessage = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
          errorStatus = 0;
        } else if (error.message.includes('timeout') || error.isTimeoutError) {
          errorMessage = 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง';
          errorStatus = 408;
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
          errorStatus = 0;
        } 
        // Server errors - can be specific
        else if (error.status >= 500) {
          errorMessage = 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้งในภายหลัง';
          errorStatus = error.status;
        } 
        // Validation errors - can be specific
        else if (error.status === 400) {
          errorMessage = 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง';
          errorStatus = 400;
        }
        // Rate limiting - can be specific
        else if (error.status === 429 || error.message.includes('rate limit')) {
          errorMessage = 'มีการพยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่';
          errorStatus = 429;
        }
        // Account status errors - can be specific
        else if (error.message.includes('Account pending approval')) {
          errorMessage = 'บัญชีของคุณรอการอนุมัติ กรุณาติดต่อผู้ดูแลระบบ';
          errorStatus = 403;
        } else if (error.message.includes('Account rejected')) {
          errorMessage = 'บัญชีของคุณถูกปฏิเสธ กรุณาติดต่อผู้ดูแลระบบ';
          errorStatus = 403;
        } else if (error.message.includes('account') || error.message.includes('status')) {
          errorMessage = 'บัญชีของคุณมีสถานะไม่ปกติ กรุณาติดต่อผู้ดูแลระบบ';
          errorStatus = 403;
        }
        // Default fallback
        else {
          errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง';
          errorStatus = error.status || 500;
        }
      }
      
      setLoginError({
        message: errorMessage,
        response: { status: errorStatus },
      });
    }
  };

  const handleCloseError = () => setLoginError(null);
  const handleRetry = () => {
    setIsRetrying(true);
    setLoginError(null);
    setTimeout(() => {
    handleSubmit(new Event('submit') as any);
    }, 1000);
  };

  return (
    <div className="login-page min-h-screen relative overflow-hidden">
      {/* Blue-Gray gradient background */}
      <div 
        className="absolute inset-0 animate-gradient"
        style={{
          background: 'linear-gradient(135deg, #365486 0%, #7FC7D9 25%, #D2E0FB 50%, #F9F7F7 75%, #7FC7D9 100%)',
          backgroundSize: '400% 400%'
        }}
      />
      
      {/* Animated overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      
      {/* Floating elements with blue theme */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse-glow" style={{ backgroundColor: '#7FC7D9' + '33' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse-glow" style={{ backgroundColor: '#D2E0FB' + '33', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse-glow" style={{ backgroundColor: '#365486' + '20', animationDelay: '4s' }} />
      </div>
      
      {/* Main content - unified design */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Unified login card with integrated logo */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-600 p-8 relative overflow-hidden text-slate-900 dark:text-gray-100">
            {/* Blue-themed background pattern (decorative only) */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none -z-10" style={{ background: 'linear-gradient(135deg, #36548620 0%, transparent 50%, #7FC7D920 100%)' }} />
            
            {/* Simple brand text: ASC */}
            <div className="relative text-center mb-8 text-slate-900 dark:text-gray-100">
              <h1 className="text-4xl font-extrabold tracking-tight">ASC</h1>
            </div>
            {/* Success */}
          {loginSuccess && (
            <ProfessionalNotification
              type="success"
                title={t('login.successTitle')}
                message={t('login.successMessage')}
              onClose={() => setLoginSuccess(false)}
              autoClose={true}
              duration={3000}
            />
          )}
          
            {/* Error */}
            {loginError && (
              <ProfessionalLoginHandler 
                error={loginError} 
                onClose={handleCloseError}
                onRetry={handleRetry}
              />
            )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-900 dark:text-gray-100 mb-2"
                >
                {t('login.email')}
              </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl bg-white text-slate-900 placeholder-slate-500 border border-slate-300 focus:border-[#7FC7D9] focus:ring-2 focus:ring-[#7FC7D9]/40 caret-slate-900"
                  placeholder={t('login.email')}
                />
            </div>

            <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-900 dark:text-gray-100 mb-2"
                >
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 pr-14 rounded-2xl bg-white text-slate-900 placeholder-slate-500 border border-slate-300 focus:border-[#7FC7D9] focus:ring-2 focus:ring-[#7FC7D9]/40 caret-slate-900"
                  placeholder={t('login.password')}
                />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-700 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-6 w-6" />
                    ) : (
                      <EyeIcon className="h-6 w-6" />
                    )}
                  </button>
              </div>
            </div>

              <button
                type="submit"
                disabled={loading || isRetrying}
                className="w-full py-4 rounded-2xl text-lg font-bold text-white shadow-xl
                           transition-all disabled:opacity-60 disabled:cursor-not-allowed
                           hover:shadow-2xl hover:-translate-y-1 transform"
                style={{ 
                  background: 'linear-gradient(90deg, #365486 0%, #7FC7D9 100%)',
                  boxShadow: '0 10px 25px -5px rgba(54, 84, 134, 0.35), 0 6px 10px -5px rgba(0,0,0,0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #2d4a73 0%, #6bb3c7 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #365486 0%, #7FC7D9 100%)';
                }}
              >
                {loading || isRetrying ? (
                  <span className="inline-flex items-center">
                    <span className="animate-spin inline-block h-5 w-5 rounded-full border-2 border-white border-b-transparent mr-3" />
                    {isRetrying ? t('login.retrying') : t('login.signingIn')}
                  </span>
                ) : (
                  <span>{t('login.signIn')} →</span>
                )}
              </button>
          </form>

            {/* Signup Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-600 dark:text-gray-300 text-sm mb-3">
                {t('login.noAccount')}
              </p>
              <Link 
                to="/signup" 
                className="inline-flex items-center px-6 py-3 rounded-xl text-slate-700 dark:text-gray-200 font-medium
                           border-2 border-slate-300 dark:border-gray-600 hover:border-slate-400 dark:hover:border-gray-500 hover:bg-slate-50 dark:hover:bg-gray-700
                           transition-all duration-200 hover:shadow-lg"
              >
                {t('login.signUp')}
              </Link>
            </div>

            {/* Language Toggle Only */}
            <div className="mt-6 flex justify-center">
              <LanguageToggle />
          </div>
        </div>

        {/* Footer */}
          <footer className="mt-8 text-center text-white/60">
            <p className="font-medium">ASC3 Contribution Management System</p>
            <p className="text-sm">© 2025 All rights reserved</p>
          </footer>
        </div>
      </div>

    </div>
  );
};

export default Login;