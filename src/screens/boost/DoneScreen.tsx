/** 6. 완료 — 입금 완료 안내. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/ui';
import { colors, typography } from '../../theme/theme';
import { useAppState, won } from '../../state/AppState';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Done'>;

export function DoneScreen({ navigation, route }: Props) {
  const { deposit } = useAppState();
  const amount = route.params?.amount ?? 0;

  const goHome = () => {
    if (amount > 0) deposit(amount);
    navigation.navigate('Main');
  };

  return (
    <Screen scroll={false} contentStyle={styles.wrap}>
      <Text style={styles.emoji}>🎉</Text>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{won(amount)}원 입금 완료!</Text>
        <Text style={styles.sub}>{'내일부터 조금씩 굴러가기 시작해요.\n가끔 들어와서 얼마나 됐는지 확인해 보세요.'}</Text>
      </View>
      <Button label="홈으로" large onPress={goHome} style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  emoji: { fontSize: 76 },
  textWrap: { alignItems: 'center', gap: 12 },
  title: { ...typography.display, color: colors.ink, textAlign: 'center' },
  sub: { ...typography.body, color: colors.muted, textAlign: 'center' },
  cta: { maxWidth: 280, width: '100%' },
});
