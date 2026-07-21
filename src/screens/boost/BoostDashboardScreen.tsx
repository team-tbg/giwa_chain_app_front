/**
 * 3. 체험 대시보드 — 넣은 공돈에 매일 조금씩 붙는 걸 보여준다.
 * 입금→이자→출금 루프를 유저가 직접 완주할 수 있어야 신뢰가 생긴다.
 * 이자는 시뮬레이션(파일럿 재원 지급). 확정 아님.
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Amount, Button, Card, Pill, Row } from '../../components/ui';
import { colors, typography } from '../../theme/theme';
import { useAppState, won } from '../../state/AppState';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BoostDashboard'>;

export function BoostDashboardScreen({ navigation }: Props) {
  const { boostedAmount, growth, tickGrowth } = useAppState();

  // 이자 카운트업 시뮬레이션.
  useEffect(() => {
    const id = setInterval(() => tickGrowth(Math.random() * 0.9 + 0.3), 700);
    return () => clearInterval(id);
  }, [tickGrowth]);

  const current = boostedAmount + growth;

  return (
    <Screen>
      <Row style={styles.header}>
        <Text style={styles.h2}>불리는 중 🌿</Text>
        <Pill>잘 되고 있어요</Pill>
      </Row>

      <Card style={styles.hero}>
        <Text style={styles.label}>지금 내 리워드</Text>
        <View style={styles.mt6}>
          <Amount value={won(current)} color={colors.mint} />
        </View>
        <Pill>+{won(growth)}원 늘었어요</Pill>
      </Card>

      <Row style={styles.statsRow}>
        <Card flat style={styles.stat}>
          <Text style={styles.statLabel}>오늘 붙은 금액</Text>
          <Text style={styles.statValue}>+{won(Math.max(3, growth / 3))}원</Text>
        </Card>
        <Card flat style={styles.stat}>
          <Text style={styles.statLabel}>지금까지</Text>
          <Text style={styles.statValue}>+{won(growth)}원</Text>
        </Card>
      </Row>

      <Card flat style={styles.unlock}>
        <Text style={styles.unlockIc}>🔓</Text>
        <View style={styles.flex1}>
          <Text style={styles.unlockTitle}>언제든 뺄 수 있어요</Text>
          <Text style={styles.unlockP}>묶이지 않아요. 아래에서 바로 받아보세요.</Text>
        </View>
      </Card>

      <Button label="받기" variant="plain" large onPress={() => navigation.navigate('WithdrawMoment')} style={styles.cta} />
      <Text style={styles.note}>💡 걸어서 번 리워드가 이렇게 조금씩 늘어나요. 붙는 금액은 달라질 수 있어요.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 4, marginBottom: 16 },
  h2: { ...typography.heading, color: colors.ink },
  hero: { backgroundColor: colors.panelDeep, borderColor: 'rgba(37,99,235,0.18)', alignItems: 'center', gap: 6 },
  label: { ...typography.label, color: colors.muted },
  mt6: { marginVertical: 6 },
  statsRow: { gap: 12, marginTop: 14, alignItems: 'stretch' },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { ...typography.caption, color: colors.muted, fontWeight: '700' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.mint, marginTop: 4 },
  unlock: { marginTop: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  unlockIc: { fontSize: 24 },
  flex1: { flex: 1 },
  unlockTitle: { ...typography.body, fontWeight: '700', color: colors.ink },
  unlockP: { ...typography.caption, color: colors.muted, marginTop: 2 },
  cta: { marginTop: 18 },
  note: { ...typography.caption, color: colors.muted, textAlign: 'center', marginTop: 12, lineHeight: 20 },
});
