import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiService } from '../services/api';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PencilIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

interface DashboardData {
  totalContributions: number;
  approvedContributions: number;
  submittedContributions: number;
  draftContributions: number;
  impactBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface MonthlyData {
  month: string;
  monthName: string;
  contributions: {
    low: number;
    medium: number;
    high: number;
    critical: number;
    total: number;
  };
}

interface TimelineData {
  year: number;
  monthlyData: MonthlyData[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(2025); // Default to 2025 (current data)

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user) {
      fetchDashboardData();
      fetchTimelineData();
    } else {
      setLoading(false);
    }
  }, [user?.id, selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching dashboard data for year:', selectedYear);
      
      const response = await apiService.getDashboardData(selectedYear);
      console.log('🔍 Dashboard API response:', response);
      
      if (response.success) {
        console.log('🔍 Dashboard data:', response.data);
        setDashboardData(response.data);
      } else {
        console.error('Failed to fetch dashboard data:', response.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimelineData = async () => {
    try {
      console.log('🔍 Fetching timeline data for year:', selectedYear);
      
      const response = await apiService.getTimelineData(selectedYear);
      console.log('🔍 Timeline API response:', response);
      
      if (response.success) {
        console.log('🔍 Timeline data:', response.data);
        setTimelineData(response.data);
      } else {
        console.error('Failed to fetch timeline data:', response.message);
      }
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Contributions ทั้งหมด',
      value: dashboardData?.totalContributions || 0,
      icon: DocumentTextIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      name: 'Contributions ที่ Approved แล้ว',
      value: dashboardData?.approvedContributions || 0,
      icon: CheckCircleIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      name: 'Contributions ที่ส่งแล้ว (รอ Review)',
      value: dashboardData?.submittedContributions || 0,
      icon: ClockIcon,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
    {
      name: 'ยัง Draft อยู่',
      value: dashboardData?.draftContributions || 0,
      icon: ExclamationTriangleIcon,
      color: 'text-danger-600',
      bgColor: 'bg-danger-100',
    },
  ];

  const impactStats = [
    { name: 'Routine', value: dashboardData?.impactBreakdown.low || 0, color: 'bg-green-500' },
    { name: 'Team-Level', value: dashboardData?.impactBreakdown.medium || 0, color: 'bg-yellow-500' },
    { name: 'Department', value: dashboardData?.impactBreakdown.high || 0, color: 'bg-red-500' },
    { name: 'Strategic', value: dashboardData?.impactBreakdown.critical || 0, color: 'bg-purple-500' },
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-purple-500';
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getImpactOrder = (impact: string) => {
    switch (impact) {
      case 'low': return 1;       // Low อยู่ล่างสุด
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;  // Critical อยู่บนสุด
      default: return 0;
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'low': return 'Routine (Low Impact)';
      case 'medium': return 'Team-Level (Medium Impact)';
      case 'high': return 'Department (High Impact)';
      case 'critical': return 'Strategic (Critical Impact)';
      default: return impact;
    }
  };

  // Layout constants to guarantee visual sequence:
  // [circles just above line] -> [blue timeline line] -> [month label at bottom]
  const TIMELINE_LINE_BOTTOM_PX = 50; // distance of blue line from bottom (above month labels)
  const CIRCLE_BASE_GAP_PX = 4;       // gap between line and lowest circle
  const CIRCLE_STACK_GAP_PX = 22;     // vertical spacing between stacked circles
  const CONNECTOR_HEIGHT_PX = 8;      // small guide line above the blue line

  // Alternative matrix view helpers
  const impactRowOrder: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
  const impactBgMap: Record<'critical' | 'high' | 'medium' | 'low', string> = {
    critical: 'bg-purple-500',
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  const renderMonthlyMarkers = (monthData: MonthlyData) => {
    const { low, medium, high, critical } = monthData.contributions;
    const markers: JSX.Element[] = [];
    
    // Create markers for each impact level with count > 0
    const impactLevels = [
      { level: 'low', count: low, color: 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-green-200' },
      { level: 'medium', count: medium, color: 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-yellow-200' },
      { level: 'high', count: high, color: 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-red-200' },
      { level: 'critical', count: critical, color: 'bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-purple-200' }
    ].filter(impact => impact.count > 0);
    
    // Sort by impact order (low to critical - low at bottom, critical at top)
    impactLevels.sort((a, b) => getImpactOrder(a.level) - getImpactOrder(b.level));
    
    
    // Stack circles vertically from bottom to top
    impactLevels.forEach((impact, index) => {
      markers.push(
        <div
          key={`${monthData.month}-${impact.level}`}
          className={`absolute w-8 h-8 ${impact.color} flex items-center justify-center text-xs font-bold shadow-lg rounded-full border-2 border-white hover:scale-110 transition-all duration-300 drop-shadow-md`}
          style={{
            bottom: `${TIMELINE_LINE_BOTTOM_PX + CIRCLE_BASE_GAP_PX + (index * CIRCLE_STACK_GAP_PX)}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10
          }}
        >
          {impact.count}
        </div>
      );
    });
    
    return markers;
  };

  // Get available years (2025, 2026, etc.)
  const availableYears = [2025, 2026, 2027, 2028, 2029];

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-soft p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">เลือกปี:</span>
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedYear === year
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
      {/* Welcome Section - World Class Design */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-8 text-white shadow-2xl border border-blue-500/20">
        <div className="flex items-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-6 shadow-lg border border-white/20">
            <UserIcon className="h-10 w-10 text-white drop-shadow-lg" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 drop-shadow-sm">{t('dashboard.welcome')} {user?.fullName}!</h1>
            <p className="text-blue-100 text-lg font-medium">
              {t('dashboard.impactAcross')} {user?.involvedAccountNames.length || 1} {t('dashboard.accounts')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white/90 drop-shadow-sm">{dashboardData?.totalContributions || 0}</div>
            <div className="text-blue-200 text-sm font-medium">{t('dashboard.contributionsAll')}</div>
          </div>
        </div>
      </div>

      {/* Contribution Timeline 2025 */}
      {timelineData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg border border-blue-400/20">
                <ChartBarIcon className="h-6 w-6 text-white drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t('dashboard.contributionTimeline')}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{t('dashboard.trackTeamImpact')} {timelineData.year}</p>
              </div>
            </div>
            <div className="text-right bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">{timelineData.year}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{t('dashboard.yearOverview')}</div>
            </div>
          </div>
          
          {/* Timeline view removed per request; showing matrix view only */}
          
          {/* Alternative: Compact Monthly Matrix */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('dashboard.monthlyImpactMatrix')}</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.quickGlance')}</span>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                {/* Header months */}
                <div className="grid" style={{ gridTemplateColumns: `120px repeat(${timelineData.monthlyData.length}, minmax(48px, 1fr))` }}>
                  <div></div>
                  {timelineData.monthlyData.map((m) => (
                    <div key={`head-${m.month}`} className="text-center text-xs font-medium text-gray-600 dark:text-gray-300 py-1">{m.monthName}</div>
                  ))}
                </div>
                {/* Rows by impact level */}
                {impactRowOrder.map((impactKey) => (
                  <div key={`row-${impactKey}`} className="grid items-center" style={{ gridTemplateColumns: `120px repeat(${timelineData.monthlyData.length}, minmax(48px, 1fr))` }}>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 py-2">
                      {getImpactLabel(impactKey)}
                    </div>
                    {timelineData.monthlyData.map((m) => {
                      const count = (m.contributions as any)[impactKey] as number;
                      return (
                        <div key={`cell-${impactKey}-${m.month}`} className="py-1 flex items-center justify-center">
                          {count > 0 ? (
                            <div className={`w-6 h-6 rounded-full ${impactBgMap[impactKey]} text-white text-[10px] font-semibold flex items-center justify-center shadow-sm`}>{count}</div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700/60"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clean Legend */}
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-8 text-sm bg-gray-50 dark:bg-gray-800 px-6 py-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.legendRoutine')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.legendTeam')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.legendDepartment')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.legendStrategic')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Impact Overview */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Impact Overview</h2>
          <ChartBarIcon className="h-6 w-6 text-gray-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {impactStats.map((impact) => (
            <div key={impact.name} className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full ${impact.color} flex items-center justify-center mb-2`}>
                <span className="text-white font-bold text-lg">{impact.value}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">{impact.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions - Admin Only */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => window.location.href = '/contributions'}
              className="flex items-center justify-center p-4 border-2 border-dashed border-primary-300 rounded-xl text-primary-600 hover:border-primary-400 hover:text-primary-700 transition-colors duration-200"
            >
              <DocumentTextIcon className="h-6 w-6 mr-2" />
              Add New Contribution
            </button>
            <button 
              onClick={() => window.location.href = '/reports'}
              className="flex items-center justify-center p-4 border-2 border-dashed border-warning-300 rounded-xl text-warning-600 hover:border-warning-400 hover:text-warning-700 transition-colors duration-200"
            >
              <ChartBarIcon className="h-6 w-6 mr-2" />
              View Reports
            </button>
            <button 
              onClick={() => window.location.href = '/user-management'}
              className="flex items-center justify-center p-4 border-2 border-dashed border-success-300 rounded-xl text-success-600 hover:border-success-400 hover:text-success-700 transition-colors duration-200"
            >
              <CheckCircleIcon className="h-6 w-6 mr-2" />
              Review Submissions
            </button>
          </div>
        </div>
      )}

      {/* User Information - Regular User Only */}
      {user?.role === 'user' && (
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Profile Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Full Name:</span>
                  <span className="text-sm font-medium text-gray-900">{user.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Staff ID:</span>
                  <span className="text-sm font-medium text-gray-900">{user.staffId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium text-gray-900">{user.email}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Account Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Role:</span>
                  <span className="text-sm font-medium text-blue-600 capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-sm font-medium ${user.status === 'approved' ? 'text-green-600' : 'text-yellow-600'} capitalize`}>
                    {user.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Can View Others:</span>
                  <span className={`text-sm font-medium ${user.canViewOthers ? 'text-green-600' : 'text-gray-500'}`}>
                    {user.canViewOthers ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => navigate('/my-contributions')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                View My Contributions
              </button>
              <button 
                onClick={() => navigate('/user-management')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit My Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No recent contributions yet</p>
          <p className="text-sm">Start by adding your first contribution!</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
