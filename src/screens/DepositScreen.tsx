/**
 * 입금하기 — 원화 입금 (v10 deposit 그대로).
 * 금액 선택 → 결제수단 선택 → 내 자산에 쌓임. 이자받기에서 저금해야 이자가 붙는다.
 * (v10에 없는 리스크 박스/수익 예시는 넣지 않는다. 원금 손실 고지는 v10처럼 변동 자산 구매 시점에.)
 */
import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Button } from '../components/ui';
import { colors, typography } from '../theme/theme';
import { useAppState, won } from '../state/AppState';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Deposit'>;

const CHIPS = [10000, 100000, 300000, 500000];
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

  const amount = Math.max(0, Math.floor(Number(manwon) || 0)) * 10000;

  const openPay = () => {
    if (amount <= 0) return;
    setPayOpen(true);
  };
  const pay = (method: string) => {
    setPayOpen(false);
    depositCash(amount);
    navigation.navigate('Main', { screen: 'Interest' });
    Alert.alert('입금 완료', `${method}으로 ${won(amount)}원을 입금했어요. 이자받기에서 저금하면 이자가 붙어요.`);
  };

  return (
    <Screen>
      <Button label="← 뒤로" variant="plain" onPress={() => navigation.goBack()} style={styles.back} />
      <Text style={styles.title}>입금하기</Text>
      <Text style={styles.sub}>넣을 만큼 조절하거나 직접 입력해요</Text>

      <Text style={styles.bigAmt}>{amount >= 10000 ? `${(amount / 10000).toLocaleString('ko-KR')}만 ` : `${won(amount)} `}<Text style={styles.bigWon}>원</Text></Text>

      <View style={styles.chips}>
        {CHIPS.map((v) => {
          const on = v === amount;
          return (
            <Pressable key={v} onPress={() => setManwon(String(v / 10000))} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{v / 10000}만원</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.manRow}>
        <TextInput
          value={manwon}
          onChangeText={(t) => setManwon(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          style={styles.manInput}
          placeholder="0"
          placeholderTextColor={colors.dim}
        />
        <Text style={styles.manUnit}>만 원</Text>
      </View>

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
  chips: { flexDirection: 'row', gap: 8, marginTop: 18 },
  chip: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { fontWeight: '800', fontSize: 14, color: colors.ink },
  chipTextOn: { color: colors.primary },
  manRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.line, borderRadius: 15, marginTop: 12, backgroundColor: colors.surface, paddingHorizontal: 16 },
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
