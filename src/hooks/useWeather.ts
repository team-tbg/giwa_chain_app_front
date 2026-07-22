/**
 * 날씨 훅 — Open-Meteo(무료·API키 불필요). GPS 좌표로 현재 기온/날씨코드 조회.
 * 좌표 없으면(위치 미허용) 조회 안 함 → 기본값 유지.
 */
import { useEffect, useState } from 'react';

const emojiFor = (code: number): string => {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '🌡️';
};

export type WeatherState = { tempC: number | null; emoji: string };

export function useWeather(coords: { lat: number; lng: number } | null): WeatherState {
  const [state, setState] = useState<WeatherState>({ tempC: null, emoji: '☀️' });

  useEffect(() => {
    if (!coords) return;
    let mounted = true;
    (async () => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}` +
          `&longitude=${coords.lng}&current=temperature_2m,weather_code`;
        const res = await fetch(url);
        const j = await res.json();
        const t = j?.current?.temperature_2m;
        const c = j?.current?.weather_code ?? 0;
        if (mounted && typeof t === 'number') setState({ tempC: t, emoji: emojiFor(c) });
      } catch {
        // 실패 시 기본값 유지
      }
    })();
    return () => {
      mounted = false;
    };
  }, [coords?.lat, coords?.lng]);

  return state;
}
