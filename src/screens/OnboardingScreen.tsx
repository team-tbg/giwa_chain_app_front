/**
 * 0. 온보딩 — 무해한 입장.
 * 규칙: 크립토·지갑·투자 언급 최소화. 걷기 권한만 받고 시작.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Button } from '../components/ui';
import { colors, typography } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  return (
    <Screen scroll={false} contentStyle={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🚶‍♀️</Text>
        <Text style={styles.title}>{'걸으면 쌓이는 리워드,\n나드리'}</Text>
        <Text style={styles.sub}>{'오늘도 걸으셨죠?\n그 걸음, 이제 리워드로 바꿔 드려요.'}</Text>
      </View>
      <View style={styles.footer}>
        <Button label="시작하기" large onPress={() => navigation.replace('Login')} />
        <Text style={styles.note}>가입은 30초면 끝나요. 어려운 건 하나도 없어요.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  emoji: { fontSize: 76 },
  title: { ...typography.display, color: colors.ink, textAlign: 'center' },
  sub: { ...typography.body, color: colors.muted, textAlign: 'center' },
  footer: { gap: 14 },
  note: { ...typography.caption, color: colors.muted, textAlign: 'center' },
});
