import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notificationService';

// Types
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'booking' | 'promotion' | 'reminder' | 'system' | 'loyalty';
  data?: any;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'low' | 'normal' | 'high';
  category?: string;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  bookingReminders: boolean;
  promotionalOffers: boolean;
  loyaltyUpdates: boolean;
  systemMessages: boolean;
  reminderHours: number; // hours before booking
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  fcmToken: string | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  settings: {
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    bookingReminders: true,
    promotionalOffers: true,
    loyaltyUpdates: true,
    systemMessages: true,
    reminderHours: 2,
  },
  fcmToken: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getNotifications();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationService.markAsRead(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark all notifications as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete notification');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'notification/updateSettings',
  async (settings: Partial<NotificationSettings>, { rejectWithValue }) => {
    try {
      const response = await notificationService.updateSettings(settings);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update notification settings');
    }
  }
);

export const registerToken = createAsyncThunk(
  'notification/registerToken',
  async (token: string, { rejectWithValue }) => {
    try {
      await notificationService.registerFCMToken(token);
      return token;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to register notification token');
    }
  }
);

// Notification slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Add to beginning of array
      state.notifications.unshift(action.payload);
      
      // Update unread count
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
      
      // Limit to 100 notifications
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100);
      }
    },
    removeExpiredNotifications: (state) => {
      const now = new Date().toISOString();
      const validNotifications = state.notifications.filter(
        notification => !notification.expiresAt || notification.expiresAt > now
      );
      
      // Update unread count if expired notifications were unread
      const expiredUnreadCount = state.notifications
        .filter(n => n.expiresAt && n.expiresAt <= now && !n.read)
        .length;
      
      state.notifications = validNotifications;
      state.unreadCount = Math.max(0, state.unreadCount - expiredUnreadCount);
    },
    setFCMToken: (state, action: PayloadAction<string>) => {
      state.fcmToken = action.payload;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark as read
    builder
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Mark all as read
    builder
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Delete notification
    builder
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification.read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(index, 1);
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Update settings
    builder
      .addCase(updateSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = { ...state.settings, ...action.payload };
        state.error = null;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register token
    builder
      .addCase(registerToken.fulfilled, (state, action) => {
        state.fcmToken = action.payload;
      })
      .addCase(registerToken.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  addNotification,
  removeExpiredNotifications,
  setFCMToken,
  clearNotifications,
  updateNotificationSettings,
} = notificationSlice.actions;

export default notificationSlice.reducer;