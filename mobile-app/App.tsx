import React, { useEffect } from 'react';
import { StatusBar, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import messaging from '@react-native-firebase/messaging';
import { StripeProvider } from '@stripe/stripe-react-native';
import Config from 'react-native-config';

import { store, persistor } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import LoadingScreen from './src/components/LoadingScreen';
import { initializeI18n } from './src/locales/i18n';
import { requestUserPermission, notificationListener } from './src/services/notifications';
import { PRIMARY_COLOR } from './src/utils/colors';

// Initialize i18n
initializeI18n();

const App: React.FC = () => {
  useEffect(() => {
    // Initialize push notifications
    initializeNotifications();
    
    // Handle background/quit state messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });
  }, []);

  const initializeNotifications = async () => {
    // Request permission for push notifications
    await requestUserPermission();
    
    // Listen for notifications
    notificationListener();
    
    // Handle notification when app is opened from background
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      handleNotificationNavigation(remoteMessage);
    });

    // Handle notification when app is opened from quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          handleNotificationNavigation(remoteMessage);
        }
      });
  };

  const handleNotificationNavigation = (remoteMessage: any) => {
    // Handle navigation based on notification data
    if (remoteMessage?.data?.type === 'booking_reminder') {
      // Navigate to bookings screen
    } else if (remoteMessage?.data?.type === 'promotion') {
      // Navigate to services screen
    }
  };

  return (
    <StripeProvider publishableKey={Config.STRIPE_PUBLISHABLE_KEY || ''}>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <NavigationContainer>
            <StatusBar
              barStyle="light-content"
              backgroundColor={PRIMARY_COLOR}
              translucent={false}
            />
            <RootNavigator />
          </NavigationContainer>
        </PersistGate>
      </Provider>
    </StripeProvider>
  );
};

export default App;