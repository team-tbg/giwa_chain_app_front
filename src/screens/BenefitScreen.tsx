/**
 * 혜택 탭 — 포인트 버는 활동 모음 (v10 BENEFITS).
 * 미니게임/퀴즈/뽑기 등 상세 화면은 후속 포팅 대상 → 지금은 정직하게 "준비 중" 안내.
 */
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { colors, radii, cardShadow, typography } from '../theme/theme';

type Item = { emoji: string; bg: string; title: string; desc: string };

const ITEMS: Item[] = [
  { emoji: '📅', bg: colors.primarySoft, title: '출석체크', desc: '7일 연속 출석해 보세요' },
  { emoji: '💰', bg: colors.goldSoft, title: '오늘의 보너스', desc: '6시간마다 한 번, 최대 300P를 받아요' },
  { emoji: '📺', bg: '#FDECEC', title: '영상 보고 받기', desc: '짧은 영상을 보고 포인트를 받아요' },
  { emoji: '🎮', bg: colors.rewardSoft, title: '게임하고 받기', desc: '20초 동안 포인트를 모아봐요' },
  { emoji: '🎁', bg: '#F0E8FE', title: '나드리 뽑기', desc: '100P로 한 번 뽑아요' },
  { emoji: '🎡', bg: '#FFE8D5', title: '행운 룰렛', desc: '하루 1번, 최대 50P를 받아요' },
  { emoji: '🧠', bg: '#FDECEC', title: 'OX 금융퀴즈', desc: '하루 5문제, 맞히면 5P를 받아요' },
  { emoji: '📝', bg: colors.primarySoft, title: '설문 참여', desc: '5분이면 끝나요. 마치면 300P' },
  { emoji: '👥', bg: colors.rewardSoft, title: '친구 초대', desc: '초대하면 나도 친구도 500P' },
];

export function BenefitScreen() {
  const open = (t: string) => Alert.alert(t, '곧 만나요. 준비 중이에요.');
  return (
    <Screen scroll={false}>
      <Text style={styles.h1}>혜택</Text>
      <Text style={styles.sub}>걸음 말고도 포인트 버는 방법이 많아요</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {ITEMS.map((it) => (
          <Pressable key={it.title} style={styles.row} onPress={() => open(it.title)}>
            <View style={[styles.ic, { backgroundColor: it.bg }]}><Text style={styles.emoji}>{it.emoji}</Text></View>
            <View style={styles.flex1}>
              <Text style={styles.title}>{it.title}</Text>
              <Text style={styles.desc}>{it.desc}</Text>
            </View>
            <Text style={styles.go}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.display, color: colors.ink, marginTop: 6 },
  sub: { ...typography.body, color: colors.muted, marginTop: 4, marginBottom: 12 },
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
});
