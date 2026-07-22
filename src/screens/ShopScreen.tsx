/**
 * 포인트샵 탭 — 포인트를 현금·비트코인·금·쿠폰으로 바꾸는 곳 (v10, 규칙 7 완화 반영).
 * 규칙: 확정% 금지 · 유저 속이지 않기(부족하면 정직하게 안내).
 */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { notify, confirmAction, toast } from '../lib/alert';
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

// 실시간 후기 (v10 REVIEWS): [이모지, 배경색, 후기, 부가]
const REVIEWS: [string, string, string, string][] = [
  ['🐷', '#DEF7EC', '아침마다 뒷산 한 바퀴 도는데 커피값이 나오네요', '메가 MGC 커피 · 3분 전'],
  ['🍗', '#FEF0D5', '아들내미 치킨 사줬습니다 걸어서 번 돈으로요', '교촌치킨 · 11분 전'],
  ['👟', '#E8EFFE', '출퇴근에 두 정거장 걸었더니 한 달에 이만원이 모였습니다', '현금 15,000원 · 24분 전'],
  ['🍔', '#FDECEC', '점심값 굳었다니까 동료들이 다들 깔더라구요', '맥도날드 빅맥 세트 · 32분 전'],
  ['🎫', '#E8EFFE', '손주 용돈은 이걸로 챙겨줍니다', '신세계상품권 3만원 · 41분 전'],
  ['🌱', '#DEF7EC', '늦게 시작했는데 이자 붙는 재미가 쏠쏠하네요', '이자받기 · 55분 전'],
  ['🥐', '#FEF0D5', '집사람이랑 같이 걷습니다 은근히 경쟁이 되네요', '파리바게뜨 · 1시간 전'],
  ['🥇', '#FEF0D5', '금은 조금씩 사 모으는 재미로 하고 있습니다', '금 10,000원어치 · 1시간 전'],
];

// 베스트 상품 (인기순) — PRODUCTS에서 선별
const BEST: Product[] = [PRODUCTS[3], PRODUCTS[5], PRODUCTS[0], PRODUCTS[1], PRODUCTS[6], PRODUCTS[4]];
const MEDAL = ['', '🥇', '🥈', '🥉'];

export function ShopScreen() {
  const s = useAppState();
  const { points, pointsToCash, buyAsset } = s;
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [rv, setRv] = useState(0);

  // 실시간 후기 자동 회전
  useEffect(() => {
    const id = setInterval(() => setRv((i) => (i + 1) % REVIEWS.length), 2800);
    return () => clearInterval(id);
  }, []);

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
      toast(`${won(it.won)}원으로 바꿨어요 · 내 지갑에서 확인`);
    } else if ((it.cat === 'btc' || it.cat === 'gold') && it.won) {
      buyAsset(it.cat, it.p, it.won / PRICE[it.cat]);
      toast(`${it.name} 구매 완료 · 내 지갑 보관`);
    }
  };

  const buy = (it: Product) => {
    // 쿠폰함이 아직 없어서 쿠폰 교환은 막아둔다(가짜 성공 금지).
    if (it.cat === 'coupon') {
      return notify('준비 중이에요', '쿠폰 교환과 쿠폰함은 곧 열려요.');
    }
    if (points < it.p) return notify('포인트가 부족해요', `${fmtP(it.p - points)}P 더 모으면 바꿀 수 있어요.`);
    confirmAction({
      title: it.name,
      message: `${fmtP(it.p)}P로 바꿔요.\n\n${disclosure(it)}`,
      confirmLabel: `${fmtP(it.p)}P로 바꾸기`,
      onConfirm: () => doBuy(it),
    });
  };

  const list = cat === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat);
  const staked = pTotal(s);
  const shown = [REVIEWS[rv], REVIEWS[(rv + 1) % REVIEWS.length]];

  return (
    <Screen>
      <Text style={styles.h1}>포인트샵</Text>
      <View style={styles.head}>
        <Text style={styles.headK}>쓸 수 있는 포인트</Text>
        <Text style={styles.headV}>{fmtP(points)}P</Text>
        {staked > 0 && <Text style={styles.headStake}>🌱 이자 받는 중 {fmtP(staked)}P</Text>}
      </View>

      {/* 실시간 후기 */}
      <Text style={styles.sect}>실시간 후기</Text>
      <View style={styles.reviews}>
        {shown.map(([e, bg, txt, sub], i) => (
          <View key={`${rv}-${i}`} style={[styles.rv, i === 0 && styles.rvBorder]}>
            <View style={[styles.rvAv, { backgroundColor: bg }]}><Text style={styles.rvEmoji}>{e}</Text></View>
            <View style={styles.flex1}>
              <Text style={styles.rvTxt} numberOfLines={1}>{txt}</Text>
              <Text style={styles.rvSub}>{sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 베스트 상품 */}
      <Text style={styles.sect}>베스트 상품</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bestRow}>
        {BEST.map((it, idx) => {
          const rank = idx + 1;
          return (
            <Pressable key={it.name} style={[styles.bcard, rank <= 3 && styles.bcardTop]} onPress={() => buy(it)}>
              <Text style={styles.bRank}>{rank <= 3 ? `${MEDAL[rank]} ${rank}위` : `${rank}위`}</Text>
              <Text style={styles.bEmoji}>{it.emoji}</Text>
              <Text style={styles.bBr}>{it.brand}</Text>
              <Text style={styles.bNm} numberOfLines={2}>{it.name}</Text>
              <View style={styles.prRow}>
                <View style={styles.pc}><Text style={styles.pcTxt}>P</Text></View>
                <Text style={styles.bPr}>{fmtP(it.p)}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 카테고리 */}
      <Text style={styles.sect}>카테고리</Text>
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

      <View style={styles.list}>
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
              <Text style={styles.go}>{it.cat === 'coupon' ? '준비 중' : can ? '바꾸기 ›' : '부족'}</Text>
            </Pressable>
          );
        })}
        <Text style={styles.note}>현금·비트코인·금은 내 지갑에 쌓이고, 언제든 내 계좌로 출금할 수 있어요.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.display, color: colors.ink, marginTop: 6, marginBottom: 12 },
  head: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, ...cardShadow },
  headK: { fontSize: 12, fontWeight: '700', color: colors.muted },
  headV: { fontSize: 30, fontWeight: '900', letterSpacing: -1.4, color: colors.ink, marginTop: 2 },
  headStake: { fontSize: 11.5, fontWeight: '700', color: colors.rewardDeep, marginTop: 6 },

  sect: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: 22, marginBottom: 10 },

  // 실시간 후기
  reviews: { backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 16, ...cardShadow },
  rv: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  rvBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  rvAv: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rvEmoji: { fontSize: 15 },
  rvTxt: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  rvSub: { fontSize: 11, fontWeight: '600', color: colors.dim, marginTop: 2 },

  // 베스트 상품
  bestRow: { gap: 12, paddingRight: 8, paddingBottom: 2 },
  bcard: { width: 148, backgroundColor: colors.surface, borderRadius: 18, padding: 14, ...cardShadow },
  bcardTop: { borderWidth: 2, borderColor: colors.line },
  bRank: { fontSize: 12, fontWeight: '900', color: colors.ink },
  bEmoji: { fontSize: 30, marginTop: 8 },
  bBr: { fontSize: 11, fontWeight: '700', color: colors.muted, marginTop: 6 },
  bNm: { fontSize: 13, fontWeight: '800', color: colors.ink, marginTop: 1, height: 36 },
  bPr: { fontSize: 16, fontWeight: '900', color: colors.ink },

  cats: { marginTop: 2, flexGrow: 0 },
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
