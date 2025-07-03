import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { QueuedAction, CachedData, OfflineBooking } from '../store/slices/offlineSlice';

class OfflineServiceClass {
  private readonly CACHE_PREFIX = 'carwash_cache_';
  private readonly QUEUE_KEY = 'carwash_queue';
  private readonly OFFLINE_BOOKINGS_KEY = 'carwash_offline_bookings';

  async isOnline(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected && netInfo.isInternetReachable;
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  }

  async syncData(queuedActions: QueuedAction[]): Promise<{
    syncedActionIds: string[];
    failedActions: { id: string; error: string }[];
  }> {
    const syncedActionIds: string[] = [];
    const failedActions: { id: string; error: string }[] = [];

    for (const action of queuedActions) {
      try {
        await this.processQueuedAction(action);
        syncedActionIds.push(action.id);
      } catch (error: any) {
        failedActions.push({
          id: action.id,
          error: error.message || 'Unknown sync error',
        });
      }
    }

    // Clear synced actions from storage
    if (syncedActionIds.length > 0) {
      await this.removeQueuedActions(syncedActionIds);
    }

    return { syncedActionIds, failedActions };
  }

  async uploadPendingData(pendingUploads: string[]): Promise<{
    uploadedIds: string[];
    failedIds: string[];
  }> {
    const uploadedIds: string[] = [];
    const failedIds: string[] = [];

    for (const uploadId of pendingUploads) {
      try {
        await this.processUpload(uploadId);
        uploadedIds.push(uploadId);
      } catch (error) {
        console.error(`Failed to upload ${uploadId}:`, error);
        failedIds.push(uploadId);
      }
    }

    return { uploadedIds, failedIds };
  }

  async retryActions(failedActions: QueuedAction[]): Promise<{
    results: { id: string; success: boolean; error?: string }[];
  }> {
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const action of failedActions) {
      try {
        await this.processQueuedAction(action);
        results.push({ id: action.id, success: true });
      } catch (error: any) {
        results.push({
          id: action.id,
          success: false,
          error: error.message || 'Retry failed',
        });
      }
    }

    return { results };
  }

  async clearCache(type?: string): Promise<void> {
    try {
      if (type) {
        // Clear specific cache type
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => 
          key.startsWith(this.CACHE_PREFIX) && 
          key.includes(`_${type}_`)
        );
        await AsyncStorage.multiRemove(cacheKeys);
      } else {
        // Clear all cache
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw new Error('Failed to clear cache');
    }
  }

  async cacheData(data: CachedData): Promise<void> {
    try {
      const key = `${this.CACHE_PREFIX}${data.type}_${data.key}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching data:', error);
      throw new Error('Failed to cache data');
    }
  }

  async getCachedData(type: string, key: string): Promise<CachedData | null> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${type}_${key}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const data: CachedData = JSON.parse(cached);
      
      // Check if cache is expired
      if (new Date(data.expiresAt) < new Date()) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  async queueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<void> {
    try {
      const queuedAction: QueuedAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retries: 0,
        status: 'pending',
        ...action,
      };

      const existingQueue = await this.getQueuedActions();
      existingQueue.push(queuedAction);
      
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(existingQueue));
    } catch (error) {
      console.error('Error queuing action:', error);
      throw new Error('Failed to queue action');
    }
  }

  async getQueuedActions(): Promise<QueuedAction[]> {
    try {
      const queue = await AsyncStorage.getItem(this.QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting queued actions:', error);
      return [];
    }
  }

  async removeQueuedActions(actionIds: string[]): Promise<void> {
    try {
      const queue = await this.getQueuedActions();
      const updatedQueue = queue.filter(action => !actionIds.includes(action.id));
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Error removing queued actions:', error);
      throw new Error('Failed to remove queued actions');
    }
  }

  async saveOfflineBooking(booking: Omit<OfflineBooking, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const offlineBooking: OfflineBooking = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        status: 'draft',
        ...booking,
      };

      const existingBookings = await this.getOfflineBookings();
      existingBookings.push(offlineBooking);
      
      await AsyncStorage.setItem(this.OFFLINE_BOOKINGS_KEY, JSON.stringify(existingBookings));
      return offlineBooking.id;
    } catch (error) {
      console.error('Error saving offline booking:', error);
      throw new Error('Failed to save offline booking');
    }
  }

  async getOfflineBookings(): Promise<OfflineBooking[]> {
    try {
      const bookings = await AsyncStorage.getItem(this.OFFLINE_BOOKINGS_KEY);
      return bookings ? JSON.parse(bookings) : [];
    } catch (error) {
      console.error('Error getting offline bookings:', error);
      return [];
    }
  }

  async updateOfflineBooking(id: string, updates: Partial<OfflineBooking>): Promise<void> {
    try {
      const bookings = await this.getOfflineBookings();
      const index = bookings.findIndex(booking => booking.id === id);
      
      if (index !== -1) {
        bookings[index] = { ...bookings[index], ...updates };
        await AsyncStorage.setItem(this.OFFLINE_BOOKINGS_KEY, JSON.stringify(bookings));
      }
    } catch (error) {
      console.error('Error updating offline booking:', error);
      throw new Error('Failed to update offline booking');
    }
  }

  async removeOfflineBooking(id: string): Promise<void> {
    try {
      const bookings = await this.getOfflineBookings();
      const updatedBookings = bookings.filter(booking => booking.id !== id);
      await AsyncStorage.setItem(this.OFFLINE_BOOKINGS_KEY, JSON.stringify(updatedBookings));
    } catch (error) {
      console.error('Error removing offline booking:', error);
      throw new Error('Failed to remove offline booking');
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += JSON.stringify(value).length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  async cleanupExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      const now = new Date();
      
      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          try {
            const data: CachedData = JSON.parse(cached);
            if (new Date(data.expiresAt) < now) {
              await AsyncStorage.removeItem(key);
            }
          } catch (error) {
            // Invalid cache data, remove it
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired cache:', error);
    }
  }

  private async processQueuedAction(action: QueuedAction): Promise<void> {
    // This would contain logic to process different types of queued actions
    // For example: API calls, data uploads, etc.
    console.log('Processing queued action:', action);
    
    // Simulate processing based on action type
    switch (action.type) {
      case 'CREATE_BOOKING':
        // Process booking creation
        break;
      case 'UPDATE_PROFILE':
        // Process profile update
        break;
      case 'REDEEM_REWARD':
        // Process reward redemption
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async processUpload(uploadId: string): Promise<void> {
    // This would contain logic to upload pending files/data
    console.log('Processing upload:', uploadId);
    
    // Simulate upload process
    // In real implementation, this would handle file uploads, image uploads, etc.
  }

  async initializeOfflineSupport(): Promise<void> {
    try {
      // Clean up expired cache on initialization
      await this.cleanupExpiredCache();
      
      // Set up network state monitoring
      NetInfo.addEventListener(state => {
        console.log('Network state changed:', state);
        // Dispatch network state changes to Redux store
      });
      
    } catch (error) {
      console.error('Error initializing offline support:', error);
    }
  }
}

export const offlineService = new OfflineServiceClass();
export default offlineService;