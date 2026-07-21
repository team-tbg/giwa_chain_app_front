/** 루트 스택: 온보딩 → 메인 탭 → 불리기 전환 플로우 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MainTabs } from './MainTabs';
import { BoostIntroScreen } from '../screens/boost/BoostIntroScreen';
import { BoostDashboardScreen } from '../screens/boost/BoostDashboardScreen';
import { WithdrawMomentScreen } from '../screens/boost/WithdrawMomentScreen';
import { PrincipalScreen } from '../screens/boost/PrincipalScreen';
import { DoneScreen } from '../screens/boost/DoneScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Group screenOptions={{ presentation: 'card' }}>
        <Stack.Screen name="BoostIntro" component={BoostIntroScreen} />
        <Stack.Screen name="BoostDashboard" component={BoostDashboardScreen} />
        <Stack.Screen name="WithdrawMoment" component={WithdrawMomentScreen} />
        <Stack.Screen name="Principal" component={PrincipalScreen} />
        <Stack.Screen name="Done" component={DoneScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
