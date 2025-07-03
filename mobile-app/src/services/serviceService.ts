import axios, { AxiosResponse } from 'axios';
import Config from 'react-native-config';
import { Service, ServiceCategory, ServiceAddon, Promotion } from '../store/slices/serviceSlice';
import { authService } from './authService';

// API Configuration
const API_BASE_URL = Config.API_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await authService.getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

class ServiceServiceClass {
  async getAllServices(): Promise<Service[]> {
    try {
      const response: AxiosResponse<Service[]> = await api.get('/services');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch services');
    }
  }

  async getServiceById(id: string): Promise<Service> {
    try {
      const response: AxiosResponse<Service> = await api.get(`/services/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch service details');
    }
  }

  async getCategories(): Promise<ServiceCategory[]> {
    try {
      const response: AxiosResponse<ServiceCategory[]> = await api.get('/services/categories');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch service categories');
    }
  }

  async getServicesByCategory(categoryId: string): Promise<Service[]> {
    try {
      const response: AxiosResponse<Service[]> = await api.get(`/services/category/${categoryId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch services by category');
    }
  }

  async getAddons(): Promise<ServiceAddon[]> {
    try {
      const response: AxiosResponse<ServiceAddon[]> = await api.get('/services/addons');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch service addons');
    }
  }

  async getAddonsByService(serviceId: string): Promise<ServiceAddon[]> {
    try {
      const response: AxiosResponse<ServiceAddon[]> = await api.get(`/services/${serviceId}/addons`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch service addons');
    }
  }

  async getActivePromotions(): Promise<Promotion[]> {
    try {
      const response: AxiosResponse<Promotion[]> = await api.get('/promotions/active');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch active promotions');
    }
  }

  async validatePromotion(code: string, serviceIds: string[]): Promise<Promotion> {
    try {
      const response: AxiosResponse<Promotion> = await api.post('/promotions/validate', {
        code,
        serviceIds,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Invalid promotion code');
    }
  }

  async getPopularServices(): Promise<Service[]> {
    try {
      const response: AxiosResponse<Service[]> = await api.get('/services/popular');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch popular services');
    }
  }

  async searchServices(query: string): Promise<Service[]> {
    try {
      const response: AxiosResponse<Service[]> = await api.get('/services/search', {
        params: { q: query },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to search services');
    }
  }

  async getServicePricing(serviceId: string, date?: string): Promise<{
    basePrice: number;
    seasonalMultiplier?: number;
    finalPrice: number;
    currency: string;
  }> {
    try {
      const params = date ? { date } : {};
      const response = await api.get(`/services/${serviceId}/pricing`, { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch service pricing');
    }
  }

  async getServiceAvailability(serviceId: string, date: string): Promise<{
    available: boolean;
    slots: string[];
    restrictions?: string[];
  }> {
    try {
      const response = await api.get(`/services/${serviceId}/availability`, {
        params: { date },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to check service availability');
    }
  }

  async getServiceReviews(serviceId: string, limit: number = 10, offset: number = 0): Promise<{
    reviews: any[];
    averageRating: number;
    totalReviews: number;
    hasMore: boolean;
  }> {
    try {
      const response = await api.get(`/services/${serviceId}/reviews`, {
        params: { limit, offset },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch service reviews');
    }
  }

  async addToFavorites(serviceId: string): Promise<void> {
    try {
      await api.post(`/services/${serviceId}/favorite`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to add to favorites');
    }
  }

  async removeFromFavorites(serviceId: string): Promise<void> {
    try {
      await api.delete(`/services/${serviceId}/favorite`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to remove from favorites');
    }
  }

  async getFavoriteServices(): Promise<Service[]> {
    try {
      const response: AxiosResponse<Service[]> = await api.get('/services/favorites');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch favorite services');
    }
  }

  async getServiceEstimatedTime(serviceId: string, addons?: string[]): Promise<{
    estimatedDuration: number; // in minutes
    breakdown: {
      service: number;
      addons: number;
      preparation: number;
    };
  }> {
    try {
      const response = await api.post(`/services/${serviceId}/estimate-time`, {
        addons: addons || [],
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to get time estimate');
    }
  }

  async compareServices(serviceIds: string[]): Promise<{
    services: Service[];
    comparison: {
      features: string[];
      pricing: { [serviceId: string]: number };
      duration: { [serviceId: string]: number };
    };
  }> {
    try {
      const response = await api.post('/services/compare', {
        serviceIds,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to compare services');
    }
  }

  async getServiceRecommendations(userId?: string): Promise<Service[]> {
    try {
      const response: AxiosResponse<Service[]> = await api.get('/services/recommendations', {
        params: userId ? { userId } : {},
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch service recommendations');
    }
  }
}

export const serviceService = new ServiceServiceClass();
export default serviceService;