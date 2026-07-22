/**
 * 포인트샵 탭 — 포인트를 현금·비트코인·금·쿠폰으로 바꾸는 곳 (v10, 규칙 7 완화 반영).
 * 규칙: 확정% 금지 · 유저 속이지 않기(부족하면 정직하게 안내).
 */
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { colors, radii, cardShadow, typography } from '../theme/theme';
import { useAppState, won, fmtP, PRICE, pTotal } from '../state/AppState';

type Cat = 'cash' | 'btc' | 'gold' | 'coupon';
type Product = { cat: Cat; emoji: string; brand: string; name: string; p: number; won?: number };

const PRODUCTS: Product[] = [
  { cat: 'cash', emoji: '💵', brand: '현금 전환', name: '현금 10,000원', p: 11000, won: 10000 },
  { cat: 'cash', emoji: '💵', brand: '현금 전환', name: '현금 30,000원', p: 32000, won: 30000 },
  { cat: 'cash', emoji: '💵', brand: '현금 전환', name: '현금 50,000원', p: 52000, won: 50000 },
  { cat: 'btc', emoji: '₿', brand: '비트코인', name: '비트코인 10,000원어치', p: 10800, won: 10000 },
  { cat: 'btc', emoji: '₿', brand: '비트코인', name: '비트코인 30,000원어치', p: 32000, won: 30000 },
  { cat: 'gold', emoji: '🥇', brand: '금 PAXG', name: '금 10,000원어치', p: 10800, won: 10000 },
  { cat: 'gold', emoji: '🥇', brand: '금 PAXG', name: '금 50,000원어치', p: 53000, won: 50000 },
  { cat: 'coupon', emoji: '☕', brand: '카페', name: '아메리카노 교환권', p: 4500 },
  { cat: 'coupon', emoji: '🍔', brand: '편의점', name: '5,000원 상품권', p: 5500 },
];

const CATS: { id: Cat | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'cash', label: '현금' },
  { id: 'btc', label: '비트코인' },
  { id: 'gold', label: '금' },
  { id: 'coupon', label: '쿠폰' },
];

export function ShopScreen() {
  const s = useAppState();
  const { points, pointsToCash, buyAsset } = s;
  const [cat, setCat] = useState<Cat | 'all'>('all');

  // v10처럼 자산은 "값이 오르내려 산 금액보다 적어질 수 있다"고 정직하게 고지한 뒤 구매.
  const disclosure = (it: Product) =>
    it.cat === 'btc' || it.cat === 'gold'
      ? '값이 오르내리는 자산이에요. 산 금액보다 적어질 수 있고, 실물 배송은 지원하지 않아요.'
      : it.cat === 'cash'
        ? '바꾼 현금은 내 자산에 쌓여요. 바로 출금해도 되고, 두고 이자를 받아도 돼요.'
        : '쿠폰함에서 확인할 수 있어요.';

  const doBuy = (it: Product) => {
    if (it.cat === 'cash' && it.won) {
      pointsToCash(it.p, it.won);
      Alert.alert('바꿨어요', `${won(it.won)}원이 내 자산에 들어왔어요. 내 지갑에서 볼 수 있어요.`);
    } else if ((it.cat === 'btc' || it.cat === 'gold') && it.won) {
      buyAsset(it.cat, it.p, it.won / PRICE[it.cat]);
      Alert.alert('샀어요', `${it.name}를 샀어요. 내 지갑에 보관돼요.`);
    } else {
      Alert.alert('교환 완료', `${it.name}으로 바꿨어요. 쿠폰함에서 확인하세요.`);
    }
  };

  const buy = (it: Product) => {
    if (points < it.p) return Alert.alert('포인트가 부족해요', `${fmtP(it.p - points)}P 더 모으면 바꿀 수 있어요.`);
    Alert.alert(it.name, `${fmtP(it.p)}P로 바꿔요.\n\n${disclosure(it)}`, [
      { text: '취소', style: 'cancel' },
      { text: `${fmtP(it.p)}P로 바꾸기`, onPress: () => doBuy(it) },
    ]);
  };

  const list = cat === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat);
  const staked = pTotal(s);

  return (
    <Screen scroll={false}>
      <Text style={styles.h1}>포인트샵</Text>
      <View style={styles.head}>
        <Text style={styles.headK}>쓸 수 있는 포인트</Text>
        <Text style={styles.headV}>{fmtP(points)}P</Text>
        {staked > 0 && <Text style={styles.headStake}>🌱 이자 받는 중 {fmtP(staked)}P</Text>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cats} contentContainerStyle={styles.catsInner}>
        {CATS.map((c) => {
          const on = c.id === cat;
          return (
            <Pressable key={c.id} style={[styles.cat, on && styles.catOn]} onPress={() => setCat(c.id)}>
              <Text style={[styles.catTxt, on && styles.catTxtOn]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {list.map((it) => {
          const can = points >= it.p;
          return (
            <Pressable key={it.name} style={styles.prod} onPress={() => buy(it)}>
              <View style={styles.im}><Text style={styles.imEmoji}>{it.emoji}</Text></View>
              <View style={styles.flex1}>
                <Text style={styles.br}>{it.brand}</Text>
                <Text style={styles.nm}>{it.name}</Text>
                <View style={styles.prRow}>
                  <View style={styles.pc}><Text style={styles.pcTxt}>P</Text></View>
                  <Text style={[styles.pr, !can && styles.prOff]}>{fmtP(it.p)}</Text>
                </View>
              </View>
              <Text style={styles.go}>{can ? '바꾸기 ›' : '부족'}</Text>
            </Pressable>
          );
        })}
        <Text style={styles.note}>현금·비트코인·금은 내 지갑에 쌓이고, 언제든 내 계좌로 출금할 수 있어요.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.display, color: colors.ink, marginTop: 6, marginBottom: 12 },
  head: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, ...cardShadow },
  headK: { fontSize: 12, fontWeight: '700', color: colors.muted },
  headV: { fontSize: 30, fontWeight: '900', letterSpacing: -1.4, color: colors.ink, marginTop: 2 },
  headStake: { fontSize: 11.5, fontWeight: '700', color: colors.rewardDeep, marginTop: 6 },
  cats: { marginTop: 14, flexGrow: 0 },
  catsInner: { gap: 7, paddingRight: 8 },
  cat: { backgroundColor: colors.surface, borderRadius: radii.pill, paddingVertical: 10, paddingHorizontal: 16, ...cardShadow },
  catOn: { backgroundColor: colors.ink },
  catTxt: { fontSize: 13.5, fontWeight: '800', color: colors.muted },
  catTxtOn: { color: '#fff' },
  list: { paddingTop: 12, paddingBottom: 24, gap: 8 },
  prod: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 18, padding: 14, ...cardShadow },
  im: { width: 60, height: 60, borderRadius: 14, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  imEmoji: { fontSize: 30 },
  flex1: { flex: 1 },
  br: { fontSize: 12, fontWeight: '700', color: colors.muted },
  nm: { fontSize: 14.5, fontWeight: '800', color: colors.ink, marginTop: 1 },
  prRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  pc: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  pcTxt: { color: '#fff', fontSize: 10, fontWeight: '900' },
  pr: { fontSize: 18, fontWeight: '900', color: colors.ink },
  prOff: { color: colors.dim },
  go: { fontSize: 13, fontWeight: '800', color: colors.primary },
  note: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 8, lineHeight: 18, paddingHorizontal: 4 },
});
