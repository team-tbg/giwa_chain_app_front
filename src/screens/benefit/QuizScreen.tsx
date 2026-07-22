/**
 * OX 금융퀴즈 — 하루 5문제, 정답이면 포인트 적립(일일 한도 적용). 해설로 금융 상식 학습.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/ui';
import { colors, radii, cardShadow, typography } from '../../theme/theme';
import { useAppState, fmtP, QUIZ_REWARD, QUIZ_DAILY, capRoom } from '../../state/AppState';
import { QUIZ } from '../../data/quiz';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

export function QuizScreen({ navigation }: Props) {
  const s = useAppState();
  const { quizIndex, quizSolvedToday, answerQuiz } = s;
  const [picked, setPicked] = useState<'O' | 'X' | null>(null);

  const doneToday = quizIndex >= QUIZ_DAILY;
  const q = QUIZ[quizIndex % QUIZ.length];
  const correct = picked != null && picked === q.a;

  const pick = (choice: 'O' | 'X') => {
    if (picked) return;
    setPicked(choice);
  };
  const next = () => {
    answerQuiz(picked === q.a);
    setPicked(null);
  };

  return (
    <Screen>
      <Button label="← 뒤로" variant="plain" onPress={() => navigation.goBack()} style={styles.back} />
      <Text style={styles.h1}>OX 금융퀴즈</Text>
      <Text style={styles.sub}>하루 {QUIZ_DAILY}문제 · 맞히면 {fmtP(QUIZ_REWARD)}P</Text>

      {doneToday ? (
        <View style={styles.doneBox}>
          <Text style={styles.emoji}>🎓</Text>
          <Text style={styles.doneTitle}>오늘 퀴즈 끝!</Text>
          <Text style={styles.doneSub}>오늘 {fmtP(quizSolvedToday)}문제 맞혔어요. 내일 새 문제로 만나요.</Text>
          <Button label="혜택으로 돌아가기" onPress={() => navigation.goBack()} style={styles.cta} />
        </View>
      ) : (
        <>
          <View style={styles.progress}>
            <Text style={styles.progressTxt}>{quizIndex + 1} / {QUIZ_DAILY}</Text>
          </View>

          <View style={styles.qcard}>
            <Text style={styles.q}>{q.q}</Text>
          </View>

          <View style={styles.oxRow}>
            <Pressable
              style={[styles.ox, styles.oxO, picked === 'O' && styles.oxPicked, picked && picked !== 'O' && styles.oxDim]}
              onPress={() => pick('O')}
              disabled={!!picked}
            >
              <Text style={[styles.oxMark, { color: colors.primary }]}>O</Text>
            </Pressable>
            <Pressable
              style={[styles.ox, styles.oxX, picked === 'X' && styles.oxPicked, picked && picked !== 'X' && styles.oxDim]}
              onPress={() => pick('X')}
              disabled={!!picked}
            >
              <Text style={[styles.oxMark, { color: colors.red }]}>X</Text>
            </Pressable>
          </View>

          {picked && (
            <>
              <View style={[styles.ans, correct ? styles.ansOk : styles.ansNo]}>
                <Text style={[styles.ansHead, { color: correct ? colors.rewardDeep : '#B42318' }]}>
                  {correct ? `정답이에요! +${fmtP(Math.min(QUIZ_REWARD, capRoom(s)))}P` : `아쉬워요. 정답은 ${q.a}`}
                </Text>
                <Text style={styles.ansEx}>{q.ex}</Text>
              </View>
              <Button label={quizIndex + 1 >= QUIZ_DAILY ? '마치기' : '다음 문제'} large onPress={next} style={styles.cta} />
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 14, marginBottom: 4 },
  h1: { ...typography.display, color: colors.ink },
  sub: { ...typography.body, color: colors.muted, marginTop: 6, marginBottom: 16 },
  progress: { alignItems: 'center', marginBottom: 10 },
  progressTxt: { fontSize: 14, fontWeight: '800', color: colors.muted },
  qcard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 24, minHeight: 130, alignItems: 'center', justifyContent: 'center', ...cardShadow },
  q: { fontSize: 19, fontWeight: '800', color: colors.ink, lineHeight: 28, textAlign: 'center', letterSpacing: -0.4 },
  oxRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  ox: { flex: 1, borderRadius: 20, paddingVertical: 26, alignItems: 'center', backgroundColor: colors.surface, ...cardShadow },
  oxO: {},
  oxX: {},
  oxMark: { fontSize: 40, fontWeight: '900' },
  oxPicked: { borderWidth: 3, borderColor: colors.ink },
  oxDim: { opacity: 0.4 },
  ans: { borderRadius: 16, padding: 16, marginTop: 14 },
  ansOk: { backgroundColor: colors.rewardSoft },
  ansNo: { backgroundColor: '#FDECEC' },
  ansHead: { fontSize: 15, fontWeight: '800' },
  ansEx: { fontSize: 13.5, fontWeight: '600', color: colors.muted, lineHeight: 21, marginTop: 8 },
  cta: { marginTop: 18 },
  doneBox: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 30, alignItems: 'center', ...cardShadow, marginTop: 8 },
  emoji: { fontSize: 52 },
  doneTitle: { fontSize: 20, fontWeight: '900', color: colors.ink, marginTop: 10 },
  doneSub: { ...typography.body, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
