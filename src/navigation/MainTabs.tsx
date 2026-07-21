/** 하단 탭: 홈 / 불리기 / 내 정보 */
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { BoostTabScreen } from '../screens/BoostTabScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const icon = (emoji: string) => ({ color }: { color: string }) =>
  <Text style={{ fontSize: 21, color }}>{emoji}</Text>;

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.mint,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          height: 76,
          paddingTop: 8,
          paddingBottom: 16,
        },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '700' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈', tabBarIcon: icon('🏠') }} />
      <Tab.Screen name="Boost" component={BoostTabScreen} options={{ title: '불리기', tabBarIcon: icon('✨') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '내 정보', tabBarIcon: icon('👤') }} />
    </Tab.Navigator>
  );
}
