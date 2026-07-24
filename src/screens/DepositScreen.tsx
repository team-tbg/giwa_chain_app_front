/**
 * 입금하기 — 원화 입금 (v10 deposit 그대로).
 * 금액 선택 → 결제수단 선택 → 내 자산에 쌓임. 이자받기에서 저금해야 이자가 붙는다.
 * (v10에 없는 리스크 박스/수익 예시는 넣지 않는다. 원금 손실 고지는 v10처럼 변동 자산 구매 시점에.)
 */
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { toast } from '../lib/alert';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Button } from '../components/ui';
import { colors, typography } from '../theme/theme';
import { useAppState, won } from '../state/AppState';
import { groupDigits, onlyDigits } from '../lib/format';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Deposit'>;

const SLIDER_MAX = 1000000; // 슬라이더는 0~100만 원(1만 원 단위)
const INPUT_MAX_WON = 500000000; // 직접 입력은 50,000만 원까지
const PAYS: { name: string; bg: string; mark: string; fg: string }[] = [
  { name: '토스', bg: '#0064FF', mark: 't', fg: '#fff' },
  { name: '카카오페이', bg: '#FEE500', mark: 'K', fg: '#3C1E1E' },
  { name: '네이버페이', bg: '#03C75A', mark: 'N', fg: '#fff' },
  { name: '신용·체크카드', bg: '#4B5563', mark: '💳', fg: '#fff' },
  { name: '계좌이체', bg: '#2F6BF3', mark: '🏦', fg: '#fff' },
];

export function DepositScreen({ navigation }: Props) {
  const { depositCash } = useAppState();
  const [manwon, setManwon] = useState('10'); // 만 원 단위 입력
  const [payOpen, setPayOpen] = useState(false);

  const amount = Math.min(INPUT_MAX_WON, Math.max(0, Math.floor(Number(manwon) || 0)) * 10000);
  const overCap = (Number(manwon) || 0) > INPUT_MAX_WON / 10000; // 50,000만 원 초과 입력

  const openPay = () => {
    if (amount <= 0) return;
    setPayOpen(true);
  };
  const pay = (method: string) => {
    setPayOpen(false);
    depositCash(amount);
    // v10처럼 입금 후엔 이자받기 인트로가 아니라 '이자 현황(저금 대시보드)'로 보낸다.
    // 방금 넣은 돈이 바로 보이고 저금할 수 있는 곳.
    navigation.navigate('Grow');
    toast(`${method}으로 ${won(amount)}원 입금 완료 🎉`);
  };

  return (
    <Screen>
      <Button label="← 뒤로" variant="plain" onPress={() => navigation.goBack()} style={styles.back} />
      <Text style={styles.title}>입금하기</Text>
      <Text style={styles.sub}>넣을 만큼 조절하거나 직접 입력해요</Text>

      <Text style={styles.bigAmt}>{amount >= 10000 ? `${(amount / 10000).toLocaleString('ko-KR')}만 ` : `${won(amount)} `}<Text style={styles.bigWon}>원</Text></Text>

      <View style={styles.sliderWrap}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={SLIDER_MAX}
          step={10000}
          value={Math.min(amount, SLIDER_MAX)}
          onValueChange={(v) => setManwon(String(Math.round(v / 10000)))}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.line}
          thumbTintColor={colors.primary}
        />
        <View style={styles.ticks}>
          <Text style={styles.tick}>0</Text>
          <Text style={styles.tick}>100만 원</Text>
        </View>
      </View>

      <View style={[styles.manRow, overCap && styles.manRowErr]}>
        <TextInput
          value={groupDigits(manwon)}
          onChangeText={(t) => setManwon(onlyDigits(t))}
          keyboardType="number-pad"
          style={[styles.manInput, overCap && styles.manInputErr]}
          placeholder="0"
          placeholderTextColor={colors.dim}
        />
        <Text style={styles.manUnit}>만 원</Text>
      </View>
      {overCap ? (
        <Pressable onPress={() => setManwon('50000')}>
          <Text style={styles.limitErr}>최대 50,000만 원까지예요 · 눌러서 맞추기</Text>
        </Pressable>
      ) : (
        <Text style={styles.limitHint}>직접 입력은 50,000만 원까지 돼요</Text>
      )}

      <Button label="입금하기" large onPress={openPay} disabled={amount <= 0} style={styles.cta} />

      <View style={styles.notice}>
        <Text style={styles.noticeText}>입금한 돈은 <Text style={styles.b}>내 지갑</Text>에서 확인할 수 있어요. 이자받기에서 저금하기를 눌러야 이자가 붙기 시작해요.</Text>
      </View>

      {/* 결제수단 선택 */}
      <Modal visible={payOpen} transparent animationType="slide" onRequestClose={() => setPayOpen(false)}>
        <Pressable style={styles.mask} onPress={() => setPayOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{won(amount)}원을 입금해요</Text>
          <Text style={styles.sheetSub}>결제 수단을 선택해주세요</Text>
          <View style={styles.payList}>
            {PAYS.map((p) => (
              <Pressable key={p.name} style={styles.pay} onPress={() => pay(p.name)}>
                <View style={[styles.payMark, { backgroundColor: p.bg }]}><Text style={[styles.payMarkTxt, { color: p.fg }]}>{p.mark}</Text></View>
                <Text style={styles.payName}>{p.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 14, marginBottom: 4 },
  title: { ...typography.heading, color: colors.ink },
  sub: { fontSize: 13.5, fontWeight: '600', color: colors.muted, marginTop: 6, textAlign: 'center' },
  bigAmt: { fontSize: 38, fontWeight: '900', color: colors.primary, letterSpacing: -1.5, textAlign: 'center', marginTop: 14 },
  bigWon: { fontSize: 20, fontWeight: '900' },
  sliderWrap: { marginTop: 18 },
  slider: { width: '100%', height: 40 },
  ticks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tick: { fontSize: 12, fontWeight: '800', color: colors.muted },
  manRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.line, borderRadius: 15, marginTop: 16, backgroundColor: colors.surface, paddingHorizontal: 16 },
  limitHint: { fontSize: 12, fontWeight: '700', color: colors.muted, textAlign: 'center', marginTop: 8 },
  manRowErr: { borderColor: colors.red, backgroundColor: '#FFF3F3' },
  manInputErr: { color: colors.red },
  limitErr: { fontSize: 12, fontWeight: '800', color: colors.red, textAlign: 'center', marginTop: 8 },
  manInput: { flex: 1, paddingVertical: 15, fontSize: 22, fontWeight: '900', color: colors.ink, textAlign: 'right' },
  manUnit: { fontSize: 16, fontWeight: '800', color: colors.muted, marginLeft: 8 },
  cta: { marginTop: 16 },
  notice: { backgroundColor: colors.surface2, borderRadius: 14, padding: 14, marginTop: 16 },
  noticeText: { fontSize: 12.5, fontWeight: '600', color: colors.muted, lineHeight: 20 },
  b: { fontWeight: '800', color: colors.ink },

  mask: { flex: 1, backgroundColor: 'rgba(12,20,34,0.42)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 30 },
  handle: { width: 38, height: 4, borderRadius: 99, backgroundColor: '#E2E6ED', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 19, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  sheetSub: { fontSize: 13.5, fontWeight: '600', color: colors.muted, textAlign: 'center', marginTop: 6 },
  payList: { marginTop: 16, gap: 8 },
  pay: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1.5, borderColor: colors.line, borderRadius: 15 },
  payMark: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  payMarkTxt: { fontSize: 13, fontWeight: '900' },
  payName: { fontSize: 15, fontWeight: '800', color: colors.ink },
});
