/**
 * 만보기 훅 — 폰 하드웨어 만보 센서(TYPE_STEP_COUNTER)를 expo-sensors Pedometer로 직접 사용.
 *  - 삼성헬스/Health Connect 불필요(모든 폰의 OS 센서). 권한은 표준 "신체 활동(ACTIVITY_RECOGNITION)" 팝업.
 *  - 센서 미지원/권한 거부 시 가속도계 폴백(포그라운드).
 *  - 걸음수는 프론트에서만 관리(DB 저장 안 함). 앱 열려 있을 때 카운트(백그라운드 누적은 후속: 포그라운드 서비스).
 */
import { useEffect, useRef, useState } from 'react';
import { Pedometer, Accelerometer } from 'expo-sensors';

export type PedometerState = {
  available: boolean | null; // null = 확인 중
  todaySteps: number;
  source?: 'pedometer' | 'accel';
  error?: string;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// 가속도계 걸음 감지 임계값(중력=1g 기준) — 폴백용
const HIGH = 1.18;
const LOW = 1.06;
const MIN_STEP_MS = 280;

type Setter = React.Dispatch<React.SetStateAction<PedometerState>>;

/** 폴백: 가속도계 실시간 걸음 감지. cleanup 반환. */
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
  const [state, setState] = useState<PedometerState>({ available: null, todaySteps: 0 });
  const cleanupRef = useRef<() => void>(() => {});

  useEffect(() => {
    let mounted = true;

    (async () => {
      let note = '';
      try {
        // 표준 신체활동(ACTIVITY_RECOGNITION) 권한 팝업 — 앱 켤 때 뜸
        const perm = await Pedometer.requestPermissionsAsync();
        if (!mounted) return;
        if (perm && perm.granted === false) {
          note = '신체 활동 권한 거부';
        } else {
          const available = await Pedometer.isAvailableAsync();
          if (!mounted) return;
          if (!available) {
            note = '만보 센서 미지원 기기';
          } else {
            // iOS는 자정~현재 누적을 반환(지원), Android는 미지원이라 0에서 구독분 누적.
            let baseline = 0;
            try {
              const r = await Pedometer.getStepCountAsync(startOfToday(), new Date());
              if (r) baseline = r.steps;
            } catch {
              /* Android 미지원 */
            }
            if (mounted) setState({ available: true, todaySteps: baseline, source: 'pedometer' });
            // watchStepCount의 steps는 "구독 이후 누적" → 더하지 말고 baseline + 로 SET
            const sub = Pedometer.watchStepCount((r) => {
              if (mounted) setState((s) => ({ ...s, todaySteps: baseline + r.steps }));
            });
            cleanupRef.current = () => sub.remove();
            return;
          }
        }
      } catch (e) {
        note = `만보 예외: ${(e as { message?: string })?.message ?? e}`;
      }
      // 폴백: 가속도계
      cleanupRef.current = startAccelerometer(setState, () => mounted, note);
    })();

    return () => {
      mounted = false;
      cleanupRef.current();
    };
  }, []);

  return state;
}
