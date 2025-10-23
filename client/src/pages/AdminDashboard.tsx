import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CogIcon,
  LockClosedIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

interface AdminDashboardData {
  totalContributions: number;
  totalUsers: number;
  totalAccounts: number;
  impactBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface UserContribution {
  userId: string;
  userName: string;
  totalContributions: number;
  recentContributions: Array<{
    id: string;
    title: string;
    accountName: string;
    contributionType: string;
    impact: string;
    contributionMonth: string;
    createdAt: string;
  }>;
}

interface Contribution {
  id: string;
  title: string;
  accountName: string;
  saleName: string;
  saleEmail: string;
  contributionType: string;
  impact: string;
  effort: string;
  estimatedImpactValue?: number;
  description: string;
  contributionMonth: string;
  tags: string[];
  status: 'draft' | 'submitted';
  createdAt: string;
  updatedAt: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [userContributions, setUserContributions] = useState<UserContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserContribution | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showAdminResetModal, setShowAdminResetModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  // Edit contribution states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Contribution>>({});
  
  // Timeline (Time Series / Matrix) data for Admin (aggregated across users)
  interface AdminMonthlyData {
    month: string;
    monthName: string;
    contributions: { low: number; medium: number; high: number; critical: number; total: number };
  }
  interface AdminTimelineData { year: number; monthlyData: AdminMonthlyData[] }
  const [timelineData, setTimelineData] = useState<AdminTimelineData | null>(null);
  const impactRowOrder: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
  const impactBgMap: Record<'critical' | 'high' | 'medium' | 'low', string> = {
    critical: 'bg-purple-500',
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };
  const getImpactLabel = (impact: string) => impact === 'critical' ? 'Strategic (Critical Impact)' : impact === 'high' ? 'Department (High Impact)' : impact === 'medium' ? 'Team-Level (Medium Impact)' : 'Routine (Low Impact)';

  console.log('🔍 AdminDashboard component rendered');
  console.log('🔍 User:', user);
  console.log('🔍 Navigate function:', typeof navigate);

  useEffect(() => {
    fetchAdminDashboardData();
    fetchUserContributions();
    fetchTimelineData();
  }, [user?.id]);

  const fetchAdminDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching admin dashboard data...');
      
      // Get contributions data
      const contributionsResponse = await apiService.getContributions();
      console.log('🔍 Contributions response:', contributionsResponse);
      
      // Get users data
      const usersResponse = await apiService.getUsers();
      console.log('🔍 Users response:', usersResponse);
      
