/**
 * 하단 탭 "내 정보" — 계정 요약 + 설정 메뉴.
 * 규칙: 크립토·지갑 용어 노출 없음. 출금은 언제든 열려 있음(메뉴로 접근).
 */
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Screen } from '../components/Screen';
import { Amount, Card, Row } from '../components/ui';
import { colors, radii, typography } from '../theme/theme';
import { useAppState, won } from '../state/AppState';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

const providerLabel = (p?: string) =>
  p === 'google' ? 'Google 계정으로 로그인' : p === 'toss' ? '토스 계정으로 로그인' : '';

const MENU = ['알림 설정', '출금 계좌 관리', '자주 묻는 질문', '고객센터'];

export function ProfileScreen({ navigation }: Props) {
  const { user, balance, boostedAmount, growth, logout } = useAppState();

  const onLogout = () => {
    logout();
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

  return (
    <Screen>
      <Text style={styles.h1}>내 정보</Text>

      {/* 계정 */}
      <Card>
        <Row>
          <View style={styles.flex1}>
            <Text style={styles.name}>{user?.name ?? '회원'}님</Text>
            <Text style={styles.phone}>{providerLabel(user?.provider)}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? '나').slice(0, 1)}</Text>
          </View>
        </Row>
      </Card>

      {/* 자산 요약 */}
      <Card style={styles.mt}>
        <Row>
          <Text style={styles.label}>모은 리워드</Text>
          <Amount value={won(balance)} size={22} />
        </Row>
        <View style={styles.divider} />
        <Row>
          <Text style={styles.label}>불리는 중</Text>
          <Amount value={won(boostedAmount + growth)} color={colors.reward} size={22} />
        </Row>
      </Card>

      {/* 메뉴 */}
      <Card flat style={styles.mt}>
        {MENU.map((m, i) => (
          <Pressable
            key={m}
            accessibilityRole="button"
            onPress={() => Alert.alert(m, '준비 중이에요.')}
            style={[styles.menuItem, i < MENU.length - 1 && styles.menuBorder]}
          >
            <Text style={styles.menuText}>{m}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </Card>

      <Pressable accessibilityRole="button" onPress={onLogout} style={styles.logout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.display, color: colors.ink, marginTop: 6, marginBottom: 16 },
  flex1: { flex: 1 },
  name: { ...typography.heading, color: colors.ink },
  phone: { ...typography.body, color: colors.muted, marginTop: 4 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.primary },
  mt: { marginTop: 14 },
  label: { ...typography.body, color: colors.muted, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 14 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  menuText: { ...typography.body, color: colors.ink, fontWeight: '600' },
  chevron: { fontSize: 22, color: colors.muted },
  logout: { alignItems: 'center', paddingVertical: 20, marginTop: 6 },
  logoutText: { ...typography.body, color: colors.muted, fontWeight: '700' },
});
