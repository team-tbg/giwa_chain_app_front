/**
 * 혜택 탭 — 포인트 버는 활동 모음 (v10 BENEFITS).
 * 미니게임/퀴즈/뽑기 등 상세 화면은 후속 포팅 대상 → 지금은 정직하게 "준비 중" 안내.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { notify } from '../lib/alert';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Screen } from '../components/Screen';
import { colors, radii, cardShadow, typography } from '../theme/theme';
import { useAppState } from '../state/AppState';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Route = 'Attendance' | 'Bonus';
type Item = { emoji: string; bg: string; title: string; desc: string; route?: Route };

const ITEMS: Item[] = [
  { emoji: '📅', bg: colors.primarySoft, title: '출석체크', desc: '7일 연속 출석해 보세요', route: 'Attendance' },
  { emoji: '💰', bg: colors.goldSoft, title: '오늘의 보너스', desc: '6시간마다 한 번, 최대 300P를 받아요', route: 'Bonus' },
  { emoji: '🧠', bg: '#FDECEC', title: 'OX 금융퀴즈', desc: '하루 5문제, 맞히면 5P를 받아요' },
  { emoji: '📺', bg: '#FDECEC', title: '영상 보고 받기', desc: '짧은 영상을 보고 포인트를 받아요' },
  { emoji: '🎮', bg: colors.rewardSoft, title: '게임하고 받기', desc: '20초 동안 포인트를 모아봐요' },
  { emoji: '🎁', bg: '#F0E8FE', title: '나드리 뽑기', desc: '100P로 한 번 뽑아요' },
  { emoji: '🎡', bg: '#FFE8D5', title: '행운 룰렛', desc: '하루 1번, 최대 50P를 받아요' },
  { emoji: '📝', bg: colors.primarySoft, title: '설문 참여', desc: '5분이면 끝나요. 마치면 300P' },
  { emoji: '👥', bg: colors.rewardSoft, title: '친구 초대', desc: '초대하면 나도 친구도 500P' },
];

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Benefit'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function BenefitScreen({ navigation }: Props) {
  const { attToday } = useAppState();
  // 완료 표시는 앱이 실제로 '오늘 완료'를 아는 항목만 (지금은 출석체크). 나머지는 준비 중이라 그대로.
  const isDone = (it: Item) => it.title === '출석체크' && attToday;
  const open = (it: Item) => {
    if (it.route) navigation.navigate(it.route);
    else notify(it.title, '곧 만나요. 준비 중이에요.');
  };
  return (
    <Screen scroll={false}>
      <Text style={styles.h1}>혜택</Text>
      <Text style={styles.sub}>누르면 포인트를 모을 수 있어요</Text>
      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {ITEMS.map((it) => (
          <Pressable key={it.title} style={styles.row} onPress={() => open(it)}>
            <View style={[styles.ic, { backgroundColor: it.bg }]}><Text style={styles.emoji}>{it.emoji}</Text></View>
            <View style={styles.flex1}>
              <Text style={styles.title}>{it.title}</Text>
              <Text style={styles.desc}>{it.desc}</Text>
            </View>
            {isDone(it)
              ? <View style={styles.okChip}><Text style={styles.okChipTxt}>완료</Text></View>
              : <Text style={styles.go}>›</Text>}
          </Pressable>
        ))}
        <Text style={styles.hint}>완료한 항목은 내일 다시 열려요</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.display, color: colors.ink, marginTop: 6 },
  sub: { ...typography.body, color: colors.muted, marginTop: 4, marginBottom: 12 },
  listScroll: { flex: 1 },
  list: { paddingBottom: 24, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 18, padding: 15, ...cardShadow,
  },
  ic: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 21 },
  flex1: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  desc: { fontSize: 12.5, fontWeight: '600', color: colors.muted, marginTop: 2 },
  go: { fontSize: 20, color: colors.dim },
  okChip: { backgroundColor: colors.rewardSoft, borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 11 },
  okChipTxt: { fontSize: 12, fontWeight: '800', color: colors.rewardDeep },
  hint: { fontSize: 12.5, fontWeight: '700', color: colors.muted, textAlign: 'center', marginTop: 10 },
});
