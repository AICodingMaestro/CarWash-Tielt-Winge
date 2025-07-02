import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PRIMARY_COLOR, WHITE } from '../utils/colors';

// Screens (to be created)
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import PrivacyScreen from '../screens/profile/PrivacyScreen';
import HelpScreen from '../screens/profile/HelpScreen';
import AboutScreen from '../screens/profile/AboutScreen';

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  Privacy: undefined;
  Help: undefined;
  About: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

const ProfileNavigator: React.FC = () => {
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
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Mijn Profiel',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Profiel Bewerken',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Instellingen',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          title: 'Wachtwoord Wijzigen',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          title: 'Privacy & Gegevens',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{
          title: 'Help & Ondersteuning',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'Over de App',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;