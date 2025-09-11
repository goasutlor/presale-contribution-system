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
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Contribution {
  id: string;
  accountName: string;
  saleName: string;
  saleEmail: string;
  contributionType: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
  estimatedImpactValue?: number; // New field for business impact value
  contributionMonth: string; // Changed from startDate/endDate to single month field
  status: 'draft' | 'submitted' | 'approved';
  createdAt: string;
  updatedAt: string;
}

const SimpleContributions: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    accountName: '',
    saleName: '',
    saleEmail: '',
    contributionType: 'technical',
    title: '',
    description: '',
    impact: 'medium',
    effort: 'medium',
    estimatedImpactValue: 0,
    contributionMonth: '',
    tags: '',
  });

  useEffect(() => {
    loadContributions();
  }, [user?.id]);

  // Auto-fill form when user data is available
  useEffect(() => {
    console.log('🔍 SimpleContributions - User data:', user);
    console.log('🔍 Account Names:', user?.involvedAccountNames, 'Length:', user?.involvedAccountNames?.length);
    console.log('🔍 Sale Names:', user?.involvedSaleNames, 'Length:', user?.involvedSaleNames?.length);
    console.log('🔍 Sale Emails:', user?.involvedSaleEmails, 'Length:', user?.involvedSaleEmails?.length);
    
    if (user && user.involvedAccountNames && user.involvedSaleNames && user.involvedSaleEmails) {
      console.log('🔍 Auto-filling form with user data:', user);
      
      setFormData(prev => ({
        ...prev,
        accountName: user.involvedAccountNames.length === 1 ? user.involvedAccountNames[0] : prev.accountName,
        saleName: user.involvedSaleNames.length === 1 ? user.involvedSaleNames[0] : prev.saleName,
        saleEmail: user.involvedSaleEmails.length === 1 ? user.involvedSaleEmails[0] : prev.saleEmail,
      }));
    }
  }, [user]);

  const loadContributions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContributions();
      if (response.success) {
        setContributions(response.data);
      }
    } catch (error) {
      console.error('Error loading contributions:', error);
      toast.error('Failed to load contributions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, action: 'draft' | 'submit' = 'submit') => {
    e.preventDefault();
    try {
      console.log('🔍 Form Data:', formData);
      
      // Transform data to match API expectations
      const apiData = {
        accountName: formData.accountName,
        saleName: formData.saleName,
        saleEmail: formData.saleEmail,
        contributionType: formData.contributionType,
        title: formData.title,
        description: formData.description,
        impact: formData.impact, // API expects 'impact' not 'impactLevel'
        effort: formData.effort, // API expects 'effort' not 'effortLevel'
        estimatedImpactValue: formData.estimatedImpactValue,
        contributionMonth: formData.contributionMonth,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        status: action === 'draft' ? 'draft' : 'submitted'
      };
      
      console.log('🔍 SimpleContributions - Action:', action);
      console.log('🔍 SimpleContributions - API Data:', apiData);

      if (editingContribution) {
        // Update existing contribution
        const response = await apiService.updateContribution(editingContribution.id, apiData);
        if (response.success) {
          toast.success('Contribution updated successfully');
          loadContributions();
          resetForm();
        }
      } else {
        // Create new contribution
        const response = await apiService.createContribution(apiData);
        if (response.success) {
          if (action === 'draft') {
            toast.success('Draft saved successfully');
          } else {
            toast.success('Contribution submitted successfully');
          }
          loadContributions();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error saving contribution:', error);
      toast.error('Failed to save contribution');
    }
  };

  const handleEdit = (contribution: Contribution) => {
    setEditingContribution(contribution);
    setFormData({
      accountName: contribution.accountName,
      saleName: contribution.saleName,
      saleEmail: contribution.saleEmail,
      contributionType: contribution.contributionType,
      title: contribution.title,
      description: contribution.description,
      impact: contribution.impact,
      effort: contribution.effort,
      estimatedImpactValue: contribution.estimatedImpactValue || 0,
      contributionMonth: contribution.contributionMonth,
      tags: '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contribution?')) {
      try {
        const response = await apiService.deleteContribution(id);
        if (response.success) {
          toast.success('Contribution deleted successfully');
          loadContributions();
        }
      } catch (error) {
        console.error('Error deleting contribution:', error);
        toast.error('Failed to delete contribution');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      accountName: '',
      saleName: '',
      saleEmail: '',
      contributionType: 'technical',
      title: '',
      description: '',
      impact: 'medium',
      effort: 'medium',
      estimatedImpactValue: 0,
      contributionMonth: '',
      tags: '',
    });
    setEditingContribution(null);
    setShowForm(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'submitted':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.role === 'admin' ? 'My Contributions' : 'My Contributions'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === 'admin' 
              ? 'Your personal contributions. Use "All Contributions" menu to view all contributions from all users.'
              : 'Track and manage your contributions to different accounts'
            }
          </p>
        </div>
        {user?.role !== 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add Contribution
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingContribution ? 'Edit Contribution' : 'Add New Contribution'}
            </h2>
            
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Name *
                  </label>
                  {user?.involvedAccountNames && user.involvedAccountNames.length === 1 ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={user.involvedAccountNames[0]}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-gray-700 font-medium dark:bg-green-900 dark:text-green-100"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <span className="text-green-600 text-sm">✓ Auto-filled</span>
                      </div>
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">เลือก Account Name ({user?.involvedAccountNames?.length || 0} รายการ)</option>
                      {user?.involvedAccountNames?.map((account) => (
                        <option key={account} value={account}>
                          {account}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sale Name *
                  </label>
                  {user?.involvedSaleNames && user.involvedSaleNames.length === 1 ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={user.involvedSaleNames[0]}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-gray-700 font-medium dark:bg-green-900 dark:text-green-100"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <span className="text-green-600 text-sm">✓ Auto-filled</span>
                      </div>
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.saleName}
                      onChange={(e) => setFormData({ ...formData, saleName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">เลือก Sale Name ({user?.involvedSaleNames?.length || 0} รายการ)</option>
                      {user?.involvedSaleNames?.map((sale, index) => (
                        <option key={sale} value={sale}>
                          {sale} {user?.involvedSaleEmails?.[index] && `(${user.involvedSaleEmails[index]})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sale Email *
                  </label>
                  {user?.involvedSaleEmails && user.involvedSaleEmails.length === 1 ? (
                    <div className="relative">
                      <input
                        type="email"
                        value={user.involvedSaleEmails[0]}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-gray-700 font-medium dark:bg-green-900 dark:text-green-100"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <span className="text-green-600 text-sm">✓ Auto-filled</span>
                      </div>
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.saleEmail}
                      onChange={(e) => setFormData({ ...formData, saleEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">เลือก Sale Email ({user?.involvedSaleEmails?.length || 0} รายการ)</option>
                      {user?.involvedSaleEmails?.map((email) => (
                        <option key={email} value={email}>
                          {email}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contribution Type *
                  </label>
                  <select
                    required
                    value={formData.contributionType}
                    onChange={(e) => setFormData({ ...formData, contributionType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="technical">Technical</option>
                    <option value="business">Business</option>
                    <option value="relationship">Relationship</option>
                    <option value="innovation">Innovation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Impact Level *
                  </label>
                  <select
                    required
                    value={formData.impact}
                    onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Effort Level *
                  </label>
                  <select
                    required
                    value={formData.effort}
                    onChange={(e) => setFormData({ ...formData, effort: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="very-high">Very High</option>
                  </select>
                </div>

                {/* Estimated Impact Value - Only show for Business contributions */}
                {formData.contributionType === 'business' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estimated Business Impact Value (THB) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={formData.estimatedImpactValue}
                      onChange={(e) => setFormData({ ...formData, estimatedImpactValue: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter estimated value in THB"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      กรอกมูลค่าที่คาดว่าจะได้รับจาก Contribution นี้ (บาท)
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contribution Month/Year *
                  </label>
                  <select
                    required
                    value={formData.contributionMonth}
                    onChange={(e) => setFormData({ ...formData, contributionMonth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">เลือกเดือน/ปี</option>
                    <option value="2025-01">มกราคม 2025</option>
                    <option value="2025-02">กุมภาพันธ์ 2025</option>
                    <option value="2025-03">มีนาคม 2025</option>
                    <option value="2025-04">เมษายน 2025</option>
                    <option value="2025-05">พฤษภาคม 2025</option>
                    <option value="2025-06">มิถุนายน 2025</option>
                    <option value="2025-07">กรกฎาคม 2025</option>
                    <option value="2025-08">สิงหาคม 2025</option>
                    <option value="2025-09">กันยายน 2025</option>
                    <option value="2025-10">ตุลาคม 2025</option>
                    <option value="2025-11">พฤศจิกายน 2025</option>
                    <option value="2025-12">ธันวาคม 2025</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    เลือกเดือนที่ได้ทำ Contribution นี้
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter contribution title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe your contribution in detail"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'draft')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'submit')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingContribution ? 'Update' : 'Submit'} Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contributions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {contributions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <PlusIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No contributions yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by adding your first contribution
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add Contribution
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Impact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Impact Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {contributions.map((contribution) => (
                  <tr key={contribution.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {contribution.accountName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {contribution.saleName} ({contribution.saleEmail})
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {contribution.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {contribution.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {contribution.contributionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contribution.impact === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        contribution.impact === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        contribution.impact === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {contribution.impact}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contribution.contributionType === 'business' && contribution.estimatedImpactValue ? (
                        <span className="text-sm text-gray-900 dark:text-white font-medium">
                          ฿{contribution.estimatedImpactValue.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(contribution.status)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contribution.status)}`}>
                          {contribution.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {contribution.contributionMonth ? 
                        new Date(contribution.contributionMonth + '-01').toLocaleDateString('th-TH', { 
                          year: 'numeric', 
                          month: 'long' 
                        }) : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔍 View button clicked for contribution:', contribution.id);
                            setSelectedContribution(contribution);
                            setShowViewModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="ดูรายละเอียด"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(contribution)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contribution.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Contribution Modal */}
      {showViewModal && selectedContribution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-full max-w-4xl">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => {
                    console.log('🔍 Close modal button clicked');
                    setShowViewModal(false);
                    setSelectedContribution(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <span className="sr-only">ปิด</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{selectedContribution.title}</h2>
                <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-sm">
                  <p className="text-yellow-800 dark:text-yellow-200">🔍 Debug: Modal is showing with contribution: {selectedContribution.title}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Account:</strong> {selectedContribution.accountName}</p>
                    <p><strong>Sale:</strong> {selectedContribution.saleName} ({selectedContribution.saleEmail})</p>
                    <p><strong>Type:</strong> {selectedContribution.contributionType}</p>
                    <p><strong>Status:</strong> <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedContribution.status)}`}>{selectedContribution.status}</span></p>
                  </div>
                  <div>
                    <p><strong>Impact:</strong> <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedContribution.impact === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      selectedContribution.impact === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      selectedContribution.impact === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>{selectedContribution.impact}</span></p>
                    <p><strong>Effort:</strong> {selectedContribution.effort}</p>
                    <p><strong>Month:</strong> {selectedContribution.contributionMonth ? 
                      new Date(selectedContribution.contributionMonth + '-01').toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'long' 
                      }) : 
                      '-'
                    }</p>
                    {selectedContribution.estimatedImpactValue && (
                      <p><strong>Impact Value:</strong> ฿{selectedContribution.estimatedImpactValue.toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p><strong>Description:</strong></p>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{selectedContribution.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleContributions;
