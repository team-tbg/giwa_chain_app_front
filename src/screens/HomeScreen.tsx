/**
 * 1. 홈 · 걷기/적립 (리텐션 엔진) — v10 프로토타입 레이아웃.
 * 구성: 상단바 · 걸음 링 · 걸어서 받을 포인트 · 오늘 모은 포인트 · 자산 스트립 · 퀵 메뉴 · 불리기 배너.
 * 규칙: 퍼센트·풀 노출 금지. 포인트(P)/원 표기. 미구현 화면은 정직하게 "준비 중" 안내.
 */
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { notify } from '../lib/alert';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Screen } from '../components/Screen';
import { ProgressRing } from '../components/ui';
import { colors, radii, cardShadow } from '../theme/theme';
import { DAILY_CAP, useAppState, won, fmtP, claimableP, pTotal, cTotal } from '../state/AppState';
import { usePedometer } from '../hooks/usePedometer';
import { useLocation } from '../hooks/useLocation';
import { useWeather } from '../hooks/useWeather';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const soon = (label: string) =>
  notify(label, '곧 만나요. 지금은 걷고 모으고 불리는 것부터 시작해요.');

export function HomeScreen({ navigation }: Props) {
  const s = useAppState();
  const { user, goal, streak, points, todayEarned, cash, claimSteps, setSteps } = s;
  const ped = usePedometer();
  const loc = useLocation();
  const weather = useWeather(loc.coords);

  // 걸음수는 프론트(센서)에서 관리 — 측정되면 앱 상태에 반영(DB 저장 안 함).
  useEffect(() => {
    if (ped.available && ped.todaySteps > 0) setSteps(ped.todaySteps);
  }, [ped.available, ped.todaySteps, setSteps]);

  // 위치 상태를 분명히 표시 — GPS로 잡힌 동네인지 폴백인지 구분되게
  const regionText =
    loc.status === 'checking' ? '동네 확인 중…'
      : loc.region ? loc.region
      : loc.status === 'granted' ? '동네 미확인(GPS)'
      : '위치 꺼짐';
  const tempText = weather.tempC != null ? `${weather.tempC.toFixed(1)}°` : '--°';

  // 단일 소스: 앱 상태의 걸음수(측정값 동기화됨). 센서 없으면 데모 기본값.
  const steps = s.steps;
  const prog = useMemo(() => Math.min(1, steps / goal), [steps, goal]);
  const kcal = Math.round(steps * 0.0687);
  const km = (steps * 0.00064).toFixed(1);
  const todayPct = Math.min(100, (todayEarned / DAILY_CAP) * 100);
  const claim = claimableP(s);
  const staked = pTotal(s);
  const asset = cash + cTotal(s);

  return (
    <Screen>
      {/* 상단바 */}
      <View style={styles.topbar}>
        <Pressable style={styles.balancePill} onPress={() => navigation.navigate('Shop')}>
          <View style={styles.coin}><Text style={styles.coinTxt}>P</Text></View>
          <Text style={styles.balanceTxt}>{fmtP(points)}</Text>
        </Pressable>
        <View style={styles.topIcons}>
          <Pressable style={styles.iconBtn} onPress={() => soon('알림')}>
            <Text style={styles.iconEmoji}>🔔</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.iconEmoji}>👤</Text>
          </Pressable>
        </View>
      </View>

      {/* 연속 걷기 · 날씨 */}
      <View style={styles.chipRow}>
        <Pressable style={styles.chip} onPress={() => navigation.navigate('Benefit')}>
          <Text style={styles.chipTxt}>🔥 {streak}일 연속 걷는 중</Text>
        </Pressable>
        <Text style={styles.weather}>{weather.emoji} {regionText} · {tempText}</Text>
      </View>

      {/* 걸음 링 */}
      <View style={styles.hero}>
        <ProgressRing progress={prog}>
          <Text style={styles.ringLab}>오늘의 걸음</Text>
          <Text style={styles.ringNum}>{won(steps)}</Text>
          <Text style={styles.ringGoal}>목표 {won(goal)}</Text>
        </ProgressRing>
        <View style={styles.stat2}>
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{won(kcal)}<Text style={styles.statUnit}> kcal</Text></Text>
            <Text style={styles.statLab}>태운 열량</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{km}<Text style={styles.statUnit}> km</Text></Text>
            <Text style={styles.statLab}>걸은 거리</Text>
          </View>
        </View>
        {__DEV__ && !ped.available && (
          <Pressable style={styles.devSteps} onPress={() => setSteps(steps + 137)}>
            <Text style={styles.devStepsTxt}>🔧 (개발·웹) 걸음 +137 — 센서 없는 환경에서 동적 확인용</Text>
          </Pressable>
        )}
      </View>

      {/* 걸어서 받을 포인트 */}
      <View style={styles.claim}>
        <View style={styles.flex1}>
          <Text style={styles.claimLab}>걸어서 받을 포인트</Text>
          <Text style={styles.claimAmt}>{fmtP(claim)}P</Text>
        </View>
        <Pressable
          style={[styles.claimBtn, claim <= 0 && styles.claimBtnOff]}
          disabled={claim <= 0}
          onPress={claimSteps}
        >
          <Text style={[styles.claimBtnTxt, claim <= 0 && styles.claimBtnTxtOff]}>
            {claim > 0 ? '받기' : '받았어요'}
          </Text>
        </Pressable>
      </View>

      {/* 오늘 모은 포인트 (일일 한도) */}
      <Pressable style={styles.today} onPress={() => soon('활동 기록')}>
        <View style={styles.todayHead}>
          <Text style={styles.todayLab}>오늘 모은 포인트</Text>
          <Text style={styles.todayVal}>{fmtP(todayEarned)} / {fmtP(DAILY_CAP)}P</Text>
        </View>
        <View style={styles.pbarTrack}>
          <View style={[styles.pbarFill, { width: `${todayPct}%` }]} />
        </View>
      </Pressable>

      {/* 자산 스트립 */}
      <View style={styles.assetStrip}>
        <Pressable style={styles.asset} onPress={() => navigation.navigate('Interest')}>
          <Text style={styles.assetLab}>이자 받는 포인트</Text>
          <Text style={styles.assetVal}>{fmtP(staked)}P</Text>
        </Pressable>
        <Pressable style={styles.asset} onPress={() => navigation.navigate('Wallet')}>
          <Text style={styles.assetLab}>내 자산</Text>
          <Text style={styles.assetVal}>{won(asset)}원</Text>
        </Pressable>
      </View>

      {/* 퀵 메뉴 */}
      <View style={styles.quickRow}>
        <QuickBtn emoji="📅" bg={colors.primarySoft} label="출석체크" dot onPress={() => navigation.navigate('Attendance')} />
        <QuickBtn emoji="💰" bg={colors.goldSoft} label="보너스" dot onPress={() => navigation.navigate('Bonus')} />
        <QuickBtn emoji="🧠" bg="#FDECEC" label="OX퀴즈" dot onPress={() => navigation.navigate('Quiz')} />
        <QuickBtn emoji="🎁" bg="#F0E8FE" label="뽑기" onPress={() => soon('나드리 뽑기')} />
      </View>
      <View style={styles.quickWide}>
        <QuickWide emoji="🎮" bg={colors.rewardSoft} label="게임하고 받기" onPress={() => soon('게임하고 받기')} />
        <QuickWide emoji="📺" bg="#FDECEC" label="영상 보고 받기" onPress={() => soon('영상 보고 받기')} />
      </View>

      {/* 불리기 배너 */}
      <Pressable style={styles.growBanner} onPress={() => navigation.navigate('Interest')}>
        <View style={styles.flex1}>
          <Text style={styles.growTitle}>모은 포인트를 늘려봐요</Text>
          <Text style={styles.growSub}>넣어두면 매일 이자가 붙어요</Text>
        </View>
        <Text style={styles.pig}>🐷</Text>
      </Pressable>
    </Screen>
  );
}

