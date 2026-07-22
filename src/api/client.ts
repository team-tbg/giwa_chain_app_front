/**
 * HTTP 클라이언트 — base URL·인증 헤더·에러 봉투·401 자동 리프레시.
 * 스펙: docs/11-api-spec.md §0 공통 규약.
 */
import { API_BASE_URL, isApiConfigured } from './config';
import { tokenStore } from './tokenStore';

export class ApiError extends Error {
  code: string;
  status: number;
  detail?: unknown;
  constructor(status: number, code: string, message: string, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean; // 인증 헤더 부착 (기본 true)
  idempotencyKey?: string; // 금전 뮤테이션 멱등키
};

let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = await tokenStore.getRefresh();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    await tokenStore.save(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  if (!isApiConfigured()) {
    throw new ApiError(0, 'API_NOT_CONFIGURED', '서버 주소가 설정되지 않았어요. 잠시 후 다시 시도해 주세요.');
  }
  const { method = 'GET', body, auth = true, idempotencyKey } = opts;

  const run = async (): Promise<Response> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    if (auth) {
      const token = await tokenStore.getAccess();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let res: Response;
  try {
    res = await run();
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '네트워크에 연결할 수 없어요. 연결을 확인해 주세요.');
  }

  // 401 → 한 번만 리프레시 후 재시도
  if (res.status === 401 && auth) {
    refreshing = refreshing ?? refreshTokens();
    const ok = await refreshing;
    refreshing = null;
    if (ok) {
      try {
        res = await run();
      } catch {
        throw new ApiError(0, 'NETWORK_ERROR', '네트워크에 연결할 수 없어요.');
      }
    }
  }

  if (res.status === 204) return undefined as T;

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* 본문 없음 */
  }

  if (!res.ok) {
    const e = json?.error ?? {};
    throw new ApiError(res.status, e.code ?? 'UNKNOWN', e.message ?? '문제가 생겼어요. 잠시 후 다시 시도해 주세요.', e.detail);
  }
  return json as T;
}

/** 간단 UUID (멱등키용) */
export function idemKey(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
