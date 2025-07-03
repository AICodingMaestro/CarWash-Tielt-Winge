import axios, { AxiosResponse } from 'axios';
import messaging from '@react-native-firebase/messaging';
import Config from 'react-native-config';
import { Notification, NotificationSettings } from '../store/slices/notificationSlice';
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

class NotificationServiceClass {
  async getNotifications(limit: number = 50, offset: number = 0): Promise<{
    notifications: Notification[];
    unreadCount: number;
    hasMore: boolean;
  }> {
    try {
      const response = await api.get('/notifications', {
        params: { limit, offset },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch notifications');
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await api.put('/notifications/read-all');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to delete notification');
    }
  }

  async deleteAllNotifications(): Promise<void> {
    try {
      await api.delete('/notifications');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to delete all notifications');
    }
  }

  async getSettings(): Promise<NotificationSettings> {
    try {
      const response: AxiosResponse<NotificationSettings> = await api.get('/notifications/settings');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch notification settings');
    }
  }

  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response: AxiosResponse<NotificationSettings> = await api.put('/notifications/settings', settings);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to update notification settings');
    }
  }

  async registerFCMToken(token: string): Promise<void> {
    try {
      await api.post('/notifications/register-token', {
        token,
        platform: 'mobile',
      });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to register FCM token');
    }
  }

  async unregisterFCMToken(token: string): Promise<void> {
    try {
      await api.post('/notifications/unregister-token', {
        token,
      });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to unregister FCM token');
    }
  }

  async testNotification(type: string): Promise<void> {
    try {
      await api.post('/notifications/test', { type });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to send test notification');
    }
  }

  async scheduleBookingReminder(bookingId: string, reminderTime: string): Promise<void> {
    try {
      await api.post('/notifications/schedule-reminder', {
        bookingId,
        reminderTime,
      });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to schedule booking reminder');
    }
  }

  async cancelBookingReminder(bookingId: string): Promise<void> {
    try {
      await api.delete(`/notifications/cancel-reminder/${bookingId}`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to cancel booking reminder');
    }
  }

  async getNotificationHistory(
    startDate: string,
    endDate: string,
    type?: string
  ): Promise<Notification[]> {
    try {
      const params: any = { startDate, endDate };
      if (type) params.type = type;

      const response: AxiosResponse<Notification[]> = await api.get('/notifications/history', {
        params,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch notification history');
    }
  }

  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      await api.post('/notifications/subscribe-topic', { topic });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to subscribe to topic');
    }
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      await api.post('/notifications/unsubscribe-topic', { topic });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to unsubscribe from topic');
    }
  }

  async getSubscribedTopics(): Promise<string[]> {
    try {
      const response: AxiosResponse<{ topics: string[] }> = await api.get('/notifications/topics');
      return response.data.topics;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch subscribed topics');
    }
  }
}

// Firebase Messaging Helper Functions
export const requestUserPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted');
      const token = await messaging().getToken();
      if (token) {
        await notificationService.registerFCMToken(token);
        console.log('FCM Token registered:', token);
      }
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const notificationListener = () => {
  // Listen for foreground messages
  messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground message received:', remoteMessage);
    // Handle foreground notification display
    // This can be done using a local notification library
  });

  // Handle token refresh
  messaging().onTokenRefresh(async (token) => {
    console.log('FCM Token refreshed:', token);
    try {
      await notificationService.registerFCMToken(token);
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  });
};

export const notificationService = new NotificationServiceClass();
export default notificationService;