import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import slices
import authSlice from './slices/authSlice';
import bookingSlice from './slices/bookingSlice';
import serviceSlice from './slices/serviceSlice';
import loyaltySlice from './slices/loyaltySlice';
import notificationSlice from './slices/notificationSlice';
import offlineSlice from './slices/offlineSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'loyalty', 'offline'], // Only persist these reducers
  blacklist: ['notification'], // Don't persist notifications
};

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  booking: bookingSlice,
  service: serviceSlice,
  loyalty: loyaltySlice,
  notification: notificationSlice,
  offline: offlineSlice,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__,
});

// Persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;