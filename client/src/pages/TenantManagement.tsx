import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/api';
import toast from 'react-hot-toast';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface Tenant {
  id: string;
  tenantPrefix: string;
  name: string;
  adminEmails: string[];
  createdAt: string;
  updatedAt: string;
  stats?: {
    users: number;
    contributions: number;
    approved: number;
    lastActivity: string | null;
  };
}

const TenantManagement: React.FC = () => {
  const { t } = useLanguage();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    tenantPrefix: '',
    name: '',
    adminEmails: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const loadTenants = async () => {
    try {
      setLoading(true);
      const [tenantsRes, statsRes] = await Promise.all([
        apiService.getGlobalTenants(),
        apiService.getTenantStats()
      ]);
      
      if (tenantsRes.success && statsRes.success) {
        const statsByPrefix: Record<string, any> = {};
        (statsRes.data || []).forEach((s: any) => { 
          statsByPrefix[s.tenantPrefix] = s; 
        });
        
        const combined = (tenantsRes.data || []).map((t: any) => ({
          ...t,
          adminEmails: t.adminEmails || [],
          stats: statsByPrefix[t.tenantPrefix] || { 
            users: 0, 
            contributions: 0, 
            approved: 0, 
            lastActivity: null 
          }
        }));
        
        setTenants(combined);
      } else {
        toast.error('Failed to load tenants');
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenantPrefix || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const adminEmails = formData.adminEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      const response = await apiService.createGlobalTenant({
        tenantPrefix: formData.tenantPrefix,
        name: formData.name,
        adminEmails
      });

      if (response.success) {
        toast.success('Tenant created successfully');
        setShowCreateForm(false);
        setFormData({ tenantPrefix: '', name: '', adminEmails: '' });
        loadTenants();
      } else {
        toast.error('Failed to create tenant');
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast.error('Failed to create tenant');
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTenant) return;

    try {
      const adminEmails = formData.adminEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      const response = await apiService.updateGlobalTenant(editingTenant.id, {
        name: formData.name,
        adminEmails
      });

      if (response.success) {
        toast.success('Tenant updated successfully');
        setEditingTenant(null);
        setFormData({ tenantPrefix: '', name: '', adminEmails: '' });
        loadTenants();
      } else {
        toast.error('Failed to update tenant');
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast.error('Failed to update tenant');
    }
  };

  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    if (!window.confirm(`Are you sure you want to delete tenant "${tenantName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiService.deleteGlobalTenant(tenantId);
      if (response.success) {
        toast.success('Tenant deleted successfully');
        loadTenants();
      } else {
        toast.error('Failed to delete tenant');
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast.error('Failed to delete tenant');
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.tenantPrefix.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Tenant Management
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create, edit, and manage tenants
          </p>
        </div>
        <div className="mt-4 md:mt-0 md:ml-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Tenant
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Tenants
          </label>
          <input
            type="text"
            placeholder="Search by name or prefix..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Tenants Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading tenants...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTenants.map((tenant) => (
            <div key={tenant.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <BuildingOfficeIcon className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {tenant.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {tenant.tenantPrefix}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingTenant(tenant);
                      setFormData({
                        tenantPrefix: tenant.tenantPrefix,
                        name: tenant.name,
                        adminEmails: tenant.adminEmails.join(', ')
                      });
                    }}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Edit Tenant"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete Tenant"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {tenant.stats?.users || 0} users
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ChartBarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {tenant.stats?.contributions || 0} contributions
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Created: {formatDate(tenant.createdAt)}</span>
                    {tenant.stats?.lastActivity && (
                      <span>Last activity: {formatDate(tenant.stats.lastActivity)}</span>
                    )}
                  </div>
                </div>

                {tenant.adminEmails && tenant.adminEmails.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admin Emails:
                    </p>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {tenant.adminEmails.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tenants found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new tenant.'}
          </p>
        </div>
      )}

      {/* Create/Edit Tenant Modal */}
      {(showCreateForm || editingTenant) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
              </h3>
              
              <form onSubmit={editingTenant ? handleUpdateTenant : handleCreateTenant}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tenant Prefix *
                    </label>
                    <input
                      type="text"
                      value={formData.tenantPrefix}
                      onChange={(e) => setFormData(prev => ({ ...prev, tenantPrefix: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., asc1, asc2"
                      disabled={!!editingTenant}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Used in URLs: /t/{formData.tenantPrefix || 'prefix'}/login
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tenant Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., ASC Team 1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admin Emails
                    </label>
                    <input
                      type="text"
                      value={formData.adminEmails}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminEmails: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="admin1@company.com, admin2@company.com"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Comma-separated list of admin email addresses
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingTenant(null);
                      setFormData({ tenantPrefix: '', name: '', adminEmails: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {editingTenant ? 'Update Tenant' : 'Create Tenant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
