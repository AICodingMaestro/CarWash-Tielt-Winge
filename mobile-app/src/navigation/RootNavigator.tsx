import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { authService } from '../services/authService';
import { setToken } from '../store/slices/authSlice';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingScreen from '../components/LoadingScreen';

const Stack = createStackNavigator();

const RootNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const [initializing, setInitializing] = React.useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await authService.getStoredToken();
      const user = await authService.getStoredUser();
      
      if (token && user) {
        // Verify token is still valid
        const isValid = await authService.checkAuthStatus();
        if (isValid) {
          const refreshToken = await authService.getStoredToken();
          dispatch(setToken({ token, refreshToken: refreshToken || '' }));
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setInitializing(false);
    }
  };

  if (initializing || isLoading) {
    return <LoadingScreen message="Initialiseren..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;