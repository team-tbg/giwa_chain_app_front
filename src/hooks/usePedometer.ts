/**
 * 만보기 훅 — 걸음수 소스 우선순위:
 *  1) Android: Health Connect = OS가 백그라운드(앱 꺼져 있어도)에서 센 "오늘 총 걸음" 조회 (캐시워크 방식)
 *  2) 폴백: 가속도계 실시간 피크 감지 (앱 포그라운드일 때만, iOS/웹/HC 미허용 시)
 * 걸음수는 프론트에서만 관리(DB 저장 안 함).
 */
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as SecureStore from 'expo-secure-store';

export type PedometerState = {
  available: boolean | null; // null = 확인 중
  todaySteps: number;
  source?: 'health' | 'accel';
  error?: string;
};

// 가속도계 걸음 감지 임계값(중력=1g 기준)
const HIGH = 1.18;
const LOW = 1.06;
const MIN_STEP_MS = 280;

// Health Connect 사용 여부 스위치.
// ⚠️ react-native-health-connect는 MainActivity에 권한 런처(ActivityResultLauncher)를 등록해야 하는데
//    현재 설정에선 등록이 안 돼 requestPermission 호출 시 네이티브 크래시(lateinit ... requestPermission)가 남.
//    delegate 등록(설정 플러그인)까지 붙인 뒤 true로 켠다. 그전까진 가속도계 폴백 사용.
const HEALTH_CONNECT_ENABLED = false;

// Health Connect는 안드로이드 전용 — 웹/iOS 번들에서 로드 안 되게 가드 require.
let HC: {
  initialize: () => Promise<boolean>;
  requestPermission: (p: Array<{ accessType: string; recordType: string }>) => Promise<Array<{ recordType: string }>>;
  aggregateRecord: (o: unknown) => Promise<{ COUNT_TOTAL?: number }>;
} | null = null;
if (Platform.OS === 'android') {
  try {
    HC = require('react-native-health-connect');
  } catch {
    HC = null;
  }
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// 가입(첫 실행) 시점 — 설치 전에 걸은 걸음은 크레딧하지 않기 위한 기준선.
const ENROLL_KEY = 'naduri.stepsEnrolledAt';
async function getEnrolledAt(): Promise<number> {
  try {
    const v = await SecureStore.getItemAsync(ENROLL_KEY);
    if (v) return parseInt(v, 10) || 0;
  } catch {
    /* ignore */
  }
  const now = Date.now();
  try {
    await SecureStore.setItemAsync(ENROLL_KEY, String(now));
  } catch {
    /* ignore */
  }
  return now;
}

type Setter = React.Dispatch<React.SetStateAction<PedometerState>>;

/** 폴백: 가속도계 실시간 걸음 감지. cleanup 반환. */
function startAccelerometer(setState: Setter, isMounted: () => boolean): () => void {
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
      setState({ available: false, todaySteps: 0 });
      return;
    }
    setState({ available: true, todaySteps: 0, source: 'accel' });
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
      // 1) Health Connect (안드로이드) — delegate 등록 전까진 비활성(크래시 방지)
      if (HC && HEALTH_CONNECT_ENABLED) {
        try {
          const inited = await HC.initialize();
          if (inited) {
            const granted = await HC.requestPermission([{ accessType: 'read', recordType: 'Steps' }]);
            const ok = Array.isArray(granted) && granted.some((p) => p.recordType === 'Steps');
            if (ok && mounted) {
              const enrolledAt = await getEnrolledAt();
              const read = async () => {
                try {
                  // 설치 당일은 가입 시점부터, 이후엔 자정부터(둘 중 늦은 시각).
                  const startMs = Math.max(startOfToday().getTime(), enrolledAt);
                  const res = await HC!.aggregateRecord({
                    recordType: 'Steps',
                    timeRangeFilter: {
                      operator: 'between',
                      startTime: new Date(startMs).toISOString(),
                      endTime: new Date().toISOString(),
                    },
                  });
                  const total = res?.COUNT_TOTAL ?? 0;
                  if (mounted) setState({ available: true, todaySteps: total, source: 'health' });
                } catch {
                  /* 일시 오류 — 이전 값 유지 */
                }
              };
              await read();
              const id = setInterval(read, 10000); // 포그라운드 중 주기적 갱신
              cleanupRef.current = () => clearInterval(id);
              return;
            }
          }
        } catch {
          /* HC 실패 → 가속도계로 폴백 */
        }
      }

      // 2) 폴백: 가속도계
      cleanupRef.current = startAccelerometer(setState, () => mounted);
    })();

    return () => {
      mounted = false;
      cleanupRef.current();
    };
  }, []);

  return state;
}
