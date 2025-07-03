import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_COLOR, GRAY_400, WHITE } from '../utils/colors';

// Import navigators and screens
import HomeNavigator from './HomeNavigator';
import ServicesNavigator from './ServicesNavigator';
import BookingsNavigator from './BookingsNavigator';
import LoyaltyNavigator from './LoyaltyNavigator';
import ProfileNavigator from './ProfileNavigator';

export type MainTabParamList = {
  HomeTab: undefined;
  ServicesTab: undefined;
  BookingsTab: undefined;
  LoyaltyTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'HomeTab':
              iconName = 'home';
              break;
            case 'ServicesTab':
              iconName = 'local-car-wash';
              break;
            case 'BookingsTab':
              iconName = 'event';
              break;
            case 'LoyaltyTab':
              iconName = 'stars';
              break;
            case 'ProfileTab':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: PRIMARY_COLOR,
        tabBarInactiveTintColor: GRAY_400,
        tabBarStyle: {
          backgroundColor: WHITE,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="ServicesTab"
        component={ServicesNavigator}
        options={{
          tabBarLabel: 'Diensten',
        }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsNavigator}
        options={{
          tabBarLabel: 'Boekingen',
        }}
      />
      <Tab.Screen
        name="LoyaltyTab"
        component={LoyaltyNavigator}
        options={{
          tabBarLabel: 'Voordelen',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profiel',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;