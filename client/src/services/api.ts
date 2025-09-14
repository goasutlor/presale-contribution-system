import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001');

// Type definitions for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    staffId: string;
    email: string;
    involvedAccountNames: string[];
    involvedSaleNames: string[];
    involvedSaleEmails: string[];
    role: 'user' | 'admin';
    status: 'pending' | 'approved' | 'rejected';
    canViewOthers: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UserProfile {
  id: string;
  fullName: string;
  staffId: string;
  email: string;
  involvedAccountNames: string[];
  involvedSaleNames: string[];
  involvedSaleEmails: string[];
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  canViewOthers: boolean;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    const tenantPrefix = (localStorage.getItem('tenantPrefix') || 'default').trim();
    
    console.log('🔍 API Request:', { 
      endpoint, 
      url, 
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenStart: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    console.log('🔍 Full token for debugging:', token);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        'x-tenant-prefix': tenantPrefix || 'default',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        console.error('❌ API Error:', { status: response.status, statusText: response.statusText, url });
        
        if (response.status === 401) {
          console.error('❌ 401 Unauthorized - Token expired or invalid');
          localStorage.removeItem('token');
          // Don't redirect immediately, let the component handle it
          throw new Error('Unauthorized - Please login again');
        }
        
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('❌ Error response data:', errorData);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          console.error('❌ Could not parse error response:', e);
          // If can't parse JSON, use default message
        }
        
        const error = new Error(errorMessage) as any;
        error.response = response;
        error.status = response.status;
        throw error;
      }
      
      const responseData = await response.json();
      console.log('✅ API Response:', responseData);
      return responseData;
    } catch (error: any) {
      console.error('API request failed:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = new Error('Network error - Cannot connect to server') as any;
        networkError.status = 0;
        networkError.isNetworkError = true;
        throw networkError;
      }
      
      // Handle timeout errors
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout - Please try again') as any;
        timeoutError.status = 408;
        timeoutError.isTimeoutError = true;
        throw timeoutError;
      }
      
      // Handle specific HTTP status codes
      if (error.response) {
        const status = error.response.status;
        if (status === 403) {
          const forbiddenError = new Error('Access forbidden - Insufficient permissions') as any;
          forbiddenError.status = 403;
          throw forbiddenError;
        } else if (status === 404) {
          const notFoundError = new Error('Resource not found') as any;
          notFoundError.status = 404;
          throw notFoundError;
        } else if (status === 429) {
          const rateLimitError = new Error('Rate limit exceeded - Please try again later') as any;
          rateLimitError.status = 429;
          throw rateLimitError;
        }
      }
      
      throw error;
    }
  }

  // Global admin request (separate token, no tenant header required)
  private async requestGlobal<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const globalToken = localStorage.getItem('globalToken');
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(globalToken && { Authorization: `Bearer ${globalToken}` }),
        ...options.headers,
      },
      ...options,
    };
    const resp = await fetch(url, config);
    if (!resp.ok) {
      let msg = `HTTP ${resp.status}`;
      try { const data = await resp.json(); if (data.message) msg = data.message; } catch {}
      const err: any = new Error(msg); err.status = resp.status; throw err;
    }
    return resp.json();
  }

  // Tenant prefix helpers
  setTenantPrefix(prefix: string) {
    localStorage.setItem('tenantPrefix', (prefix || 'default').trim());
  }
  getTenantPrefix(): string {
    return (localStorage.getItem('tenantPrefix') || 'default').trim();
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<ApiResponse<LoginResponse>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getGlobalOverview(params?: { start?: string; end?: string }): Promise<ApiResponse<any>> {
    const qs = params?.start && params?.end ? `?start=${encodeURIComponent(params.start)}&end=${encodeURIComponent(params.end)}` : '';
    return this.requestGlobal<ApiResponse<any>>(`/api/global/overview${qs}`);
  }
  async getTenantStats(params?: { start?: string; end?: string }): Promise<ApiResponse<any[]>> {
    const qs = params?.start && params?.end ? `?start=${encodeURIComponent(params.start)}&end=${encodeURIComponent(params.end)}` : '';
    return this.requestGlobal<ApiResponse<any[]>>(`/api/global/tenants/stats${qs}`);
  }
  async getTenants(): Promise<ApiResponse<any[]>> {
    return this.requestGlobal<ApiResponse<any[]>>('/api/global/tenants');
  }
  async getGlobalUsers(search?: string): Promise<ApiResponse<any[]>> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.requestGlobal<ApiResponse<any[]>>(`/api/global/users${qs}`);
  }
  async updateGlobalUser(id: string, payload: Partial<{ role: 'user' | 'admin'; status: 'pending' | 'approved' | 'rejected'; canViewOthers: boolean; tenantPrefix: string; password: string }>): Promise<ApiResponse<any>> {
    return this.requestGlobal<ApiResponse<any>>(`/api/global/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  async createGlobalUser(userData: any): Promise<ApiResponse<any>> {
    return this.requestGlobal<ApiResponse<any>>('/api/global/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
  async createTenant(payload: { tenantPrefix: string; name: string; adminEmails: string[] }): Promise<ApiResponse<any>> {
    return this.requestGlobal<ApiResponse<any>>('/api/global/tenants', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
  async updateTenant(id: string, payload: { name?: string; adminEmails?: string[] }): Promise<ApiResponse<any>> {
    return this.requestGlobal<ApiResponse<any>>(`/api/global/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<ApiResponse<UserProfile>>('/api/auth/profile');
  }

  async updateMyProfile(profile: Partial<UserProfile> & {
    involvedAccountNames?: string[];
    involvedSaleNames?: string[];
    involvedSaleEmails?: string[];
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/api/auth/logout', {
      method: 'POST',
    });
  }

  async signup(userData: any): Promise<ApiResponse<LoginResponse>> {
    return this.request<ApiResponse<LoginResponse>>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // User endpoints
  async getUsers(): Promise<ApiResponse<UserProfile[]>> {
    return this.request<ApiResponse<UserProfile[]>>('/api/users');
  }

  async createUser(userData: any): Promise<ApiResponse<UserProfile>> {
    return this.request<ApiResponse<UserProfile>>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any): Promise<ApiResponse<UserProfile>> {
    return this.request<ApiResponse<UserProfile>>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  async approveUser(id: string): Promise<ApiResponse<UserProfile>> {
    return this.request<ApiResponse<UserProfile>>(`/api/users/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectUser(id: string): Promise<ApiResponse<UserProfile>> {
    return this.request<ApiResponse<UserProfile>>(`/api/users/${id}/reject`, {
      method: 'POST',
    });
  }

  // Dashboard endpoints
  async getDashboardData(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/reports/dashboard');
  }

  async getTimelineData(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/reports/timeline');
  }

  // Contribution endpoints
  async getContributions(): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>('/api/contributions');
  }

  async createContribution(contributionData: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/contributions', {
      method: 'POST',
      body: JSON.stringify(contributionData),
    });
  }

  async updateContribution(id: string, contributionData: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/api/contributions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contributionData),
    });
  }

  async deleteContribution(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/api/contributions/${id}`, {
      method: 'DELETE',
    });
  }

  async submitContribution(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/api/contributions/${id}/submit`, {
      method: 'POST',
    });
  }

  // Report endpoints (normalized)
  async getDashboardReport(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/reports/dashboard'); // GET
  }

  async getUserReport(userId: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/api/reports/user/${userId}`);
  }

  async getComprehensiveReport(filters: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/reports/comprehensive', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  }

  async exportReport(filters: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/reports/export', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  }

  // Update password
  async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin reset user password
  async adminResetPassword(data: { userId: string; newPassword: string }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/auth/admin-reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/health');
  }


  async globalLogin(email: string, password: string): Promise<ApiResponse<any>> {
    return this.requestGlobal<ApiResponse<any>>('/api/global/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getGlobalContributions(): Promise<ApiResponse<any[]>> {
    return this.requestGlobal<ApiResponse<any[]>>('/api/global/contributions');
  }

  async getGlobalTimelineData(): Promise<ApiResponse<any>> {
    return this.requestGlobal<ApiResponse<any>>('/api/global/timeline');
  }

  async getGlobalTenants(): Promise<ApiResponse<any[]>> {
    return this.requestGlobal<ApiResponse<any[]>>('/api/global/tenants');
  }

  async createGlobalTenant(tenantData: any): Promise<ApiResponse<any>> {
    return this.requestGlobal<ApiResponse<any>>('/api/global/tenants', {
      method: 'POST',
      body: JSON.stringify(tenantData),
    });
  }

  async updateGlobalTenant(tenantId: string, tenantData: any): Promise<ApiResponse<any>> {
    return this.requestGlobal<ApiResponse<any>>(`/api/global/tenants/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify(tenantData),
    });
  }

  async deleteGlobalTenant(tenantId: string): Promise<ApiResponse<any>> {
    return this.requestGlobal<ApiResponse<any>>(`/api/global/tenants/${tenantId}`, {
      method: 'DELETE',
    });
  }

}

export const apiService = new ApiService();
export default apiService;
