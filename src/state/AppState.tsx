/**
 * 파일럿용 앱 상태 (오프체인 목업) — v10 프로토타입 화폐 모델.
 * 포인트(P) = 걸어서 버는 적립 화폐 / 원화(원) = 진짜 돈 / 비트코인·금 = 포인트샵 매수 자산.
 * 이자받기(저금)는 GIWA 디파이 이자 시뮬레이션(우리 재원). 확정 아님.
 * 불변 규칙: 가짜 잔고/숨은 차감 금지 — 여기 값은 그대로 화면에 되비추는 용도.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { logout as apiLogout } from '../api/auth';

export type Provider = 'google' | 'toss';
export type User = { name: string; provider: Provider };

/** 하루에 모을 수 있는 포인트 상한(P). 걸음·출석·퀴즈·게임·영상에 적용. */
export const DAILY_CAP = 200;
/** 자산 시세(원). 파일럿 고정값(업비트 오라클 자리). */
export const PRICE = { btc: 158_400_000, gold: 4_620_000 } as const;

type AppState = {
  user: User | null; // 로그인 사용자
  steps: number; // 오늘 걸음 수
  goal: number; // 오늘 목표
  streak: number; // 연속으로 걸은 일수
  stepClaimed: boolean; // 오늘 걸음 포인트를 받았는지

  points: number; // 쓸 수 있는 포인트(P)
  todayEarned: number; // 오늘 모은 포인트(P) — 일일 한도 대비

  pStake: number; // 이자받기에 저금한 포인트(P)
  pEarn: number; // 저금 포인트에 붙은 이자(P)

  cash: number; // 원화 자산 — 저금 안 한 돈(원)
  cStake: number; // 이자받기에 저금한 원화(원)
  cEarn: number; // 저금 원화에 붙은 이자(원)

  hold: { btc: number; gold: number }; // 보유 수량

  refUsed: boolean; // 추천인 코드 사용 여부(1계정 1회)
};

type AppActions = {
  login: (user: User) => void;
  logout: () => void;
  reset: () => void;

  claimSteps: () => void; // 걸어서 받을 포인트를 받기
  stakePoints: (amt: number) => void; // 포인트 저금
  unstakePoints: () => void; // 포인트 저금 그만 (원금+이자 → points)
  depositCash: (won: number) => void; // 원화 입금
  withdrawCash: (won: number) => void; // 원화 출금(내 계좌로)
  stakeCash: (amt: number) => void; // 원화 저금
  unstakeCash: () => void; // 원화 저금 그만
  pointsToCash: (p: number, won: number) => void; // 포인트를 현금으로
  buyAsset: (kind: 'btc' | 'gold', p: number, qty: number) => void; // 포인트로 매수
  sellAsset: (kind: 'btc' | 'gold') => void; // 자산을 원화로 되팔기
  tickGrowth: () => void; // 이자 1틱 증가(시뮬레이션)
  redeemReferral: (code: string) => void; // 추천인 코드 등록(+500P, 1회). 검증은 호출부에서.
};

const initial: AppState = {
  user: null,
  steps: 6432,
  goal: 10000,
  streak: 7,
  stepClaimed: false,

  points: 30154,
  todayEarned: 0,

  pStake: 0,
  pEarn: 0,

  cash: 0,
  cStake: 0,
  cEarn: 0,

  hold: { btc: 0, gold: 0 },

  refUsed: false,
};

