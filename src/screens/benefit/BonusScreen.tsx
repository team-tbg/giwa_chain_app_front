/**
 * 오늘의 보너스 — 6시간마다 한 번, 가중 추첨(대부분 소액·아주 가끔 큰 금액). 일일 한도 미적용(v10).
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/ui';
import { toast } from '../../lib/alert';
import { colors, radii, cardShadow, typography } from '../../theme/theme';
import { useAppState, fmtP, BONUS_COOLDOWN_MS } from '../../state/AppState';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Bonus'>;

const hhmmss = (ms: number) => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export function BonusScreen({ navigation }: Props) {
  const { points, lastBonusAt, claimBonus } = useAppState();
  const [now, setNow] = useState(Date.now());
  const [reveal, setReveal] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = lastBonusAt + BONUS_COOLDOWN_MS - now;
  const available = remaining <= 0;

  const open = async () => {
    if (!available || busy) return;
    setBusy(true);
    try {
      const amount = await claimBonus(); // 서버가 추첨한 금액(오프라인이면 로컬 추첨)
      setReveal(amount);
      toast(`보너스 +${fmtP(amount)}P 받았어요`);
    } catch (e) {
      toast((e as { message?: string })?.message ?? '지금은 보너스를 받을 수 없어요');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Button label="← 뒤로" variant="plain" onPress={() => navigation.goBack()} style={styles.back} />
      <Text style={styles.h1}>오늘의 보너스</Text>
      <Text style={styles.sub}>6시간마다 한 번, 최대 300P를 받아요</Text>

      <View style={styles.balRow}>
        <Text style={styles.balLab}>현재 보유 포인트</Text>
        <Text style={styles.balVal}>{fmtP(points)}P</Text>
      </View>

      <View style={[styles.box, reveal != null && styles.boxWin]}>
        {reveal != null ? (
          <>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.win}>+{fmtP(reveal)}P</Text>
            <Text style={styles.boxNote}>보너스 포인트가 쌓였어요. 다음 보너스는 6시간 뒤에 열려요.</Text>
          </>
        ) : available ? (
          <>
            <Text style={styles.emoji}>🎁</Text>
            <Text style={styles.ready}>지금 열 수 있어요</Text>
            <Text style={styles.boxNote}>대부분 소액이지만, 아주 가끔 큰 금액이 나와요.</Text>
          </>
        ) : (
          <>
            <Text style={styles.emoji}>⏳</Text>
            <Text style={styles.timer}>{hhmmss(remaining)}</Text>
            <Text style={styles.boxNote}>다음 보너스까지 남은 시간</Text>
          </>
        )}
      </View>

      <Button
        label={reveal != null ? '받았어요' : available ? '보너스 열기' : '아직 열 수 없어요'}
        large
        disabled={!available || reveal != null}
        onPress={open}
        style={styles.cta}
      />
      <Text style={styles.note}>보너스는 하루 적립 한도에 포함되지 않아요.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 14, marginBottom: 4 },
  h1: { ...typography.display, color: colors.ink },
  sub: { ...typography.body, color: colors.muted, marginTop: 6, marginBottom: 14 },
  balRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 16, ...cardShadow,
  },
  balLab: { fontSize: 13, fontWeight: '700', color: colors.muted },
  balVal: { fontSize: 18, fontWeight: '900', color: colors.ink, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  box: { backgroundColor: colors.surface, borderRadius: radii.lg, paddingVertical: 40, alignItems: 'center', ...cardShadow },
  boxWin: { backgroundColor: colors.goldSoft },
  emoji: { fontSize: 52 },
  win: { fontSize: 40, fontWeight: '900', color: '#B4740A', letterSpacing: -1.5, marginTop: 10 },
  ready: { fontSize: 22, fontWeight: '900', color: colors.ink, marginTop: 10 },
  timer: { fontSize: 34, fontWeight: '900', color: colors.ink, marginTop: 10, fontVariant: ['tabular-nums'], letterSpacing: 1 },
  boxNote: { ...typography.caption, color: colors.muted, marginTop: 10, textAlign: 'center', paddingHorizontal: 20, lineHeight: 19 },
  cta: { marginTop: 20 },
  note: { ...typography.caption, color: colors.muted, textAlign: 'center', marginTop: 12 },
});
