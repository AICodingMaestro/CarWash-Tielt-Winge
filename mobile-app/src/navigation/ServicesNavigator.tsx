import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PRIMARY_COLOR, WHITE } from '../utils/colors';

// Screens (to be created)
import ServicesScreen from '../screens/services/ServicesScreen';
import ServiceDetailScreen from '../screens/services/ServiceDetailScreen';
import BookingScreen from '../screens/services/BookingScreen';
import BookingConfirmationScreen from '../screens/services/BookingConfirmationScreen';
import PaymentScreen from '../screens/services/PaymentScreen';

export type ServicesStackParamList = {
  Services: undefined;
  ServiceDetail: { serviceId: string };
  Booking: { serviceId: string };
  BookingConfirmation: { bookingId: string };
  Payment: { bookingId: string; amount: number };
};

const Stack = createStackNavigator<ServicesStackParamList>();

const ServicesNavigator: React.FC = () => {
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
        name="Services"
        component={ServicesScreen}
        options={{
          title: 'Onze Diensten',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{
          title: 'Service Details',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{
          title: 'Reserveren',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
        options={{
          title: 'Bevestiging',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          title: 'Betaling',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default ServicesNavigator;