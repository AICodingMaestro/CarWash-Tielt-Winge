import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { offlineService } from '../../services/offlineService';

// Types
export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'retrying' | 'failed' | 'completed';
  error?: string;
}

export interface CachedData {
  key: string;
  data: any;
  timestamp: string;
  expiresAt: string;
  type: 'services' | 'bookings' | 'user' | 'loyalty' | 'general';
}

export interface OfflineBooking {
  id: string;
  serviceId: string;
  date: string;
  time: string;
  vehicleInfo: any;
  notes?: string;
  createdAt: string;
  status: 'draft' | 'pending_sync';
}

interface OfflineState {
  isOnline: boolean;
  syncInProgress: boolean;
  lastSyncAt: string | null;
  queuedActions: QueuedAction[];
  cachedData: CachedData[];
  offlineBookings: OfflineBooking[];
  pendingUploads: string[];
  syncErrors: string[];
  autoSyncEnabled: boolean;
  dataSaver: boolean;
  cacheSize: number;
  maxCacheSize: number;
}

// Initial state
const initialState: OfflineState = {
  isOnline: true,
  syncInProgress: false,
  lastSyncAt: null,
  queuedActions: [],
  cachedData: [],
  offlineBookings: [],
  pendingUploads: [],
  syncErrors: [],
  autoSyncEnabled: true,
  dataSaver: false,
  cacheSize: 0,
  maxCacheSize: 50 * 1024 * 1024, // 50MB
};

// Async thunks
export const syncOfflineData = createAsyncThunk(
  'offline/syncOfflineData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { offline: OfflineState };
      const response = await offlineService.syncData(state.offline.queuedActions);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sync failed');
    }
  }
);

export const uploadPendingData = createAsyncThunk(
  'offline/uploadPendingData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { offline: OfflineState };
      const response = await offlineService.uploadPendingData(state.offline.pendingUploads);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Upload failed');
    }
  }
);

export const retryFailedActions = createAsyncThunk(
  'offline/retryFailedActions',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { offline: OfflineState };
      const failedActions = state.offline.queuedActions.filter(a => a.status === 'failed');
      const response = await offlineService.retryActions(failedActions);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Retry failed');
    }
  }
);

export const clearCache = createAsyncThunk(
  'offline/clearCache',
  async (type: string | undefined, { rejectWithValue }) => {
    try {
      await offlineService.clearCache(type);
      return type;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear cache');
    }
  }
);

