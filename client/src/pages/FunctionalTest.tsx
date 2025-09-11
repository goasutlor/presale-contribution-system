import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface TestResult {
  testName: string;
  status: 'pass' | 'fail';
  message: string;
  details?: string;
  timestamp: string;
}

interface TestResponse {
  overallStatus: 'pass' | 'fail';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
  timestamp: string;
}

const FunctionalTest: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runFullTest = async () => {
    if (!user || user.role !== 'admin') {
      alert('Only administrators can run functional tests.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/test/run-full-test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults(data.data);
        setLastRun(new Date().toLocaleString());
      } else {
        throw new Error('Failed to run tests');
      }
    } catch (error) {
      console.error('Error running functional tests:', error);
      alert('Failed to run functional tests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircleIcon className="h-5 w-5 text-success-600" />;
      case 'fail':
        return <XCircleIcon className="h-5 w-5 text-danger-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-success-50 border-success-200 text-success-800';
      case 'fail':
        return 'bg-danger-50 border-danger-200 text-danger-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-warning-500 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-500">Only administrators can access the functional testing page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Functional Testing</h1>
          <p className="text-gray-600">Run comprehensive tests to verify system functionality</p>
        </div>
        <button
          onClick={runFullTest}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Running Tests...
            </>
          ) : (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Run Full Test Suite
            </>
          )}
        </button>
      </div>

      {/* Test Status Overview */}
      {testResults && (
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Test Results Overview</h2>
            {lastRun && (
              <div className="text-sm text-gray-500">
                Last run: {lastRun}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{testResults.totalTests}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="text-center p-4 bg-success-50 rounded-xl border border-success-200">
              <div className="text-2xl font-bold text-success-600">{testResults.passedTests}</div>
              <div className="text-sm text-success-800">Passed</div>
            </div>
            <div className="text-center p-4 bg-danger-50 rounded-xl border border-danger-200">
              <div className="text-2xl font-bold text-danger-600">{testResults.failedTests}</div>
              <div className="text-sm text-danger-800">Failed</div>
            </div>
            <div className={`text-center p-4 rounded-xl border ${
              testResults.overallStatus === 'pass' 
                ? 'bg-success-50 border-success-200' 
                : 'bg-danger-50 border-danger-200'
            }`}>
              <div className={`text-2xl font-bold ${
                testResults.overallStatus === 'pass' ? 'text-success-600' : 'text-danger-600'
              }`}>
                {testResults.overallStatus === 'pass' ? 'PASS' : 'FAIL'}
              </div>
              <div className={`text-sm ${
                testResults.overallStatus === 'pass' ? 'text-success-800' : 'text-danger-800'
              }`}>
                Overall Status
              </div>
            </div>
          </div>

          {/* Overall Status Banner */}
          <div className={`p-4 rounded-lg border ${
            testResults.overallStatus === 'pass' 
              ? 'bg-success-50 border-success-200' 
              : 'bg-danger-50 border-danger-200'
          }`}>
            <div className="flex items-center">
              {testResults.overallStatus === 'pass' ? (
                <CheckCircleIcon className="h-6 w-6 text-success-600 mr-3" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-danger-600 mr-3" />
              )}
              <div>
                <h3 className={`font-medium ${
                  testResults.overallStatus === 'pass' ? 'text-success-800' : 'text-danger-800'
                }`}>
                  {testResults.overallStatus === 'pass' 
                    ? 'All Tests Passed Successfully!' 
                    : 'Some Tests Failed - Review Required'
                  }
                </h3>
                <p className={`text-sm ${
                  testResults.overallStatus === 'pass' ? 'text-success-700' : 'text-danger-700'
                }`}>
                  {testResults.overallStatus === 'pass'
                    ? `All ${testResults.totalTests} tests completed successfully. The system is functioning properly.`
                    : `${testResults.failedTests} out of ${testResults.totalTests} tests failed. Please review the failed tests below.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Test Results */}
      {testResults && (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Detailed Test Results</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {testResults.results.map((result, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{result.testName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                      {result.details && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-700 font-medium">Details:</p>
                          <p className="text-xs text-gray-600 mt-1">{result.details}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(result.status)}`}>
                    {result.status.toUpperCase()}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Completed at: {new Date(result.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Information */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">About Functional Testing</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">What Gets Tested</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Database connectivity and structure</li>
              <li>• User authentication system</li>
              <li>• API endpoint functionality</li>
              <li>• Data validation and processing</li>
              <li>• Error handling mechanisms</li>
              <li>• System security features</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">When to Run Tests</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• After system updates</li>
              <li>• Before production deployment</li>
              <li>• When troubleshooting issues</li>
              <li>• Regular system maintenance</li>
              <li>• After configuration changes</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex items-start">
            <CogIcon className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-primary-800">Test Automation</h3>
              <p className="text-sm text-primary-700 mt-1">
                These tests are designed to run automatically and provide comprehensive coverage of system functionality. 
                They help ensure system reliability and catch issues early in the development cycle.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* No Results State */}
      {!testResults && !loading && (
        <div className="bg-white rounded-xl shadow-soft p-12 border border-gray-100 text-center">
          <CogIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test</h3>
          <p className="text-gray-500 mb-6">
            Click "Run Full Test Suite" to start comprehensive system testing.
          </p>
          <button
            onClick={runFullTest}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Start Testing
          </button>
        </div>
      )}
    </div>
  );
};

export default FunctionalTest;