      if (contributionsResponse.success && usersResponse.success) {
        const contributions = contributionsResponse.data;
        const users = usersResponse.data;
        
        // Calculate statistics
        const totalContributions = contributions.length;
        const totalUsers = users.length;
        const uniqueAccounts = new Set(contributions.map((c: any) => c.accountName)).size;
        
        const impactBreakdown = {
          critical: contributions.filter((c: any) => c.impact === 'critical').length,
          high: contributions.filter((c: any) => c.impact === 'high').length,
          medium: contributions.filter((c: any) => c.impact === 'medium').length,
          low: contributions.filter((c: any) => c.impact === 'low').length
        };
        
        const dashboardData: AdminDashboardData = {
          totalContributions,
          totalUsers,
          totalAccounts: uniqueAccounts,
          impactBreakdown
        };
        
        console.log('🔍 Calculated dashboard data:', dashboardData);
        setDashboardData(dashboardData);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimelineData = async () => {
    try {
      const response = await apiService.getTimelineData();
      if (response.success) {
        setTimelineData(response.data);
      }
    } catch (error) {
      console.error('Error fetching admin timeline data:', error);
    }
  };

  const fetchUserContributions = async () => {
    try {
      const response = await apiService.getContributions();
      if (response.success) {
        // Group contributions by user
        const userMap = new Map<string, UserContribution>();
        
        response.data.forEach((contribution: any) => {
          const userId = contribution.userId;
          const userName = contribution.userName;
          
          if (!userMap.has(userId)) {
            userMap.set(userId, {
              userId,
              userName,
              totalContributions: 0,
              recentContributions: []
            });
          }
          
          const userData = userMap.get(userId)!;
          userData.totalContributions++;
          
          // Add to recent contributions (max 5 per user)
          if (userData.recentContributions.length < 5) {
            userData.recentContributions.push({
              id: contribution.id,
              title: contribution.title,
              accountName: contribution.accountName,
              contributionType: contribution.contributionType,
              impact: contribution.impact,
              contributionMonth: contribution.contributionMonth,
              createdAt: contribution.createdAt
            });
          }
        });
        
        // Sort by total contributions descending
        const sortedUsers = Array.from(userMap.values()).sort((a, b) => b.totalContributions - a.totalContributions);
        setUserContributions(sortedUsers);
      }
    } catch (error) {
      console.error('Error fetching user contributions:', error);
    }
  };

  const handleUserClick = (userContribution: UserContribution) => {
    setSelectedUser(userContribution);
    setShowUserDetails(true);
  };

  // Edit contribution handlers
  const handleEditContribution = async (contributionId: string) => {
    try {
      const response = await apiService.getContributionById(contributionId);
      if (response.success) {
        setSelectedContribution(response.data);
        setEditFormData(response.data);
        setShowEditModal(true);
      } else {
        toast.error('Failed to load contribution details');
      }
    } catch (error: any) {
      console.error('Error loading contribution:', error);
      toast.error('Failed to load contribution details');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContribution) return;

    try {
      const response = await apiService.updateContribution(selectedContribution.id, editFormData);
      if (response.success) {
        toast.success('Contribution updated successfully');
        setShowEditModal(false);
        setSelectedContribution(null);
        setEditFormData({});
        // Refresh user contributions
        fetchUserContributions();
      } else {
        toast.error('Failed to update contribution');
      }
    } catch (error: any) {
      console.error('Error updating contribution:', error);
      toast.error('Failed to update contribution');
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setSelectedContribution(null);
    setEditFormData({});
  };

  // Quick Actions handlers
  const handleManageUsers = () => {
    console.log('🔍 handleManageUsers called');
    console.log('🔍 Current location:', window.location.pathname);
    console.log('🔍 Navigate function:', typeof navigate);
    console.log('🔍 User role:', user?.role);
    try {
      console.log('🔍 Attempting navigation to /user-management');
      navigate('/user-management');
      console.log('🔍 Navigate to user-management called successfully');
    } catch (error: any) {
      console.error('❌ Navigation error:', error);
      toast.error('Navigation failed: ' + (error.message || 'Unknown error'));
    }
  };

  const handleViewReports = () => {
    console.log('🔍 handleViewReports called');
    console.log('🔍 Current location:', window.location.pathname);
    console.log('🔍 Navigate function:', typeof navigate);
    console.log('🔍 User role:', user?.role);
    try {
      console.log('🔍 Attempting navigation to /reports');
      navigate('/reports');
      console.log('🔍 Navigate to reports called successfully');
    } catch (error: any) {
      console.error('❌ Navigation error:', error);
      toast.error('Navigation failed: ' + (error.message || 'Unknown error'));
    }
  };

  const handleReviewSubmissions = () => {
    console.log('🔍 handleReviewSubmissions called');
    console.log('🔍 Current location:', window.location.pathname);
    console.log('🔍 Navigate function:', typeof navigate);
    console.log('🔍 User role:', user?.role);
    try {
      console.log('🔍 Attempting navigation to /my-contributions');
      navigate('/my-contributions');
      console.log('🔍 Navigate to my-contributions called successfully');
    } catch (error: any) {
      console.error('❌ Navigation error:', error);
      toast.error('Navigation failed: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAdminResetPassword = (userId: string) => {
    setSelectedUserId(userId);
    setResetPasswordData({ newPassword: '', confirmPassword: '' });
    setShowAdminResetModal(true);
  };

  const handleAdminResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (resetPasswordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await apiService.adminResetPassword({
        userId: selectedUserId,
        newPassword: resetPasswordData.newPassword
      });

      if (response.success) {
        toast.success('Password reset successfully');
        setShowAdminResetModal(false);
        setResetPasswordData({ newPassword: '', confirmPassword: '' });
      } else {
        toast.error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Admin reset password error:', error);
      toast.error('Failed to reset password');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      const response = await apiService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (response.success) {
        toast.success('Password changed successfully');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    }
  };

  // const handleSystemSettings = () => {
  //   toast('System Settings feature coming soon!', {
  //     icon: 'ℹ️',
  //     duration: 3000,
  //   });
  // };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: t('dashboard.totalUsers'),
      value: dashboardData?.totalUsers || 0,
      icon: UserGroupIcon,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      name: t('dashboard.totalAccounts'),
      value: dashboardData?.totalAccounts || 0,
      icon: DocumentTextIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
    {
      name: t('dashboard.totalContributions'),
      value: dashboardData?.totalContributions || 0,
      icon: ChartBarIcon,
      color: 'text-warning-600',
      bgColor: 'bg-warning-100',
    },
  ];


  const impactStats = [
    { name: 'Strategic (Critical Impact)', value: dashboardData?.impactBreakdown.critical || 0, color: 'bg-purple-500' },
    { name: 'Department (High Impact)', value: dashboardData?.impactBreakdown.high || 0, color: 'bg-red-500' },
    { name: 'Team-Level (Medium Impact)', value: dashboardData?.impactBreakdown.medium || 0, color: 'bg-yellow-500' },
    { name: 'Routine (Low Impact)', value: dashboardData?.impactBreakdown.low || 0, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Welcome Section */}
      <div className="bg-gradient-to-r from-secondary-600 to-secondary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="bg-white bg-opacity-60 dark:bg-gray-800 dark:bg-opacity-60 p-3 rounded-xl border-2 border-white border-opacity-50 dark:border-gray-600 dark:border-opacity-50 shadow-xl">
            <CogIcon className="h-8 w-8 text-gray-800 dark:text-white drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('dashboard.adminTitle')}</h1>
            <p className="text-secondary-100">
              {t('dashboard.adminWelcome')}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Impact Matrix (Admin - Aggregated) */}
      {timelineData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.monthlyImpactMatrix')}</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.allUsers')} • {timelineData.year}</span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              {/* Header months */}
              <div className="grid" style={{ gridTemplateColumns: `160px repeat(${timelineData.monthlyData.length}, minmax(48px, 1fr))` }}>
                <div></div>
                {timelineData.monthlyData.map((m) => (
                  <div key={`head-${m.month}`} className="text-center text-xs font-medium text-gray-600 dark:text-gray-300 py-1">{m.monthName}</div>
                ))}
              </div>
              {/* Rows by impact level */}
              {impactRowOrder.map((impactKey) => (
                <div key={`row-${impactKey}`} className="grid items-center" style={{ gridTemplateColumns: `160px repeat(${timelineData.monthlyData.length}, minmax(48px, 1fr))` }}>
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

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Impact Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Impact Summary</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-purple-600">Strategic</span>: {dashboardData?.impactBreakdown.critical || 0} •
                <span className="font-semibold text-red-600"> Department</span>: {dashboardData?.impactBreakdown.high || 0} •
                <span className="font-semibold text-yellow-600"> Team-Level</span>: {dashboardData?.impactBreakdown.medium || 0} •
                <span className="font-semibold text-green-600"> Routine</span>: {dashboardData?.impactBreakdown.low || 0}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Impact Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Impact Overview</h2>
          <ChartBarIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
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

      {/* User Contributions Summary */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">User Contributions Summary</h2>
          <DocumentTextIcon className="h-6 w-6 text-gray-400" />
        </div>
        
        {userContributions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No contributions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userContributions.map((userContribution, index) => (
              <div
                key={userContribution.userId}
                onClick={() => handleUserClick(userContribution)}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">
                        {userContribution.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{userContribution.userName}</h3>
                      <p className="text-sm text-gray-500">
                        {userContribution.totalContributions} total contributions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{userContribution.totalContributions}</div>
                      <div className="text-xs text-gray-500">Contributions</div>
                    </div>
                    <div className="text-primary-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(() => {
            console.log('🔍 Rendering Quick Actions buttons');
            return null;
          })()}
          <button 
            type="button"
            onClick={(e) => {
              console.log('🔍 Manage Users button clicked!');
              console.log('🔍 Event:', e);
              console.log('🔍 Event type:', e.type);
              console.log('🔍 Event target:', e.target);
              e.preventDefault();
              e.stopPropagation();
              console.log('🔍 After preventDefault and stopPropagation');
              handleManageUsers();
            }}
            className="flex items-center justify-center p-4 border-2 border-dashed border-primary-300 rounded-xl text-primary-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200 cursor-pointer"
          >
            <UserGroupIcon className="h-6 w-6 mr-2" />
            Manage Users
          </button>
          <button 
            type="button"
            onClick={(e) => {
              console.log('🔍 View Reports button clicked!');
              console.log('🔍 Event:', e);
              console.log('🔍 Event type:', e.type);
              console.log('🔍 Event target:', e.target);
              e.preventDefault();
              e.stopPropagation();
              console.log('🔍 After preventDefault and stopPropagation');
              handleViewReports();
            }}
            className="flex items-center justify-center p-4 border-2 border-dashed border-warning-300 rounded-xl text-warning-600 hover:border-warning-400 hover:text-warning-700 hover:bg-warning-50 transition-all duration-200 cursor-pointer"
          >
            <ChartBarIcon className="h-6 w-6 mr-2" />
            View Reports
          </button>
          <button 
            type="button"
            onClick={(e) => {
              console.log('🔍 Review Submissions button clicked!');
              console.log('🔍 Event:', e);
              console.log('🔍 Event type:', e.type);
              console.log('🔍 Event target:', e.target);
              e.preventDefault();
              e.stopPropagation();
              console.log('🔍 After preventDefault and stopPropagation');
              handleReviewSubmissions();
            }}
            className="flex items-center justify-center p-4 border-2 border-dashed border-success-300 rounded-xl text-success-600 hover:border-success-400 hover:text-success-700 hover:bg-success-50 transition-all duration-200 cursor-pointer"
          >
            <CheckCircleIcon className="h-6 w-6 mr-2" />
            Review Submissions
          </button>
          <button 
            type="button"
            onClick={(e) => {
              console.log('🔍 Change Password button clicked!');
              e.preventDefault();
              e.stopPropagation();
              setShowPasswordModal(true);
            }}
            className="flex items-center justify-center p-4 border-2 border-dashed border-primary-300 rounded-xl text-primary-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200 cursor-pointer"
          >
            <LockClosedIcon className="h-6 w-6 mr-2" />
            Change Password
          </button>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-success-50 rounded-xl border border-success-200">
            <CheckCircleIcon className="h-8 w-8 mx-auto text-success-600 mb-2" />
            <p className="text-sm font-medium text-success-800">Database</p>
            <p className="text-xs text-success-600">Healthy</p>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-xl border border-success-200">
            <CheckCircleIcon className="h-8 w-8 mx-auto text-success-600 mb-2" />
            <p className="text-sm font-medium text-success-800">API</p>
            <p className="text-xs text-success-600">Operational</p>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-xl border border-success-200">
            <CheckCircleIcon className="h-8 w-8 mx-auto text-success-600 mb-2" />
            <p className="text-sm font-medium text-success-800">Frontend</p>
            <p className="text-xs text-success-600">Running</p>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedUser.userName} - Contributions Details
              </h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* User Stats */}
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="text-center p-3 bg-primary-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{selectedUser.totalContributions}</div>
                  <div className="text-sm text-primary-800">Total Contributions</div>
                </div>
              </div>

              {/* Recent Contributions */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Recent Contributions</h4>
                {selectedUser.recentContributions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent contributions</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.recentContributions.map((contribution) => (
                      <div key={contribution.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{contribution.title}</h5>
                            <p className="text-sm text-gray-500">
                              {contribution.accountName} • {contribution.contributionType} • {contribution.contributionMonth}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              บันทึกแล้ว
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              contribution.impact === 'critical' ? 'bg-red-100 text-red-800' :
                              contribution.impact === 'high' ? 'bg-orange-100 text-orange-800' :
                              contribution.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {contribution.impact === 'critical' ? 'Strategic' : contribution.impact === 'high' ? 'Department' : contribution.impact === 'medium' ? 'Team-Level' : 'Routine'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditContribution(contribution.id);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit Contribution"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={() => handleAdminResetPassword(selectedUser.userId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reset Password
              </button>
              <button
                onClick={() => setShowUserDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {showAdminResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset User Password</h3>
            <form onSubmit={handleAdminResetSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={resetPasswordData.newPassword}
                    onChange={(e) => setResetPasswordData({
                      ...resetPasswordData,
                      newPassword: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={resetPasswordData.confirmPassword}
                    onChange={(e) => setResetPasswordData({
                      ...resetPasswordData,
                      confirmPassword: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdminResetModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Own Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={handleChangePasswordSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contribution Modal */}
      {showEditModal && selectedContribution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Contribution - {selectedContribution.title}
              </h3>
              <button
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editFormData.title || ''}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.accountName || ''}
                    onChange={(e) => setEditFormData({...editFormData, accountName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Sale Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.saleName || ''}
                    onChange={(e) => setEditFormData({...editFormData, saleName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Sale Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Email *
                  </label>
                  <input
                    type="email"
                    value={editFormData.saleEmail || ''}
                    onChange={(e) => setEditFormData({...editFormData, saleEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Contribution Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contribution Type *
                  </label>
                  <select
                    value={editFormData.contributionType || ''}
                    onChange={(e) => setEditFormData({...editFormData, contributionType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="technical">Technical</option>
                    <option value="business">Business</option>
                    <option value="relationship">Relationship</option>
                    <option value="innovation">Innovation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Contribution Month */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contribution Month *
                  </label>
                  <input
                    type="month"
                    value={editFormData.contributionMonth || ''}
                    onChange={(e) => setEditFormData({...editFormData, contributionMonth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Impact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Impact *
                  </label>
                  <select
                    value={editFormData.impact || ''}
                    onChange={(e) => setEditFormData({...editFormData, impact: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Impact</option>
                    <option value="low">Routine (Low Impact)</option>
                    <option value="medium">Team-Level (Medium Impact)</option>
                    <option value="high">Department (High Impact)</option>
                    <option value="critical">Strategic (Critical Impact)</option>
                  </select>
                </div>

                {/* Effort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effort *
                  </label>
                  <select
                    value={editFormData.effort || ''}
                    onChange={(e) => setEditFormData({...editFormData, effort: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Effort</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Estimated Impact Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Impact Value
                  </label>
                  <input
                    type="number"
                    value={editFormData.estimatedImpactValue || ''}
                    onChange={(e) => setEditFormData({...editFormData, estimatedImpactValue: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editFormData.tags?.join(', ') || ''}
                    onChange={(e) => setEditFormData({...editFormData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={editFormData.status || ''}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value as 'draft' | 'submitted'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  Update Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
