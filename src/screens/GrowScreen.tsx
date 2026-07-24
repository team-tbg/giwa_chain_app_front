/**
 * 이자 현황(grow) — 포인트 저금 / 원화 저금 2트랙 대시보드 (v10 grow). 이자받기 인트로에서 진입.
 * 규칙: 확정% 금지(붙는 금액만) · 언제든 원탭으로 꺼냄 · 이자는 GIWA 디파이 시뮬레이션(우리 재원, 확정 아님).
 */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { notify, toast } from '../lib/alert';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Button, QMark } from '../components/ui';
import { WithdrawSheet } from '../components/WithdrawSheet';
import { TIP_STAKE } from '../lib/tips';
import { groupDigits, onlyDigits } from '../lib/format';
import { colors, cardShadow } from '../theme/theme';
import { useAppState, won, fmtP, fmtd, pTotal, cTotal, earnedP, earnedC } from '../state/AppState';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Grow'>;

// v10 TIPS.stake / TIPS.asset 원문과 1:1 일치 (docs/prototype/naduri_v10.html)
// (내 자산에는 v10 grow 화면에 물음표가 없으므로 두지 않는다. 툴팁 원문은 src/lib/tips.ts)

// v10 카드 그래디언트 (linear-gradient 140deg)
const GRAD_P = ['#16C172', '#0E9E5C'] as const; // 포인트(그린)
const GRAD_C = ['#3C7BFF', '#2455C8'] as const; // 자산(블루)

// v10 growNum: 정수부는 크게, 소수부는 작고 흐리게. 매 순간 소수점이 올라가는 게 보이도록.
// 빈 상태(dim)도 v10 스크린샷처럼 "0.0000000" 형태로 흐리게·가운데 정렬해서 보여준다.
function GrowNum({ v, d, unit, dim, center }: { v: number; d: number; unit: string; dim?: boolean; center?: boolean }) {
  const str = fmtd(v, d);
  const i = str.indexOf('.');
  const intPart = i < 0 ? str : str.slice(0, i);
  const decPart = i < 0 ? '' : str.slice(i);
  return (
    <Text style={[styles.gbig, dim && styles.empty, center && styles.center]}>
      {intPart}
      {decPart ? <Text style={styles.gdec}>{decPart}</Text> : null}
      <Text style={styles.gunit}> {unit}</Text>
    </Text>
  );
}

