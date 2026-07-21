/**
 * 4. ★ 출금 모멘트 = 전환 화면 (사업의 심장).
 * 규칙:
 * - 받기(출금)는 진짜 열려 있다. 3탭 이내, 확인 다이얼로그로 막지 않는다.
 * - 미래 금액은 항상 가정형 + "변동 가능 · 원금 비보장" 꼬리표.
 * - idle 예시(300만원)는 연동 전 고정값.
 */
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Amount, Button, Pill, Row } from '../../components/ui';
import { colors, typography } from '../../theme/theme';
import { useAppState, won } from '../../state/AppState';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WithdrawMoment'>;

export function WithdrawMomentScreen({ navigation }: Props) {
  const { boostedAmount, growth } = useAppState();
  const withdrawable = boostedAmount + growth;

  const withdraw = () => {
    // 마찰 없는 진짜 출금. (파일럿: 실제 정산 대신 알림)
    Alert.alert('보냈어요', `통장으로 ${won(withdrawable)}원을 보내드렸어요. 언제든 다시 이용하세요.`);
    navigation.navigate('Main');
  };

  return (
    <Screen>
      <Button label="← 뒤로" variant="plain" onPress={() => navigation.goBack()} style={styles.back} />
      <Text style={styles.title}>받기</Text>

      <View style={styles.now}>
        <Text style={styles.label}>지금 받으면</Text>
        <View style={styles.mt2}>
          <Amount value={won(withdrawable)} size={34} />
        </View>
        <Text style={styles.subtle}>통장으로 바로 보내드려요.</Text>
      </View>

      <View style={styles.offer}>
        <Pill tone="honey">💡 이런 방법도 있어요</Pill>
        <Text style={styles.offerText}>
          혹시 그냥 놀고 있는 <Text style={styles.bold}>300만원</Text>이 있다면,{'\n'}똑같은 방식으로 뒀을 때 예를 들면요?
        </Text>
        <Row style={styles.offerRow}>
          <View>
            <Text style={styles.label}>10년 뒤 (가정)</Text>
            <View style={styles.mt2}>
              <Amount value="약 486만" color={colors.mint} size={32} />
            </View>
          </View>
          <Text style={styles.chart}>📈</Text>
        </Row>
        <Text style={styles.disclaimer}>
          지금 붙는 정도로 가정한 예시예요. 실제 결과는 달라질 수 있고, 원금이 보장되지는 않아요.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="내 돈으로 더 해보기" large onPress={() => navigation.navigate('Principal')} />
        <Button label={`지금 ${won(withdrawable)}원 받기`} variant="plain" onPress={withdraw} />
      </View>
      <Text style={styles.note}>받는 건 언제든 바로 돼요. 편하게 선택하세요.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', height: 40, paddingHorizontal: 14, marginBottom: 12 },
  title: { ...typography.display, color: colors.ink, marginBottom: 16 },
  now: { backgroundColor: colors.surface2, borderRadius: 18, padding: 20 },
  label: { ...typography.label, color: colors.muted },
  mt2: { marginTop: 2 },
  subtle: { ...typography.caption, color: colors.muted, marginTop: 4 },
  offer: {
    borderRadius: 18,
    padding: 20,
    marginTop: 12,
    backgroundColor: colors.panelDeep,
    borderWidth: 1.5,
    borderColor: 'rgba(37,99,235,0.28)',
  },
  offerText: { ...typography.body, color: colors.ink, fontWeight: '700', marginVertical: 12, lineHeight: 24 },
  bold: { fontWeight: '800' },
  offerRow: { alignItems: 'flex-end' },
  chart: { fontSize: 30 },
  disclaimer: { fontSize: 12.5, color: colors.warn, marginTop: 6, lineHeight: 18 },
  actions: { gap: 14, marginTop: 20 },
  note: { ...typography.caption, color: colors.muted, textAlign: 'center', marginTop: 12 },
});
