/**
 * 이자받기 탭 — 인트로 (v10 V.interest). "포인트가 자동으로 늘어나요" 🐷 + 혜택 3줄 + 진입 버튼.
 * 버튼 → 이자 현황(GrowScreen). "?" 툴팁으로 이자 원리 설명.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Screen } from '../components/Screen';
import { Button, QMark } from '../components/ui';
import { colors, radii, cardShadow, typography } from '../theme/theme';
import { useAppState } from '../state/AppState';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Interest'>,
  NativeStackScreenProps<RootStackParamList>
>;

const TIP_INTEREST =
  '나드리에 저금한 포인트와 원화는 업비트가 만든 레이어2 블록체인 GIWA 체인의 디파이 플랫폼에 예치돼요. 거기서 생긴 수익을 이자로 돌려드려요. 지갑 만들기·가스비·전송 같은 절차는 나드리가 대신 처리해요. 이자율은 시장 상황에 따라 달라질 수 있어요.';

const BENEFITS = [
  { ic: '💧', t: '꾸준히 이자가 적립돼요' },
  { ic: '🪵', t: '언제든 뺄 수 있어요' },
  { ic: '👀', t: '실시간으로 확인해요' },
];

export function InterestScreen({ navigation }: Props) {
  const { pStake, cStake } = useAppState();
  const staked = pStake > 0 || cStake > 0;

  return (
    <Screen contentStyle={styles.wrap}>
      <Text style={styles.title}>{'포인트가 자동으로\n늘어나요'}</Text>
      <Text style={styles.pig}>🐷</Text>

      <View style={styles.list}>
        {BENEFITS.map((b, i) => (
          <View key={b.t} style={[styles.row, i === BENEFITS.length - 1 && styles.rowLast]}>
            <Text style={styles.rowIc}>{b.ic}</Text>
            <Text style={styles.rowTxt}>{b.t}</Text>
          </View>
        ))}
      </View>

      <Button
        label={staked ? '이자 현황 보기' : '이자 받으러 가기'}
        variant="honey"
        large
        onPress={() => navigation.navigate('Grow')}
        style={styles.cta}
      />

      <View style={styles.ask}>
        <Text style={styles.askTxt}>이자는 어디에서 생기나요</Text>
        <QMark tip={TIP_INTEREST} openLeft />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 27, fontWeight: '900', color: colors.ink, textAlign: 'center', letterSpacing: -1, lineHeight: 36, marginTop: 8 },
  pig: { fontSize: 92, textAlign: 'center', marginTop: 12, marginBottom: 6 },
  list: { backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: 18, ...cardShadow, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLast: { borderBottomWidth: 0 },
  rowIc: { fontSize: 18 },
  rowTxt: { fontSize: 15, fontWeight: '700', color: colors.ink },
  cta: { marginTop: 24 },
  ask: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  askTxt: { fontSize: 13, fontWeight: '700', color: colors.muted },
});
