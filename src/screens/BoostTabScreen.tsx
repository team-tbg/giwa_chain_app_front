/**
 * 하단 탭 "불리기" — 진행 중이면 현황 요약, 아니면 시작 유도.
 * 실제 예치/출금 상세는 루트 스택의 불리기 플로우로 이동.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Screen } from '../components/Screen';
import { Amount, Button, Card } from '../components/ui';
import { colors, typography } from '../theme/theme';
import { useAppState, won } from '../state/AppState';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Boost'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function BoostTabScreen({ navigation }: Props) {
  const { boostedAmount, growth } = useAppState();
  const active = boostedAmount > 0;

  return (
    <Screen>
      <Text style={styles.h1}>불리기</Text>
      {active ? (
        <Card style={styles.hero}>
          <Text style={styles.label}>지금 불리고 있는 리워드</Text>
          <View style={styles.mt6}>
            <Amount value={won(boostedAmount + growth)} color={colors.mint} />
          </View>
          <Button
            label="받기"
            variant="plain"
            onPress={() => navigation.navigate('WithdrawMoment')}
            style={styles.mt16}
          />
        </Card>
      ) : (
        <Card>
          <Text style={styles.emoji}>🌱</Text>
          <Text style={styles.title}>걸어서 번 리워드, 불려볼까요?</Text>
          <Text style={styles.sub}>내 돈은 안 들어가요. 부담 없이 체험해 보세요.</Text>
          <Button label="시작하기" onPress={() => navigation.navigate('BoostIntro')} style={styles.mt16} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.display, color: colors.ink, marginTop: 6, marginBottom: 16 },
  hero: { backgroundColor: colors.panelDeep, borderColor: 'rgba(37,99,235,0.18)', alignItems: 'center' },
  label: { ...typography.label, color: colors.muted },
  mt6: { marginVertical: 6 },
  mt16: { marginTop: 16 },
  emoji: { fontSize: 48, textAlign: 'center' },
  title: { ...typography.heading, color: colors.ink, textAlign: 'center', marginTop: 8 },
  sub: { ...typography.body, color: colors.muted, textAlign: 'center', marginTop: 6 },
});
