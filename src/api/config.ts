/**
 * API·인증 환경설정. 우선순위: EXPO_PUBLIC_* 환경변수 > app.json extra.
 * 실서비스 값(백엔드 URL, OAuth 클라이언트 ID)은 배포 환경에서 주입한다.
 */
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra
  ?? (Constants as { manifest?: { extra?: Record<string, string> } }).manifest?.extra
  ?? (Constants as { manifest2?: { extra?: { expoClient?: { extra?: Record<string, string> } } } }).manifest2?.extra?.expoClient?.extra
  ?? {}) as Record<string, string | undefined>;

const env = process.env as Record<string, string | undefined>;
const pick = (envKey: string, extraKey: string) => env[envKey] || extra[extraKey] || '';

/** 백엔드 API base URL (예: https://api.stg.naduri.app/v1) */
export const API_BASE_URL = pick('EXPO_PUBLIC_API_BASE_URL', 'apiBaseUrl');

/** 구글 OAuth 클라이언트 ID (플랫폼별) */
export const GOOGLE = {
  webClientId: pick('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'googleWebClientId'),
  androidClientId: pick('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', 'googleAndroidClientId'),
  iosClientId: pick('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'googleIosClientId'),
};

export const isApiConfigured = () => API_BASE_URL.length > 0;
export const isGoogleConfigured = () =>
  Boolean(GOOGLE.webClientId || GOOGLE.androidClientId || GOOGLE.iosClientId);
