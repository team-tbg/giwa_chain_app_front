/**
 * 파일럿용 앱 상태 (오프체인 목업).
 * 실제로는 서버 포인트 원장과 연동되지만, 지금은 화면 흐름 검증을 위한 로컬 상태.
 * 불변 규칙: 가짜 잔고/숨은 차감 금지 — 여기 값은 그대로 화면에 되비추는 용도.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Provider = 'google' | 'toss';
export type User = { name: string; provider: Provider };

type AppState = {
  user: User | null; // 로그인 사용자
  steps: number; // 오늘 걸음 수
  goal: number; // 오늘 목표
  pendingPoints: number; // 아직 안 받은 리워드
  balance: number; // 모은 리워드(원)
  boostedAmount: number; // 불리기에 넣은 금액
  growth: number; // 불리기로 붙은 금액(시뮬레이션)
};

type AppActions = {
  login: (user: User) => void; // 로그인
  logout: () => void;
  collect: () => void; // 받을 리워드를 잔고로
  deposit: (amount: number) => void; // 리워드를 불리기에
  tickGrowth: (delta: number) => void; // 이자 시뮬레이션 증가
  reset: () => void;
};

const initial: AppState = {
  user: null,
  steps: 6432,
  goal: 10000,
  pendingPoints: 62,
  balance: 21400,
  boostedAmount: 0,
  growth: 0,
};

const Ctx = createContext<(AppState & AppActions) | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initial);

  const login = useCallback((user: User) => {
    setState((s) => ({ ...s, user }));
  }, []);

  const logout = useCallback(() => {
    setState((s) => ({ ...s, user: null }));
  }, []);

  const collect = useCallback(() => {
    setState((s) =>
      s.pendingPoints <= 0
        ? s
        : { ...s, balance: s.balance + s.pendingPoints, pendingPoints: 0 },
    );
  }, []);

  const deposit = useCallback((amount: number) => {
    setState((s) => ({ ...s, boostedAmount: s.boostedAmount + amount }));
  }, []);

  const tickGrowth = useCallback((delta: number) => {
    setState((s) => ({ ...s, growth: s.growth + delta }));
  }, []);

  const reset = useCallback(() => setState(initial), []);

  const value = useMemo(
    () => ({ ...state, login, logout, collect, deposit, tickGrowth, reset }),
    [state, login, logout, collect, deposit, tickGrowth, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export const won = (n: number) => Math.round(n).toLocaleString('ko-KR');
