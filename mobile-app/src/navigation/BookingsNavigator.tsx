import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PRIMARY_COLOR, WHITE } from '../utils/colors';

// Screens (to be created)
import BookingsScreen from '../screens/bookings/BookingsScreen';
import BookingDetailScreen from '../screens/bookings/BookingDetailScreen';
import RescheduleScreen from '../screens/bookings/RescheduleScreen';
import BookingHistoryScreen from '../screens/bookings/BookingHistoryScreen';
import VehiclesScreen from '../screens/bookings/VehiclesScreen';

export type BookingsStackParamList = {
  Bookings: undefined;
  BookingDetail: { bookingId: string };
  Reschedule: { bookingId: string };
  BookingHistory: undefined;
  Vehicles: undefined;
};

const Stack = createStackNavigator<BookingsStackParamList>();

const BookingsNavigator: React.FC = () => {
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
        name="Bookings"
        component={BookingsScreen}
        options={{
          title: 'Mijn Boekingen',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
        options={{
          title: 'Boeking Details',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Reschedule"
        component={RescheduleScreen}
        options={{
          title: 'Verzetten',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="BookingHistory"
        component={BookingHistoryScreen}
        options={{
          title: 'Geschiedenis',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Vehicles"
        component={VehiclesScreen}
        options={{
          title: 'Mijn Voertuigen',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default BookingsNavigator;