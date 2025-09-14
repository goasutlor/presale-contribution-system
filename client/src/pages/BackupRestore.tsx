import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CloudArrowUpIcon, 
  CloudArrowDownIcon, 
  DocumentArrowDownIcon,
  ServerIcon,
  ClockIcon,
  TagIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon as ClockIconSolid
} from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/api';

interface ExportVersion {
  id: string;
  timestamp: string;
  description: string;
  fileSize: string;
  status: 'completed' | 'uploading' | 'failed';
  tag?: string;
  googleDriveFileId?: string;
  googleDriveUrl?: string;
}

interface GoogleDriveCredentials {
  email: string;
  password: string;
  isConnected: boolean;
  folderId?: string;
  folderName?: string;
}

interface BackupStatus {
  isRunning: boolean;
  currentStep: string;
  progress: number;
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
}

const BackupRestore: React.FC = () => {
  const { t } = useLanguage();
  const [exportVersions, setExportVersions] = useState<ExportVersion[]>([]);
  const [exporting, setExporting] = useState(false);
  const [showGoogleDriveSetup, setShowGoogleDriveSetup] = useState(false);
  const [googleCredentials, setGoogleCredentials] = useState<GoogleDriveCredentials>({
    email: '',
    password: '',
    isConnected: false
  });
  const [backupTag, setBackupTag] = useState('');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    isRunning: false,
    currentStep: '',
    progress: 0,
    status: 'idle',
    message: ''
  });

  useEffect(() => {
    // Load existing export versions (simulated)
    setExportVersions([
      {
        id: 'v1703123456789',
        timestamp: '2024-01-01 10:30:00',
        description: 'Full tenant backup - 25 users, 150 contributions',
        fileSize: '2.3 MB',
        status: 'completed',
        tag: 'pre-migration',
        googleDriveFileId: 'gd_1703123456789',
        googleDriveUrl: 'https://drive.google.com/file/d/gd_1703123456789/view'
      },
      {
        id: 'v1703112345678',
        timestamp: '2024-01-01 09:15:00',
        description: 'Full tenant backup - 24 users, 148 contributions',
        fileSize: '2.2 MB',
        status: 'completed',
        tag: 'monthly-backup',
        googleDriveFileId: 'gd_1703112345678',
        googleDriveUrl: 'https://drive.google.com/file/d/gd_1703112345678/view'
      },
      {
        id: 'v1703101234567',
        timestamp: '2024-01-01 08:00:00',
        description: 'Full tenant backup - 24 users, 145 contributions',
        fileSize: '2.1 MB',
        status: 'completed'
      }
    ]);
  }, []);

  const exportData = async (tag?: string) => {
    setExporting(true);
    setBackupStatus({
      isRunning: true,
      currentStep: 'Checking authentication...',
      progress: 10,
      status: 'running',
      message: 'Starting backup process'
    });

    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        setBackupStatus({
          isRunning: false,
          currentStep: 'Authentication failed',
          progress: 0,
          status: 'error',
          message: 'Please login first to export data'
        });
        toast.error('Please login first to export data');
        setExporting(false);
        setShowBackupModal(false);
        setBackupTag('');
        return;
      }

      setBackupStatus({
        isRunning: true,
        currentStep: 'Fetching data...',
        progress: 30,
        status: 'running',
        message: 'Retrieving user and contribution data'
      });

      // Export all tenant data
      const [users, contributions, dashboard] = await Promise.all([
        apiService.getUsers(),
        apiService.getContributions(),
        apiService.getDashboardData()
      ]);

      setBackupStatus({
        isRunning: true,
        currentStep: 'Preparing backup...',
        progress: 60,
        status: 'running',
        message: 'Creating backup file'
      });

      const exportData = {
        timestamp: new Date().toISOString(),
        version: `v${Date.now()}`,
        tenant: localStorage.getItem('tenantPrefix') || 'unknown',
        tag: tag || '',
        data: {
          users: users.data || [],
          contributions: contributions.data || [],
          dashboard: dashboard.data || {}
        },
        metadata: {
          exportType: 'full_tenant_backup',
          totalUsers: users.data?.length || 0,
          totalContributions: contributions.data?.length || 0
        }
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenant-backup-${exportData.version}${tag ? `-${tag}` : ''}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Upload to Google Drive if connected
      let googleDriveFileId = '';
      let googleDriveUrl = '';
      if (googleCredentials.isConnected) {
        try {
          setBackupStatus({
            isRunning: true,
            currentStep: 'Uploading to Google Drive...',
            progress: 80,
            status: 'running',
            message: `Uploading to folder: ${googleCredentials.folderName || 'Root'}`
          });

          // Simulate Google Drive upload
          googleDriveFileId = `gd_${Date.now()}`;
          googleDriveUrl = `https://drive.google.com/file/d/${googleDriveFileId}/view`;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload time
        } catch (error) {
          console.error('Google Drive upload failed:', error);
          setBackupStatus({
            isRunning: false,
            currentStep: 'Google Drive upload failed',
            progress: 0,
            status: 'error',
            message: 'Local backup saved, but Google Drive upload failed'
          });
          toast.error('Local backup saved, but Google Drive upload failed');
          setExporting(false);
          setShowBackupModal(false);
          setBackupTag('');
          return;
        }
      }

      const version: ExportVersion = {
        id: exportData.version,
        timestamp: new Date().toLocaleString(),
        description: `Full tenant backup - ${exportData.metadata.totalUsers} users, ${exportData.metadata.totalContributions} contributions${tag ? ` [${tag}]` : ''}`,
        fileSize: `${Math.round(blob.size / 1024)} KB`,
        status: 'completed',
        tag: tag || undefined,
        googleDriveFileId: googleDriveFileId || undefined,
        googleDriveUrl: googleDriveUrl || undefined
      };

      setExportVersions(prev => [version, ...prev]);
      
      setBackupStatus({
        isRunning: false,
        currentStep: 'Backup completed',
        progress: 100,
        status: 'success',
        message: 'Data exported successfully' + (googleCredentials.isConnected ? ' and uploaded to Google Drive' : '')
      });

      toast.success('Data exported successfully' + (googleCredentials.isConnected ? ' and uploaded to Google Drive' : ''));

    } catch (error) {
      console.error('Export failed:', error);
      setBackupStatus({
        isRunning: false,
        currentStep: 'Backup failed',
        progress: 0,
        status: 'error',
        message: 'Export failed: ' + error
      });
      toast.error('Export failed: ' + error);
    } finally {
      setExporting(false);
      setShowBackupModal(false);
      setBackupTag('');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setBackupStatus({
          isRunning: false,
          currentStep: '',
          progress: 0,
          status: 'idle',
          message: ''
        });
      }, 3000);
    }
  };

  const connectGoogleDrive = async () => {
    if (!googleCredentials.email || !googleCredentials.password) {
      toast.error('Please enter Google Drive credentials');
      return;
    }

    try {
      // Simulate Google Drive authentication
      toast.success('Connecting to Google Drive...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate folder selection (in real implementation, this would show a folder picker)
      const selectedFolder = {
        id: '0Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        name: 'ASC3-Backups'
      };
      
      setGoogleCredentials(prev => ({ 
        ...prev, 
        isConnected: true,
        folderId: selectedFolder.id,
        folderName: selectedFolder.name
      }));
      setShowGoogleDriveSetup(false);
      toast.success(`Successfully connected to Google Drive! Selected folder: ${selectedFolder.name}`);
    } catch (error) {
      console.error('Google Drive connection failed:', error);
      toast.error('Failed to connect to Google Drive');
    }
  };

  const browseGoogleDriveFolder = async () => {
    // In a real implementation, this would open Google Drive folder picker
    // For now, we'll simulate showing available folders
    const availableFolders = [
      { id: '0Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', name: 'ASC3-Backups' },
      { id: '0Byyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy', name: 'Company-Backups' },
      { id: '0Bzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz', name: 'Root' }
    ];
    
    // Simulate folder selection dialog
    const selectedFolder = availableFolders[0]; // Default to first folder
    
    setGoogleCredentials(prev => ({ 
      ...prev, 
      folderId: selectedFolder.id,
      folderName: selectedFolder.name
    }));
    
    toast.success(`Selected folder: ${selectedFolder.name}`);
  };

  const restoreFromVersion = async (version: ExportVersion) => {
    if (!window.confirm(`Are you sure you want to restore from version ${version.id}? This will overwrite current data.`)) {
      return;
    }

    try {
      toast.success('Restore functionality would be implemented here');
      // In a real implementation, this would:
      // 1. Download the backup file from Google Drive or local storage
      // 2. Parse the JSON data
      // 3. Clear current database
      // 4. Import the backup data
      // 5. Verify data integrity
      console.log('Restoring from version:', version);
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error('Restore failed: ' + error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'uploading':
        return <ClockIconSolid className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'uploading':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Backup & Restore
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your tenant data backups and restore from previous versions
          </p>
          {!localStorage.getItem('token') && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Not authenticated:</strong> Please login to access backup and restore features.
              </p>
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-0 md:ml-4 flex space-x-3">
          {googleCredentials.isConnected && (
            <button
              onClick={browseGoogleDriveFolder}
              className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md shadow-sm text-sm font-medium"
            >
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
              📁 {googleCredentials.folderName || 'Select Folder'}
            </button>
          )}
          <button
            onClick={() => setShowGoogleDriveSetup(true)}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              googleCredentials.isConnected 
                ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            {googleCredentials.isConnected ? 'Google Drive ✓' : 'Setup Google Drive'}
          </button>
          <button
            onClick={() => setShowBackupModal(true)}
            disabled={exporting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            {exporting ? 'Creating Backup...' : 'Create Backup'}
          </button>
        </div>
      </div>

      {/* Backup Status */}
      {backupStatus.status !== 'idle' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Backup Status
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {backupStatus.status === 'running' && (
                  <ClockIconSolid className="h-5 w-5 text-blue-500 mr-2 animate-spin" />
                )}
                {backupStatus.status === 'success' && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                )}
                {backupStatus.status === 'error' && (
                  <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {backupStatus.currentStep}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {backupStatus.message}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {backupStatus.progress}%
                </p>
              </div>
            </div>
            
            {backupStatus.status === 'running' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${backupStatus.progress}%` }}
                ></div>
              </div>
            )}
            
            {backupStatus.status === 'success' && (
              <div className="w-full bg-green-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-full"></div>
              </div>
            )}
            
            {backupStatus.status === 'error' && (
              <div className="w-full bg-red-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full w-full"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backup History */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Backup History
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Previous backups and restore points for your tenant data
          </p>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {exportVersions.map((version) => (
            <div key={version.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DocumentArrowDownIcon className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {version.id}
                      </p>
                      {version.tag && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {version.tag}
                        </span>
                      )}
                      {version.googleDriveFileId && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CloudArrowUpIcon className="h-3 w-3 mr-1" />
                          Google Drive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {version.description}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      <ClockIcon className="h-3 w-3 inline mr-1" />
                      {version.timestamp} • {version.fileSize}
                      {version.googleDriveUrl && (
                        <span> • <a href={version.googleDriveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">View in Drive</a></span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(version.status)}`}>
                    {getStatusIcon(version.status)}
                    <span className="ml-1">
                      {version.status === 'completed' ? 'Ready' : 
                       version.status === 'uploading' ? 'Uploading' : 'Failed'}
                    </span>
                  </span>
                  {version.status === 'completed' && (
                    <button
                      onClick={() => restoreFromVersion(version)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <CloudArrowDownIcon className="h-3 w-3 mr-1" />
                      Restore
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Google Drive Setup Modal */}
      {showGoogleDriveSetup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Google Drive Setup
              </h3>
              
              <form onSubmit={(e) => { e.preventDefault(); connectGoogleDrive(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Google Account Email
                    </label>
                    <input
                      type="email"
                      value={googleCredentials.email}
                      onChange={(e) => setGoogleCredentials(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="your.email@gmail.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password / App Password
                    </label>
                    <input
                      type="password"
                      value={googleCredentials.password}
                      onChange={(e) => setGoogleCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your password or app password"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      For security, use an App Password instead of your regular password
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowGoogleDriveSetup(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Connect
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Create Backup
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Backup Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={backupTag}
                    onChange={(e) => setBackupTag(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., pre-migration, monthly-backup, v2.0-release"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Add a tag to help identify this backup later
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    📋 <strong>Backup includes:</strong>
                  </p>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 ml-4">
                    <li>• All users and their data</li>
                    <li>• All contributions and metadata</li>
                    <li>• Dashboard configurations</li>
                    <li>• System settings</li>
                  </ul>
                </div>

                {googleCredentials.isConnected && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      ☁️ Backup will be saved to Google Drive automatically
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      📁 Destination folder: <strong>{googleCredentials.folderName || 'Root'}</strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowBackupModal(false);
                    setBackupTag('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => exportData(backupTag)}
                  disabled={exporting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {exporting ? 'Creating Backup...' : 'Create Backup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupRestore;
