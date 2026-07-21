/**
 * 2. 체험 예치 (원금 리스크 0).
 * 규칙: 걸어서 번 리워드만 들어간다 → 여기서는 "원금 걱정 없어요"가 참.
 *       퍼센트/코인명 노출 금지. 붙는 금액은 "달라질 수 있어요".
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Amount, Button, Card } from '../../components/ui';
import { colors, typography } from '../../theme/theme';
import { useAppState, won } from '../../state/AppState';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BoostIntro'>;

const benefits = [
  { ic: '🛡️', t: '내 돈은 안 들어가요', p: '걸어서 번 리워드로만 시작해요. 그래서 원금 걱정 없이 체험할 수 있어요.' },
  { ic: '📈', t: '매일 조금씩 붙어요', p: '얼마가 붙을지는 그때그때 달라질 수 있어요.' },
  { ic: '🔓', t: '언제든 뺄 수 있어요', p: '묶이지 않아요. 원할 때 바로 받을 수 있어요.' },
];

export function BoostIntroScreen({ navigation }: Props) {
  const { balance, deposit } = useAppState();

  const start = () => {
    deposit(balance);
    navigation.navigate('BoostDashboard');
  };

  return (
    <Screen>
      <Button label="← 뒤로" variant="plain" onPress={() => navigation.goBack()} style={styles.back} />
      <View style={styles.center}>
        <Text style={styles.emoji}>🌱</Text>
        <Text style={styles.title}>{'걸어서 번 리워드,\n불려볼까요?'}</Text>
        <Text style={styles.sub}>{'걸어서 번 리워드만 들어가요.\n내 돈은 한 푼도 안 써요.'}</Text>
      </View>

      <View style={styles.amountBox}>
        <Text style={styles.boxLabel}>지금 넣어볼 수 있는 리워드</Text>
        <View style={styles.mt4}>
          <Amount value={won(balance)} color={colors.mint} />
        </View>
      </View>

      <Card flat>
        {benefits.map((b, i) => (
          <View key={b.t} style={[styles.item, i < benefits.length - 1 && styles.itemBorder]}>
            <Text style={styles.itemIc}>{b.ic}</Text>
            <View style={styles.flex1}>
              <Text style={styles.itemTitle}>{b.t}</Text>
              <Text style={styles.itemP}>{b.p}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Button label="이 리워드로 시작하기" large onPress={start} style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 14, marginBottom: 14 },
  center: { alignItems: 'center', gap: 10, marginBottom: 6 },
  emoji: { fontSize: 56 },
  title: { ...typography.display, color: colors.ink, textAlign: 'center' },
  sub: { ...typography.body, color: colors.muted, textAlign: 'center' },
  amountBox: {
    backgroundColor: colors.mintSoft,
    borderColor: 'rgba(37,99,235,0.2)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginVertical: 18,
  },
  boxLabel: { ...typography.label, color: colors.muted },
  mt4: { marginTop: 4 },
  item: { flexDirection: 'row', gap: 13, alignItems: 'flex-start', paddingVertical: 14 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  itemIc: { fontSize: 22, marginTop: 1 },
  flex1: { flex: 1 },
  itemTitle: { ...typography.body, color: colors.ink, fontWeight: '700' },
  itemP: { ...typography.caption, color: colors.muted, marginTop: 2, lineHeight: 20 },
  cta: { marginTop: 18 },
});
