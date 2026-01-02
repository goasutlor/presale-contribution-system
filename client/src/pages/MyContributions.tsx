import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import Tooltip from '../components/Tooltip';
import {
  DocumentTextIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
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
  year: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const MyContributions: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(2026); // Default to 2026 (new year)
  const [showForm, setShowForm] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);

  const loadContributions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getContributions();
      if (response.success) {
        // Filter contributions for current user only
        const userContributions = response.data.filter((contrib: any) => contrib.userId === user?.id);
        setContributions(userContributions);
      } else {
        toast.error('Failed to load contributions');
      }
    } catch (error) {
      console.error('Error loading contributions:', error);
      toast.error('Failed to load contributions');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadContributions();
  }, [loadContributions]);

  const handleCreateContribution = async (data: any, action: 'draft' | 'submit') => {
    try {
      // Use status from data if available, otherwise use action
      const finalStatus = data.status || (action === 'draft' ? 'draft' : 'submitted');
      
      const contributionData = {
        ...data,
        status: finalStatus
      };
      
      console.log('🔍 MyContributions - Create Contribution Debug:', {
        action: action,
        dataStatus: data.status,
        finalStatus: finalStatus,
        contributionData: contributionData
      });
      
      const response = await apiService.createContribution(contributionData);
      if (response.success) {
        await loadContributions();
        setShowForm(false);
        setEditingContribution(null);
        
        // Refresh user profile to get latest data
        console.log('🔄 Refreshing user profile after contribution creation...');
        await refreshUser();
        
        toast.success(action === 'draft' ? 'Draft saved successfully' : 'Contribution submitted successfully');
      } else {
        toast.error(response.message || 'Failed to create contribution');
      }
    } catch (error: any) {
      console.error('Error creating contribution:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      // Show more specific error message
      let errorMessage = 'Failed to create contribution';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 400) {
        errorMessage = 'Invalid data provided. Please check your input.';
      } else if (error.status === 401) {
        errorMessage = 'Please login again.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      }
      
      // Show specific error message for account validation
      if (error.message && error.message.includes('not in your allowed list')) {
        toast.error(`ข้อมูลไม่ถูกต้อง: ${error.message}`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleUpdateContribution = async (data: any, action: 'draft' | 'submit') => {
    if (!editingContribution) return;
    
    try {
      // Use status from data if available, otherwise use action
      const finalStatus = data.status || (action === 'draft' ? 'draft' : 'submitted');
      
      // Transform data to match API expectations
      const apiData = {
        accountName: data.accountName,
        saleName: data.saleName,
        saleEmail: data.saleEmail,
        contributionType: data.contributionType,
        title: data.title,
        description: data.description,
        impact: data.impact,
        effort: data.effort,
        estimatedImpactValue: data.estimatedImpactValue,
        contributionMonth: data.contributionMonth,
        tags: data.tags || [],
        status: finalStatus
      };

      console.log('🔍 MyContributions - Update Contribution Debug:', {
        action: action,
        dataStatus: data.status,
        finalStatus: finalStatus,
        apiStatus: apiData.status,
        isDraft: action === 'draft',
        fullApiData: apiData
      });

      const response = await apiService.updateContribution(editingContribution.id, apiData);
      if (response.success) {
        await loadContributions(); // Reload from API
        setShowForm(false);
        setEditingContribution(null);
        
        // Refresh user profile to get latest data
        console.log('🔄 Refreshing user profile after contribution update...');
        await refreshUser();
        
        toast.success(action === 'draft' ? 'Draft updated successfully' : 'Contribution updated and submitted successfully');
      } else {
        toast.error(response.message || 'Failed to update contribution');
      }
    } catch (error: any) {
      console.error('Error updating contribution:', error);
      toast.error(error.message || 'Failed to update contribution');
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

  const handleDeleteContribution = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this draft contribution?')) {
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

  const getStatusBadge = (status: string) => {
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

  // Get available years from contributions
  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    contributions.forEach(contrib => {
      if (contrib.year) {
        years.add(contrib.year);
      } else {
        // Fallback: extract year from contributionMonth or createdAt
        const year = contrib.contributionMonth 
          ? parseInt(contrib.contributionMonth.split('-')[0])
          : new Date(contrib.createdAt).getFullYear();
        years.add(year);
      }
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    // If no years found, add current year and previous year
    if (sortedYears.length === 0) {
      const currentYear = new Date().getFullYear();
      return [currentYear, currentYear - 1];
    }
    return sortedYears;
  }, [contributions]);

  // Filter contributions by year and status
  const filteredContributions = contributions.filter(contrib => {
    // Filter by year
    const contribYear = contrib.year || 
      (contrib.contributionMonth ? parseInt(contrib.contributionMonth.split('-')[0]) : new Date(contrib.createdAt).getFullYear());
    if (contribYear !== selectedYear) return false;
    
    // Filter by status
    if (filterStatus === 'all') return true;
    return contrib.status === filterStatus;
  });

  // Filter stats by year
  const yearContributions = contributions.filter(contrib => {
    const contribYear = contrib.year || 
      (contrib.contributionMonth ? parseInt(contrib.contributionMonth.split('-')[0]) : new Date(contrib.createdAt).getFullYear());
    return contribYear === selectedYear;
  });

  const draftCount = yearContributions.filter(c => c.status === 'draft').length;
  const submittedCount = yearContributions.filter(c => c.status === 'submitted').length;
  const approvedCount = yearContributions.filter(c => c.status === 'approved').length;

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Contributions</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your contribution drafts and submissions</p>
        </div>
        <button
          onClick={() => {
            console.log('🔍 MyContributions - Add New Contribution clicked');
            setShowForm(true);
            console.log('🔍 MyContributions - showForm set to true');
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
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700">
              <ClockIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Drafts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{draftCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Submitted</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{submittedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{approvedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/20">
              <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{yearContributions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Year Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4 border border-gray-100 dark:border-gray-700">
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
          {/* Add button to add new year */}
          <button
            onClick={() => {
              const newYear = new Date().getFullYear();
              if (!availableYears.includes(newYear)) {
                setSelectedYear(newYear);
              }
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            เพิ่มปีใหม่
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contributions (ปี {selectedYear})</h2>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Contributions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filteredContributions.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No contributions found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {filterStatus === 'all' 
                ? `You haven't created any contributions for year ${selectedYear} yet.` 
                : `No contributions with status "${filterStatus}" found for year ${selectedYear}.`
              }
            </p>
            <Link
              to="/contributions"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create First Contribution
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredContributions.map((contribution) => (
              <div key={contribution.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{contribution.title}</h3>
                      {getStatusBadge(contribution.status)}
                      {getImpactBadge(contribution.impact)}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{contribution.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span><strong>Account:</strong> {contribution.accountName}</span>
                      <span><strong>Type:</strong> {contribution.contributionType}</span>
                      <span><strong>Month:</strong> {contribution.contributionMonth}</span>
                      <span><strong>Effort:</strong> {contribution.effort}</span>
                      {contribution.estimatedImpactValue > 0 && (
                        <span><strong>Value:</strong> ${contribution.estimatedImpactValue.toLocaleString()}</span>
                      )}
                    </div>
                    
                    {contribution.tags && contribution.tags.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {contribution.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Tooltip content="ดูรายละเอียด">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedContribution(contribution);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    {contribution.status === 'draft' && (
                      <>
                        <Tooltip content="แก้ไข">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('📝 Edit clicked for contribution:', contribution.id, 'status:', contribution.status);
                              console.log('📝 Contribution object:', contribution);
                              setEditingContribution(contribution);
                              setShowForm(true);
                            }}
                            className="inline-flex items-center px-2 py-1 border border-yellow-300 text-xs font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                            title="แก้ไข"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                        </Tooltip>
                        <Tooltip content="ส่งข้อมูล">
                          <button
                            onClick={() => handleSubmitContribution(contribution.id)}
                            className="text-green-600 hover:text-green-900 transition-colors duration-200"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="ลบข้อมูล">
                          <button
                            onClick={() => handleDeleteContribution(contribution.id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                  Created: {new Date(contribution.createdAt).toLocaleDateString()} • 
                  Updated: {new Date(contribution.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
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
      )}

      {/* View Contribution Modal */}
      {showViewModal && selectedContribution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-full max-w-4xl">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => {
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-900 dark:text-white"><strong>Account:</strong> {selectedContribution.accountName}</p>
                    <p className="text-gray-900 dark:text-white"><strong>Sale:</strong> {selectedContribution.saleName} ({selectedContribution.saleEmail})</p>
                    <p className="text-gray-900 dark:text-white"><strong>Type:</strong> {selectedContribution.contributionType}</p>
                    <p className="text-gray-900 dark:text-white"><strong>Status:</strong> {getStatusBadge(selectedContribution.status)}</p>
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white"><strong>Impact:</strong> {getImpactBadge(selectedContribution.impact)}</p>
                    <p className="text-gray-900 dark:text-white"><strong>Effort:</strong> {selectedContribution.effort}</p>
                    <p className="text-gray-900 dark:text-white"><strong>Month:</strong> {selectedContribution.contributionMonth}</p>
                    {selectedContribution.estimatedImpactValue > 0 && (
                      <p className="text-gray-900 dark:text-white"><strong>Impact Value:</strong> ฿{selectedContribution.estimatedImpactValue.toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-gray-900 dark:text-white"><strong>Description:</strong></p>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{selectedContribution.description}</p>
                </div>
                {selectedContribution.tags && selectedContribution.tags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-gray-900 dark:text-white"><strong>Tags:</strong></p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedContribution.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contribution Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-0 mx-auto p-5 w-full max-w-6xl">
            <div className="relative bg-white rounded-lg shadow-xl">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => {
                    setShowForm(false);
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <span className="sr-only">ปิด</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Debug Info */}
              
              <ContributionForm 
                user={user!}
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
    </div>
  );
};

export default MyContributions;
