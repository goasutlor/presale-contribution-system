import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import { EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, IdentificationIcon, BuildingOfficeIcon, UserGroupIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    staffId: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'admin'
  });
  const [accounts, setAccounts] = useState<Array<{ name: string }>>([
    { name: '' }
  ]);
  const [sales, setSales] = useState<Array<{ fullName: string; email: string }>>([
    { fullName: '', email: '' }
  ]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clean special characters for text fields
    let cleanedValue = value;
    if (name === 'fullName') {
      // For full name, only remove leading special characters, keep spaces and Thai characters
      cleanedValue = value
        .replace(/^[\u0E47-\u0E4E]+/, '') // Remove leading Thai diacritical marks
        .replace(/[^\u0020-\u007E\u0E01-\u0E5B]/g, '') // Keep only ASCII, spaces, and Thai characters
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space (no trim)
    } else if (name === 'staffId') {
      // For staff ID, remove spaces and special characters
      cleanedValue = value
        .replace(/^[\u0E47-\u0E4E]+/, '') // Remove leading Thai diacritical marks
        .replace(/[^\u0020-\u007E\u0E01-\u0E5B]/g, '') // Keep only ASCII and Thai characters
        .replace(/\s/g, '') // Remove all spaces
        .trim();
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: cleanedValue
    }));
  };

  const handleAccountChange = (index: number, value: string) => {
    // Clean special characters for account names
    const cleanedValue = value
      .replace(/^[\u0E47-\u0E4E]+/, '') // Remove leading Thai diacritical marks
      .replace(/[^\u0020-\u007E\u0E01-\u0E5B]/g, '') // Keep only ASCII and Thai characters
      .trim();
    
    setAccounts(prev => prev.map((account, i) => 
      i === index ? { ...account, name: cleanedValue } : account
    ));
  };

  const addAccount = () => {
    setAccounts(prev => [...prev, { name: '' }]);
  };

  const removeAccount = (index: number) => {
    if (accounts.length > 1) {
      setAccounts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaleChange = (index: number, field: 'fullName' | 'email', value: string) => {
    let cleanedValue = value;
    
    // Clean special characters for sale full name
    if (field === 'fullName') {
      cleanedValue = value
        .replace(/^[\u0E47-\u0E4E]+/, '') // Remove leading Thai diacritical marks
        .replace(/[^\u0020-\u007E\u0E01-\u0E5B]/g, '') // Keep only ASCII, spaces, and Thai characters
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space (no trim)
    }
    
    setSales(prev => prev.map((sale, i) => 
      i === index ? { ...sale, [field]: cleanedValue } : sale
    ));
  };

  const addSale = () => {
    setSales(prev => [...prev, { fullName: '', email: '' }]);
  };

  const removeSale = (index: number) => {
    if (sales.length > 1) {
      setSales(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.fullName || formData.fullName.trim() === '') {
      toast.error(t('signup.fullNameRequired'));
      setLoading(false);
      return;
    }
    if (!formData.staffId || formData.staffId.trim() === '') {
      toast.error(t('signup.staffIdRequired'));
      setLoading(false);
      return;
    }
    if (!formData.email || formData.email.trim() === '') {
      toast.error(t('signup.emailRequired'));
      setLoading(false);
      return;
    }
    if (!formData.password || formData.password.trim() === '') {
      toast.error(t('signup.passwordRequired'));
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('signup.passwordMismatch'));
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t('signup.invalidEmail'));
      setLoading(false);
      return;
    }

    try {
      // Prepare data for API call
      const signupData = {
        ...formData,
        fullName: formData.fullName.trim(), // Trim only when sending to API
        staffId: formData.staffId.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        confirmPassword: formData.confirmPassword.trim(),
        involvedAccountNames: accounts.map(acc => acc.name).filter(name => name.trim() !== ''),
        involvedSaleNames: sales.map(sale => sale.fullName).filter(name => name.trim() !== ''),
        involvedSaleEmails: sales.map(sale => sale.email).filter(email => email.trim() !== '')
      };

      console.log('Signup Data:', signupData);
      
      // Call signup API using API service
      const result = await apiService.signup(signupData);

      if (result.success) {
        toast.success(t('signup.success'));
        
        // Redirect to login page
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(result.message || t('signup.error'));
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Determine error message based on error type
      let errorMessage = t('signup.error');
      
      if (error.message) {
        if (error.message.includes('already exists')) {
          errorMessage = 'อีเมลหรือรหัสพนักงานนี้ถูกใช้งานแล้ว';
        } else if (error.message.includes('Validation failed')) {
          errorMessage = 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง';
        } else if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
          errorMessage = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง';
        } else if (error.message.includes('Full name contains invalid characters')) {
          errorMessage = 'ชื่อ-นามสกุลมีตัวอักษรที่ไม่ถูกต้อง';
        } else if (error.message.includes('Staff ID contains invalid characters')) {
          errorMessage = 'รหัสพนักงานมีตัวอักษรที่ไม่ถูกต้อง';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 dark:bg-gray-700/50 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-gray-600 mb-4">
            <svg className="w-12 h-12 text-white dark:text-gray-100" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white dark:text-gray-100 mb-2">ASC3 Contribution</h1>
          <p className="text-white/70 dark:text-gray-300">{t('signup.subtitle')}</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 border border-white/20 dark:border-gray-600 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white dark:text-gray-100 mb-2">{t('signup.title')}</h2>
            <p className="text-white/70 dark:text-gray-300 text-sm">{t('signup.description')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-white/90 dark:text-gray-100 text-sm font-medium mb-2">
                {t('signup.fullName')} *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 dark:text-gray-600" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 dark:bg-gray-100 border border-white/30 dark:border-gray-300 text-slate-900 dark:text-gray-900 placeholder-slate-500 dark:placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                           transition-all duration-200"
                  placeholder={t('signup.fullNamePlaceholder')}
                />
              </div>
            </div>

            {/* Staff ID */}
            <div>
              <label className="block text-white/90 dark:text-gray-100 text-sm font-medium mb-2">
                {t('signup.staffId')} *
              </label>
              <div className="relative">
                <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 dark:text-gray-400" />
                <input
                  type="text"
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 dark:bg-gray-100 border border-white/30 dark:border-gray-300 text-slate-900 dark:text-gray-900 placeholder-slate-500 dark:placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                           transition-all duration-200"
                  placeholder={t('signup.staffIdPlaceholder')}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-900 dark:text-gray-100 text-sm font-medium mb-2">
                {t('signup.email')} *
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 dark:text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 dark:bg-gray-100 border border-white/30 dark:border-gray-300 text-slate-900 dark:text-gray-900 placeholder-slate-500 dark:placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                           transition-all duration-200"
                  placeholder={t('signup.emailPlaceholder')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/90 dark:text-gray-100 text-sm font-medium mb-2">
                {t('signup.password')} *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/90 dark:bg-gray-100 border border-white/30 dark:border-gray-300 text-slate-900 dark:text-gray-900 placeholder-slate-500 dark:placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                           transition-all duration-200"
                  placeholder={t('signup.passwordPlaceholder')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 dark:text-gray-600 hover:text-slate-700 dark:hover:text-gray-800 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-white/90 dark:text-gray-100 text-sm font-medium mb-2">
                {t('signup.confirmPassword')} *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/90 dark:bg-gray-100 border border-white/30 dark:border-gray-300 text-slate-900 dark:text-gray-900 placeholder-slate-500 dark:placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                           transition-all duration-200"
                  placeholder={t('signup.confirmPasswordPlaceholder')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 dark:text-gray-600 hover:text-slate-700 dark:hover:text-gray-800 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Account Names */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-white/90 dark:text-gray-100 text-sm font-medium">
                  {t('signup.accounts')}
                </label>
                <button
                  type="button"
                  onClick={addAccount}
                  className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium text-white bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 transition-all duration-200"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  {t('signup.addAccount')}
                </button>
              </div>
              <div className="space-y-2">
                {accounts.map((account, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 dark:text-gray-400" />
                      <input
                        type="text"
                        value={account.name}
                        onChange={(e) => handleAccountChange(index, e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 dark:bg-gray-700/50 border border-white/30 dark:border-gray-600 text-white dark:text-gray-100 placeholder-white/50 dark:placeholder-gray-400
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                 transition-all duration-200"
                        placeholder={t('signup.accountPlaceholder', { number: index + 1 })}
                      />
                    </div>
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAccount(index)}
                        className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 hover:text-red-200 transition-all duration-200"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sale Information */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-white/90 dark:text-gray-100 text-sm font-medium">
                  {t('signup.sales')}
                </label>
                <button
                  type="button"
                  onClick={addSale}
                  className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium text-white bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 transition-all duration-200"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  {t('signup.addSale')}
                </button>
              </div>
              <div className="space-y-3">
                {sales.map((sale, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white/80 dark:text-gray-200 text-sm font-medium">{t('signup.saleNumber', { number: index + 1 })}</h4>
                      {sales.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSale(index)}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 hover:text-red-200 transition-all duration-200"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {/* Sale Full Name */}
                      <div className="relative">
                        <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 dark:text-gray-400" />
                        <input
                          type="text"
                          value={sale.fullName}
                          onChange={(e) => handleSaleChange(index, 'fullName', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 dark:bg-gray-100 border border-white/30 dark:border-gray-300 text-slate-900 dark:text-gray-900 placeholder-slate-500 dark:placeholder-gray-600
                                   focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                   transition-all duration-200"
                          placeholder={t('signup.saleNamePlaceholder')}
                        />
                      </div>
                      {/* Sale Email */}
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50 dark:text-gray-400" />
                        <input
                          type="email"
                          value={sale.email}
                          onChange={(e) => handleSaleChange(index, 'email', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 dark:bg-gray-100 border border-white/30 dark:border-gray-300 text-slate-900 dark:text-gray-900 placeholder-slate-500 dark:placeholder-gray-600
                                   focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                                   transition-all duration-200"
                          placeholder={t('signup.saleEmailPlaceholder')}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-lg font-bold text-white shadow-xl
                         transition-all disabled:opacity-60 disabled:cursor-not-allowed
                         hover:shadow-2xl hover:-translate-y-1 transform"
              style={{ 
                background: 'linear-gradient(90deg, #365486 0%, #7FC7D9 100%)',
                boxShadow: '0 10px 25px -5px rgba(54, 84, 134, 0.35), 0 6px 10px -5px rgba(0,0,0,0.4)'
              }}
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <span className="animate-spin inline-block h-5 w-5 rounded-full border-2 border-white border-b-transparent mr-3" />
                  {t('signup.signingUp')}
                </span>
              ) : (
                <span>{t('signup.signUp')} →</span>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-white/80 dark:text-gray-300 text-sm mb-3">
              {t('signup.haveAccount')}
            </p>
            <Link 
              to="/login" 
              className="inline-flex items-center px-6 py-3 rounded-xl text-white dark:text-gray-100 font-medium
                         border-2 border-white/30 dark:border-gray-600 hover:border-white/50 dark:hover:border-gray-500 hover:bg-white/10 dark:hover:bg-gray-700/50
                         transition-all duration-200 hover:shadow-lg"
            >
              {t('signup.login')}
            </Link>
          </div>

          {/* Language Toggle */}
          <div className="mt-6 flex justify-center">
            <LanguageToggle />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-white/60">
          <p className="font-medium">{t('signup.footerTitle')}</p>
          <p className="text-sm">{t('signup.footerCopyright')}</p>
        </footer>
      </div>
    </div>
  );
};

export default Signup;
