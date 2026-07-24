/**
 * 출금 금액 지정 시트 (v10 withdrawSheet) — 이자받기·내 지갑에서 공용.
 * 입력 즉시 검증: 출금 가능 금액보다 많이 적으면 바로 빨갛게 표시하고 버튼을 막는다.
 * 규칙: 출금은 진짜 열림(마찰·인질형 금지). 이자 받고 있지 않은 원화만 출금 가능.
 */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from './ui';
import { colors } from '../theme/theme';
import { won } from '../state/AppState';

export function WithdrawSheet({ visible, cash, onClose, onConfirm }: {
  visible: boolean; cash: number; onClose: () => void; onConfirm: (amount: number) => void;
}) {
  const [input, setInput] = useState('');
  const max = Math.floor(cash);
  useEffect(() => {
    if (visible) setInput(String(max)); // 열릴 때 기본값 = 출금 가능 전액
  }, [visible, max]);

  const val = Math.floor(Number(input) || 0);
  const over = val > max;   // 출금 가능액 초과
  const empty = val <= 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.mask} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>내 계좌로 출금하기</Text>
        <Text style={styles.sub}>이자를 받고 있지 않은 금액만 출금할 수 있어요</Text>
        <View style={[styles.row, over && styles.rowErr]}>
          <TextInput
            value={input}
            onChangeText={(t) => setInput(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            style={[styles.input, over && styles.inputErr]}
            placeholder="0"
            placeholderTextColor={colors.dim}
            autoFocus
          />
          <Text style={styles.unit}>원</Text>
          <Pressable style={styles.maxBtn} onPress={() => setInput(String(max))}>
            <Text style={styles.maxBtnTxt}>전액</Text>
          </Pressable>
        </View>
        {over ? (
          <Pressable onPress={() => setInput(String(max))}>
            <Text style={styles.err}>출금 가능한 금액보다 많아요 · 눌러서 최대 {won(max)}원으로 맞추기</Text>
          </Pressable>
        ) : (
          <Text style={styles.hint}>출금 가능 {won(max)}원</Text>
        )}
        <View style={styles.notice}>
          <Text style={styles.noticeTxt}>출금은 영업일 기준 1~3일이 걸려요. 신청 상태는 이자받기 화면에서 확인할 수 있어요.</Text>
        </View>
        <Button label="출금 신청하기" large onPress={() => onConfirm(val)} disabled={empty || over} style={styles.cta} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: { flex: 1, backgroundColor: 'rgba(12,20,34,0.42)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 30 },
  handle: { width: 38, height: 4, borderRadius: 99, backgroundColor: '#E2E6ED', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 19, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  sub: { fontSize: 13.5, fontWeight: '600', color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.line, borderRadius: 15, marginTop: 18, backgroundColor: colors.surface, paddingHorizontal: 16 },
  rowErr: { borderColor: colors.red, backgroundColor: '#FFF3F3' },
  input: { flex: 1, paddingVertical: 15, fontSize: 24, fontWeight: '900', color: colors.ink, textAlign: 'right' },
  inputErr: { color: colors.red },
  unit: { fontSize: 16, fontWeight: '800', color: colors.muted, marginLeft: 8 },
  maxBtn: { marginLeft: 12, borderRadius: 10, backgroundColor: colors.surface2, paddingVertical: 8, paddingHorizontal: 12 },
  maxBtnTxt: { fontSize: 13, fontWeight: '800', color: colors.ink },
  hint: { fontSize: 12.5, fontWeight: '700', color: colors.muted, textAlign: 'center', marginTop: 10 },
  err: { fontSize: 12.5, fontWeight: '800', color: colors.red, textAlign: 'center', marginTop: 10 },
  notice: { backgroundColor: colors.surface2, borderRadius: 14, padding: 14, marginTop: 16 },
  noticeTxt: { fontSize: 12.5, fontWeight: '600', color: colors.muted, lineHeight: 20 },
  cta: { marginTop: 16 },
});