export function GrowScreen({ navigation }: Props) {
  const s = useAppState();
  const { points, cash, pStake, cStake,
    stakePoints, unstakePoints, stakeCash, unstakeCash, withdrawCash } = s;

  // 이자는 저장하지 않고 '지금 시각'으로 계산한다(서버로 매초 쏘지 않음).
  // 화면에서 숫자가 부드럽게 오르도록 now만 100ms마다 갱신 → 전역/서버는 건드리지 않음.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (pStake <= 0 && cStake <= 0) return; // 저금이 없으면 다시 그릴 필요 없음
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [pStake, cStake]);

  const pt = pTotal(s, now);
  const ct = cTotal(s, now);
  const pEarnNow = earnedP(s, now); // 지금까지 붙은 포인트 이자
  const cEarnNow = earnedC(s, now); // 지금까지 붙은 원화 이자

  // 저금 금액 지정 시트 (v10 stakeSheet/doStake). kind 'p'=포인트, 'c'=자산(원화).
  const [stakeKind, setStakeKind] = useState<'p' | 'c' | null>(null);
  const [stakeInput, setStakeInput] = useState('');
  const stakeMax = stakeKind === 'p' ? points : cash;
  const stakeUnit = stakeKind === 'p' ? 'P' : '원';
  // 입력 즉시 검증 — 잔고보다 많이 넣으려 하면 바로 표시하고 버튼을 막는다. (정수 단위)
  const stakeVal = Math.floor(Number(stakeInput) || 0);
  const stakeOver = stakeVal > Math.floor(stakeMax); // 잔고 초과
  const stakeEmpty = stakeVal <= 0;

  const openStake = (kind: 'p' | 'c') => {
    const max = kind === 'p' ? points : cash;
    if (max <= 0) return; // 버튼이 비활성이라 사실상 도달 안 함
    setStakeInput(String(Math.floor(max))); // 기본값 = 넣을 수 있는 최대(정수)
    setStakeKind(kind);
  };

  const doStake = async () => {
    if (!stakeKind) return;
    const max = stakeKind === 'p' ? points : cash;
    let v = Number(stakeInput) || 0;
    if (stakeKind === 'c') v = Math.floor(v);
    if (v <= 0) return toast('넣을 금액을 입력해주세요');
    if (v > max + 1e-6) return toast('가진 금액보다 많아요');
    v = Math.min(v, max);
    try {
      if (stakeKind === 'p') await stakePoints(v); // 온라인=서버(온체인 볼트) / 오프라인=로컬
      else stakeCash(v);
      setStakeKind(null);
      toast(`${stakeKind === 'p' ? fmtd(v, 0) + 'P' : won(v) + '원'}을 저금했어요`);
    } catch (e) {
      toast((e as { message?: string })?.message ?? '지금은 저금할 수 없어요');
    }
  };

  const [wOpen, setWOpen] = useState(false);
  const openWithdraw = () => {
    if (cash <= 0) return notify('출금할 돈이 없어요', '이자 안 받고 있는 원화 자산이 없어요.');
    setWOpen(true);
  };
  const doWithdraw = (amt: number) => {
    withdrawCash(amt);
    setWOpen(false);
    notify('보냈어요', `내 계좌로 ${won(amt)}원을 보내드렸어요. 영업일 기준 1~3일 걸려요.`);
  };

  return (
    <Screen>
      {/* v10 shead — ‹ 뒤로 + 가운데 정렬 제목 */}
      <View style={styles.shead}>
        <Pressable style={styles.backb} onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.backbTxt}>‹</Text>
        </Pressable>
        <Text style={styles.sheadTitle}>이자받기</Text>
        <View style={styles.backb} />
      </View>

      {/* 포인트 저금 */}
      <View style={styles.sectRow}>
        <Text style={styles.sect}>내 포인트</Text>
        <QMark tip={TIP_STAKE} />
      </View>
      <LinearGradient colors={GRAD_P} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.growCard}>
        {pStake > 0 ? (
          <>
            <Text style={styles.gk}>포인트가 이자를 받아오고 있어요</Text>
            <GrowNum v={pt} d={7} unit="P" />
            <View style={styles.gline}><Text style={styles.glineL}>오늘 받은 이자</Text><Text style={styles.glineR}>+{fmtd(pEarnNow, 4)}P</Text></View>
            <View style={styles.gbtns}>
              <GBtn label="추가 저금하기" onPress={() => openStake('p')} disabled={points <= 0} />
              <GBtn label="이자 그만 받기" solid solidColor={colors.rewardDeep} onPress={() => { void unstakePoints().catch((e) => toast((e as { message?: string })?.message ?? '지금은 처리할 수 없어요')); }} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.gk}>내 포인트</Text>
            <GrowNum v={0} d={7} unit="P" dim center />
            <Text style={styles.ghint}>지금 갖고 있는 {fmtP(points)}P를 넣어보세요</Text>
            <View style={[styles.gbtns, { marginTop: 12 }]}>
              <GBtn label="이자 받기" solid solidColor={colors.rewardDeep} full onPress={() => openStake('p')} disabled={points <= 0} />
            </View>
          </>
        )}
      </LinearGradient>

      {/* v10 midcopy — 저금 중일 때만 */}
      {(pStake > 0 || cStake > 0) && (
        <View style={styles.midcopy}>
          <Text style={styles.midcopyT}>포인트가 자동으로 이자를 받고 있어요</Text>
          <Text style={styles.midcopyP}>입금을 해도 똑같이 늘어나요</Text>
        </View>
      )}

      {/* 원화 저금 */}
      <View style={styles.sectRow}>
        <View style={styles.flex1}>
          <Text style={styles.sect}>내 자산</Text>
          <Text style={styles.sectSub}>입금한 돈도 이자를 받을 수 있어요</Text>
        </View>
        <Pressable style={styles.minib} onPress={() => navigation.navigate('Deposit')}><Text style={styles.minibTxt}>입금</Text></Pressable>
        <Pressable style={styles.minib} onPress={openWithdraw}><Text style={styles.minibTxt}>출금</Text></Pressable>
      </View>
      <LinearGradient colors={GRAD_C} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.growCard}>
        {cStake > 0 ? (
          <>
            <Text style={styles.gk}>입금한 돈이 이자를 받아오고 있어요</Text>
            <GrowNum v={ct} d={4} unit="원" />
            <View style={styles.gline}><Text style={styles.glineL}>오늘 받은 이자</Text><Text style={styles.glineR}>+{fmtd(cEarnNow, 4)}원</Text></View>
          </>
        ) : (
          <>
            <Text style={styles.gk}>내 자산</Text>
            <GrowNum v={0} d={4} unit="원" dim center />
          </>
        )}
        <View style={styles.gline}><Text style={styles.glineL}>이자 안 받고 있는 돈</Text><Text style={styles.glineR}>{won(cash)}원</Text></View>
        <View style={styles.gbtns}>
          <GBtn label={cStake > 0 ? '추가 저금하기' : '이자 받기'} solid solidColor={colors.primaryDeep} onPress={() => openStake('c')} disabled={cash <= 0} full={cStake <= 0} />
          {cStake > 0 && <GBtn label="이자 그만 받기" onPress={unstakeCash} />}
        </View>
      </LinearGradient>

      <Text style={styles.note}>출금하기는 내 계좌로 보내는 거라 영업일 기준 1~3일이 걸려요.</Text>

      {/* 저금 금액 지정 시트 (v10 stakeSheet) */}
      <Modal visible={stakeKind != null} transparent animationType="slide" onRequestClose={() => setStakeKind(null)}>
        <Pressable style={styles.mask} onPress={() => setStakeKind(null)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{stakeKind === 'p' ? '포인트' : '자산'} 저금하기</Text>
          <Text style={styles.sheetSub}>넣은 만큼 매 순간 이자를 받아요. 언제든 그만 받을 수 있어요</Text>
          <View style={[styles.stakeRow, stakeOver && styles.stakeRowErr]}>
            <TextInput
              value={groupDigits(stakeInput)}
              onChangeText={(t) => setStakeInput(onlyDigits(t))}
              keyboardType="number-pad"
              style={[styles.stakeInput, stakeOver && styles.stakeInputErr]}
              placeholder="0"
              placeholderTextColor={colors.dim}
              autoFocus
            />
            <Text style={styles.stakeUnit}>{stakeUnit}</Text>
            <Pressable style={styles.maxBtn} onPress={() => setStakeInput(String(Math.floor(stakeMax)))}>
              <Text style={styles.maxBtnTxt}>전액</Text>
            </Pressable>
          </View>
          {stakeOver ? (
            <Pressable onPress={() => setStakeInput(stakeKind === 'p' ? String(+stakeMax.toFixed(4)) : String(Math.floor(stakeMax)))}>
              <Text style={styles.stakeErr}>가진 금액보다 많아요 · 눌러서 최대 {stakeKind === 'p' ? fmtP(points) : won(cash)}{stakeUnit}로 맞추기</Text>
            </Pressable>
          ) : (
            <Text style={styles.stakeHint}>넣을 수 있는 금액 {stakeKind === 'p' ? fmtP(points) : won(cash)}{stakeUnit}</Text>
          )}
          <Button label="저금하기" large onPress={doStake} disabled={stakeEmpty || stakeOver} style={styles.stakeCta} />
        </View>
      </Modal>

      <WithdrawSheet visible={wOpen} cash={cash} onClose={() => setWOpen(false)} onConfirm={doWithdraw} />
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
  shead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, marginBottom: 6 },
  backb: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  backbTxt: { fontSize: 26, fontWeight: '700', color: colors.ink, lineHeight: 28, marginTop: -2 },
  sheadTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', letterSpacing: -0.3, color: colors.ink },
  sect: { fontSize: 15, fontWeight: '800', color: colors.ink },
  sectSub: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 2 },
  sectRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 16, marginBottom: 8 },
  flex1: { flex: 1 },
  center: { textAlign: 'center' },
  minib: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 11, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 2 },
  minibTxt: { fontSize: 13, fontWeight: '800', color: colors.ink },

  growCard: { borderRadius: 24, paddingVertical: 20, paddingHorizontal: 18, overflow: 'hidden' },
  gk: { fontSize: 13, fontWeight: '800', color: '#fff', opacity: 0.9 },
  gbig: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5, color: '#fff', marginTop: 6, lineHeight: 39, fontVariant: ['tabular-nums'] },
  gdec: { fontSize: 19, fontWeight: '900', color: '#fff', opacity: 0.75 },
  gunit: { fontSize: 19, fontWeight: '800', color: '#fff', opacity: 0.85 },
  empty: { opacity: 0.55 },
  ghint: { fontSize: 12.5, fontWeight: '700', color: '#fff', opacity: 0.9, marginTop: 6 },
  midcopy: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, marginTop: 20, marginBottom: 4, alignItems: 'center', ...cardShadow },
  midcopyT: { fontSize: 15, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  midcopyP: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 5, textAlign: 'center' },
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
  note: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 12, lineHeight: 18 },

  mask: { flex: 1, backgroundColor: 'rgba(12,20,34,0.42)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 30 },
  handle: { width: 38, height: 4, borderRadius: 99, backgroundColor: '#E2E6ED', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 19, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  sheetSub: { fontSize: 13.5, fontWeight: '600', color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  stakeRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.line, borderRadius: 15, marginTop: 18, backgroundColor: colors.surface, paddingHorizontal: 16 },
  stakeInput: { flex: 1, paddingVertical: 15, fontSize: 24, fontWeight: '900', color: colors.ink, textAlign: 'right' },
  stakeUnit: { fontSize: 16, fontWeight: '800', color: colors.muted, marginLeft: 8 },
  maxBtn: { marginLeft: 12, borderRadius: 10, backgroundColor: colors.surface2, paddingVertical: 8, paddingHorizontal: 12 },
  maxBtnTxt: { fontSize: 13, fontWeight: '800', color: colors.ink },
  stakeHint: { fontSize: 12.5, fontWeight: '700', color: colors.muted, textAlign: 'center', marginTop: 10 },
  stakeRowErr: { borderColor: colors.red, backgroundColor: '#FFF3F3' },
  stakeInputErr: { color: colors.red },
  stakeErr: { fontSize: 12.5, fontWeight: '800', color: colors.red, textAlign: 'center', marginTop: 10 },
  stakeCta: { marginTop: 16 },
});
