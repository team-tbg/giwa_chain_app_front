/**
 * 만보기 훅 — 가속도계(expo-sensors Accelerometer) 기반 실시간 걸음 감지.
 * 이유: 안드로이드 TYPE_STEP_COUNTER(Pedometer)는 배치/지연·권한 이슈로 반응이 느림.
 *       가속도계 피크 감지는 실시간·특별 권한 불필요·기기 호환성이 좋아 데모에 적합.
 * 걸음수는 프론트에서만 관리(DB 저장 안 함). 앱 켠 시점부터 누적.
 */
import { useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

export type PedometerState = {
  available: boolean | null; // null = 확인 중
  todaySteps: number;
  error?: string;
};

// 걸음 감지 임계값(중력=1g 기준). 위로 튀는 순간을 1걸음으로.
const HIGH = 1.18; // 이 위로 올라오면 걸음 후보
const LOW = 1.06; // 이 아래로 내려가면 다음 걸음 감지 준비
const MIN_STEP_MS = 280; // 걸음 간 최소 간격(초당 ~3.5걸음 상한)

export function usePedometer(): PedometerState {
  const [state, setState] = useState<PedometerState>({ available: null, todaySteps: 0 });
  const subRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let mounted = true;
    let steps = 0;
    let armed = true; // 다음 피크를 셀 준비가 됐는지(히스테리시스)
    let lastStepAt = 0;

    (async () => {
      let available = false;
      try {
        available = await Accelerometer.isAvailableAsync();
      } catch {
        available = false;
      }
      if (!mounted) return;
      if (!available) {
        setState({ available: false, todaySteps: 0 });
        return;
      }
      setState({ available: true, todaySteps: 0 });

      Accelerometer.setUpdateInterval(80); // ~12.5Hz
      subRef.current = Accelerometer.addListener(({ x, y, z }) => {
        const mag = Math.sqrt(x * x + y * y + z * z); // 대략 정지 시 1g
        const now = Date.now();
        if (armed && mag > HIGH) {
          armed = false;
          if (now - lastStepAt > MIN_STEP_MS) {
            steps += 1;
            lastStepAt = now;
            if (mounted) setState((s) => ({ ...s, todaySteps: steps }));
          }
        } else if (!armed && mag < LOW) {
          armed = true; // 골 지나면 다음 피크 감지 준비
        }
      });
    })();

    return () => {
      mounted = false;
      subRef.current?.remove();
    };
  }, []);

  return state;
}
