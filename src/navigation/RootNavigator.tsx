/** 루트 스택: 온보딩 → 로그인 → 메인 6탭 + 원화 예치 플로우 */
import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { MainTabs } from './MainTabs';
import { DepositScreen } from '../screens/DepositScreen';
import { GrowScreen } from '../screens/GrowScreen';
import { AttendanceScreen } from '../screens/benefit/AttendanceScreen';
import { BonusScreen } from '../screens/benefit/BonusScreen';
import { QuizScreen } from '../screens/benefit/QuizScreen';
import { useAppState } from '../state/AppState';
import { colors } from '../theme/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, authReady } = useAppState();

  // 저장된 세션 복원 검사 전엔 초기 라우트를 확정하지 않는다(로그인 화면 깜빡임 방지).
  if (!authReady) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <Stack.Navigator initialRouteName={user ? 'Main' : 'Onboarding'} screenOptions={{ headerShown: false }}>
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
