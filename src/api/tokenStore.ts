/**
 * 인증 토큰 보관. 네이티브는 expo-secure-store(암호화), 웹은 localStorage 폴백.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS = 'naduri.accessToken';
const REFRESH = 'naduri.refreshToken';

const isWeb = Platform.OS === 'web';
const webStore = (globalThis as { localStorage?: { setItem(k: string, v: string): void; getItem(k: string): string | null; removeItem(k: string): void } }).localStorage;

async function setItem(key: string, value: string) {
  if (isWeb) {
    webStore?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}
async function getItem(key: string): Promise<string | null> {
  if (isWeb) return webStore?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}
async function delItem(key: string) {
  if (isWeb) {
    webStore?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStore = {
  async save(accessToken: string, refreshToken: string) {
    await Promise.all([setItem(ACCESS, accessToken), setItem(REFRESH, refreshToken)]);
  },
  getAccess: () => getItem(ACCESS),
  getRefresh: () => getItem(REFRESH),
  async clear() {
    await Promise.all([delItem(ACCESS), delItem(REFRESH)]);
  },
};
