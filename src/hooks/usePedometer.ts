/**
 * 만보기 훅 — expo-sensors Pedometer.
 * MVP-now 핵심 기능 중 하나(로그인 + 만보기 + 포인트 조회).
 *
 * 주의:
 * - 실기기에서만 실제 걸음 수가 잡힌다(에뮬레이터/웹은 미지원 → available=false).
 * - Android 백그라운드 누적 정확도는 Health Connect / Google Fit 연동이 필요할 수 있음(후속).
 * - iOS는 CMPedometer, Android는 Step Counter 센서 권한이 필요.
 */
import { useEffect, useRef, useState } from 'react';
import { Pedometer } from 'expo-sensors';

export type PedometerState = {
  available: boolean | null; // null = 확인 중
  todaySteps: number;
  error?: string;
};

export function usePedometer(): PedometerState {
  const [state, setState] = useState<PedometerState>({ available: null, todaySteps: 0 });
  const subRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        if (!mounted) return;
        if (!available) {
          setState({ available: false, todaySteps: 0 });
          return;
        }

        // 오늘 자정부터 현재까지 누적 걸음(지원 플랫폼 한정: 주로 iOS)
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        try {
          const result = await Pedometer.getStepCountAsync(start, new Date());
          if (mounted && result) {
            setState((s) => ({ ...s, available: true, todaySteps: result.steps }));
          }
        } catch {
          // getStepCountAsync 미지원 플랫폼(Android 일부) — 실시간 구독만 사용
          if (mounted) setState((s) => ({ ...s, available: true }));
        }

        // 실시간 증가 구독
        subRef.current = Pedometer.watchStepCount((r) => {
          if (mounted) setState((s) => ({ ...s, todaySteps: s.todaySteps + r.steps }));
        });
      } catch (e) {
        if (mounted) {
          setState({ available: false, todaySteps: 0, error: String(e) });
        }
      }
    })();

    return () => {
      mounted = false;
      subRef.current?.remove();
    };
  }, []);

  return state;
}
