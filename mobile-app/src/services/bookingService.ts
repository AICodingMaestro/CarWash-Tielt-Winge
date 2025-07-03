import axios, { AxiosResponse } from 'axios';
import Config from 'react-native-config';
import { Booking, BookingService, TimeSlot } from '../store/slices/bookingSlice';

// API Configuration
const API_BASE_URL = Config.API_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Import auth service for token management
import { authService } from './authService';

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

interface CreateBookingData {
  serviceId: string;
  date: string;
  time: string;
  vehicleInfo: {
    make: string;
    model: string;
    year?: number;
    color?: string;
    licensePlate?: string;
  };
  notes?: string;
  addons?: string[];
  promotionCode?: string;
}

class BookingServiceClass {
  async getUserBookings(): Promise<Booking[]> {
    try {
      const response: AxiosResponse<Booking[]> = await api.get('/bookings');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch bookings');
    }
  }

  async getBookingById(id: string): Promise<Booking> {
    try {
      const response: AxiosResponse<Booking> = await api.get(`/bookings/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch booking details');
    }
  }

  async createBooking(bookingData: CreateBookingData): Promise<Booking> {
    try {
      const response: AxiosResponse<Booking> = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create booking');
    }
  }

  async updateBooking(id: string, updateData: Partial<Booking>): Promise<Booking> {
    try {
      const response: AxiosResponse<Booking> = await api.put(`/bookings/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to update booking');
    }
  }

  async cancelBooking(id: string): Promise<Booking> {
    try {
      const response: AxiosResponse<Booking> = await api.post(`/bookings/${id}/cancel`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to cancel booking');
    }
  }

  async rescheduleBooking(id: string, newDate: string, newTime: string): Promise<Booking> {
    try {
      const response: AxiosResponse<Booking> = await api.post(`/bookings/${id}/reschedule`, {
        date: newDate,
        time: newTime,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to reschedule booking');
    }
  }

  async getServices(): Promise<BookingService[]> {
    try {
      const response: AxiosResponse<BookingService[]> = await api.get('/services');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch services');
    }
  }

  async getServiceById(id: string): Promise<BookingService> {
    try {
      const response: AxiosResponse<BookingService> = await api.get(`/services/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch service details');
    }
  }

  async getAvailableSlots(date: string, serviceId: string): Promise<TimeSlot[]> {
    try {
      const response: AxiosResponse<TimeSlot[]> = await api.get('/bookings/slots', {
        params: {
          date,
          serviceId,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch available time slots');
    }
  }

  async checkSlotAvailability(date: string, time: string, serviceId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ available: boolean }> = await api.get('/bookings/check-slot', {
        params: {
          date,
          time,
          serviceId,
        },
      });
      return response.data.available;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to check slot availability');
    }
  }

  async getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    try {
      const response: AxiosResponse<Booking[]> = await api.get('/bookings/range', {
        params: {
          startDate,
          endDate,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch bookings for date range');
    }
  }

  async addVehicle(vehicleData: {
    make: string;
    model: string;
    year?: number;
    color?: string;
    licensePlate?: string;
  }): Promise<void> {
    try {
      await api.post('/vehicles', vehicleData);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to add vehicle');
    }
  }

  async getUserVehicles(): Promise<any[]> {
    try {
      const response: AxiosResponse<any[]> = await api.get('/vehicles');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch vehicles');
    }
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    try {
      await api.delete(`/vehicles/${vehicleId}`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to delete vehicle');
    }
  }

  async getBookingHistory(limit: number = 20, offset: number = 0): Promise<{
    bookings: Booking[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const response = await api.get('/bookings/history', {
        params: { limit, offset },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch booking history');
    }
  }

  async addBookingRating(bookingId: string, rating: number, review?: string): Promise<void> {
    try {
      await api.post(`/bookings/${bookingId}/rating`, {
        rating,
        review,
      });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to submit rating');
    }
  }

  async getBookingInvoice(bookingId: string): Promise<Blob> {
    try {
      const response = await api.get(`/bookings/${bookingId}/invoice`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to download invoice');
    }
  }

  async validatePromoCode(code: string, serviceId: string): Promise<{
    valid: boolean;
    discount: number;
    type: 'percentage' | 'fixed';
  }> {
    try {
      const response = await api.post('/bookings/validate-promo', {
        code,
        serviceId,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to validate promo code');
    }
  }
}

export const bookingService = new BookingServiceClass();
export default bookingService;