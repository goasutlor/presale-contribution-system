import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { UserIcon, EnvelopeIcon, IdentificationIcon, BuildingOfficeIcon, UserGroupIcon, ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface ProfileFormData {
  id: string;
  fullName: string;
  staffId: string;
  email: string;
  involvedAccountNames: string[];
  involvedSaleNames: string[];
  involvedSaleEmails: string[];
  role: 'user' | 'admin';
  canViewOthers: boolean;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileFormProps {
  user: ProfileFormData;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProfileForm({ user, onSuccess, onCancel }: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors }
  } = useForm<ProfileFormData>({
    defaultValues: {
      id: user.id,
      fullName: user.fullName,
      staffId: user.staffId,
      email: user.email,
      involvedAccountNames: user.involvedAccountNames,
      involvedSaleNames: user.involvedSaleNames,
      involvedSaleEmails: user.involvedSaleEmails,
      role: user.role,
      canViewOthers: user.canViewOthers
    }
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors }
  } = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const newPassword = watchPassword('newPassword');

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      // Self-service update via auth route
      const response = await apiService.updateMyProfile({
        id: user.id,
        fullName: data.fullName,
        staffId: data.staffId,
        email: data.email,
        involvedAccountNames: data.involvedAccountNames,
        involvedSaleNames: data.involvedSaleNames,
        involvedSaleEmails: data.involvedSaleEmails,
      });
      if (response.success) {
        // Update all contributions with new account names and sale names
        await updateContributionsWithNewData(data);
        toast.success('Profile updated successfully. All contributions have been updated with new account and sale information.');
        onSuccess();
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateContributionsWithNewData = async (data: ProfileFormData) => {
    try {
      // Get all contributions for this user
      const contributionsResponse = await apiService.getContributions();
      if (contributionsResponse.success) {
        const userContributions = contributionsResponse.data.filter((contrib: any) => contrib.userId === user.id);
        
        // Update each contribution with new account names and sale names
        for (const contrib of userContributions) {
          const updatedContrib = {
            ...contrib,
            accountName: data.involvedAccountNames[0] || contrib.accountName, // Use first account name
            saleName: data.involvedSaleNames[0] || contrib.saleName, // Use first sale name
            saleEmail: data.involvedSaleEmails[0] || contrib.saleEmail // Use first sale email
          };
          
          await apiService.updateContribution(contrib.id, updatedContrib);
        }
      }
    } catch (error) {
      console.error('Error updating contributions:', error);
      // Don't throw error here, just log it
    }
  };

  const handlePasswordUpdate = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    try {
      const response = await apiService.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      if (response.success) {
        toast.success('Password updated successfully');
        resetPassword();
        setActiveTab('profile');
      } else {
        toast.error(response.message || 'Failed to update password');
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Profile</h2>
        <p className="text-gray-600">Update your profile information and password</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Change Password
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit(handleProfileUpdate)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Controller
                name="fullName"
                control={profileControl}
                rules={{ required: 'Full name is required' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                )}
              />
              {profileErrors.fullName && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.fullName.message}</p>
              )}
            </div>

            {/* Staff ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff ID <span className="text-red-500">*</span>
              </label>
              <Controller
                name="staffId"
                control={profileControl}
                rules={{ required: 'Staff ID is required' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                )}
              />
              {profileErrors.staffId && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.staffId.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <Controller
                name="email"
                control={profileControl}
                rules={{ 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email format'
                  }
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                )}
              />
              {profileErrors.email && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <Controller
                name="role"
                control={profileControl}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              />
              <p className="mt-1 text-xs text-gray-500">Role cannot be changed</p>
            </div>
          </div>

          {/* Account Names - editable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Accounts</label>
            <Controller
              name="involvedAccountNames"
              control={profileControl}
              rules={{ required: 'At least one account is required' }}
              render={({ field }) => (
                <div className="space-y-2">
                  {field.value.map((account, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={account}
                        onChange={(e) => {
                          const next = [...field.value];
                          next[index] = e.target.value;
                          field.onChange(next);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => field.onChange(field.value.filter((_: any, i: number) => i !== index))}
                        className="px-2 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => field.onChange([...(field.value || []), ''])}
                    className="inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200"
                  >
                    + Add Account
                  </button>
                </div>
              )}
            />
            {profileErrors.involvedAccountNames && (
              <p className="mt-1 text-sm text-red-600">{(profileErrors as any).involvedAccountNames.message}</p>
            )}
          </div>

          {/* Sale Names & Emails - editable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Sales</label>
            <Controller
              name="involvedSaleNames"
              control={profileControl}
              rules={{ required: 'At least one sale is required' }}
              render={({ field }) => (
                <div className="space-y-2">
                  {field.value.map((sale, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={sale}
                        onChange={(e) => {
                          const next = [...field.value];
                          next[index] = e.target.value;
                          field.onChange(next);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <Controller
                        name="involvedSaleEmails"
                        control={profileControl}
                        render={({ field: emailField }) => (
                          <div className="flex items-center gap-2">
                            <input
                              type="email"
                              value={emailField.value[index] || ''}
                              onChange={(e) => {
                                const next = [...emailField.value];
                                next[index] = e.target.value;
                                emailField.onChange(next);
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextNames = field.value.filter((_: any, i: number) => i !== index);
                                const nextEmails = emailField.value.filter((_: any, i: number) => i !== index);
                                field.onChange(nextNames);
                                emailField.onChange(nextEmails);
                              }}
                              className="px-2 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const names = [...(field.value || []), ''];
                      const emailsField = (profileControl as any)._formValues.involvedSaleEmails || [];
                      (profileControl as any)._formValues.involvedSaleEmails = [...emailsField, ''];
                      field.onChange(names);
                    }}
                    className="inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md text-success-700 bg-success-100 hover:bg-success-200"
                  >
                    + Add Sale
                  </button>
                </div>
              )}
            />
            {profileErrors.involvedSaleNames && (
              <p className="mt-1 text-sm text-red-600">{(profileErrors as any).involvedSaleNames.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit(handlePasswordUpdate)} className="space-y-6">
          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <Controller
                name="currentPassword"
                control={passwordControl}
                rules={{ required: 'Current password is required' }}
                render={({ field }) => (
                  <div className="relative">
                    <input
                      {...field}
                      type={showPasswords.current ? 'text' : 'password'}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.current ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <Controller
                name="newPassword"
                control={passwordControl}
                rules={{ 
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                }}
                render={({ field }) => (
                  <div className="relative">
                    <input
                      {...field}
                      type={showPasswords.new ? 'text' : 'password'}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.new ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <Controller
                name="confirmPassword"
                control={passwordControl}
                rules={{ 
                  required: 'Please confirm your password',
                  validate: value => value === newPassword || 'Passwords do not match'
                }}
                render={({ field }) => (
                  <div className="relative">
                    <input
                      {...field}
                      type={showPasswords.confirm ? 'text' : 'password'}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.confirm ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
