/**
 * 구글 로그인 — 네이티브(안드로이드/iOS)는 공식 SDK(@react-native-google-signin), 웹은 expo-auth-session.
 * 이유: 네이티브에서 expo-auth-session의 implicit id_token은 구글이 막아 `invalid_request`가 남.
 * 공식 SDK는 계정 선택 → id_token(aud = webClientId) 반환. 서버 /auth/social에서 이 id_token 검증(docs/11 §1).
 * ⚠️ 안드로이드는 콘솔의 Android OAuth 클라이언트에 "이 빌드의 SHA-1"이 등록돼 있어야 함(android/app/debug.keystore).
 */
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE, isGoogleConfigured } from '../api/config';

WebBrowser.maybeCompleteAuthSession();

const PLACEHOLDER = 'unconfigured.apps.googleusercontent.com';
const configured = isGoogleConfigured();

// 네이티브 전용 SDK — 웹 번들에서 실행되지 않도록 가드 require.
let GSignin: { hasPlayServices: () => Promise<unknown>; signIn: () => Promise<any>; configure: (o: object) => void } | null = null;
if (Platform.OS !== 'web' && GOOGLE.webClientId) {
  try {
    GSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    GSignin?.configure({ webClientId: GOOGLE.webClientId, offlineAccess: false });
  } catch {
    GSignin = null;
  }
}

export function useGoogleAuth() {
  // 웹용 expo-auth-session (네이티브에선 promptAsync 미사용, throw 방지용 placeholder)
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE.webClientId || PLACEHOLDER,
    androidClientId: GOOGLE.androidClientId || PLACEHOLDER,
    iosClientId: GOOGLE.iosClientId || PLACEHOLDER,
  });

  /** 로그인 → id_token, 취소/미설정 시 null */
  const signIn = async (): Promise<string | null> => {
    if (!configured) return null;

    if (Platform.OS !== 'web') {
      if (!GSignin) return null;
      await GSignin.hasPlayServices();
      const res = await GSignin.signIn();
      if (!res || res.type === 'cancelled') return null;
      return res?.data?.idToken ?? res?.idToken ?? null;
    }

    const res = await promptAsync();
    if (res?.type === 'success') {
      return (res.params?.id_token as string) ?? res.authentication?.idToken ?? null;
    }
    return null;
  };

  const ready = configured && (Platform.OS !== 'web' ? !!GSignin : !!request);
  return { ready, signIn };
}
