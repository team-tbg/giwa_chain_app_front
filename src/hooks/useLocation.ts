/**
 * 위치(GPS) 훅 — expo-location. 포그라운드 권한 요청 → 현재 좌표 + 동네 이름.
 * 홈의 동네 표시/거리 검증에 사용. 실패(웹·권한 거부)해도 앱은 목업으로 계속.
 */
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type LocationState = {
  status: 'checking' | 'granted' | 'denied' | 'unavailable';
  region: string | null; // 예: "서울특별시 송파구"
  coords: { lat: number; lng: number } | null;
};

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({ status: 'checking', region: null, coords: null });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;
        if (status !== 'granted') {
          setState((s) => ({ ...s, status: 'denied' }));
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!mounted) return;
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        let region: string | null = null;
        try {
          const geo = await Location.reverseGeocodeAsync(pos.coords);
          const g = geo[0];
          if (g) {
            region = [g.region, g.district ?? g.city ?? g.subregion].filter(Boolean).join(' ') || null;
          }
        } catch {
          // 웹 등 reverseGeocode 미지원 — 좌표만
        }
        if (mounted) setState({ status: 'granted', region, coords });
      } catch {
        if (mounted) setState({ status: 'unavailable', region: null, coords: null });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
