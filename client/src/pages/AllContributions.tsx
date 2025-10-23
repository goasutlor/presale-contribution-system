import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import Tooltip from '../components/Tooltip';
import {
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import ContributionForm from '../components/ContributionForm';

interface Contribution {
  id: string;
  title: string;
  description: string;
  accountName: string;
  saleName: string;
  saleEmail: string;
  contributionType: string;
  impact: string;
  effort: string;
  estimatedImpactValue: number;
  contributionMonth: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  tags: string[];
  userName: string;
  createdAt: string;
  updatedAt: string;
}

interface FilterState {
  search: string;
  accountName: string;
  impact: string;
  contributionType: string;
  status: string;
  user: string;
}

const AllContributions: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  console.log('🔍 AllContributions - User object:', user);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    accountName: '',
    impact: '',
    contributionType: '',
    status: '',
    user: ''
  });
  
  // Pagination and Sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'userName' | 'impact'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadContributions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [contributions, filters, sortBy, sortOrder]);

  const loadContributions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContributions();
      if (response.success) {
        console.log('🔍 Loaded Contributions:', response.data);
        response.data.forEach((contrib, index) => {
          console.log(`🔍 Contribution ${index + 1}:`, {
            id: contrib.id,
            title: contrib.title,
            status: contrib.status
          });
        });
        setContributions(response.data);
      } else {
        toast.error('Failed to load contributions');
      }
    } catch (error) {
      console.error('Error loading contributions:', error);
      toast.error('Failed to load contributions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...contributions];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(contrib =>
        contrib.title.toLowerCase().includes(searchLower) ||
        contrib.description.toLowerCase().includes(searchLower) ||
        contrib.accountName.toLowerCase().includes(searchLower) ||
        contrib.saleName.toLowerCase().includes(searchLower) ||
        contrib.userName.toLowerCase().includes(searchLower)
      );
    }

    if (filters.accountName) {
      filtered = filtered.filter(contrib => contrib.accountName === filters.accountName);
    }

    if (filters.impact) {
      filtered = filtered.filter(contrib => contrib.impact === filters.impact);
    }

    if (filters.contributionType) {
      filtered = filtered.filter(contrib => contrib.contributionType === filters.contributionType);
    }

    if (filters.status) {
      filtered = filtered.filter(contrib => contrib.status === filters.status);
    }

    if (filters.user) {
      filtered = filtered.filter(contrib => contrib.userName === filters.user);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'userName':
          aValue = a.userName.toLowerCase();
          bValue = b.userName.toLowerCase();
          break;
        case 'impact':
          const impactOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          aValue = impactOrder[a.impact as keyof typeof impactOrder] || 0;
          bValue = impactOrder[b.impact as keyof typeof impactOrder] || 0;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredContributions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleCreateContribution = async (data: any, action: 'draft' | 'submit') => {
    try {
      const contributionData = {
        ...data,
        status: action === 'draft' ? 'draft' : 'submitted'
      };
      
      console.log('🔍 AllContributions - Action:', action);
      console.log('🔍 AllContributions - ContributionData:', contributionData);
      
      const response = await apiService.createContribution(contributionData);
      if (response.success) {
        await loadContributions();
        setShowForm(false);
        if (action === 'draft') {
          toast.success('Draft saved successfully');
        } else {
          toast.success('Contribution submitted successfully');
        }
      } else {
        toast.error(response.message || 'Failed to create contribution');
      }
    } catch (error: any) {
      console.error('Error creating contribution:', error);
      toast.error(error.message || 'Failed to create contribution');
    }
  };

  const handleUpdateContribution = async (data: any, action: 'draft' | 'submit') => {
    if (!editingContribution) return;
    
    try {
      const contributionData = {
        ...data,
        status: action === 'draft' ? 'draft' : 'submitted'
      };
      
      const response = await apiService.updateContribution(editingContribution.id, contributionData);
      if (response.success) {
        await loadContributions();
        setEditingContribution(null);
        setShowForm(false);
        if (action === 'draft') {
          toast.success('Draft updated successfully');
        } else {
          toast.success('Contribution updated successfully');
        }
      } else {
        toast.error(response.message || 'Failed to update contribution');
      }
    } catch (error: any) {
      console.error('Error updating contribution:', error);
      toast.error(error.message || 'Failed to update contribution');
    }
  };

  const handleDeleteContribution = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contribution?')) {
      try {
        const response = await apiService.deleteContribution(id);
        if (response.success) {
          await loadContributions();
          toast.success('Contribution deleted successfully');
        } else {
          toast.error(response.message || 'Failed to delete contribution');
        }
      } catch (error: any) {
        console.error('Error deleting contribution:', error);
        toast.error(error.message || 'Failed to delete contribution');
      }
    }
  };

  const handleSubmitContribution = async (id: string) => {
    try {
      const response = await apiService.submitContribution(id);
      if (response.success) {
        await loadContributions();
        toast.success('Contribution submitted successfully');
      } else {
        toast.error(response.message || 'Failed to submit contribution');
      }
    } catch (error: any) {
      console.error('Error submitting contribution:', error);
      toast.error(error.message || 'Failed to submit contribution');
    }
  };

  // Pagination functions
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredContributions.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredContributions.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Sorting functions
  const handleSort = (field: 'createdAt' | 'title' | 'userName' | 'impact') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'createdAt' | 'title' | 'userName' | 'impact') => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getStatusBadge = (status: string) => {
    console.log('🔍 getStatusBadge called with status:', status, 'type:', typeof status);
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            Draft
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <DocumentTextIcon className="h-3 w-3 mr-1" />
            Submitted
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <TrashIcon className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        console.log('🔍 Unknown status:', status);
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[impact as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {impact}
      </span>
    );
  };

  // Get unique values for filter dropdowns
  const uniqueAccounts = Array.from(new Set(contributions.map(c => c.accountName)));
  const uniqueUsers = Array.from(new Set(contributions.map(c => c.userName)));
  const uniqueTypes = Array.from(new Set(contributions.map(c => c.contributionType)));

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Contributions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all team contributions</p>
        </div>
        <button
          onClick={() => {
            console.log('🔍 Add New Contribution clicked');
            setShowForm(true);
            console.log('🔍 showForm set to true');
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Contribution
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900">
              <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{contributions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700">
              <ClockIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drafts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {contributions.filter(c => c.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {contributions.filter(c => c.status === 'submitted').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {contributions.filter(c => c.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Search contributions..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
            <select
              value={filters.accountName}
              onChange={(e) => setFilters(prev => ({ ...prev, accountName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Accounts</option>
              {uniqueAccounts.map(account => (
                <option key={account} value={account}>{account}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Impact</label>
            <select
              value={filters.impact}
              onChange={(e) => setFilters(prev => ({ ...prev, impact: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Impact</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select
              value={filters.contributionType}
              onChange={(e) => setFilters(prev => ({ ...prev, contributionType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contributions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Contributions ({filteredContributions.length})
          </h2>
        </div>
        
        {filteredContributions.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contributions found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.accountName || filters.impact || filters.contributionType || filters.status
                ? "No contributions match your filters."
                : "No contributions have been created yet."
              }
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create First Contribution
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      Contribution {getSortIcon('title')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('userName')}
                  >
                    <div className="flex items-center">
                      User {getSortIcon('userName')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('impact')}
                  >
                    <div className="flex items-center">
                      Impact {getSortIcon('impact')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Date {getSortIcon('createdAt')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentPageData().map((contribution) => (
                  <tr key={contribution.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{contribution.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {contribution.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contribution.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contribution.accountName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getImpactBadge(contribution.impact)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contribution.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                        <Tooltip content="ดูรายละเอียด">
                          <button
                            onClick={() => {
                              setSelectedContribution(contribution);
                              setShowViewModal(true);
                            }}
                            className="text-primary-600 hover:text-primary-900 transition-colors duration-200"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="แก้ไขข้อมูล">
                          <button
                            onClick={() => {
                              console.log('🔍 Edit button clicked - contribution data:', contribution);
                              setEditingContribution(contribution);
                              setShowForm(true);
                            }}
                            className="text-warning-600 hover:text-warning-900 transition-colors duration-200"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        {contribution.status === 'draft' && (
                          <Tooltip content="ส่งข้อมูล">
                            <button
                              onClick={() => handleSubmitContribution(contribution.id)}
                              className="text-green-600 hover:text-green-900 transition-colors duration-200"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          </Tooltip>
                        )}
                        <Tooltip content="ลบข้อมูล">
                          <button
                            onClick={() => handleDeleteContribution(contribution.id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {filteredContributions.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === getTotalPages()}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, filteredContributions.length)}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredContributions.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{filteredContributions.length}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === getTotalPages()}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contribution Form Modal */}
      {showForm && user && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999}}>
          <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto'}}>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
              <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#333'}}>Add New Contribution</h2>
              <button 
                onClick={() => setShowForm(false)}
                style={{position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer'}}
              >
                ×
              </button>
            </div>
            <div style={{minWidth: '600px', minHeight: '400px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px'}}>
              <p style={{textAlign: 'center', color: '#666'}}>Form will be loaded here...</p>
              <button 
                onClick={() => setShowForm(false)}
                style={{marginTop: '20px', padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showForm && user && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{zIndex: 9999}}>
          <div className="relative top-0 mx-auto p-5 w-full max-w-6xl">
            <div className="relative bg-white rounded-lg shadow-xl">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingContribution(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">ปิด</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ContributionForm
                user={user}
                onSubmit={editingContribution ? handleUpdateContribution : handleCreateContribution}
                onCancel={() => {
                  setShowForm(false);
                  setEditingContribution(null);
                }}
                initialData={editingContribution}
                isEditing={!!editingContribution}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedContribution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contribution Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Title:</span>
                  <span className="ml-2 text-gray-900">{selectedContribution.title}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">User:</span>
                  <span className="ml-2 text-gray-900">{selectedContribution.userName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Account:</span>
                  <span className="ml-2 text-gray-900">{selectedContribution.accountName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Sale:</span>
                  <span className="ml-2 text-gray-900">{selectedContribution.saleName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-900">{selectedContribution.contributionType}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Impact:</span>
                  <span className="ml-2">{getImpactBadge(selectedContribution.impact)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2">{getStatusBadge(selectedContribution.status)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="mt-1 text-gray-900">{selectedContribution.description}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllContributions;
