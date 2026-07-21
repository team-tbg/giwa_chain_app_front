/**
 * 5. 원금 전환 — 내 원화가 들어가는 지점.
 * 규칙(중요): 여기서부터 "원금 걱정 없어요" 금지.
 *   원금 비보장·손실 가능성을 분명히 고지한다(유사수신·부당권유 회피).
 *   단, 출금은 계속 진짜 열려 있음을 함께 안내.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';
import { Screen } from '../../components/Screen';
import { Amount, Button, Pill } from '../../components/ui';
import { colors, typography } from '../../theme/theme';
import { won } from '../../state/AppState';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Principal'>;

const OPTIONS = [100000, 300000, 500000];

export function PrincipalScreen({ navigation }: Props) {
  const [amount, setAmount] = useState(300000);

  return (
    <Screen>
      <Button label="← 뒤로" variant="plain" onPress={() => navigation.goBack()} style={styles.back} />
      <Text style={styles.title}>얼마를 넣어볼까요?</Text>
      <Text style={styles.sub}>{'넣은 돈에도 똑같은 방식으로 굴러가요.\n복잡한 건 저희가 알아서 할게요.'}</Text>

      <View style={styles.chips}>
        {OPTIONS.map((v) => {
          const on = v === amount;
          return (
            <Pressable
              key={v}
              onPress={() => setAmount(v)}
              accessibilityRole="button"
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{v / 10000}만원</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.amountBox}>
        <Text style={styles.label}>넣을 금액</Text>
        <View style={styles.mt4}>
          <Amount value={won(amount)} color={colors.mint} />
        </View>
        <View style={styles.mt12}>
          <Pill>📈 1년 뒤 예시 약 {won(amount * 0.05)}원 · 달라질 수 있어요</Pill>
        </View>
      </View>

      {/* 필수 리스크 고지 */}
      <View style={styles.risk}>
        <Text style={styles.riskIc}>⚠️</Text>
        <Text style={styles.riskText}>
          여기서부터는 <Text style={styles.bold}>내 원금</Text>이 들어가요. 원금은 보장되지 않고, 시장 상황에 따라{' '}
          <Text style={styles.bold}>손실이 날 수도</Text> 있어요. 그래도 <Text style={styles.bold}>언제든 다시 뺄 수 있어요.</Text>
        </Text>
      </View>

      <Button
        label="이해했어요, 입금하기"
        large
        onPress={() => navigation.navigate('Done', { amount })}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 14, marginBottom: 12 },
  title: { ...typography.display, color: colors.ink },
  sub: { ...typography.body, color: colors.muted, marginTop: 10 },
  chips: { flexDirection: 'row', gap: 9, marginVertical: 20 },
  chip: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: colors.mint, backgroundColor: colors.mintSoft },
  chipText: { fontWeight: '800', fontSize: 16, color: colors.ink },
  chipTextOn: { color: colors.mint },
  amountBox: {
    backgroundColor: colors.mintSoft,
    borderColor: 'rgba(37,99,235,0.2)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  label: { ...typography.label, color: colors.muted },
  mt4: { marginTop: 4 },
  mt12: { marginTop: 12 },
  risk: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    backgroundColor: colors.warnSoft,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  riskIc: { fontSize: 18 },
  riskText: { flex: 1, fontSize: 13.5, color: colors.warn, lineHeight: 20, fontWeight: '600' },
  bold: { fontWeight: '800' },
  cta: { marginTop: 18 },
});
