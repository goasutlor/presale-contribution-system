// API Configuration
export const API_CONFIG = {
  // Backend API URL - Use relative URL for production
  BASE_URL: process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001'),
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      PROFILE: '/api/auth/profile',
      CHANGE_PASSWORD: '/api/auth/change-password',
    },
    USERS: {
      LIST: '/api/users',
      CREATE: '/api/users',
      UPDATE: (id: string) => `/api/users/${id}`,
      DELETE: (id: string) => `/api/users/${id}`,
      GET: (id: string) => `/api/users/${id}`,
    },
    CONTRIBUTIONS: {
      LIST: '/api/contributions',
      CREATE: '/api/contributions',
      UPDATE: (id: string) => `/api/contributions/${id}`,
      DELETE: (id: string) => `/api/contributions/${id}`,
      GET: (id: string) => `/api/contributions/${id}`,
      SUBMIT: (id: string) => `/api/contributions/${id}/submit`,
    },
    REPORTS: {
      DASHBOARD: '/api/reports/dashboard',
      COMPREHENSIVE: '/api/reports/comprehensive',
      EXPORT: '/api/reports/export',
      USER: (id: string) => `/api/reports/user/${id}`,
    },
    TEST: {
      RUN_FULL: '/api/test/run-full-test',
    },
  },
  
  // Request Configuration
  REQUEST_CONFIG: {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include' as const,
  },
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
