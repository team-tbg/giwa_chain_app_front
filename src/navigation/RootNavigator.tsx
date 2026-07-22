/** 루트 스택: 온보딩 → 로그인 → 메인 6탭 + 원화 예치 플로우 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { MainTabs } from './MainTabs';
import { DepositScreen } from '../screens/DepositScreen';
import { GrowScreen } from '../screens/GrowScreen';
import { AttendanceScreen } from '../screens/benefit/AttendanceScreen';
import { BonusScreen } from '../screens/benefit/BonusScreen';
import { QuizScreen } from '../screens/benefit/QuizScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Group screenOptions={{ presentation: 'card' }}>
        <Stack.Screen name="Deposit" component={DepositScreen} />
        <Stack.Screen name="Grow" component={GrowScreen} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        <Stack.Screen name="Bonus" component={BonusScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
