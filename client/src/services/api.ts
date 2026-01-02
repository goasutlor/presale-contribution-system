import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080');

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
    blogLinks: string[];
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
  blogLinks: string[];
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
          console.error('❌ Error response details:', JSON.stringify(errorData, null, 2));
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
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

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<ApiResponse<LoginResponse>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
  async getDashboardData(year?: number): Promise<ApiResponse<any>> {
    const yearParam = year || 2026; // Default to 2026 (new year)
    return this.request<ApiResponse<any>>(`/api/reports/dashboard?year=${yearParam}`);
  }

  async getTimelineData(year?: number): Promise<ApiResponse<any>> {
    const yearParam = year || 2026; // Default to 2026 (new year)
    return this.request<ApiResponse<any>>(`/api/reports/timeline?year=${yearParam}`);
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

  async getContributionById(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/api/contributions/${id}`);
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

  // Complex Projects endpoints
  async getComplexProjects(year?: number): Promise<ApiResponse<any[]>> {
    const yearParam = year ? `?year=${year}` : '';
    return this.request<ApiResponse<any[]>>(`/api/complex-projects${yearParam}`);
  }

  async getComplexProjectById(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/api/complex-projects/${id}`);
  }

  async createComplexProject(payload: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/complex-projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateComplexProject(id: string, payload: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/api/complex-projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteComplexProject(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/api/complex-projects/${id}`, {
      method: 'DELETE',
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
}

export const apiService = new ApiService();
export default apiService;
