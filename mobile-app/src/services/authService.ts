import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { User } from '../store/slices/authSlice';

// API Configuration
const API_BASE_URL = Config.API_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await authService.refreshToken(refreshToken);
          await AsyncStorage.setItem('authToken', response.token);
          await AsyncStorage.setItem('refreshToken', response.refreshToken);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${response.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
        throw refreshError;
      }
    }
    
    return Promise.reject(error);
  }
);

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
      
      // Store tokens
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post('/auth/register', userData);
      
      // Store tokens
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Registration failed. Please try again.');
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage regardless of API call success
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response: AxiosResponse<RefreshTokenResponse> = await api.post('/auth/refresh', {
        refreshToken,
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Token refresh failed');
    }
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response: AxiosResponse<User> = await api.put('/auth/profile', userData);
      
      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Profile update failed');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Password change failed');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Password reset request failed');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Password reset failed');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      await api.post('/auth/verify-email', { token });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Email verification failed');
    }
  }

  async resendVerificationEmail(): Promise<void> {
    try {
      await api.post('/auth/resend-verification');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to resend verification email');
    }
  }

  async deleteAccount(password: string): Promise<void> {
    try {
      await api.delete('/auth/account', {
        data: { password },
      });
      
      // Clear local storage
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Account deletion failed');
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return false;
      
      const response = await api.get('/auth/me');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      return null;
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;