import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PRIMARY_COLOR, WHITE } from '../utils/colors';

// Screens (to be created)
import HomeScreen from '../screens/home/HomeScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import LocationScreen from '../screens/home/LocationScreen';

export type HomeStackParamList = {
  Home: undefined;
  Notifications: undefined;
  Location: undefined;
};

const Stack = createStackNavigator<HomeStackParamList>();

const HomeNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: PRIMARY_COLOR,
        },
        headerTintColor: WHITE,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: {
          backgroundColor: WHITE,
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'CarWash Tielt-Winge',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Meldingen',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Location"
        component={LocationScreen}
        options={{
          title: 'Locatie',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeNavigator;