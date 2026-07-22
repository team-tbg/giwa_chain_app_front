/** 하단 6탭 (v10): 홈 / 혜택 / 이자받기 / 포인트샵 / 내 지갑 / 내정보 */
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { BenefitScreen } from '../screens/BenefitScreen';
import { InterestScreen } from '../screens/InterestScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const icon = (emoji: string) => ({ color }: { color: string }) =>
  <Text style={{ fontSize: 19, color }}>{emoji}</Text>;

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.dim,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 74,
          paddingTop: 8,
          paddingBottom: 14,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈', tabBarIcon: icon('🏠') }} />
      <Tab.Screen name="Benefit" component={BenefitScreen} options={{ title: '혜택', tabBarIcon: icon('🎁') }} />
      <Tab.Screen name="Interest" component={InterestScreen} options={{ title: '이자받기', tabBarIcon: icon('🌱') }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ title: '포인트샵', tabBarIcon: icon('🛍️') }} />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ title: '내 지갑', tabBarIcon: icon('👛') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '내정보', tabBarIcon: icon('👤') }} />
    </Tab.Navigator>
  );
}
