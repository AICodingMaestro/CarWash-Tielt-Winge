import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PRIMARY_COLOR, WHITE } from '../utils/colors';

// Screens (to be created)
import LoyaltyScreen from '../screens/loyalty/LoyaltyScreen';
import RewardsScreen from '../screens/loyalty/RewardsScreen';
import RewardDetailScreen from '../screens/loyalty/RewardDetailScreen';
import PointsHistoryScreen from '../screens/loyalty/PointsHistoryScreen';
import ReferralScreen from '../screens/loyalty/ReferralScreen';

export type LoyaltyStackParamList = {
  Loyalty: undefined;
  Rewards: undefined;
  RewardDetail: { rewardId: string };
  PointsHistory: undefined;
  Referral: undefined;
};

const Stack = createStackNavigator<LoyaltyStackParamList>();

const LoyaltyNavigator: React.FC = () => {
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
        name="Loyalty"
        component={LoyaltyScreen}
        options={{
          title: 'Loyalteitsprogramma',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          title: 'Beschikbare Beloningen',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="RewardDetail"
        component={RewardDetailScreen}
        options={{
          title: 'Beloning Details',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="PointsHistory"
        component={PointsHistoryScreen}
        options={{
          title: 'Punten Geschiedenis',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Referral"
        component={ReferralScreen}
        options={{
          title: 'Vrienden Uitnodigen',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default LoyaltyNavigator;