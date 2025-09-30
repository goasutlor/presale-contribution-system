import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import apiService, { UserProfile, LoginResponse } from '../services/api';

type User = UserProfile;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGlobalAdmin: boolean;
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
    const token = localStorage.getItem('token');
    const globalToken = localStorage.getItem('globalToken');
    if (token) {
      fetchUserProfile(token);
    } else {
      // If we don't have a tenant token but have a global admin token, we still consider authenticated
      if (globalToken) {
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      localStorage.setItem('token', token);
      const response: { data: UserProfile } = await apiService.getProfile();
      setUser(response.data);
    } catch (_error) {
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response: { data: UserProfile } = await apiService.getProfile();
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('globalToken');
      apiService.logout().catch(() => {});
      toast.success('Logged out successfully');
    } catch (_error) {
      localStorage.removeItem('token');
      localStorage.removeItem('globalToken');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const isGlobalAdmin = !!localStorage.getItem('globalToken') || user?.email === 'global@asc.com';
  const isAuthenticated = !!user || isGlobalAdmin;

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isGlobalAdmin,
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
