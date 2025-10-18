import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import apiService, { UserProfile, LoginResponse } from '../services/api';

// Use the UserProfile type from API service
type User = UserProfile;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    console.log('🔍 AuthContext useEffect - Token check:', token ? 'exists' : 'missing');
    if (token) {
      fetchUserProfile(token);
    } else {
      console.log('🔍 No token found, setting loading to false');
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      console.log('🔍 Fetching user profile with token:', token ? 'exists' : 'missing');
      // Set token in localStorage first
      localStorage.setItem('token', token);
      const response: { data: UserProfile } = await apiService.getProfile();
      console.log('🔍 User profile response:', response);
      setUser(response.data);
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      console.log('❌ Removing token due to error');
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiService.login(email, password);

      if (response.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        setUser(userData);
        toast.success('Login successful!');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      // Don't show toast here, let the Login component handle it
      console.error('🔴 AuthContext Login Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear user state immediately to prevent API calls
      setUser(null);
      localStorage.removeItem('token');
      
      // Try to call logout API (but don't wait for it)
      apiService.logout().catch(error => {
        console.log('Logout API call failed (expected after token removal):', error);
      });
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, ensure we're logged out
      localStorage.removeItem('token');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🔄 Refreshing user profile...');
        const response: { data: UserProfile } = await apiService.getProfile();
        console.log('🔄 Refreshed user profile:', response);
        setUser(response.data);
      }
    } catch (error) {
      console.error('❌ Error refreshing user profile:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
