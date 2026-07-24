/**
 * 파일럿용 앱 상태 (오프체인 목업) — v10 프로토타입 화폐 모델.
 * 포인트(P) = 걸어서 버는 적립 화폐 / 원화(원) = 진짜 돈 / 비트코인·금 = 포인트샵 매수 자산.
 * 이자받기(저금)는 GIWA 디파이 이자 시뮬레이션(우리 재원). 확정 아님.
 * 불변 규칙: 가짜 잔고/숨은 차감 금지 — 여기 값은 그대로 화면에 되비추는 용도.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { logout as apiLogout } from '../api/auth';

export type Provider = 'google';
export type User = { name: string; provider: Provider };

/** 포인트/자산 거래 원장 항목 (최근 내역·활동 기록용) */
export type LedgerEntry = { id: number; why: string; amount: number; unit: 'P' | 'KRW'; at: number };

let _lid = 0;
const pushLog = (hist: LedgerEntry[], why: string, amount: number, unit: 'P' | 'KRW'): LedgerEntry[] =>
  [{ id: ++_lid, why, amount, unit, at: Date.now() }, ...hist].slice(0, 50);

/** 하루에 모을 수 있는 포인트 상한(P). 걸음·출석·퀴즈·게임·영상에 적용. 보너스·룰렛·설문·친구 초대는 별도(한도 미포함). */
export const DAILY_CAP = 200;
/** 걷기(만보)로 하루에 받을 수 있는 포인트 상한(P). */
export const WALK_MAX = 100;
/** 자산 시세(원). 파일럿 고정값(업비트 오라클 자리). */
export const PRICE = { btc: 158_400_000, gold: 4_620_000 } as const;

/** 포인트 적립 활동 보상/규칙 */
export const ATT_REWARD = 10; // 출석체크 1회
export const QUIZ_REWARD = 5; // OX 퀴즈 정답 1문제
export const QUIZ_DAILY = 5; // 하루 풀 수 있는 퀴즈 수
export const BONUS_COOLDOWN_MS = 6 * 3600 * 1000; // 보너스 6시간 쿨다운
/** 오늘의 보너스 가중 추첨표 [지급P, 가중치] — 대부분 소액, 아주 가끔 큰 금액(v10) */
export const BONUS_TABLE: ReadonlyArray<readonly [number, number]> = [
  [1, 30], [2, 25], [3, 22], [5, 12], [10, 8], [50, 2.2], [100, 0.5], [150, 0.2], [200, 0.08], [300, 0.02],
];
/** 가중 추첨으로 보너스 금액 하나 뽑기 */
export function pickBonus(): number {
  const total = BONUS_TABLE.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [amt, w] of BONUS_TABLE) {
    if ((r -= w) <= 0) return amt;
  }
  return BONUS_TABLE[0][0];
}
/** 오늘 남은 적립 한도(P) */
export const capRoom = (s: { todayEarned: number }) => Math.max(0, DAILY_CAP - s.todayEarned);

type AppState = {
  user: User | null; // 로그인 사용자
  steps: number; // 오늘 걸음 수
  goal: number; // 오늘 목표
  streak: number; // 연속으로 걸은 일수
  stepClaimed: boolean; // 오늘 걸음 포인트를 받았는지

  points: number; // 쓸 수 있는 포인트(P)
  todayEarned: number; // 오늘 모은 포인트(P) — 일일 한도(200P) 대비 (걸음·출석·퀴즈·게임·영상)
  todayBonus: number; // 오늘 받은 보너스(P) — 한도 미포함, 표시용 별도 집계

  pStake: number; // 이자받기에 저금한 포인트(P)
  pEarn: number; // 저금 포인트에 붙은 이자(P)

  cash: number; // 원화 자산 — 저금 안 한 돈(원)
  cStake: number; // 이자받기에 저금한 원화(원)
  cEarn: number; // 저금 원화에 붙은 이자(원)

  hold: { btc: number; gold: number }; // 보유 수량

  refUsed: boolean; // 추천인 코드 사용 여부(1계정 1회)

  attToday: boolean; // 오늘 출석했는지
  lastBonusAt: number; // 보너스 마지막 개봉 시각(ms). 0=아직
  quizSolvedToday: number; // 오늘 푼 퀴즈 수
  quizIndex: number; // 다음에 낼 퀴즈 인덱스(순차)

  history: LedgerEntry[]; // 최근 거래·활동 원장(내 지갑 최근 내역·활동 기록)
  push: boolean; // 푸시 알림 on/off
};

