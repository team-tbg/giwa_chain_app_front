/**
 * 내정보 탭 (v10 me) — 프로필 · 초대 · 푸시 알림 · 내 활동 · 고객 지원 · 로그아웃.
 * 규칙: 출금은 언제든 열려 있음(내 지갑으로 접근). 로그아웃 원탭.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { notify } from '../lib/alert';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Screen } from '../components/Screen';
import { colors, radii, cardShadow, typography } from '../theme/theme';
import { useAppState, won, fmtP, netWorth } from '../state/AppState';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProfileScreen({ navigation }: Props) {
  const s = useAppState();
  const { user, points, streak, todayEarned, refUsed, push, togglePush, logout } = s;

  const onLogout = () => {
    logout();
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };
  const soon = (t: string) => notify(t, '준비 중이에요.');

  return (
    <Screen>
      <Text style={styles.h1}>내정보</Text>

      {/* 프로필 */}
      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarEmoji}>🙂</Text></View>
        <View style={styles.flex1}>
          <Text style={styles.name}>{user?.name ?? '나드리회원'}님</Text>
          <Text style={styles.pts}>쓸 수 있는 포인트 {fmtP(points)}P</Text>
        </View>
        <Pressable style={styles.editBtn} onPress={() => soon('닉네임 수정')}>
          <Text style={styles.editTxt}>수정</Text>
        </Pressable>
      </View>

      <Section title="초대">
        <MenuItem label="친구 초대하기" right="500P" onPress={() => soon('친구 초대')} />
        <MenuItem label="추천인 코드 입력" right={refUsed ? '등록됨' : '미등록'} onPress={() => soon('추천인 코드')} last />
      </Section>

      <Section title="알림">
        <View style={styles.item}>
          <Text style={styles.itemLabel}>푸시 알림</Text>
          <Toggle on={push} onPress={togglePush} />
        </View>
      </Section>

      <Section title="내 활동">
        <MenuItem label="내 활동 기록" right={`오늘 ${fmtP(todayEarned)}P`} onPress={() => soon('활동 기록')} />
        <MenuItem label="내 지갑" right={won(netWorth(s))} onPress={() => navigation.navigate('Wallet')} />
        <MenuItem label="보유 배지" right={`🔥 ${streak}일`} onPress={() => soon('배지')} last />
      </Section>

      <Section title="고객 지원">
        <MenuItem label="공지사항" onPress={() => soon('공지사항')} />
        <MenuItem label="자주 묻는 질문" onPress={() => soon('자주 묻는 질문')} />
        <MenuItem label="고객센터" onPress={() => soon('고객센터')} />
        <MenuItem label="약관 및 정책" onPress={() => soon('약관 및 정책')} />
        <MenuItem label="버전 정보" right="1.0.0" onPress={() => soon('버전 정보')} last />
      </Section>

      <Pressable style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </Pressable>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Text style={styles.sect}>{title}</Text>
      <View style={styles.list}>{children}</View>
    </>
  );
}

function MenuItem({ label, right, onPress, last }: { label: string; right?: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable style={[styles.item, !last && styles.itemBorder]} onPress={onPress}>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.itemRight}>{right ?? '›'}</Text>
    </Pressable>
  );
}

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.switch, on && styles.switchOn]}>
      <View style={[styles.knob, on && styles.knobOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.display, color: colors.ink, marginTop: 6, marginBottom: 14 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: radii.lg, padding: 18, ...cardShadow },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 26 },
  flex1: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
  pts: { fontSize: 12.5, fontWeight: '700', color: colors.muted, marginTop: 4 },
  editBtn: { backgroundColor: colors.primarySoft, borderRadius: 11, paddingVertical: 9, paddingHorizontal: 14 },
  editTxt: { fontSize: 13, fontWeight: '800', color: colors.primaryDeep },

  sect: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: 22, marginBottom: 8 },
  list: { backgroundColor: colors.surface, borderRadius: 18, ...cardShadow, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  itemLabel: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  itemRight: { fontSize: 13, fontWeight: '600', color: colors.dim },

  switch: { width: 48, height: 28, borderRadius: 999, backgroundColor: '#DDE1E9', padding: 3, justifyContent: 'center' },
  switchOn: { backgroundColor: colors.reward },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  knobOn: { alignSelf: 'flex-end' },

  logout: { alignItems: 'center', paddingVertical: 20, marginTop: 10 },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.muted },
});
