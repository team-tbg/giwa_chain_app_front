/**
 * 구글 소셜 로그인 — expo-auth-session으로 OIDC id_token 획득.
 * 획득한 id_token은 서버 /auth/social 로 넘겨 검증한다(docs/11 §1).
 * 주의: useIdTokenAuthRequest는 플랫폼 클라이언트 ID가 없으면 렌더 중 throw하므로,
 *       미설정 시 placeholder를 넣어 throw만 막고 ready=false로 실사용을 차단한다.
 */
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE, isGoogleConfigured } from '../api/config';

// 인증 팝업이 리다이렉트로 돌아왔을 때 세션을 마무리.
WebBrowser.maybeCompleteAuthSession();

const PLACEHOLDER = 'unconfigured.apps.googleusercontent.com';
const configured = isGoogleConfigured();

export function useGoogleAuth() {
  // 훅은 항상 같은 순서로 호출되어야 하므로 무조건 호출하되, 미설정 플랫폼은 placeholder로 throw만 회피.
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE.webClientId || PLACEHOLDER,
    androidClientId: GOOGLE.androidClientId || PLACEHOLDER,
    iosClientId: GOOGLE.iosClientId || PLACEHOLDER,
  });

  /** 구글 로그인 팝업 → 성공 시 id_token, 취소/미설정 시 null */
  const signIn = async (): Promise<string | null> => {
    if (!configured) return null;
    const res = await promptAsync();
    if (res?.type === 'success') {
      return (res.params?.id_token as string) ?? res.authentication?.idToken ?? null;
    }
    return null;
  };

  return { ready: configured && Boolean(request), signIn };
}