// Offline slice
const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      
      // Auto-sync when coming back online
      if (action.payload && state.autoSyncEnabled && state.queuedActions.length > 0) {
        // This would trigger a sync action
      }
    },
    queueAction: (state, action: PayloadAction<Omit<QueuedAction, 'id' | 'timestamp' | 'retries' | 'status'>>) => {
      const queuedAction: QueuedAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retries: 0,
        status: 'pending',
        ...action.payload,
      };
      
      state.queuedActions.push(queuedAction);
    },
    removeQueuedAction: (state, action: PayloadAction<string>) => {
      state.queuedActions = state.queuedActions.filter(a => a.id !== action.payload);
    },
    updateQueuedAction: (state, action: PayloadAction<{ id: string; updates: Partial<QueuedAction> }>) => {
      const index = state.queuedActions.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.queuedActions[index] = { ...state.queuedActions[index], ...action.payload.updates };
      }
    },
    cacheData: (state, action: PayloadAction<Omit<CachedData, 'timestamp'>>) => {
      const existingIndex = state.cachedData.findIndex(c => c.key === action.payload.key);
      const newCacheItem: CachedData = {
        ...action.payload,
        timestamp: new Date().toISOString(),
      };
      
      if (existingIndex !== -1) {
        state.cachedData[existingIndex] = newCacheItem;
      } else {
        state.cachedData.push(newCacheItem);
      }
      
      // Update cache size
      state.cacheSize = state.cachedData.reduce((size, item) => {
        return size + JSON.stringify(item.data).length;
      }, 0);
      
      // Clean up if cache is too large
      if (state.cacheSize > state.maxCacheSize) {
        // Remove oldest items
        state.cachedData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        while (state.cacheSize > state.maxCacheSize * 0.8 && state.cachedData.length > 0) {
          const removed = state.cachedData.shift();
          if (removed) {
            state.cacheSize -= JSON.stringify(removed.data).length;
          }
        }
      }
    },
    removeCachedData: (state, action: PayloadAction<string>) => {
      const index = state.cachedData.findIndex(c => c.key === action.payload);
      if (index !== -1) {
        const removed = state.cachedData.splice(index, 1)[0];
        state.cacheSize -= JSON.stringify(removed.data).length;
      }
    },
    addOfflineBooking: (state, action: PayloadAction<Omit<OfflineBooking, 'id' | 'createdAt' | 'status'>>) => {
      const offlineBooking: OfflineBooking = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        status: 'draft',
        ...action.payload,
      };
      
      state.offlineBookings.push(offlineBooking);
    },
    updateOfflineBooking: (state, action: PayloadAction<{ id: string; updates: Partial<OfflineBooking> }>) => {
      const index = state.offlineBookings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.offlineBookings[index] = { ...state.offlineBookings[index], ...action.payload.updates };
      }
    },
    removeOfflineBooking: (state, action: PayloadAction<string>) => {
      state.offlineBookings = state.offlineBookings.filter(b => b.id !== action.payload);
    },
    addPendingUpload: (state, action: PayloadAction<string>) => {
      if (!state.pendingUploads.includes(action.payload)) {
        state.pendingUploads.push(action.payload);
      }
    },
    removePendingUpload: (state, action: PayloadAction<string>) => {
      state.pendingUploads = state.pendingUploads.filter(id => id !== action.payload);
    },
    addSyncError: (state, action: PayloadAction<string>) => {
      state.syncErrors.push(action.payload);
      
      // Keep only last 10 errors
      if (state.syncErrors.length > 10) {
        state.syncErrors = state.syncErrors.slice(-10);
      }
    },
    clearSyncErrors: (state) => {
      state.syncErrors = [];
    },
    setAutoSync: (state, action: PayloadAction<boolean>) => {
      state.autoSyncEnabled = action.payload;
    },
    setDataSaver: (state, action: PayloadAction<boolean>) => {
      state.dataSaver = action.payload;
    },
    cleanExpiredCache: (state) => {
      const now = new Date().toISOString();
      const validCache = state.cachedData.filter(item => item.expiresAt > now);
      
      if (validCache.length !== state.cachedData.length) {
        state.cachedData = validCache;
        state.cacheSize = validCache.reduce((size, item) => {
          return size + JSON.stringify(item.data).length;
        }, 0);
      }
    },
  },
  extraReducers: (builder) => {
    // Sync offline data
    builder
      .addCase(syncOfflineData.pending, (state) => {
        state.syncInProgress = true;
      })
      .addCase(syncOfflineData.fulfilled, (state, action) => {
        state.syncInProgress = false;
        state.lastSyncAt = new Date().toISOString();
        
        // Remove synced actions
        action.payload.syncedActionIds.forEach(id => {
          state.queuedActions = state.queuedActions.filter(a => a.id !== id);
        });
        
        // Update failed actions
        action.payload.failedActions.forEach(failed => {
          const index = state.queuedActions.findIndex(a => a.id === failed.id);
          if (index !== -1) {
            state.queuedActions[index].status = 'failed';
            state.queuedActions[index].error = failed.error;
            state.queuedActions[index].retries += 1;
          }
        });
      })
      .addCase(syncOfflineData.rejected, (state, action) => {
        state.syncInProgress = false;
        state.syncErrors.push(action.payload as string);
      });

    // Upload pending data
    builder
      .addCase(uploadPendingData.pending, (state) => {
        state.syncInProgress = true;
      })
      .addCase(uploadPendingData.fulfilled, (state, action) => {
        state.syncInProgress = false;
        
        // Remove uploaded items
        action.payload.uploadedIds.forEach(id => {
          state.pendingUploads = state.pendingUploads.filter(uploadId => uploadId !== id);
        });
      })
      .addCase(uploadPendingData.rejected, (state, action) => {
        state.syncInProgress = false;
        state.syncErrors.push(action.payload as string);
      });

    // Retry failed actions
    builder
      .addCase(retryFailedActions.fulfilled, (state, action) => {
        // Update action statuses based on retry results
        action.payload.results.forEach(result => {
          const index = state.queuedActions.findIndex(a => a.id === result.id);
          if (index !== -1) {
            if (result.success) {
              state.queuedActions.splice(index, 1); // Remove successful actions
            } else {
              state.queuedActions[index].retries += 1;
              state.queuedActions[index].error = result.error;
              
              // Mark as failed if max retries reached
              if (state.queuedActions[index].retries >= state.queuedActions[index].maxRetries) {
                state.queuedActions[index].status = 'failed';
              }
            }
          }
        });
      });

    // Clear cache
    builder
      .addCase(clearCache.fulfilled, (state, action) => {
        if (action.payload) {
          // Clear specific type
          state.cachedData = state.cachedData.filter(item => item.type !== action.payload);
        } else {
          // Clear all cache
          state.cachedData = [];
        }
        
        // Recalculate cache size
        state.cacheSize = state.cachedData.reduce((size, item) => {
          return size + JSON.stringify(item.data).length;
        }, 0);
      });
  },
});

export const {
  setOnlineStatus,
  queueAction,
  removeQueuedAction,
  updateQueuedAction,
  cacheData,
  removeCachedData,
  addOfflineBooking,
  updateOfflineBooking,
  removeOfflineBooking,
  addPendingUpload,
  removePendingUpload,
  addSyncError,
  clearSyncErrors,
  setAutoSync,
  setDataSaver,
  cleanExpiredCache,
} = offlineSlice.actions;

export default offlineSlice.reducer;