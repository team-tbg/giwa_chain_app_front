/**
 * 내 지갑 탭 — 전체 자산 · 보유 자산별 출금/전환 · 지갑주소 (v10, 규칙 5 완화 반영).
 * 규칙: 출금은 원탭·진짜 열림 · 시드/개인키는 "고급 설정"에만.
 */
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Screen } from '../components/Screen';
import { colors, radii, cardShadow, typography } from '../theme/theme';
import { useAppState, won, fmtP, fmtd, PRICE, pTotal, cTotal, netWorth } from '../state/AppState';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

const ADDR = '0x7A3f9B21C4dE8f0a45B7c9E1D2380Fa6b19C4E27';
const UPID = 'naduri7.up';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Wallet'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function WalletScreen({ navigation }: Props) {
  const s = useAppState();
  const { points, cash, hold, withdrawCash, sellAsset } = s;

  const total = netWorth(s) || 1;
  const parts = [
    { n: '쓸 수 있는 포인트', v: points, c: colors.gold, d: `${fmtP(points)}P` },
    { n: '이자 받는 포인트', v: pTotal(s), c: colors.reward, d: `${fmtP(pTotal(s))}P` },
    { n: '원화 자산', v: cash + cTotal(s), c: colors.primary, d: `${won(cash + cTotal(s))}원`, act: 'cash' as const },
    { n: '비트코인', v: hold.btc * PRICE.btc, c: '#F7931A', d: `${fmtd(hold.btc, 8)} BTC`, act: 'btc' as const },
    { n: '금 PAXG', v: hold.gold * PRICE.gold, c: '#C9A227', d: `${fmtd(hold.gold, 6)} PAXG`, act: 'gold' as const },
  ];

  const withdraw = () => {
    if (cash <= 0) return Alert.alert('출금할 돈이 없어요', '이자 안 받고 있는 원화 자산이 없어요.');
    withdrawCash(cash);
    Alert.alert('보냈어요', `내 계좌로 ${won(cash)}원을 보내드렸어요. 영업일 기준 1~3일 걸려요.`);
  };
  const sell = (kind: 'btc' | 'gold', name: string) => {
    if (hold[kind] <= 0) return Alert.alert('출금할 자산이 없어요', `보유한 ${name}가 없어요.`);
    const v = hold[kind] * PRICE[kind];
    sellAsset(kind);
    Alert.alert('원화로 바꿨어요', `${name}를 팔아 ${won(v)}원이 원화 자산에 들어왔어요.`);
  };

  return (
    <Screen>
      <Text style={styles.h1}>내 지갑</Text>

      {/* 전체 자산 */}
      <View style={styles.totalCard}>
        <Text style={styles.totalK}>전체 자산</Text>
        <Text style={styles.totalV}>{won(netWorth(s))}</Text>
        <View style={styles.mixbar}>
          {parts.map((p, i) => (
            <View key={i} style={{ width: `${(p.v / total) * 100}%`, backgroundColor: p.c }} />
          ))}
        </View>
      </View>

      {/* 보유 자산 */}
      <Text style={styles.sect}>보유 자산</Text>
      {parts.map((p, i) => (
        <View key={i} style={styles.wrow}>
          <View style={styles.wtop}>
            <View style={[styles.dot, { backgroundColor: p.c }]} />
            <View style={styles.flex1}>
              <Text style={styles.wname}>{p.n}</Text>
              <Text style={styles.wpct}>{((p.v / total) * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.wright}>
              <Text style={styles.wd}>{p.d}</Text>
              <Text style={styles.wv}>{won(p.v)}</Text>
            </View>
          </View>
          {p.act === 'cash' ? (
            <View style={styles.wact}>
              <WBtn label="입금" onPress={() => navigation.navigate('Deposit')} />
              <WBtn label="출금" onPress={withdraw} />
            </View>
          ) : p.act ? (
            <View style={styles.wact}>
              <WBtn label="출금하기(원화로)" onPress={() => sell(p.act as 'btc' | 'gold', p.n)} full />
            </View>
          ) : null}
        </View>
      ))}

      {/* 지갑 주소 */}
      <Text style={styles.sect}>내 지갑 주소</Text>
      <View style={styles.addrCard}>
        <View style={styles.addrRow}><Text style={styles.addrK}>이름</Text><Text style={styles.mono}>{UPID}</Text></View>
        <View style={styles.addrRow}><Text style={styles.addrK}>주소</Text><Text style={styles.mono}>{ADDR.slice(0, 6)}...{ADDR.slice(-4)}</Text></View>
        <View style={styles.addrRow}><Text style={styles.addrK}>네트워크</Text><View style={styles.netChip}><Text style={styles.netChipTxt}>GIWA</Text></View></View>
        <View style={styles.addrBtns}>
          <WBtn label="주소 복사하기" onPress={() => Alert.alert('복사했어요', '지갑 주소를 복사했어요.')} full />
          <WBtn label="고급 설정" onPress={() => Alert.alert('고급 설정', '개인키·복구 구문은 안전하게 보관하세요. (준비 중)')} full />
        </View>
      </View>
      <Text style={styles.note}>주소는 남에게 알려줘도 안전해요. 다만 로그인 정보는 누구에게도 알려주지 마세요.</Text>
    </Screen>
  );
}

function WBtn({ label, onPress, full }: { label: string; onPress: () => void; full?: boolean }) {
  return (
    <Pressable style={[styles.wbtn, full && styles.flex1]} onPress={onPress}>
      <Text style={styles.wbtnTxt}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.display, color: colors.ink, marginTop: 6, marginBottom: 12 },
  totalCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, alignItems: 'center', ...cardShadow },
  totalK: { fontSize: 12, fontWeight: '700', color: colors.muted },
  totalV: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5, color: colors.ink, marginTop: 2 },
  mixbar: { flexDirection: 'row', height: 12, borderRadius: radii.pill, overflow: 'hidden', backgroundColor: colors.line, marginTop: 16, alignSelf: 'stretch', gap: 2 },

  sect: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: 22, marginBottom: 8 },
  wrow: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 8, ...cardShadow },
  wtop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  flex1: { flex: 1 },
  wname: { fontSize: 14, fontWeight: '800', color: colors.ink },
  wpct: { fontSize: 11.5, fontWeight: '700', color: colors.muted, marginTop: 2 },
  wright: { alignItems: 'flex-end' },
  wd: { fontSize: 15, fontWeight: '800', color: colors.ink },
  wv: { fontSize: 11.5, fontWeight: '700', color: colors.muted, marginTop: 2 },
  wact: { flexDirection: 'row', gap: 6, marginTop: 11, paddingTop: 11, borderTopWidth: 1, borderTopColor: colors.line },

  addrCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, ...cardShadow },
  addrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addrK: { fontSize: 13, fontWeight: '700', color: colors.muted },
  mono: { fontFamily: 'monospace', fontSize: 13, fontWeight: '800', color: colors.ink },
  netChip: { backgroundColor: colors.primarySoft, borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 11 },
  netChipTxt: { fontSize: 12, fontWeight: '800', color: colors.primaryDeep },
  addrBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },

  wbtn: { backgroundColor: colors.surface2, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  wbtnTxt: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
  note: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 12, lineHeight: 18 },
});
