/**
 * 파일럿용 앱 상태 (오프체인 목업) — v10 프로토타입 화폐 모델.
 * 포인트(P) = 걸어서 버는 적립 화폐 / 원화(원) = 진짜 돈 / 비트코인·금 = 포인트샵 매수 자산.
 * 이자받기(저금)는 GIWA 디파이 이자 시뮬레이션(우리 재원). 확정 아님.
 * 불변 규칙: 가짜 잔고/숨은 차감 금지 — 여기 값은 그대로 화면에 되비추는 용도.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { logout as apiLogout } from '../api/auth';
import { isApiConfigured } from '../api/config';
import { tokenStore } from '../api/tokenStore';
import * as pointsApi from '../api/points';
import * as rewardsApi from '../api/rewards';
import * as savingsApi from '../api/savings';

/** 백엔드 연동 모드 여부 — API 주소가 있고 로그인 세션(토큰)이 있으면 서버가 진실의 원천.
 *  없으면(데모/둘러보기) 로컬 목업으로 동작한다. */
async function isOnline(): Promise<boolean> {
  if (!isApiConfigured()) return false;
  return Boolean(await tokenStore.getAccess());
}

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

  pStake: number; // 이자받기에 저금한 포인트 원금(P)
  pEarn: number; // pSince 시점까지 '확정'된 이자 baseline(P). 그 이후분은 읽을 때 계산.
  pSince: number; // 현재 원금 기준 이자 누적 시작 시각(ms). 백엔드도 이 값만 저장하면 됨.

  cash: number; // 원화 자산 — 저금 안 한 돈(원)
  cStake: number; // 이자받기에 저금한 원화 원금(원)
  cEarn: number; // cSince 시점까지 '확정'된 이자 baseline(원)
  cSince: number; // 현재 원금 기준 이자 누적 시작 시각(ms)

  hold: { btc: number; gold: number }; // 보유 수량

  refUsed: boolean; // 추천인 코드 사용 여부(1계정 1회)

  attToday: boolean; // 오늘 출석했는지
  lastBonusAt: number; // 보너스 마지막 개봉 시각(ms). 0=아직
  quizSolvedToday: number; // 오늘 푼 퀴즈 수
  quizIndex: number; // 다음에 낼 퀴즈 인덱스(순차)

  history: LedgerEntry[]; // 최근 거래·활동 원장(내 지갑 최근 내역·활동 기록)
  push: boolean; // 푸시 알림 on/off

  authReady: boolean; // 부팅 시 저장된 세션 복원 검사가 끝났는지(네비 초기 라우트 결정용)
};

type AppActions = {
  login: (user: User) => void;
  logout: () => void;
  reset: () => void;
  hydrate: () => Promise<void>; // 서버에서 잔액·저금 포지션을 받아 로컬 상태 동기화

  setSteps: (n: number) => void; // 측정된 걸음수 반영(프론트 관리, DB 저장 안 함)
  claimSteps: () => Promise<void>; // 걸어서 받을 포인트를 받기 (온라인=서버, 오프라인=로컬)
  stakePoints: (amt: number) => Promise<void>; // 포인트 저금
  unstakePoints: () => Promise<void>; // 포인트 저금 그만 (원금+이자 → points)
  depositCash: (won: number) => void; // 원화 입금
  withdrawCash: (won: number) => void; // 원화 출금(내 계좌로)
  stakeCash: (amt: number) => void; // 원화 저금
  unstakeCash: () => void; // 원화 저금 그만
  pointsToCash: (p: number, won: number) => void; // 포인트를 현금으로
  buyAsset: (kind: 'btc' | 'gold', p: number, qty: number) => void; // 포인트로 매수
  sellAsset: (kind: 'btc' | 'gold') => void; // 자산을 원화로 되팔기
  redeemReferral: (code: string) => void; // 추천인 코드 등록(+500P, 1회). 검증은 호출부에서.

  checkAttendance: () => Promise<void>; // 출석체크(하루 1회, 한도 적용)
  claimBonus: () => Promise<number>; // 오늘의 보너스 수령(한도 미적용). 받은 금액을 반환.
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
  pSince: 0,

  cash: 0,
  cStake: 0,
  cEarn: 0,
  cSince: 0,

  hold: { btc: 0, gold: 0 },

  refUsed: false,

  attToday: false,
  lastBonusAt: 0,
  quizSolvedToday: 0,
  quizIndex: 0,

  history: [],
  push: false,
  authReady: false,
};

