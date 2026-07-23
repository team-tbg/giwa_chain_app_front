/**
 * 온보딩 = 진입/로그인 (v10 onboard 그대로).
 * "열린 금융을 향한 발걸음 · 나드리" + 구글 계속하기 + 추천인 코드.
 * (v10의 "이메일로 계속하기"는 제외. 2차 소셜은 검토 중 — 카카오는 가상자산 제한 정책으로 제외.)
 * 구글: expo-auth-session id_token → 서버 /auth/social(docs/11 §1).
 */
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { notify } from '../lib/alert';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { colors, radii, typography } from '../theme/theme';
import { useAppState, type Provider } from '../state/AppState';
import { socialLogin } from '../api/auth';
import { ApiError } from '../api/client';
import { isApiConfigured, isGoogleConfigured } from '../api/config';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const { login, refUsed, redeemReferral } = useAppState();
  const google = useGoogleAuth();
  const [busy, setBusy] = useState<Provider | null>(null);
  const [refOpen, setRefOpen] = useState(false);
  const [code, setCode] = useState('');

  const start = async (provider: Provider) => {
    if (busy) return;
    try {
      setBusy(provider);
      if (!isApiConfigured()) {
        notify('서버 설정 필요', '백엔드 API 주소(EXPO_PUBLIC_API_BASE_URL)를 설정해 주세요.');
        return;
      }
      if (!isGoogleConfigured() || !google.ready) {
        notify('구글 로그인 설정 필요', '구글 OAuth 클라이언트 ID를 설정해 주세요.');
        return;
      }
      const idToken = await google.signIn();
      if (!idToken) return; // 취소
      const user = await socialLogin({ provider: 'google', idToken });
      login({ name: user.nickname, provider: 'google' });
      navigation.replace('Main');
    } catch (e) {
      const raw = e instanceof ApiError ? e.message : (e as { message?: string })?.message;
      notify('로그인 실패', raw ? String(raw) : '로그인 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(null);
    }
  };

  const registerCode = () => {
    if (refUsed) {
      notify('이미 추천인 코드를 넣었어요', '한 계정에 한 번만 넣을 수 있어요.');
      return;
    }
    if (code.trim().length < 4) {
      notify('코드를 정확히 입력해주세요');
      return;
    }
    redeemReferral(code);
    setRefOpen(false);
    setCode('');
    notify('추천인 코드를 등록했어요', '+500P를 받았어요. 첫 걸음을 적립하면 양쪽 모두에게 지급돼요.');
  };

  return (
    <Screen scroll={false} contentStyle={styles.wrap}>
      <View style={styles.brand}>
        <Text style={styles.sub}>열린 금융을 향한 발걸음</Text>
        <Text style={styles.logo}>나드리</Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          disabled={busy !== null}
          onPress={() => start('google')}
          style={({ pressed }) => [styles.obBtn, pressed && styles.pressed, busy && styles.dim]}
        >
          {busy === 'google' ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <>
              <View style={styles.gBadge}><Text style={styles.gLetter}>G</Text></View>
              <Text style={styles.obLabel}>구글로 계속하기</Text>
            </>
          )}
        </Pressable>

        <Pressable onPress={() => setRefOpen(true)} style={styles.linkb}>
          <Text style={styles.linkText}>추천인 코드가 있어요</Text>
        </Pressable>

        {__DEV__ && (
          <Pressable
            disabled={busy !== null}
            onPress={() => {
              login({ name: '게스트', provider: 'google' });
              navigation.replace('Main');
            }}
            style={styles.devBtn}
          >
            <Text style={styles.devText}>개발용으로 둘러보기 (백엔드 없이)</Text>
          </Pressable>
        )}
      </View>

      {/* 추천인 코드 시트 */}
      <Modal visible={refOpen} transparent animationType="slide" onRequestClose={() => setRefOpen(false)}>
        <Pressable style={styles.mask} onPress={() => setRefOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>추천인 코드를 넣어보세요</Text>
          <Text style={styles.sheetSub}>코드를 넣으면 나도 500P, 초대한 친구도 500P를 받아요</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="예: NADURI7"
            placeholderTextColor={colors.dim}
            autoCapitalize="characters"
            style={styles.input}
          />
          <Pressable style={styles.priBtn} onPress={registerCode}>
            <Text style={styles.priBtnText}>코드 등록하기</Text>
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={() => setRefOpen(false)}>
            <Text style={styles.ghostBtnText}>나중에 할게요</Text>
          </Pressable>
          <Text style={styles.sheetNote}>가입하고 첫 걸음을 적립하면 양쪽 모두에게 지급돼요.{'\n'}초대 포인트는 하루 적립 한도에 들어가지 않아요.</Text>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 26, paddingBottom: 30 },
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sub: { fontSize: 14, fontWeight: '700', color: colors.muted, letterSpacing: -0.2 },
  logo: { fontSize: 46, fontWeight: '900', color: colors.primary, letterSpacing: -2, marginTop: 8 },

  buttons: { gap: 10, paddingBottom: 20 },
  obBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    height: 54, borderRadius: 15, borderWidth: 1.5, borderColor: colors.line, backgroundColor: '#fff',
  },
  pressed: { transform: [{ scale: 0.985 }] },
  dim: { opacity: 0.7 },
  obLabel: { fontSize: 15, fontWeight: '800', color: colors.ink },
  gBadge: { width: 20, height: 20, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  gLetter: { fontSize: 12, fontWeight: '900', color: '#4285F4' },

  linkb: { alignItems: 'center', paddingVertical: 10 },
  linkText: { fontSize: 13.5, fontWeight: '700', color: colors.muted, textDecorationLine: 'underline' },

  devBtn: { alignItems: 'center', paddingVertical: 8 },
  devText: { fontSize: 13, fontWeight: '700', color: colors.dim, textDecorationLine: 'underline' },

  // 시트
  mask: { flex: 1, backgroundColor: 'rgba(12,20,34,0.42)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 30 },
  handle: { width: 38, height: 4, borderRadius: 99, backgroundColor: '#E2E6ED', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 19, fontWeight: '900', color: colors.ink, textAlign: 'center', letterSpacing: -0.5 },
  sheetSub: { fontSize: 13.5, fontWeight: '600', color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  input: { borderWidth: 1.5, borderColor: colors.line, borderRadius: 15, padding: 15, fontSize: 19, fontWeight: '900', textAlign: 'center', color: colors.ink, marginTop: 16, letterSpacing: 2 },
  priBtn: { backgroundColor: colors.primary, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 16 },
  priBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  ghostBtn: { backgroundColor: '#EEF1F6', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 8 },
  ghostBtnText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  sheetNote: { fontSize: 12, fontWeight: '600', color: colors.muted, textAlign: 'center', marginTop: 16, lineHeight: 19 },
});
