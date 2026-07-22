/**
 * 인증 API — 소셜 로그인/로그아웃. 스펙: docs/11-api-spec.md §1.
 * 클라이언트가 provider 토큰(구글 id_token / 토스 authCode)을 획득해 서버에 넘기면,
 * 서버가 검증 후 자체 JWT 발급 + 임베디드 지갑 자동 생성.
 */
import { Platform } from 'react-native';
import { api } from './client';
import { tokenStore } from './tokenStore';

export type Provider = 'google' | 'toss';

export type ApiUser = {
  id: string;
  nickname: string;
  provider: Provider;
  wallet?: { upid: string; address: string; network: string };
};

type SocialLoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isNewUser: boolean;
  user: ApiUser;
};

type SocialLoginInput = {
  provider: Provider;
  idToken?: string; // google
  authCode?: string; // toss
  pushToken?: string;
};

export async function socialLogin(input: SocialLoginInput): Promise<ApiUser> {
  const res = await api<SocialLoginResponse>('/auth/social', {
    method: 'POST',
    auth: false,
    body: {
      provider: input.provider,
      idToken: input.idToken ?? null,
      authCode: input.authCode ?? null,
      device: { os: Platform.OS, pushToken: input.pushToken ?? null },
    },
  });
  await tokenStore.save(res.accessToken, res.refreshToken);
  return res.user;
}

export async function logout(): Promise<void> {
  const refreshToken = await tokenStore.getRefresh();
  try {
    if (refreshToken) await api('/auth/logout', { method: 'POST', auth: false, body: { refreshToken } });
  } catch {
    /* 서버 실패해도 로컬 토큰은 지운다 */
  }
  await tokenStore.clear();
}
