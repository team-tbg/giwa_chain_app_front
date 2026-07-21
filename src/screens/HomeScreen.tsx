/**
 * 1. 홈 · 걷기/적립 (리텐션 엔진).
 * MVP-now: 걸음 수 / 포인트 조회 / 받기·불리기 진입.
 * 규칙: 퍼센트·풀·코인명 노출 금지. 버튼 하나, 단어 하나.
 */
import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Screen } from '../components/Screen';
import { Amount, Button, Card, Pill, Row } from '../components/ui';
import { colors, typography } from '../theme/theme';
import { useAppState, won } from '../state/AppState';
import { usePedometer } from '../hooks/usePedometer';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { user, steps: mockSteps, goal, pendingPoints, balance, collect } = useAppState();
  const ped = usePedometer();

  const withdraw = () =>
    Alert.alert('보냈어요', `통장으로 ${won(balance)}원을 보내드렸어요.`);

  // 실기기에서 센서가 잡히면 실제 걸음, 아니면 데모용 목업.
  const steps = ped.available && ped.todaySteps > 0 ? ped.todaySteps : mockSteps;
  const pct = useMemo(() => Math.min(100, (steps / goal) * 100), [steps, goal]);

  return (
    <Screen>
      <Row style={styles.header}>
        <View>
          <Text style={styles.hi}>{user ? `${user.name}님 👋` : '안녕하세요 👋'}</Text>
          <Text style={styles.h2}>오늘도 걸어볼까요?</Text>
        </View>
        <Pill tone="honey">🔥 7일째</Pill>
      </Row>

      {/* 오늘 걸음 */}
      <Card>
        <Row>
          <Text style={styles.cardLabel}>오늘 걸음</Text>
          <Pill>목표 {won(goal)}</Pill>
        </Row>
        <View style={styles.stepsRow}>
          <Text style={styles.steps}>{won(steps)}</Text>
          <Text style={styles.stepsUnit}>걸음</Text>
        </View>
        {/* 걷는 길 시그니처 */}
        <View style={styles.path}>
          <View style={styles.track} />
          <View style={[styles.fill, { width: `${pct}%` }]} />
          <Text style={[styles.walker, { left: `${pct}%` }]}>🚶</Text>
          <Text style={styles.flag}>🚩</Text>
        </View>
      </Card>

      {/* 받을 수 있는 리워드 */}
      <Card style={styles.mt}>
        <Row>
          <View>
            <Text style={styles.cardLabel}>받을 수 있는 리워드</Text>
            <View style={styles.mt4}>
              <Amount value={won(pendingPoints)} color={colors.honey} size={32} />
            </View>
          </View>
          <Button
            label={pendingPoints > 0 ? '받기' : '내일 또'}
            variant="honey"
            disabled={pendingPoints <= 0}
            onPress={collect}
            style={styles.collectBtn}
          />
        </Row>
      </Card>

      {/* 모은 리워드 */}
      <Card style={styles.mt}>
        <Text style={styles.cardLabel}>지금까지 모은 리워드</Text>
        <View style={styles.balance}>
          <Amount value={won(balance)} />
        </View>
        <Row style={styles.actions}>
          <Button label="받기" variant="plain" style={styles.flex1} onPress={withdraw} />
          <Button
            label="✨ 불리기"
            variant="primary"
            style={styles.flex14}
            onPress={() => navigation.navigate('BoostIntro')}
          />
        </Row>
        <Text style={styles.hint}>그냥 두면 그대로예요. 불리면 매일 조금씩 늘어나요.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 6, marginBottom: 14 },
  hi: { ...typography.label, color: colors.muted, fontWeight: '600' },
  h2: { ...typography.heading, color: colors.ink },
  cardLabel: { ...typography.label, color: colors.muted },
  stepsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 },
  steps: { ...typography.bigNum, color: colors.ink },
  stepsUnit: { color: colors.muted, fontWeight: '700' },
  path: { height: 60, marginTop: 8, justifyContent: 'center' },
  track: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 34,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.line,
  },
  fill: {
    position: 'absolute',
    left: 6,
    top: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mint,
  },
  walker: { position: 'absolute', top: 8, fontSize: 28, marginLeft: -14 },
  flag: { position: 'absolute', right: 0, top: 6, fontSize: 24 },
  mt: { marginTop: 14 },
  mt4: { marginTop: 2 },
  collectBtn: { paddingHorizontal: 22, height: 52, alignSelf: 'center' },
  balance: { marginTop: 4, marginBottom: 16 },
  actions: { gap: 11 },
  flex1: { flex: 1 },
  flex14: { flex: 1.4 },
  hint: { ...typography.caption, color: colors.muted, textAlign: 'center', marginTop: 11 },
});
