import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import Tooltip from '../components/Tooltip';
import {
  ChartBarIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  XMarkIcon,
  CheckIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { generateEarthToneReport } from '../utils/printTemplate';

interface ReportData {
  contributions: any[];
  totalContributions: number;
  totalUsers: number;
  totalAccounts: number;
  highImpact: number;
  mediumImpact: number;
  lowImpact: number;
  criticalImpact: number;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  console.log('🔍 Reports component mounted');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedReport, setSelectedReport] = useState('comprehensive');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    saleName: '',
    presaleName: '',
    accountName: '',
    impact: '',
    contributionType: '',
    status: '',
    startMonth: '',
    endMonth: ''
  });

  const [printFields, setPrintFields] = useState({
    account: true,
    title: true,
    description: true,
    type: true,
    impact: false,
    effort: false,
    status: false,
    month: true,
    saleName: true,
    presaleName: true
  });
  const [filterOptions, setFilterOptions] = useState({
    accounts: [] as string[],
    sales: [] as string[],
    presales: [] as string[]
  });

  const reportTypes = [
    { value: 'comprehensive', label: 'Comprehensive Report', description: 'รายงานแบบละเอียดพร้อม Timeline' }
  ];

  useEffect(() => {
    console.log('🔍 Reports useEffect triggered, user:', user);
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading report data...');
      
      // Load contributions data
      const contributionsResponse = await apiService.getContributions();
      console.log('🔍 Contributions response:', contributionsResponse);
      
      if (contributionsResponse.success) {
        const allContributions = contributionsResponse.data;
        console.log('🔍 All contributions data:', allContributions);
        
        // Store all contributions for filtering
        setReportData({
          contributions: allContributions,
          totalContributions: allContributions.length,
          totalUsers: new Set(allContributions.map((c: any) => c.userId)).size,
          totalAccounts: new Set(allContributions.map((c: any) => c.accountName)).size,
          highImpact: allContributions.filter((c: any) => c.impact === 'high').length,
          mediumImpact: allContributions.filter((c: any) => c.impact === 'medium').length,
          lowImpact: allContributions.filter((c: any) => c.impact === 'low').length,
          criticalImpact: 0
        });
        
        // Generate filter options - remove duplicates, empty values, and invalid entries
        const accounts = Array.from(new Set(
          allContributions
            .map((c: any) => c.accountName)
            .filter(Boolean)
            .filter(account => account.trim() !== '')
            .filter(account => !account.toLowerCase().includes('all accounts'))
        ));
        const sales = Array.from(new Set(
          allContributions
            .map((c: any) => c.saleName)
            .filter(Boolean)
            .filter(sale => sale.trim() !== '')
            .filter(sale => !sale.toLowerCase().includes('all sales'))
        ));
        const presales = Array.from(new Set(
          allContributions
            .map((c: any) => c.userName)
            .filter(Boolean)
            .filter(presale => presale.trim() !== '')
            .filter(presale => !presale.toLowerCase().includes('all presales'))
        ));
        
        setFilterOptions({
          accounts: accounts.sort(),
          sales: sales.sort(),
          presales: presales.sort()
        });
        
        console.log('🔍 All contributions:', allContributions);
        console.log('🔍 Raw account names:', allContributions.map((c: any) => c.accountName));
        console.log('🔍 Filtered accounts:', accounts);
        console.log('🔍 Filter options:', { accounts, sales, presales });
      } else {
        toast.error('Failed to load contributions data');
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    console.log('🔍 handlePrintReport called');
    console.log('🔍 reportData:', reportData);
    console.log('🔍 filteredData:', filteredData);
    console.log('🔍 filteredData.contributions:', filteredData?.contributions);
    console.log('🔍 filteredData.contributions.length:', filteredData?.contributions?.length);
    console.log('🔍 selectedReport:', selectedReport);
    console.log('🔍 user:', user);
    console.log('🔍 filters:', filters);
    console.log('🔍 printFields:', printFields);
    
    // Check if we have any data at all
    if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
      console.error('❌ No report data available');
      toast.error('No report data available. Please check if there are any contributions in the system.');
      return;
    }

    console.log('🔍 Checking condition:');
    console.log('🔍 filteredData exists:', !!filteredData);
    console.log('🔍 filteredData.contributions exists:', !!filteredData?.contributions);
    console.log('🔍 filteredData.contributions is array:', Array.isArray(filteredData?.contributions));
    console.log('🔍 filteredData.contributions.length > 0:', (filteredData?.contributions?.length || 0) > 0);
    
    if (filteredData && filteredData.contributions && Array.isArray(filteredData.contributions) && filteredData.contributions.length > 0) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const reportTitle = selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1).replace('_', ' ');
        
        // Use the new Earth Tone template
        const reportContent = generateEarthToneReport(filteredData, selectedReport, user, filters, printFields);
        
        console.log('🔍 Generated report content length:', reportContent.length);
        console.log('🔍 Report content preview:', reportContent.substring(0, 500));
        
        printWindow.document.write(reportContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    } else {
        console.error('❌ Failed to open print window');
        toast.error('Failed to open print window');
      }
    } else {
      console.error('❌ No filtered data available');
      console.error('❌ filteredData:', filteredData);
      console.error('❌ filteredData.contributions:', filteredData?.contributions);
      console.error('❌ filteredData.contributions.length:', filteredData?.contributions?.length);
      toast.error('No data matches the current filters. Please adjust your filters and try again.');
    }
  };

  const handleShowPreview = () => {
    console.log('🔍 handleShowPreview called');
    console.log('🔍 reportData:', reportData);
    console.log('🔍 filteredData:', filteredData);
    console.log('🔍 filteredData.contributions:', filteredData?.contributions);
    console.log('🔍 filteredData.contributions.length:', filteredData?.contributions?.length);
    console.log('🔍 selectedReport:', selectedReport);
    console.log('🔍 user:', user);
    console.log('🔍 filters:', filters);
    console.log('🔍 printFields:', printFields);
    
    // Check if we have any data at all
    if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
      console.error('❌ No report data available');
      toast.error('No report data available. Please check if there are any contributions in the system.');
      return;
    }

    console.log('🔍 Checking condition:');
    console.log('🔍 filteredData exists:', !!filteredData);
    console.log('🔍 filteredData.contributions exists:', !!filteredData?.contributions);
    console.log('🔍 filteredData.contributions is array:', Array.isArray(filteredData?.contributions));
    console.log('🔍 filteredData.contributions.length > 0:', (filteredData?.contributions?.length || 0) > 0);
    
    if (filteredData && filteredData.contributions && Array.isArray(filteredData.contributions) && filteredData.contributions.length > 0) {
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        const reportTitle = selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1).replace('_', ' ');
        
        // Use the same template as print but without print dialog
        const reportContent = generateEarthToneReport(filteredData, selectedReport, user, filters, printFields);
        
        console.log('🔍 Generated preview content length:', reportContent.length);
        console.log('🔍 Preview content preview:', reportContent.substring(0, 500));
        
        previewWindow.document.write(reportContent);
        previewWindow.document.close();
        previewWindow.focus();
    } else {
        console.error('❌ Failed to open preview window');
        toast.error('Failed to open preview window');
      }
    } else {
      console.error('❌ No filtered data available');
      console.error('❌ filteredData:', filteredData);
      console.error('❌ filteredData.contributions:', filteredData?.contributions);
      console.error('❌ filteredData.contributions.length:', filteredData?.contributions?.length);
      toast.error('No data matches the current filters. Please adjust your filters and try again.');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    console.log('🔍 Filter changed:', key, '=', value);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePrintFieldChange = (field: string, checked: boolean) => {
    setPrintFields(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  // Calculate filtered data based on current filters
  const getFilteredData = () => {
    if (!reportData) return null;

    console.log('🔍 Filtering data with filters:', filters);
    console.log('🔍 Total contributions before filter:', reportData.contributions.length);
    console.log('🔍 Sample contribution data:', reportData.contributions[0]);

    const filteredContributions = reportData.contributions.filter((contrib: any) => {
      console.log('🔍 Checking contribution:', contrib.title, {
        saleName: contrib.saleName,
        userName: contrib.userName,
        accountName: contrib.accountName,
        impact: contrib.impact,
        contributionType: contrib.contributionType,
        status: contrib.status
      });
      
      if (filters.saleName && filters.saleName !== 'All Sales' && contrib.saleName !== filters.saleName) {
        console.log('🔍 Filtered out by saleName:', contrib.saleName, 'vs', filters.saleName);
        return false;
      }
      if (filters.presaleName && filters.presaleName !== 'All Presales' && contrib.userName !== filters.presaleName) {
        console.log('🔍 Filtered out by presaleName:', contrib.userName, 'vs', filters.presaleName);
        return false;
      }
      if (filters.accountName && filters.accountName !== 'All Accounts' && contrib.accountName !== filters.accountName) {
        console.log('🔍 Filtered out by accountName:', contrib.accountName, 'vs', filters.accountName);
        return false;
      }
      if (filters.impact && filters.impact !== 'All Impact Levels' && contrib.impact !== filters.impact) {
        console.log('🔍 Filtered out by impact:', contrib.impact, 'vs', filters.impact);
        return false;
      }
      if (filters.contributionType && filters.contributionType !== 'All Types' && contrib.contributionType !== filters.contributionType) {
        console.log('🔍 Filtered out by contributionType:', contrib.contributionType, 'vs', filters.contributionType);
        return false;
      }
      if (filters.status && filters.status !== 'All Statuses' && contrib.status !== filters.status) {
        console.log('🔍 Filtered out by status:', contrib.status, 'vs', filters.status);
        return false;
      }
      console.log('🔍 Contribution passed all filters');
      return true;
    });

    console.log('🔍 Filtered contributions count:', filteredContributions.length);

    return {
      contributions: filteredContributions,
      totalContributions: filteredContributions.length,
      totalUsers: new Set(filteredContributions.map((c: any) => c.userId)).size,
      totalAccounts: new Set(filteredContributions.map((c: any) => c.accountName)).size,
      highImpact: filteredContributions.filter((c: any) => c.impact === 'high').length,
      mediumImpact: filteredContributions.filter((c: any) => c.impact === 'medium').length,
      lowImpact: filteredContributions.filter((c: any) => c.impact === 'low').length,
      criticalImpact: 0
    };
  };

  const clearFilters = () => {
    console.log('🔍 Clearing all filters');
    setFilters({
      saleName: '',
      presaleName: '',
      accountName: '',
      impact: '',
      contributionType: '',
      status: '',
      startMonth: '',
      endMonth: ''
    });
  };

  const filteredData = getFilteredData();
  const filteredContributions = filteredData ? filteredData.contributions : [];

  if (loading) {
  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
            </div>
            </div>
    );
  }

  return (
    <div className="reports-page min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <ChartBarIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
            {t('reports.title')}
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('reports.subtitle')}
          </p>
      </div>

      {/* Statistics Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contributions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.totalContributions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Accounts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.totalAccounts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Impact</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.highImpact + reportData.criticalImpact}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Impact Distribution Chart */}
      {reportData && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Impact Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-lg">💎</span>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.criticalImpact}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-lg">🔥</span>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.highImpact}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-lg">⭐</span>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Medium</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.mediumImpact}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-lg">🌱</span>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.lowImpact}</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Type Selection */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6 mb-6 border border-blue-200 dark:border-gray-600">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <ChartBarIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('reports.comprehensiveReport')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">รายงานแบบละเอียดพร้อม Timeline และปุ่ม Print</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <FunnelIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('reports.filters')}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">กรองข้อมูลตามเงื่อนไขที่ต้องการ</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                {showFilters ? 'ซ่อนตัวกรอง' : 'แสดงตัวกรอง'}
              </button>
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
{t('reports.clearFilters')}
              </button>
          </div>
      </div>

          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Account Name
                    </span>
                  </label>
            <select
                  value={filters.accountName}
                  onChange={(e) => handleFilterChange('accountName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="">{t('reports.allAccounts')}</option>
                  {filterOptions.accounts.map(account => (
                    <option key={account} value={account}>{account}</option>
              ))}
            </select>
          </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Sale Name
                    </span>
                  </label>
                <select
                  value={filters.saleName}
                  onChange={(e) => handleFilterChange('saleName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="">All Sales</option>
                  {filterOptions.sales.map(sale => (
                    <option key={sale} value={sale}>{sale}</option>
              ))}
            </select>
          </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      Presale Name
                    </span>
                  </label>
                <select
                  value={filters.presaleName}
                  onChange={(e) => handleFilterChange('presaleName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="">All Presales</option>
                  {filterOptions.presales.map(presale => (
                    <option key={presale} value={presale}>{presale}</option>
                  ))}
                </select>
                    </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Impact Level
                    </span>
                  </label>
                <select
                  value={filters.impact}
                  onChange={(e) => handleFilterChange('impact', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="">All Impact Levels</option>
                  <option value="low">🌱 Routine Contribution</option>
                  <option value="medium">⭐ Team-Level Impact</option>
                  <option value="high">🔥 Department/Org-Level Impact</option>
                  <option value="critical">💎 Strategic Impact</option>
                </select>
                  </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Contribution Type
                    </span>
                  </label>
                <select
                  value={filters.contributionType}
                  onChange={(e) => handleFilterChange('contributionType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="">All Types</option>
                  <option value="technical">Technical</option>
                  <option value="business">Business</option>
                  <option value="support">Support</option>
                </select>
                          </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Status
                    </span>
                  </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                </div>
                    </div>
                  </div>
                )}
              </div>

        {/* Print Fields Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
              <PrinterIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">เลือก Field ที่จะ Print</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">เลือกฟิลด์ที่ต้องการแสดงในรายงาน</p>
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={printFields.account}
                          onChange={(e) => handlePrintFieldChange('account', e.target.checked)}
                          className="rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 w-4 h-4 bg-white dark:bg-gray-700 checked:bg-primary-600 checked:border-primary-600"
                          style={{
                            accentColor: '#3B82F6'
                          }}
                        />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Account</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={printFields.title}
                onChange={(e) => handlePrintFieldChange('title', e.target.checked)}
                className="rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 w-4 h-4 bg-white dark:bg-gray-700 checked:bg-primary-600 checked:border-primary-600"
                style={{
                  accentColor: '#3B82F6'
                }}
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Title</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={printFields.description}
                onChange={(e) => handlePrintFieldChange('description', e.target.checked)}
                className="rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 w-4 h-4 bg-white dark:bg-gray-700 checked:bg-primary-600 checked:border-primary-600"
                style={{
                  accentColor: '#3B82F6'
                }}
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Description</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={printFields.type}
                onChange={(e) => handlePrintFieldChange('type', e.target.checked)}
                className="rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 w-4 h-4 bg-white dark:bg-gray-700 checked:bg-primary-600 checked:border-primary-600"
                style={{
                  accentColor: '#3B82F6'
                }}
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Type</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={printFields.impact}
                onChange={(e) => handlePrintFieldChange('impact', e.target.checked)}
                className="rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 w-4 h-4 bg-white dark:bg-gray-700 checked:bg-primary-600 checked:border-primary-600"
                style={{
                  accentColor: '#3B82F6'
                }}
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Impact</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={printFields.effort}
                onChange={(e) => handlePrintFieldChange('effort', e.target.checked)}
                className="rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 w-4 h-4 bg-white dark:bg-gray-700 checked:bg-primary-600 checked:border-primary-600"
                style={{
                  accentColor: '#3B82F6'
                }}
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Effort</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={printFields.status}
                onChange={(e) => handlePrintFieldChange('status', e.target.checked)}
                className="rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 w-4 h-4 bg-white dark:bg-gray-700 checked:bg-primary-600 checked:border-primary-600"
                style={{
                  accentColor: '#3B82F6'
                }}
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Status</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={printFields.month}
                onChange={(e) => handlePrintFieldChange('month', e.target.checked)}
                className="rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 w-4 h-4 bg-white dark:bg-gray-700 checked:bg-primary-600 checked:border-primary-600"
                style={{
                  accentColor: '#3B82F6'
                }}
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Month</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={printFields.saleName}
                onChange={(e) => handlePrintFieldChange('saleName', e.target.checked)}
                className="rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 w-4 h-4 bg-white dark:bg-gray-700 checked:bg-primary-600 checked:border-primary-600"
                style={{
                  accentColor: '#3B82F6'
                }}
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Sale Name</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={printFields.presaleName}
                onChange={(e) => handlePrintFieldChange('presaleName', e.target.checked)}
                className="rounded border-2 border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 w-4 h-4 bg-white dark:bg-gray-700 checked:bg-primary-600 checked:border-primary-600"
                style={{
                  accentColor: '#3B82F6'
                }}
              />
              <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Presale Name</span>
            </label>
                  </div>
                  </div>
                
        {/* Report Actions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6 mb-6 border border-blue-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <ChartBarIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Report</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">สร้างและพิมพ์รายงานตามข้อมูลที่กรอง</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Tooltip content="ดูตัวอย่างรายงานก่อนพิมพ์">
                <button
                  onClick={handleShowPreview}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <EyeIcon className="h-5 w-5 mr-2" />
                  Show Preview
                </button>
              </Tooltip>
              <Tooltip content="พิมพ์รายงาน">
                <button
                  onClick={handlePrintReport}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <PrinterIcon className="h-5 w-5 mr-2" />
                  Print Report
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
                
        {/* Report Summary */}
        {reportData && (() => {
          const filteredData = getFilteredData();
          if (!filteredData) return null;
          
          return (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <ChartBarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filtered Report Summary</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">สรุปข้อมูลตามเงื่อนไขที่กรอง</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{filteredData.totalContributions}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Contributions</div>
                </div>
                <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{filteredData.totalUsers}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Users</div>
                </div>
                <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{filteredData.totalAccounts}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Accounts</div>
                </div>
              </div>
            </div>
          );
        })()}
        
        {reportData && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Filtered Results</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{filteredContributions.length} contributions found</p>
                </div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                {filteredContributions.length} items
              </div>
            </div>
            {filteredContributions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Impact Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredContributions.slice(0, 10).map((contrib, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{contrib.accountName || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{contrib.title || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{contrib.contributionType || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            contrib.impact === 'critical' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                            contrib.impact === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                            contrib.impact === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          }`}>
                            {contrib.impact === 'critical' ? '💎 Strategic' :
                             contrib.impact === 'high' ? '🔥 Department/Org-Level' :
                             contrib.impact === 'medium' ? '⭐ Team-Level' :
                             '🌱 Routine'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            contrib.status === 'submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                            contrib.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                            contrib.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          }`}>
                            {contrib.status === 'approved' ? '✅ Approved' :
                             contrib.status === 'submitted' ? '⏳ Submitted' :
                             contrib.status === 'draft' ? '📝 Draft' :
                             '❌ Rejected'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{contrib.contributionMonth || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredContributions.length > 10 && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Showing first 10 of {filteredContributions.length} contributions</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No contributions found matching the selected filters.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;