const Ctx = createContext<(AppState & AppActions) | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initial);
  // 비동기 액션이 최신 상태를 스테일 없이 읽도록 하는 거울.
  const stateRef = useRef(state);
  stateRef.current = state;

  // 서버에서 잔액·저금·오늘 상태를 받아 로컬을 맞춘다(로그인 후·앱 진입 시). best-effort.
  // 걸음/출석/보너스 '오늘 했는지'는 별도 상태 엔드포인트가 없어 포인트 원장(history)에서 도출한다.
  // (권장 설계는 GET /me/summary — docs/11-api-spec.md §2. 구현되면 이 로직을 대체.)
  const hydrate = useCallback(async () => {
    if (!(await isOnline())) return;
    const [bal, pos, hist] = await Promise.allSettled([
      pointsApi.getBalance(),
      savingsApi.getPositions(),
      pointsApi.getHistory(100),
    ]);
    setState((s) => {
      let ns = s;
      if (bal.status === 'fulfilled') ns = { ...ns, points: bal.value };
      if (pos.status === 'fulfilled') {
        const p = pos.value.point;
        ns = {
          ...ns,
          pStake: p.principalP,
          pEarn: Number(p.accruedP) || 0,
          pSince: p.startedAt ? Date.parse(p.startedAt) : Date.now(),
        };
      }
      if (hist.status === 'fulfilled') {
        const items = hist.value;
        const dayUTC = (iso: string) => iso.slice(0, 10); // 서버 기준 UTC 일자
        const today = new Date().toISOString().slice(0, 10);
        const isToday = (iso: string) => dayUTC(iso) === today;

        const stepClaimed = items.some((i) => i.type === 'STEP_CLAIM' && isToday(i.createdAt));
        const attToday = items.some((i) => i.type === 'ATTENDANCE' && isToday(i.createdAt));
        const bonusTimes = items.filter((i) => i.type === 'BONUS').map((i) => Date.parse(i.createdAt));
        const lastBonusAt = bonusTimes.length ? Math.max(...bonusTimes) : 0;
        const todayEarned = items
          .filter((i) => i.countsToDailyCap && isToday(i.createdAt) && i.deltaP > 0)
          .reduce((a, i) => a + i.deltaP, 0);
        const todayBonus = items
          .filter((i) => i.type === 'BONUS' && isToday(i.createdAt))
          .reduce((a, i) => a + i.deltaP, 0);

        // 연속 출석수: ATTENDANCE 일자에서 오늘(또는 어제)부터 연속된 날 수.
        const attDates = new Set(items.filter((i) => i.type === 'ATTENDANCE').map((i) => dayUTC(i.createdAt)));
        let streak = 0;
        const d = new Date();
        if (!attDates.has(today)) d.setUTCDate(d.getUTCDate() - 1);
        while (attDates.has(d.toISOString().slice(0, 10))) {
          streak += 1;
          d.setUTCDate(d.getUTCDate() - 1);
        }

        ns = { ...ns, stepClaimed, attToday, lastBonusAt, todayEarned, todayBonus, streak };
      }
      return ns;
    });
  }, []);

  // 부팅: 저장된 세션이 있으면 로그인 상태로 복원하고 동기화. 끝나면 네비 게이트 해제.
  useEffect(() => {
    (async () => {
      const token = (await tokenStore.getAccess()) || (await tokenStore.getRefresh());
      if (token) {
        const nick = await tokenStore.getNick();
        setState((s) => ({ ...s, user: { name: nick ?? '나드리회원', provider: 'google' } }));
        await hydrate();
      }
      setState((s) => ({ ...s, authReady: true }));
    })();
  }, [hydrate]);

  const login = useCallback((user: User) => {
    void tokenStore.saveNick(user.name); // 다음 부팅 때 로그인 유지 표시용
    setState((s) => ({ ...s, user }));
    void hydrate(); // 로그인 직후 서버 값으로 맞춘다.
  }, [hydrate]);
  const logout = useCallback(() => {
    void apiLogout(); // 서버 세션·저장 토큰(+닉네임) 정리
    setState(() => ({ ...initial, authReady: true })); // 다른 유저 데이터 안 남게 초기화
  }, []);
  const reset = useCallback(() => setState({ ...initial, authReady: true }), []);

  const setSteps = useCallback((n: number) => {
    setState((s) => (n === s.steps ? s : { ...s, steps: n }));
  }, []);

  const claimSteps = useCallback(async () => {
    const s0 = stateRef.current;
    if (s0.stepClaimed) return;
    if (await isOnline()) {
      // 서버가 걸음→포인트 환산·한도·하루1회를 판정. 이미 받았으면 409로 온다.
      try {
        const r = await rewardsApi.claimSteps(s0.steps);
        setState((s) => ({
          ...s, points: r.pointsAfter, todayEarned: r.todayEarnedP, stepClaimed: true,
          history: r.grantedP > 0 ? pushLog(s.history, '걸음 포인트', r.grantedP, 'P') : s.history,
        }));
      } catch (e) {
        if ((e as { code?: string }).code === 'ALREADY_CLAIMED') {
          setState((s) => ({ ...s, stepClaimed: true }));
          return;
        }
        throw e;
      }
      return;
    }
    // 로컬 폴백(데모)
    setState((s) => {
      if (s.stepClaimed) return s;
      const claim = Math.min(WALK_MAX, Math.floor(s.steps / 100));
      const got = Math.min(claim, capRoom(s));
      if (got <= 0) return { ...s, stepClaimed: true };
      return {
        ...s, points: s.points + got, todayEarned: s.todayEarned + got, stepClaimed: true,
        history: pushLog(s.history, '걸음 포인트', got, 'P'),
      };
    });
  }, []);

  const stakePoints = useCallback(async (amt: number) => {
    if (amt <= 0) return;
    if (await isOnline()) {
      // 서버가 포인트 차감 + 온체인 볼트 예치. 부족/최소미달/온체인불가면 throw.
      const r = await savingsApi.stakePoints(amt);
      setState((s) => ({
        ...s, points: r.pointsAfter, pStake: r.point.principalP,
        pEarn: Number(r.point.accruedP) || 0,
        pSince: r.point.startedAt ? Date.parse(r.point.startedAt) : Date.now(),
        history: pushLog(s.history, '포인트 저금', -amt, 'P'),
      }));
      return;
    }
    setState((s) => {
      const now = Date.now();
      return {
        ...s, points: Math.max(0, s.points - amt), pStake: s.pStake + amt,
        pEarn: earnedP(s, now), pSince: now,
        history: pushLog(s.history, '포인트 저금', -amt, 'P'),
      };
    });
  }, []);
  const unstakePoints = useCallback(async () => {
    if (await isOnline()) {
      const r = await savingsApi.unstakePoints();
      setState((s) => ({
        ...s, points: r.pointsAfter, pStake: 0, pEarn: 0, pSince: Date.now(),
        history: pushLog(s.history, '이자받기에서 빼기', r.creditedP, 'P'),
      }));
      return;
    }
    setState((s) => {
      const now = Date.now();
      const t = s.pStake + earnedP(s, now);
      return t <= 0 ? s : { ...s, points: s.points + t, pStake: 0, pEarn: 0, pSince: now, history: pushLog(s.history, '이자받기에서 빼기', t, 'P') };
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
    setState((s) => {
      if (amt <= 0) return s;
      const now = Date.now();
      return {
        ...s, cash: Math.max(0, s.cash - amt), cStake: s.cStake + amt,
        cEarn: earnedC(s, now), cSince: now,
        history: pushLog(s.history, '자산 저금', -amt, 'KRW'),
      };
    });
  }, []);
  const unstakeCash = useCallback(() => {
    setState((s) => {
      const now = Date.now();
      const t = s.cStake + earnedC(s, now);
      return t <= 0 ? s : { ...s, cash: s.cash + t, cStake: 0, cEarn: 0, cSince: now, history: pushLog(s.history, '자산 저금 해제', t, 'KRW') };
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

  const checkAttendance = useCallback(async () => {
    if (stateRef.current.attToday) return;
    if (await isOnline()) {
      try {
        const r = await rewardsApi.checkAttendance();
        setState((s) => ({
          ...s, attToday: true, streak: r.streak, points: r.pointsAfter, todayEarned: r.todayEarnedP,
          history: r.grantedP > 0 ? pushLog(s.history, '출석체크', r.grantedP, 'P') : s.history,
        }));
      } catch (e) {
        if ((e as { code?: string }).code === 'ALREADY_CHECKED_IN') {
          setState((s) => ({ ...s, attToday: true }));
          return;
        }
        throw e;
      }
      return;
    }
    setState((s) => {
      if (s.attToday) return s;
      const g = Math.min(ATT_REWARD, capRoom(s));
      return {
        ...s, attToday: true, streak: s.streak + 1, points: s.points + g, todayEarned: s.todayEarned + g,
        history: g > 0 ? pushLog(s.history, '출석체크', g, 'P') : s.history,
      };
    });
  }, []);

  // 보너스 금액은 서버가 추첨(온라인) — 받은 금액을 반환해 화면이 공개하도록 한다.
  // 보너스는 일일 한도 미적용(v10). 오프라인이면 로컬 추첨.
  const claimBonus = useCallback(async (): Promise<number> => {
    if (await isOnline()) {
      const r = await rewardsApi.claimBonus();
      setState((s) => ({
        ...s, points: r.pointsAfter, todayBonus: s.todayBonus + r.grantedP,
        lastBonusAt: Date.now(), history: pushLog(s.history, '오늘의 보너스', r.grantedP, 'P'),
      }));
      return r.grantedP;
    }
    const amount = pickBonus();
    setState((s) => ({
      ...s, points: s.points + amount, todayBonus: s.todayBonus + amount,
      lastBonusAt: Date.now(), history: pushLog(s.history, '오늘의 보너스', amount, 'P'),
    }));
    return amount;
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

  const value = useMemo(
    () => ({
      ...state, login, logout, reset, hydrate, setSteps, claimSteps, stakePoints, unstakePoints,
      depositCash, withdrawCash, stakeCash, unstakeCash, pointsToCash, buyAsset, sellAsset, redeemReferral,
      checkAttendance, claimBonus, answerQuiz, togglePush,
    }),
    [state, login, logout, reset, hydrate, setSteps, claimSteps, stakePoints, unstakePoints,
      depositCash, withdrawCash, stakeCash, unstakeCash, pointsToCash, buyAsset, sellAsset, redeemReferral,
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

// ── 이자: 저장하지 않고 '읽는 순간' 계산한다 ────────────────────────────
// 이자 = 확정 baseline + 원금 × 연이율 × (지금 - 시작시각).
// 백엔드는 원금(pStake)·시작시각(pSince)·baseline(pEarn)만 저장하면 되고,
// 프론트는 1초마다 서버로 쏘지 않는다. 화면 숫자는 now만 바꿔 다시 그린다.
export const RATE = 0.05; // 연 이자율(시뮬)
const YEAR_SEC = 365 * 24 * 3600;
export const earnedP = (s: { pStake: number; pEarn: number; pSince: number }, now: number = Date.now()) =>
  s.pEarn + (s.pStake > 0 ? (s.pStake * RATE * Math.max(0, now - s.pSince)) / 1000 / YEAR_SEC : 0);
export const earnedC = (s: { cStake: number; cEarn: number; cSince: number }, now: number = Date.now()) =>
  s.cEarn + (s.cStake > 0 ? (s.cStake * RATE * Math.max(0, now - s.cSince)) / 1000 / YEAR_SEC : 0);

export const pTotal = (s: { pStake: number; pEarn: number; pSince: number }, now?: number) => s.pStake + earnedP(s, now);
export const cTotal = (s: { cStake: number; cEarn: number; cSince: number }, now?: number) => s.cStake + earnedC(s, now);
export const netWorth = (s: AppState) =>
  s.points + pTotal(s) + s.cash + cTotal(s) + s.hold.btc * PRICE.btc + s.hold.gold * PRICE.gold;

/** 원 단위 표기 */
export const won = (n: number) => Math.round(n).toLocaleString('ko-KR');
/** 포인트 표기(정수) */
export const fmtP = (n: number) => Math.floor(n).toLocaleString('ko-KR');
/** 소수 자리 표기 */
export const fmtd = (n: number, d: number) =>
  n.toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d });
