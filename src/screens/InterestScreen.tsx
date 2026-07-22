/**
 * 이자받기 탭 — 포인트 저금 / 원화 저금 2트랙 (v10 grow).
 * 규칙: 확정% 금지(붙는 금액만) · 언제든 원탭으로 꺼냄 · 원화 저금엔 원금 비보장 고지(규칙 4).
 * 이자는 GIWA 디파이 시뮬레이션(우리 재원). 확정 아님.
 */
import React, { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Screen } from '../components/Screen';
import { colors, radii, cardShadow, typography } from '../theme/theme';
import { useAppState, won, fmtP, fmtd, pTotal, cTotal } from '../state/AppState';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Interest'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function InterestScreen({ navigation }: Props) {
  const s = useAppState();
  const { points, cash, pStake, pEarn, cStake, cEarn, tickGrowth,
    stakePoints, unstakePoints, stakeCash, unstakeCash, withdrawCash } = s;

  useEffect(() => {
    const id = setInterval(tickGrowth, 700);
    return () => clearInterval(id);
  }, [tickGrowth]);

  const pt = pTotal(s);
  const ct = cTotal(s);

  const withdraw = () => {
    if (cash <= 0) return Alert.alert('출금할 돈이 없어요', '이자 안 받고 있는 원화 자산이 없어요.');
    withdrawCash(cash);
    Alert.alert('보냈어요', `내 계좌로 ${won(cash)}원을 보내드렸어요. 영업일 기준 1~3일 걸려요.`);
  };

  return (
    <Screen>
      <Text style={styles.h1}>이자받기</Text>

      {/* 포인트 저금 */}
      <Text style={styles.sect}>내 포인트</Text>
      <View style={[styles.growCard, { backgroundColor: colors.reward }]}>
        {pStake > 0 ? (
          <>
            <Text style={styles.gk}>포인트가 이자를 받아오고 있어요</Text>
            <Text style={styles.gbig}>{fmtd(pt, 2)}<Text style={styles.gunit}> P</Text></Text>
            <View style={styles.gline}><Text style={styles.glineL}>오늘 받은 이자</Text><Text style={styles.glineR}>+{fmtd(pEarn, 3)}P</Text></View>
            <View style={styles.gbtns}>
              <GBtn label="추가 저금하기" onPress={() => stakePoints(points)} disabled={points <= 0} />
              <GBtn label="이자 그만 받기" solid solidColor={colors.rewardDeep} onPress={unstakePoints} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.gk}>내 포인트</Text>
            <Text style={[styles.gbig, styles.empty]}>{fmtP(points)}<Text style={styles.gunit}> P</Text></Text>
            <Text style={styles.ghint}>지금 갖고 있는 {fmtP(points)}P를 넣어보세요.</Text>
            <View style={[styles.gbtns, { marginTop: 12 }]}>
              <GBtn label="이자 받기" solid solidColor={colors.rewardDeep} full onPress={() => stakePoints(points)} disabled={points <= 0} />
            </View>
          </>
        )}
      </View>

      {/* 원화 저금 */}
      <View style={styles.sectRow}>
        <View style={styles.flex1}>
          <Text style={styles.sect}>내 자산</Text>
          <Text style={styles.sectSub}>입금한 돈도 이자를 받을 수 있어요</Text>
        </View>
        <Pressable style={styles.minib} onPress={() => navigation.navigate('Deposit')}><Text style={styles.minibTxt}>입금</Text></Pressable>
        <Pressable style={styles.minib} onPress={withdraw}><Text style={styles.minibTxt}>출금</Text></Pressable>
      </View>
      <View style={[styles.growCard, { backgroundColor: colors.primary }]}>
        {cStake > 0 ? (
          <>
            <Text style={styles.gk}>입금한 돈이 이자를 받아오고 있어요</Text>
            <Text style={styles.gbig}>{fmtd(ct, 2)}<Text style={styles.gunit}> 원</Text></Text>
            <View style={styles.gline}><Text style={styles.glineL}>오늘 받은 이자</Text><Text style={styles.glineR}>+{fmtd(cEarn, 2)}원</Text></View>
          </>
        ) : (
          <>
            <Text style={styles.gk}>내 자산</Text>
            <Text style={[styles.gbig, styles.empty]}>{won(cash)}<Text style={styles.gunit}> 원</Text></Text>
          </>
        )}
        <View style={styles.gline}><Text style={styles.glineL}>이자 안 받고 있는 돈</Text><Text style={styles.glineR}>{won(cash)}원</Text></View>
        <View style={styles.gbtns}>
          <GBtn label={cStake > 0 ? '추가 저금하기' : '이자 받기'} solid solidColor={colors.primaryDeep} onPress={() => stakeCash(cash)} disabled={cash <= 0} full={cStake <= 0} />
          {cStake > 0 && <GBtn label="이자 그만 받기" onPress={unstakeCash} />}
        </View>
      </View>

      <Text style={styles.note}>출금하기는 내 계좌로 보내는 거라 영업일 기준 1~3일이 걸려요.</Text>
    </Screen>
  );
}

function GBtn({ label, onPress, solid, solidColor, full, disabled }: {
  label: string; onPress: () => void; solid?: boolean; solidColor?: string; full?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.gbtn, full && styles.gbtnFull, solid ? styles.gbtnSolid : styles.gbtnGhost, disabled && styles.gbtnOff]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.gbtnTxt, { color: solid ? (solidColor ?? colors.primaryDeep) : '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.display, color: colors.ink, marginTop: 6, marginBottom: 6 },
  sect: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: 16, marginBottom: 8 },
  sectSub: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 2 },
  sectRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  flex1: { flex: 1 },
  minib: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 11, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 2 },
  minibTxt: { fontSize: 13, fontWeight: '800', color: colors.ink },

  growCard: { borderRadius: 24, padding: 20 },
  gk: { fontSize: 13, fontWeight: '800', color: '#fff', opacity: 0.9 },
  gbig: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5, color: '#fff', marginTop: 6, fontVariant: ['tabular-nums'] },
  gunit: { fontSize: 19, fontWeight: '800', opacity: 0.85 },
  empty: { opacity: 0.6 },
  ghint: { fontSize: 12.5, fontWeight: '700', color: '#fff', opacity: 0.9, marginTop: 6 },
  gline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.22)' },
  glineL: { fontSize: 13, fontWeight: '700', color: '#fff', opacity: 0.9 },
  glineR: { fontSize: 13, fontWeight: '800', color: '#fff' },
  gbtns: { flexDirection: 'row', gap: 8, marginTop: 14 },
  gbtn: { flex: 1, borderRadius: 13, paddingVertical: 12, alignItems: 'center' },
  gbtnFull: { flex: 1 },
  gbtnGhost: { backgroundColor: 'rgba(255,255,255,0.22)' },
  gbtnSolid: { backgroundColor: '#fff' },
  gbtnOff: { opacity: 0.5 },
  gbtnTxt: { fontSize: 14, fontWeight: '800' },

  risk: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', backgroundColor: colors.warnSoft, borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)', borderRadius: 14, padding: 14, marginTop: 18 },
  riskIc: { fontSize: 18 },
  riskTxt: { flex: 1, fontSize: 13, color: colors.warn, lineHeight: 20, fontWeight: '600' },
  b: { fontWeight: '800' },
  note: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 12, lineHeight: 18 },
});
