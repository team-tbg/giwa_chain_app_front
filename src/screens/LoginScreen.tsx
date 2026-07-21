/**
 * 로그인 — SNS 간편 로그인 (구글 · 토스).
 * 규칙: 크립토·지갑 언급 없음. 최소 단계로 진입.
 * (OAuth 실연동은 서버/SDK 붙이면 start() 내부만 교체)
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { colors, radii, typography } from '../theme/theme';
import { useAppState, type Provider } from '../state/AppState';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAppState();

  const start = (provider: Provider) => {
    login({ name: '회원', provider });
    navigation.replace('Main');
  };

  return (
    <Screen scroll={false} contentStyle={styles.wrap}>
      <View style={styles.top}>
        <Text style={styles.logo}>🌿</Text>
        <Text style={styles.title}>간편하게 시작해요</Text>
        <Text style={styles.sub}>자주 쓰는 계정으로 3초 만에 시작할 수 있어요.</Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          accessibilityRole="button"
          onPress={() => start('google')}
          style={({ pressed }) => [styles.snsBtn, styles.google, pressed && styles.pressed]}
        >
          <View style={styles.gBadge}>
            <Text style={styles.gLetter}>G</Text>
          </View>
          <Text style={styles.googleLabel}>Google로 시작하기</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => start('toss')}
          style={({ pressed }) => [styles.snsBtn, styles.toss, pressed && styles.pressed]}
        >
          <Text style={styles.tossMark}>toss</Text>
          <Text style={styles.tossLabel}>토스로 시작하기</Text>
        </Pressable>

        <Text style={styles.note}>
          계속하면 서비스 약관과 개인정보 처리방침에 동의하게 돼요.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'space-between' },
  top: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  logo: { fontSize: 64 },
  title: { ...typography.display, color: colors.ink, textAlign: 'center' },
  sub: { ...typography.body, color: colors.muted, textAlign: 'center' },
  bottom: { gap: 12, paddingBottom: 8 },

  snsBtn: {
    height: 58,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pressed: { transform: [{ scale: 0.98 }] },

  // Google — 화이트 + 테두리
  google: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: colors.line },
  gBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gLetter: { fontSize: 15, fontWeight: '800', color: '#4285F4' },
  googleLabel: { fontSize: 17, fontWeight: '800', color: colors.ink },

  // Toss — 토스 블루
  toss: { backgroundColor: '#3182F6' },
  tossMark: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  tossLabel: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },

  note: { ...typography.caption, color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 19 },
});
