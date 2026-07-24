/**
 * 출석체크 — 하루 1회 출석하면 포인트 적립(일일 한도 적용). 7일 그리드.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { notify, toast } from '../../lib/alert';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/ui';
import { colors, radii, cardShadow, typography } from '../../theme/theme';
import { useAppState, fmtP, ATT_REWARD, DAILY_CAP, capRoom } from '../../state/AppState';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Attendance'>;

export function AttendanceScreen({ navigation }: Props) {
  const s = useAppState();
  const { streak, attToday, todayEarned, checkAttendance } = s;

  // 이번 주에 채운 칸 수(대략). attToday면 오늘까지 포함.
  const doneCount = attToday ? ((streak - 1) % 7) + 1 : streak % 7;

  const onCheck = async () => {
    if (attToday) return;
    const g = Math.min(ATT_REWARD, capRoom(s));
    try {
      await checkAttendance();
      if (g > 0) toast(`출석 완료! +${fmtP(g)}P 받았어요 🔥`);
      else notify('출석 완료!', '오늘 적립 한도를 다 채워서 포인트는 내일 다시 쌓여요.');
    } catch (e) {
      toast((e as { message?: string })?.message ?? '출석 처리 중 문제가 생겼어요');
    }
  };

  return (
    <Screen>
      <Button label="← 뒤로" variant="plain" onPress={() => navigation.goBack()} style={styles.back} />
      <Text style={styles.h1}>출석체크</Text>
      <Text style={styles.sub}>매일 출석하면 {fmtP(ATT_REWARD)}P씩 쌓여요</Text>

      <View style={styles.streakCard}>
        <Text style={styles.fire}>🔥</Text>
        <Text style={styles.streakNum}>{streak}일 연속</Text>
        <Text style={styles.streakLab}>걷고 출석하는 중</Text>
      </View>

      <View style={styles.grid}>
        {Array.from({ length: 7 }).map((_, i) => {
          const done = i < doneCount;
          const isToday = i === doneCount && !attToday;
          const isGift = i === 6;
          return (
            <View key={i} style={[styles.day, done && styles.dayDone, isToday && styles.dayToday, isGift && styles.dayGift]}>
              <Text style={styles.dayN}>{i + 1}일</Text>
              <Text style={styles.dayIc}>{done ? '✅' : isGift ? '🎁' : `+${ATT_REWARD}`}</Text>
            </View>
          );
        })}
      </View>

      <Button
        label={attToday ? '오늘 출석 완료' : `출석하고 +${fmtP(ATT_REWARD)}P 받기`}
        large
        disabled={attToday}
        onPress={onCheck}
        style={styles.cta}
      />
      <Text style={styles.note}>오늘 모은 포인트 {fmtP(todayEarned)} / {fmtP(DAILY_CAP)}P · 출석은 한도에 포함돼요</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 14, marginBottom: 4 },
  h1: { ...typography.display, color: colors.ink },
  sub: { ...typography.body, color: colors.muted, marginTop: 6, marginBottom: 16 },
  streakCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 22, alignItems: 'center', ...cardShadow },
  fire: { fontSize: 40 },
  streakNum: { fontSize: 26, fontWeight: '900', color: colors.ink, marginTop: 6, letterSpacing: -0.5 },
  streakLab: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  day: { width: '13.6%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 12, alignItems: 'center', ...cardShadow },
  dayDone: { backgroundColor: colors.rewardSoft },
  dayToday: { borderWidth: 2, borderColor: colors.primary },
  dayGift: { backgroundColor: colors.goldSoft },
  dayN: { fontSize: 11, fontWeight: '800', color: colors.muted },
  dayIc: { fontSize: 15, fontWeight: '900', color: colors.ink, marginTop: 5 },
  cta: { marginTop: 20 },
  note: { ...typography.caption, color: colors.muted, textAlign: 'center', marginTop: 12 },
});
