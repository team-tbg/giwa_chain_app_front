/**
 * 커스텀 다이얼로그 + 토스트 — 브라우저/네이티브 기본 Alert 대신 앱 테마에 맞춘 UI.
 * 명령형 API(notify/confirmAction/toast)는 어디서든 호출 가능하고,
 * App 루트에 한 번 마운트된 <DialogHost/>·<ToastHost/>가 실제로 렌더한다.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, cardShadow } from '../theme/theme';

// ───────── 다이얼로그 스토어 ─────────
type DialogReq = { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; onConfirm?: () => void };
const dialogListeners = new Set<(r: DialogReq | null) => void>();

/** 단순 안내(확인 버튼 하나) */
export function notify(title: string, message?: string) {
  dialogListeners.forEach((l) => l({ title, message }));
}
/** 확인/취소 다이얼로그 — 확인 시 onConfirm */
export function confirmAction(opts: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}) {
  dialogListeners.forEach((l) => l(opts));
}

// ───────── 토스트 스토어 ─────────
const toastListeners = new Set<(m: string) => void>();
/** 가벼운 성공/피드백 (자동 사라짐) */
export function toast(message: string) {
  toastListeners.forEach((l) => l(message));
}

// ───────── 다이얼로그 호스트 ─────────
export function DialogHost() {
  const [req, setReq] = useState<DialogReq | null>(null);
  useEffect(() => {
    const l = (r: DialogReq | null) => setReq(r);
    dialogListeners.add(l);
    return () => {
      dialogListeners.delete(l);
    };
  }, []);

  const isConfirm = !!req?.onConfirm;
  const close = () => setReq(null);
  const confirm = () => {
    const cb = req?.onConfirm;
    close();
    cb?.();
  };

  return (
    <Modal visible={!!req} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.overlay} onPress={close}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{req?.title}</Text>
          {!!req?.message && <Text style={styles.message}>{req.message}</Text>}
          <View style={styles.btnRow}>
            {isConfirm && (
              <Pressable style={[styles.btn, styles.ghost]} onPress={close}>
                <Text style={[styles.btnTxt, styles.ghostTxt]}>{req?.cancelLabel ?? '취소'}</Text>
              </Pressable>
            )}
            <Pressable style={[styles.btn, styles.primary]} onPress={isConfirm ? confirm : close}>
              <Text style={[styles.btnTxt, styles.primaryTxt]}>{isConfirm ? req?.confirmLabel ?? '확인' : '확인'}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ───────── 토스트 호스트 ─────────
export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const l = (m: string) => {
      setMsg(m);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => setMsg(null));
      }, 1900);
    };
    toastListeners.add(l);
    return () => {
      toastListeners.delete(l);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [opacity]);

  if (!msg) return null;
  return (
    <View pointerEvents="none" style={styles.toastWrap}>
      <Animated.View style={[styles.toast, { opacity }]}>
        <Text style={styles.toastTxt}>{msg}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(12,20,34,0.42)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.surface, borderRadius: radii.lg, padding: 24, ...cardShadow },
  title: { fontSize: 18, fontWeight: '900', color: colors.ink, letterSpacing: -0.4 },
  message: { fontSize: 14, fontWeight: '500', color: colors.muted, lineHeight: 22, marginTop: 10 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 22 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primary: { backgroundColor: colors.primary },
  primaryTxt: { color: '#fff' },
  ghost: { backgroundColor: colors.surface2 },
  ghostTxt: { color: colors.ink },
  btnTxt: { fontSize: 15, fontWeight: '800' },

  toastWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 108 },
  toast: { maxWidth: '86%', backgroundColor: 'rgba(16,24,38,0.94)', borderRadius: 15, paddingVertical: 13, paddingHorizontal: 20 },
  toastTxt: { color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'center', lineHeight: 20 },
});
