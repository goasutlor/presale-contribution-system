import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserPlusIcon,
  UserGroupIcon,
  XMarkIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import UserForm from '../components/UserForm';
import ProfileForm from '../components/ProfileForm';
import Tooltip from '../components/Tooltip';

interface User {
  id: string;
  fullName: string;
  staffId: string;
  email: string;
  involvedAccountNames: string[];
  involvedSaleNames: string[];
  involvedSaleEmails: string[];
  blogLinks: string[];
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  canViewOthers: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserManagement: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'admin' | 'user' | 'pending'>('all');

  // Load users from API
  useEffect(() => {
    // Only load users if user is authenticated
    if (user) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // Filter users based on active filter
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredUsers(users);
    } else if (activeFilter === 'admin') {
      setFilteredUsers(users.filter(u => u.role === 'admin'));
    } else if (activeFilter === 'user') {
      setFilteredUsers(users.filter(u => u.role === 'user'));
    } else if (activeFilter === 'pending') {
      setFilteredUsers(users.filter(u => u.status === 'pending'));
    }
  }, [users, activeFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading users...');
      
      // Only admin can load all users
      if (user?.role === 'admin') {
        const response = await apiService.getUsers();
        console.log('🔍 Users API response:', response);
        if (response.success) {
          console.log('🔍 Users data:', response.data);
          // Check if users have valid IDs
          response.data.forEach((user: any, index: number) => {
            console.log(`🔍 User ${index}:`, {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              status: user.status
            });
            if (!user.id) {
              console.error(`❌ User ${index} has no ID!`, user);
            }
          });
          setUsers(response.data);
        } else {
          console.error('❌ Failed to load users:', response.message);
          toast.error('Failed to load users');
        }
      } else {
        // For regular users, just show their own profile
        console.log('🔍 Regular user - showing own profile only');
        if (user) {
          setUsers([user]);
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading users:', error);
      if (error.message === 'Unauthorized - Please login again') {
        toast.error('Session expired. Please login again.');
        // Redirect to login
        window.location.href = '/login';
      } else {
        toast.error('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
          <UserGroupIcon className="h-4 w-4 mr-1" />
{t('userManagement.admins')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {t('userManagement.users')}
      </span>
    );
  };

  const getPermissionBadge = (canViewOthers: boolean) => {
    if (canViewOthers) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
          สามารถดูผู้อื่นได้
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        ดูเฉพาะตัวเอง
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const handleCreateUser = async (data: any) => {
    try {
      const response = await apiService.createUser(data);
      if (response.success) {
        await loadUsers(); // Reload users from API
        setShowForm(false);
        toast.success('User created successfully');
      } else {
        toast.error(response.message || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (data: any) => {
    if (!editingUser) return;
    
    try {
      // If admin is editing and password is provided, use admin reset password
      if (user?.role === 'admin' && data.password && data.password.trim() !== '') {
        const response = await apiService.adminResetPassword({
          userId: editingUser.id,
          newPassword: data.password
        });
        
        if (response.success) {
          // Update other user data
          const updateData = { ...data };
          delete updateData.password;
          delete updateData.confirmPassword;
          
          if (Object.keys(updateData).length > 0) {
            await apiService.updateUser(editingUser.id, updateData);
          }
          
          await loadUsers();
          setEditingUser(null);
          setShowForm(false);
          toast.success('User updated successfully (Password overwritten)');
        } else {
          toast.error(response.message || 'Failed to reset password');
        }
      } else {
        // Regular update without password change
        const updateData = { ...data };
        delete updateData.password;
        delete updateData.confirmPassword;
        
        const response = await apiService.updateUser(editingUser.id, updateData);
        if (response.success) {
          await loadUsers();
          setEditingUser(null);
          setShowForm(false);
          toast.success('User updated successfully');
        } else {
          toast.error(response.message || 'Failed to update user');
        }
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    // Only admin can delete users
    if (user?.role !== 'admin') {
      toast.error('Only administrators can delete users');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        console.log('🔍 Deleting user:', id);
        const response = await apiService.deleteUser(id);
        console.log('🔍 Delete response:', response);
        if (response.success) {
          await loadUsers(); // Reload users from API
          toast.success('User deleted successfully');
        } else {
          console.error('❌ Delete failed:', response.message);
          toast.error(response.message || 'Failed to delete user');
        }
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast.error(error.message || 'Failed to delete user');
      }
    }
  };


  const handleApproveUser = async (userId: string) => {
    // Only admin can approve users
    if (user?.role !== 'admin') {
      toast.error('Only administrators can approve users');
      return;
    }
    
    try {
      console.log('🔍 Approving user with ID:', userId);
      
      const result = await apiService.approveUser(userId);
      console.log('✅ Approve success:', result);
      
      if (result.success) {
        await loadUsers(); // Reload users
        toast.success('User approved successfully');
      } else {
        toast.error(result.message || 'Failed to approve user');
      }
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast.error(error.message || 'Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: string) => {
    // Only admin can reject users
    if (user?.role !== 'admin') {
      toast.error('Only administrators can reject users');
      return;
    }
    
    if (window.confirm('Are you sure you want to reject this user?')) {
      try {
        console.log('🔍 Rejecting user with ID:', userId);
        
      const result = await apiService.rejectUser(userId);
        console.log('✅ Reject success:', result);
        
        if (result.success) {
          await loadUsers(); // Reload users
          toast.success('User rejected successfully');
        } else {
          toast.error(result.message || 'Failed to reject user');
        }
      } catch (error: any) {
        console.error('Error rejecting user:', error);
        toast.error(error.message || 'Failed to reject user');
      }
    }
  };

  // Show different views based on user role
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'User Management' : 'My Profile'}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? 'Manage team members and their permissions' : 'Manage your profile and password'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            เพิ่มผู้ใช้
          </button>
        )}
      </div>

      {/* Stats Cards - Show different cards based on role */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div 
            className={`bg-white rounded-xl shadow-soft p-6 border cursor-pointer transition-all duration-200 hover:shadow-lg ${
              activeFilter === 'all' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-100'
            }`}
            onClick={() => setActiveFilter('all')}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${activeFilter === 'all' ? 'bg-primary-200' : 'bg-primary-100'}`}>
                <UserGroupIcon className={`h-6 w-6 ${activeFilter === 'all' ? 'text-primary-700' : 'text-primary-600'}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          <div 
            className={`bg-white rounded-xl shadow-soft p-6 border cursor-pointer transition-all duration-200 hover:shadow-lg ${
              activeFilter === 'admin' ? 'border-danger-500 ring-2 ring-danger-200' : 'border-gray-100'
            }`}
            onClick={() => setActiveFilter('admin')}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${activeFilter === 'admin' ? 'bg-danger-200' : 'bg-danger-100'}`}>
                <UserGroupIcon className={`h-6 w-6 ${activeFilter === 'admin' ? 'text-danger-700' : 'text-danger-600'}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
          <div 
            className={`bg-white rounded-xl shadow-soft p-6 border cursor-pointer transition-all duration-200 hover:shadow-lg ${
              activeFilter === 'user' ? 'border-success-500 ring-2 ring-success-200' : 'border-gray-100'
            }`}
            onClick={() => setActiveFilter('user')}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${activeFilter === 'user' ? 'bg-success-200' : 'bg-success-100'}`}>
                <UserGroupIcon className={`h-6 w-6 ${activeFilter === 'user' ? 'text-success-700' : 'text-success-600'}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Regular Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'user').length}
                </p>
              </div>
            </div>
          </div>
          <div 
            className={`bg-white rounded-xl shadow-soft p-6 border cursor-pointer transition-all duration-200 hover:shadow-lg ${
              activeFilter === 'pending' ? 'border-warning-500 ring-2 ring-warning-200' : 'border-gray-100'
            }`}
            onClick={() => setActiveFilter('pending')}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${activeFilter === 'pending' ? 'bg-warning-200' : 'bg-warning-100'}`}>
                <EyeIcon className={`h-6 w-6 ${activeFilter === 'pending' ? 'text-warning-700' : 'text-warning-600'}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* My Contributions Count */}
          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-primary-100">
                <UserGroupIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">My Contributions</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">Total submitted</p>
              </div>
            </div>
          </div>

          {/* Assigned Accounts */}
          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-success-100">
                <EyeIcon className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assigned Accounts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.involvedAccountNames?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Accounts you manage</p>
              </div>
            </div>
          </div>

          {/* Sale Teams */}
          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-warning-100">
                <UserGroupIcon className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sale Teams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user?.involvedSaleNames?.length || 0}
                </p>
                <p className="text-xs text-gray-500">Teams you're part of</p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-info-100">
                <UserGroupIcon className="h-6 w-6 text-info-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Account Status</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {user?.status === 'approved' ? 'Active' : user?.status || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500">Your account status</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table or My Profile */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdmin ? (
                activeFilter === 'all' ? 'All Users' :
                activeFilter === 'admin' ? 'Administrators' :
                activeFilter === 'user' ? 'Regular Users' :
                activeFilter === 'pending' ? 'Pending Users' : 'All Users'
              ) : 'My Profile Information'}
            </h2>
            {isAdmin && (
              <div className="text-sm text-gray-500">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            )}
          </div>
        </div>
        
        {isAdmin ? (
          filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeFilter === 'all' ? 'No users found' : 
                 activeFilter === 'admin' ? 'No admins found' :
                 activeFilter === 'user' ? 'No regular users found' :
                 activeFilter === 'pending' ? 'No pending users found' : 'No users found'}
              </h3>
              <p className="text-gray-500 mb-4">
                {activeFilter === 'all' ? 'Get started by adding your first team member.' :
                 activeFilter === 'admin' ? 'No administrators found in the system.' :
                 activeFilter === 'user' ? 'No regular users found in the system.' :
                 activeFilter === 'pending' ? 'No pending users found in the system.' : 'Get started by adding your first team member.'}
              </p>
              {activeFilter === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Add First User
                </button>
              )}
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accounts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {(userItem.fullName?.charAt(0)) || (userItem.email?.charAt(0)) || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{userItem.fullName}</div>
                          <div className="text-sm text-gray-500">{userItem.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userItem.staffId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(userItem.involvedAccountNames?.length || 0)} account(s)
                      </div>
                      <div className="text-sm text-gray-500">
                        {(userItem.involvedAccountNames?.slice(0, 2).join(', ') || '')}
                        {userItem.involvedAccountNames && userItem.involvedAccountNames.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(userItem.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(userItem.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPermissionBadge(userItem.canViewOthers)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Tooltip content="ดูรายละเอียดผู้ใช้">
                          <button 
                            onClick={() => setSelectedUser(userItem)}
                            className="text-primary-600 hover:text-primary-900 transition-colors duration-200"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        {userItem.status === 'pending' ? (
                          <>
                            <Tooltip content="อนุมัติผู้ใช้">
                              <button 
                                onClick={() => {
                                  console.log('🔍 Approve button clicked - userItem:', userItem);
                                  console.log('🔍 userItem.id:', userItem.id);
                                  if (!userItem.id) {
                                    console.error('❌ userItem.id is null or undefined!');
                                    toast.error('User ID is missing. Please refresh the page.');
                                    return;
                                  }
                                  handleApproveUser(userItem.id);
                                }}
                                className="text-success-600 hover:text-success-900 transition-colors duration-200"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            </Tooltip>
                            <Tooltip content="ปฏิเสธผู้ใช้">
                              <button 
                                onClick={() => {
                                  console.log('🔍 Reject button clicked - userItem:', userItem);
                                  console.log('🔍 userItem.id:', userItem.id);
                                  if (!userItem.id) {
                                    console.error('❌ userItem.id is null or undefined!');
                                    toast.error('User ID is missing. Please refresh the page.');
                                    return;
                                  }
                                  handleRejectUser(userItem.id);
                                }}
                                className="text-danger-600 hover:text-danger-900 transition-colors duration-200"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Tooltip content="แก้ไขข้อมูลผู้ใช้">
                              <button 
                                onClick={() => {
                                  console.log('🔍 Edit user clicked:', userItem);
                                  setEditingUser(userItem);
                                  setShowForm(true);
                                  console.log('🔍 Edit user - showForm set to true');
                                }}
                                className="text-warning-600 hover:text-warning-900 transition-colors duration-200"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            </Tooltip>
                            <Tooltip content="ลบผู้ใช้">
                              <button 
                                onClick={() => handleDeleteUser(userItem.id)}
                                className="text-danger-600 hover:text-danger-900 transition-colors duration-200"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        ) : (
          // My Profile Section for regular users
          <div className="p-6">
            <div className="max-w-4xl">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary-500 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user?.fullName?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900">{user?.fullName}</h3>
                    <p className="text-gray-600">{user?.email}</p>
                    <p className="text-sm text-gray-500">Staff ID: {user?.staffId}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="text-sm text-gray-900 capitalize">{user?.role}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                    <div className="text-sm text-gray-900">
                      {user?.canViewOthers ? 'Can view others' : 'Self only'}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Accounts</label>
                  <div className="flex flex-wrap gap-2">
                    {user?.involvedAccountNames?.map((account, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                        {account}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Sales</label>
                  <div className="flex flex-wrap gap-2">
                    {user?.involvedSaleNames?.map((sale, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-success-100 text-success-800">
                        {sale}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Blog Links Section */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <LinkIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    <label className="block text-sm font-medium text-gray-700">Blog Links / Portfolio URLs</label>
                  </div>
                  {user?.blogLinks && user.blogLinks.length > 0 ? (
                    <div className="space-y-2">
                      {user.blogLinks.map((link, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-1"
                          >
                            <span className="truncate">{link}</span>
                            <ArrowTopRightOnSquareIcon className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No blog links added yet</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center">
                        <div className="p-2 rounded-lg bg-primary-100 mr-3">
                          <UserGroupIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">View My Contributions</p>
                          <p className="text-sm text-gray-500">See all your submitted contributions</p>
                        </div>
                      </div>
                    </button>
                    <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center">
                        <div className="p-2 rounded-lg bg-success-100 mr-3">
                          <EyeIcon className="h-5 w-5 text-success-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Account Overview</p>
                          <p className="text-sm text-gray-500">View your assigned accounts</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Account Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user?.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : user?.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user?.status === 'approved' ? 'Active' : user?.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Member Since</span>
                      <span className="text-sm text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Last Updated</span>
                      <span className="text-sm text-gray-900">
                        {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowProfileForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit My Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-0 mx-auto p-5 w-full max-w-6xl">
            <div className="relative bg-white rounded-lg shadow-xl">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">ปิด</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <UserForm
                onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                onCancel={() => {
                  setShowForm(false);
                  setEditingUser(null);
                }}
                initialData={editingUser || undefined}
                isEditing={!!editingUser}
                existingEmails={users.map(u => u.email).filter(email => email !== editingUser?.email)}
                isAdmin={user?.role === 'admin'}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">{selectedUser.fullName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Staff ID:</span>
                  <span className="ml-2 text-gray-900">{selectedUser.staffId}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Role:</span>
                  <span className="ml-2">{getRoleBadge(selectedUser.role)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Permissions:</span>
                  <span className="ml-2">{getPermissionBadge(selectedUser.canViewOthers)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Accounts:</span>
                  <div className="ml-2 mt-1">
                    {selectedUser.involvedAccountNames.map((account, index) => (
                      <span key={index} className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-700 mr-1 mb-1">
                        {account}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form Modal */}
      {showProfileForm && user && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-0 mx-auto p-5 w-full max-w-6xl">
            <div className="relative bg-white rounded-lg shadow-xl">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowProfileForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">ปิด</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ProfileForm
                user={user}
                onSuccess={async () => {
                  setShowProfileForm(false);
                  await refreshUser(); // Refresh current user data
                  loadUsers(); // Reload all users if admin
                }}
                onCancel={() => setShowProfileForm(false)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