function QuickBtn({ emoji, bg, label, dot, onPress }: {
  emoji: string; bg: string; label: string; dot?: boolean; onPress: () => void;
}) {
  return (
    <Pressable style={styles.qb} onPress={onPress}>
      {dot && <View style={styles.qbDot} />}
      <View style={[styles.qbIc, { backgroundColor: bg }]}><Text style={styles.qbEmoji}>{emoji}</Text></View>
      <Text style={styles.qbLab}>{label}</Text>
    </Pressable>
  );
}

function QuickWide({ emoji, bg, label, onPress }: {
  emoji: string; bg: string; label: string; onPress: () => void;
}) {
  return (
    <Pressable style={styles.qw} onPress={onPress}>
      <View style={[styles.qbIc, { backgroundColor: bg }]}><Text style={styles.qbEmoji}>{emoji}</Text></View>
      <Text style={styles.qbLab}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  balancePill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.surface, borderRadius: radii.pill, paddingVertical: 7, paddingHorizontal: 13,
    ...cardShadow,
  },
  coin: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  coinTxt: { color: '#fff', fontSize: 11, fontWeight: '900' },
  balanceTxt: { fontSize: 14, fontWeight: '800', color: colors.ink },
  topIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...cardShadow },
  iconEmoji: { fontSize: 17 },

  chipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  chip: { backgroundColor: colors.primarySoft, borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 11 },
  chipTxt: { fontSize: 12, fontWeight: '800', color: colors.primaryDeep },
  weather: { fontSize: 12, fontWeight: '700', color: colors.muted },

  hero: { backgroundColor: colors.surface, borderRadius: 24, padding: 18, marginTop: 14, alignItems: 'center', ...cardShadow },
  ringLab: { fontSize: 12, fontWeight: '700', color: colors.muted },
  ringNum: { fontSize: 42, fontWeight: '900', letterSpacing: -2, color: colors.ink, fontVariant: ['tabular-nums'], lineHeight: 48 },
  ringGoal: { fontSize: 12, fontWeight: '700', color: colors.dim, marginTop: 2 },
  stat2: { flexDirection: 'row', width: '100%', marginTop: 8 },
  statCell: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 17, fontWeight: '900', color: colors.ink },
  statUnit: { fontSize: 12, fontWeight: '700', color: colors.muted },
  statLab: { fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 2 },
  devSteps: { marginTop: 12, alignSelf: 'stretch', backgroundColor: colors.surface2, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  devStepsTxt: { fontSize: 11.5, fontWeight: '700', color: colors.muted },

  claim: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    backgroundColor: colors.surface, borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: 16, marginTop: 12, ...cardShadow,
  },
  claimLab: { fontSize: 12, fontWeight: '700', color: colors.muted },
  claimAmt: { fontSize: 24, fontWeight: '900', letterSpacing: -1, color: colors.ink, marginTop: 2 },
  claimBtn: { backgroundColor: colors.primary, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 22 },
  claimBtnOff: { backgroundColor: colors.line },
  claimBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  claimBtnTxtOff: { color: colors.dim },

  today: { marginTop: 12 },
  todayHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  todayLab: { fontSize: 12, fontWeight: '800', color: colors.muted },
  todayVal: { fontSize: 12, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  pbarTrack: { height: 8, backgroundColor: colors.line, borderRadius: radii.pill, overflow: 'hidden' },
  pbarFill: { height: '100%', backgroundColor: colors.reward, borderRadius: radii.pill },

  assetStrip: { flexDirection: 'row', gap: 8, marginTop: 12 },
  asset: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, ...cardShadow },
  assetLab: { fontSize: 11, fontWeight: '700', color: colors.muted },
  assetVal: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5, color: colors.ink, marginTop: 3 },

  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quickWide: { flexDirection: 'row', gap: 8, marginTop: 8 },
  qb: { flex: 1, backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 13, alignItems: 'center', gap: 7, ...cardShadow },
  qw: { flex: 1, flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 9, ...cardShadow },
  qbIc: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  qbEmoji: { fontSize: 19 },
  qbLab: { fontSize: 12, fontWeight: '800', color: colors.ink },
  qbDot: { position: 'absolute', top: 9, right: 11, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.red, zIndex: 1 },

  growBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    backgroundColor: colors.panelDeep, borderRadius: radii.lg, paddingVertical: 16, paddingHorizontal: 18, marginTop: 14,
  },
  growTitle: { fontSize: 15, fontWeight: '800', color: colors.primaryDeep },
  growSub: { fontSize: 12, fontWeight: '600', color: '#6076A0', marginTop: 3 },
  pig: { fontSize: 38 },

  flex1: { flex: 1 },
});