type AppActions = {
  login: (user: User) => void;
  logout: () => void;
  reset: () => void;

  setSteps: (n: number) => void; // 측정된 걸음수 반영(프론트 관리, DB 저장 안 함)
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

  checkAttendance: () => void; // 출석체크(+ATT_REWARD, 하루 1회, 한도 적용)
  claimBonus: (amount: number) => void; // 오늘의 보너스 수령(한도 미적용). 금액은 호출부에서 추첨.
  answerQuiz: (correct: boolean) => void; // 퀴즈 답변(정답이면 +QUIZ_REWARD, 한도 적용)
  togglePush: () => void; // 푸시 알림 토글
};

const initial: AppState = {
  user: null,
  steps: 6432,
  goal: 10000,
  streak: 7,
  stepClaimed: false,

  points: 30154,
  todayEarned: 0,
  todayBonus: 0,

  pStake: 0,
  pEarn: 0,

  cash: 0,
  cStake: 0,
  cEarn: 0,

  hold: { btc: 0, gold: 0 },

  refUsed: false,

  attToday: false,
  lastBonusAt: 0,
  quizSolvedToday: 0,
  quizIndex: 0,

  history: [],
  push: false,
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

  const setSteps = useCallback((n: number) => {
    setState((s) => (n === s.steps ? s : { ...s, steps: n }));
  }, []);

  const claimSteps = useCallback(() => {
    setState((s) => {
      if (s.stepClaimed) return s;
      const claim = Math.min(WALK_MAX, Math.floor(s.steps / 100)); // 만보 최대 100P
      const got = Math.min(claim, capRoom(s));
      if (got <= 0) return { ...s, stepClaimed: true };
      return {
        ...s, points: s.points + got, todayEarned: s.todayEarned + got, stepClaimed: true,
        history: pushLog(s.history, '걸음 포인트', got, 'P'),
      };
    });
  }, []);

  const stakePoints = useCallback((amt: number) => {
    setState((s) => (amt <= 0 ? s : {
      ...s, points: Math.max(0, s.points - amt), pStake: s.pStake + amt,
      history: pushLog(s.history, '포인트 저금', -amt, 'P'),
    }));
  }, []);
  const unstakePoints = useCallback(() => {
    setState((s) => {
      const t = s.pStake + s.pEarn;
      return t <= 0 ? s : { ...s, points: s.points + t, pStake: 0, pEarn: 0, history: pushLog(s.history, '이자받기에서 빼기', t, 'P') };
    });
  }, []);

  const depositCash = useCallback((won: number) => {
    setState((s) => ({ ...s, cash: s.cash + won, history: pushLog(s.history, '입금', won, 'KRW') }));
  }, []);
  const withdrawCash = useCallback((won: number) => {
    setState((s) => {
      const v = Math.min(won, s.cash);
      return v <= 0 ? s : { ...s, cash: s.cash - v, history: pushLog(s.history, '계좌로 출금', -v, 'KRW') };
    });
  }, []);
  const stakeCash = useCallback((amt: number) => {
    setState((s) => (amt <= 0 ? s : {
      ...s, cash: Math.max(0, s.cash - amt), cStake: s.cStake + amt,
      history: pushLog(s.history, '자산 저금', -amt, 'KRW'),
    }));
  }, []);
  const unstakeCash = useCallback(() => {
    setState((s) => {
      const t = s.cStake + s.cEarn;
      return t <= 0 ? s : { ...s, cash: s.cash + t, cStake: 0, cEarn: 0, history: pushLog(s.history, '자산 저금 해제', t, 'KRW') };
    });
  }, []);

  const pointsToCash = useCallback((p: number, won: number) => {
    setState((s) => ({
      ...s, points: Math.max(0, s.points - p), cash: s.cash + won,
      history: pushLog(s.history, '포인트를 현금으로', -p, 'P'),
    }));
  }, []);
  const buyAsset = useCallback((kind: 'btc' | 'gold', p: number, qty: number) => {
    setState((s) => ({
      ...s,
      points: Math.max(0, s.points - p),
      hold: { ...s.hold, [kind]: s.hold[kind] + qty },
      history: pushLog(s.history, kind === 'btc' ? '비트코인 구매' : '금 구매', -p, 'P'),
    }));
  }, []);
  const sellAsset = useCallback((kind: 'btc' | 'gold') => {
    setState((s) => {
      const v = s.hold[kind] * PRICE[kind];
      return v <= 0 ? s : {
        ...s, cash: s.cash + v, hold: { ...s.hold, [kind]: 0 },
        history: pushLog(s.history, kind === 'btc' ? '비트코인 원화 전환' : '금 원화 전환', Math.round(v), 'KRW'),
      };
    });
  }, []);

  const redeemReferral = useCallback((code: string) => {
    setState((s) => (s.refUsed || code.trim().length < 4 ? s : {
      ...s, refUsed: true, points: s.points + 500, history: pushLog(s.history, '추천인 코드', 500, 'P'),
    }));
  }, []);

  const checkAttendance = useCallback(() => {
    setState((s) => {
      if (s.attToday) return s;
      const g = Math.min(ATT_REWARD, capRoom(s));
      return {
        ...s, attToday: true, streak: s.streak + 1, points: s.points + g, todayEarned: s.todayEarned + g,
        history: g > 0 ? pushLog(s.history, '출석체크', g, 'P') : s.history,
      };
    });
  }, []);

  const claimBonus = useCallback((amount: number) => {
    // 보너스는 일일 한도 미적용(v10) — 총 포인트에 바로 반영 + 오늘 보너스 별도 집계(표시용).
    setState((s) => ({
      ...s, points: s.points + amount, todayBonus: s.todayBonus + amount,
      lastBonusAt: Date.now(), history: pushLog(s.history, '오늘의 보너스', amount, 'P'),
    }));
  }, []);

  const answerQuiz = useCallback((correct: boolean) => {
    setState((s) => {
      const g = correct ? Math.min(QUIZ_REWARD, capRoom(s)) : 0;
      return {
        ...s,
        quizIndex: s.quizIndex + 1,
        quizSolvedToday: correct ? s.quizSolvedToday + 1 : s.quizSolvedToday,
        points: s.points + g,
        todayEarned: s.todayEarned + g,
        history: g > 0 ? pushLog(s.history, 'OX 퀴즈 정답', g, 'P') : s.history,
      };
    });
  }, []);

  const togglePush = useCallback(() => setState((s) => ({ ...s, push: !s.push })), []);

  const tickGrowth = useCallback(() => {
    setState((s) => ({
      ...s,
      pEarn: s.pStake > 0 ? s.pEarn + s.pStake * 0.0000004 + 0.02 : s.pEarn,
      cEarn: s.cStake > 0 ? s.cEarn + s.cStake * 0.0000004 + 1 : s.cEarn,
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state, login, logout, reset, setSteps, claimSteps, stakePoints, unstakePoints,
      depositCash, withdrawCash, stakeCash, unstakeCash, pointsToCash, buyAsset, sellAsset, tickGrowth, redeemReferral,
      checkAttendance, claimBonus, answerQuiz, togglePush,
    }),
    [state, login, logout, reset, setSteps, claimSteps, stakePoints, unstakePoints,
      depositCash, withdrawCash, stakeCash, unstakeCash, pointsToCash, buyAsset, sellAsset, tickGrowth, redeemReferral,
      checkAttendance, claimBonus, answerQuiz, togglePush],
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
  s.stepClaimed ? 0 : Math.min(WALK_MAX, Math.floor(s.steps / 100));
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