const Ctx = createContext<(AppState & AppActions) | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initial);

  const login = useCallback((user: User) => setState((s) => ({ ...s, user })), []);
  const logout = useCallback(() => {
    void apiLogout(); // 서버 세션·저장 토큰 정리(실패해도 로컬은 초기화)
    setState((s) => ({ ...s, user: null }));
  }, []);
  const reset = useCallback(() => setState(initial), []);

  const claimSteps = useCallback(() => {
    setState((s) => {
      if (s.stepClaimed) return s;
      const claim = Math.floor(s.steps / 100);
      const room = Math.max(0, DAILY_CAP - s.todayEarned);
      const got = Math.min(claim, room);
      return { ...s, points: s.points + got, todayEarned: s.todayEarned + got, stepClaimed: true };
    });
  }, []);

  const stakePoints = useCallback((amt: number) => {
    setState((s) => ({ ...s, points: Math.max(0, s.points - amt), pStake: s.pStake + amt }));
  }, []);
  const unstakePoints = useCallback(() => {
    setState((s) => ({ ...s, points: s.points + s.pStake + s.pEarn, pStake: 0, pEarn: 0 }));
  }, []);

  const depositCash = useCallback((won: number) => {
    setState((s) => ({ ...s, cash: s.cash + won }));
  }, []);
  const withdrawCash = useCallback((won: number) => {
    setState((s) => ({ ...s, cash: Math.max(0, s.cash - won) }));
  }, []);
  const stakeCash = useCallback((amt: number) => {
    setState((s) => ({ ...s, cash: Math.max(0, s.cash - amt), cStake: s.cStake + amt }));
  }, []);
  const unstakeCash = useCallback(() => {
    setState((s) => ({ ...s, cash: s.cash + s.cStake + s.cEarn, cStake: 0, cEarn: 0 }));
  }, []);

  const pointsToCash = useCallback((p: number, won: number) => {
    setState((s) => ({ ...s, points: Math.max(0, s.points - p), cash: s.cash + won }));
  }, []);
  const buyAsset = useCallback((kind: 'btc' | 'gold', p: number, qty: number) => {
    setState((s) => ({
      ...s,
      points: Math.max(0, s.points - p),
      hold: { ...s.hold, [kind]: s.hold[kind] + qty },
    }));
  }, []);
  const sellAsset = useCallback((kind: 'btc' | 'gold') => {
    setState((s) => ({
      ...s,
      cash: s.cash + s.hold[kind] * PRICE[kind],
      hold: { ...s.hold, [kind]: 0 },
    }));
  }, []);

  const redeemReferral = useCallback((code: string) => {
    setState((s) => (s.refUsed || code.trim().length < 4 ? s : { ...s, refUsed: true, points: s.points + 500 }));
  }, []);

  const tickGrowth = useCallback(() => {
    setState((s) => ({
      ...s,
      pEarn: s.pStake > 0 ? s.pEarn + s.pStake * 0.0000004 + 0.02 : s.pEarn,
      cEarn: s.cStake > 0 ? s.cEarn + s.cStake * 0.0000004 + 1 : s.cEarn,
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state, login, logout, reset, claimSteps, stakePoints, unstakePoints,
      depositCash, withdrawCash, stakeCash, unstakeCash, pointsToCash, buyAsset, sellAsset, tickGrowth, redeemReferral,
    }),
    [state, login, logout, reset, claimSteps, stakePoints, unstakePoints,
      depositCash, withdrawCash, stakeCash, unstakeCash, pointsToCash, buyAsset, sellAsset, tickGrowth, redeemReferral],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

/** 파생값 헬퍼 */
export const claimableP = (s: { steps: number; stepClaimed: boolean }) =>
  s.stepClaimed ? 0 : Math.floor(s.steps / 100);
export const pTotal = (s: { pStake: number; pEarn: number }) => s.pStake + s.pEarn;
export const cTotal = (s: { cStake: number; cEarn: number }) => s.cStake + s.cEarn;
export const netWorth = (s: AppState) =>
  s.points + pTotal(s) + s.cash + cTotal(s) + s.hold.btc * PRICE.btc + s.hold.gold * PRICE.gold;

/** 원 단위 표기 */
export const won = (n: number) => Math.round(n).toLocaleString('ko-KR');
/** 포인트 표기(정수) */
export const fmtP = (n: number) => Math.floor(n).toLocaleString('ko-KR');
/** 소수 자리 표기 */
export const fmtd = (n: number, d: number) =>
  n.toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d });
