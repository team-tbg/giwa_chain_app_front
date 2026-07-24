/**
 * 만보기 훅 — 걸음수 소스 우선순위:
 *  1) Android: expo-android-pedometer = 하드웨어 만보 센서(TYPE_STEP_COUNTER) + 포그라운드 서비스 + 상시 알림
 *     → 앱이 닫혀 있어도 오늘 걸음 누적(캐시워크 방식). 삼성헬스/Health Connect 불필요.
 *  2) iOS: expo-sensors Pedometer(CMPedometer) — 오늘 누적 히스토리 제공
 *  3) 폴백: 가속도계(웹/미지원) — 포그라운드만
 * 걸음수는 프론트에서만 관리(DB 저장 안 함).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, AppState as RNAppState } from 'react-native';
import { Pedometer, Accelerometer } from 'expo-sensors';
import { toast } from '../lib/alert';

const errMsg = (e: unknown) => (e as { message?: string })?.message ?? String(e);

// 상시 알림 문구(마운트 + 포그라운드 복귀 재표시에 공용)
const NOTIF = { title: '나드리', contentTemplate: '오늘 %d 걸음 걸었어요 👟' };

// 측정 상태(내부 useState 값)
type PedState = {
  available: boolean | null; // null = 확인 중
  todaySteps: number;
  source?: 'pedometer' | 'accel';
  error?: string;
};

export type PedometerState = PedState & {
  // 삼성 등에서 서비스가 죽을 때 수동 복구용(개발 패널에서 호출).
  requestBattery: () => Promise<void>; // 배터리 최적화 예외 요청
  openAutostart: () => Promise<void>; // OEM 자동실행 설정 열기
  restart: () => Promise<void>; // 만보 서비스 재시작 + 즉시 재조회
};

// Android 백그라운드 만보기 — 웹/iOS 번들에서 로드 안 되게 가드 require.
type ABPModule = {
  isSensorAvailable?: () => Promise<boolean>;
  requestActivityPermissions: () => Promise<{ granted: boolean }>;
  requestNotificationPermissions: () => Promise<{ granted: boolean }>;
  setupBackgroundUpdates: (c: { title?: string; contentTemplate: string }) => Promise<boolean>;
  getStepsCountAsync: (dateIso?: string) => Promise<number>;
  subscribeToChanges: (l: (e: { steps: number; timestamp: number }) => void) => { remove: () => void };
  isBatteryOptimizationExcluded?: () => Promise<boolean>;
  requestBatteryOptimizationExemption?: () => Promise<boolean>;
  canOpenAutostartSettings?: () => Promise<boolean>;
  openAutostartSettings?: () => Promise<boolean>;
};
let ABP: ABPModule | null = null;
if (Platform.OS === 'android') {
  try {
    ABP = require('expo-android-pedometer');
  } catch {
    ABP = null;
  }
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// 가속도계(폴백) 임계값
const HIGH = 1.18;
const LOW = 1.06;
const MIN_STEP_MS = 280;

type Setter = React.Dispatch<React.SetStateAction<PedState>>;

function startAccelerometer(setState: Setter, isMounted: () => boolean, note?: string): () => void {
  let sub: { remove: () => void } | null = null;
  let steps = 0;
  let armed = true;
  let lastStepAt = 0;
  (async () => {
    let available = false;
    try {
      available = await Accelerometer.isAvailableAsync();
    } catch {
      available = false;
    }
    if (!isMounted()) return;
    if (!available) {
      setState({ available: false, todaySteps: 0, error: note });
      return;
    }
    setState({ available: true, todaySteps: 0, source: 'accel', error: note });
    Accelerometer.setUpdateInterval(80);
    sub = Accelerometer.addListener(({ x, y, z }) => {
      const mag = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (armed && mag > HIGH) {
        armed = false;
        if (now - lastStepAt > MIN_STEP_MS) {
          steps += 1;
          lastStepAt = now;
          if (isMounted()) setState((s) => ({ ...s, todaySteps: steps }));
        }
      } else if (!armed && mag < LOW) {
        armed = true;
      }
    });
  })();
  return () => sub?.remove();
}

export function usePedometer(): PedometerState {
  const [state, setState] = useState<PedState>({ available: null, todaySteps: 0 });
  const cleanupRef = useRef<() => void>(() => {});

  // 만보 서비스 수동 복구 액션(삼성 스로틀 대응) — 개발 패널에서 호출. 진단 토스트 포함.
  const requestBattery = useCallback(async () => {
    try {
      const before = await ABP?.isBatteryOptimizationExcluded?.();
      await ABP?.requestBatteryOptimizationExemption?.();
      toast(before ? '배터리 예외: 이미 허용됨' : '배터리 예외: 허용 요청함');
    } catch (e) {
      toast(`배터리 오류: ${errMsg(e)}`);
    }
  }, []);
  const openAutostart = useCallback(async () => {
    try {
      if (await ABP?.canOpenAutostartSettings?.()) await ABP?.openAutostartSettings?.();
      else toast('이 기기는 자동실행 설정 미지원(삼성)');
    } catch (e) {
      toast(`자동실행 오류: ${errMsg(e)}`);
    }
  }, []);
  const restart = useCallback(async () => {
    try {
      await ABP?.setupBackgroundUpdates?.(NOTIF);
      const n = await ABP?.getStepsCountAsync?.();
      if (typeof n === 'number') setState((s) => ({ ...s, todaySteps: n }));
      toast(`서비스 재시작 · 재조회 ${typeof n === 'number' ? n : '?'}걸음`);
    } catch (e) {
      toast(`재시작 오류: ${errMsg(e)}`);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      let note = '';

      // 1) Android — 백그라운드 만보기(포그라운드 서비스 + 상시 알림)
      if (ABP) {
        try {
          const perm = await ABP.requestActivityPermissions(); // 표준 "신체 활동" 팝업
          if (!mounted) return;
          if (!perm?.granted) {
            note = '신체 활동 권한 거부';
          } else {
            try {
              await ABP.requestNotificationPermissions(); // 상시 알림용(거부돼도 포그라운드 카운트는 됨)
              await ABP.setupBackgroundUpdates(NOTIF);
              // 삼성 등에서 배터리 최적화가 서비스를 죽이면 백그라운드·알림 갱신이 멈춤 → 예외 요청
              const excluded = (await ABP.isBatteryOptimizationExcluded?.()) ?? true;
              if (!excluded) await ABP.requestBatteryOptimizationExemption?.();
            } catch {
              /* 알림/백그라운드/배터리 설정 실패해도 조회는 시도 */
            }
            // ABP(백그라운드 누적) + 가속도계(포그라운드 실시간) 결합.
            // 이 기기는 하드웨어 만보 센서가 멈춰 있어(ABP·expo-sensors 모두 값 고정) →
            // 앱 열려 있는 동안엔 우리가 제어하는 가속도계 걸음 감지로 확실히 실시간 증가.
            let abpSteps = (await ABP.getStepsCountAsync()) ?? 0;
            let base = abpSteps; // 실시간 델타 기준
            let live = 0; // 가속도계로 감지한 포그라운드 걸음
            const push = () => {
              const v = Math.max(abpSteps, base + live);
              if (mounted) setState((s) => (v === s.todaySteps ? s : { ...s, todaySteps: v, source: 'pedometer' }));
            };
            if (mounted) setState({ available: true, todaySteps: abpSteps, source: 'pedometer' });

            // ABP값 동기화(백그라운드에서 쌓였으면 기준을 올림).
            const syncAbp = (n: number) => {
              abpSteps = n;
              if (abpSteps > base + live) {
                base = abpSteps;
                live = 0;
              }
              push();
            };
            const sub = ABP.subscribeToChanges((e) => {
              if (typeof e.steps === 'number') syncAbp(e.steps);
            });
            // 백업 폴링: 구독이 끊겨도 4초마다 ABP 재조회.
            const poll = setInterval(async () => {
              try {
                const n = await ABP!.getStepsCountAsync();
                if (typeof n === 'number') syncAbp(n);
              } catch {
                /* 조회 실패는 무시 */
              }
            }, 4000);

            // 가속도계 실시간 걸음 감지(피크) — 하드웨어 센서가 멈춰도 걷는 동안 무조건 올라감.
            let armed = true;
            let lastStepAt = 0;
            let accSub: { remove: () => void } | null = null;
            try {
              if (await Accelerometer.isAvailableAsync()) {
                Accelerometer.setUpdateInterval(80);
                accSub = Accelerometer.addListener(({ x, y, z }) => {
                  const mag = Math.sqrt(x * x + y * y + z * z);
                  const now = Date.now();
                  if (armed && mag > HIGH) {
                    armed = false;
                    if (now - lastStepAt > MIN_STEP_MS) {
                      live += 1;
                      lastStepAt = now;
                      push();
                    }
                  } else if (!armed && mag < LOW) {
                    armed = true;
                  }
                });
              }
            } catch {
              /* 가속도계 미지원이면 ABP만 사용 */
            }

            cleanupRef.current = () => {
              try {
                sub.remove();
              } catch {
                /* noop */
              }
              clearInterval(poll);
              try {
                accSub?.remove();
              } catch {
                /* noop */
              }
            };
            return;
          }
        } catch (e) {
          note = `만보 예외: ${(e as { message?: string })?.message ?? e}`;
        }
        cleanupRef.current = startAccelerometer(setState, () => mounted, note);
        return;
      }

      // 2) iOS — expo-sensors Pedometer(CMPedometer)
      if (Platform.OS === 'ios') {
        try {
          const perm = await Pedometer.requestPermissionsAsync();
          if (!mounted) return;
          if (perm?.granted !== false) {
            const available = await Pedometer.isAvailableAsync();
            if (available) {
              let baseline = 0;
              try {
                const r = await Pedometer.getStepCountAsync(startOfToday(), new Date());
                if (r) baseline = r.steps;
              } catch {
                /* ignore */
              }
              if (mounted) setState({ available: true, todaySteps: baseline, source: 'pedometer' });
              const sub = Pedometer.watchStepCount((r) => {
                if (mounted) setState((s) => ({ ...s, todaySteps: baseline + r.steps }));
              });
              cleanupRef.current = () => sub.remove();
              return;
            }
          } else {
            note = '동작 권한 거부';
          }
        } catch (e) {
          note = `만보 예외: ${(e as { message?: string })?.message ?? e}`;
        }
      }

      // 3) 폴백: 가속도계 (웹/미지원)
      cleanupRef.current = startAccelerometer(setState, () => mounted, note);
    })();

    return () => {
      mounted = false;
      cleanupRef.current();
    };
  }, []);

  // 앱에 다시 들어오면: 상시 알림 재표시 + 오늘 걸음 재조회(백그라운드에서 쌓인 값 동기화).
  useEffect(() => {
    if (!ABP) return;
    const sub = RNAppState.addEventListener('change', async (st) => {
      if (st !== 'active') return;
      ABP?.setupBackgroundUpdates(NOTIF).catch(() => {});
      try {
        const n = await ABP!.getStepsCountAsync();
        if (typeof n === 'number') setState((s) => (n === s.todaySteps ? s : { ...s, todaySteps: n }));
      } catch {
        /* 무시 */
      }
    });
    return () => sub.remove();
  }, []);

  return { ...state, requestBattery, openAutostart, restart };
}
