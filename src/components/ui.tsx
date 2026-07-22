/** 공용 UI 컴포넌트 — 라이트 · 핀테크 블루 토큰 기반. docs/09-design-theme.md */
import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { cardShadow, colors, radii } from '../theme/theme';

type BtnVariant = 'primary' | 'plain' | 'ghost' | 'honey';

export function Button({
  label,
  onPress,
  variant = 'primary',
  large = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  large?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = {
    primary: colors.mint,
    plain: colors.surface2,
    ghost: colors.mintSoft,
    honey: colors.honey,
  }[variant];
  const fg = {
    primary: colors.mintOn,
    plain: colors.ink,
    ghost: colors.mint,
    honey: colors.honeyOn,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, height: large ? 62 : 58, opacity: disabled ? 0.5 : 1 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      <Text style={[styles.btnLabel, { color: fg, fontSize: large ? 19 : 18 }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({
  children,
  flat = false,
  style,
}: {
  children: React.ReactNode;
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[flat ? styles.cardFlat : styles.card, style]}>{children}</View>
  );
}

export function Pill({
  children,
  tone = 'green',
}: {
  children: React.ReactNode;
  tone?: 'green' | 'honey';
}) {
  const isGreen = tone === 'green';
  return (
    <View style={[styles.pill, { backgroundColor: isGreen ? colors.mintSoft : colors.honeySoft }]}>
      <Text style={[styles.pillText, { color: isGreen ? colors.mint : colors.honey }]}>{children}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

/** 금액 표시: 큰 숫자 + '원' */
export function Amount({
  value,
  color = colors.ink,
  size = 46,
}: {
  value: string;
  color?: string;
  size?: number;
}) {
  return (
    <Text style={{ color }}>
      <Text style={[styles.bigNum, { fontSize: size }] as StyleProp<TextStyle>}>{value}</Text>
      <Text style={styles.won}>원</Text>
    </Text>
  );
}

/**
 * 걸음 진행 링 (v10 hero ring 대응).
 * size 안에 중앙 콘텐츠(children)를 얹는다. progress 0~1.
 */
export function ProgressRing({
  size = 214,
  stroke = 17,
  progress,
  color = colors.primary,
  track = colors.line,
  children,
}: {
  size?: number;
  stroke?: number;
  progress: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const p = Math.max(0, Math.min(1, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={center} cy={center} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.ringCenter}>{children}</View>
    </View>
  );
}

/**
 * "?" 도움말 — 웹은 마우스 올리면(hover), 모바일은 누르면 설명 말풍선이 뜬다. (v10 qm)
 */
export function QMark({ tip, openLeft }: { tip: string; openLeft?: boolean }) {
  const [show, setShow] = React.useState(false);
  return (
    <View style={styles.qmarkWrap}>
      <Pressable
        onPress={() => setShow((v) => !v)}
        onHoverIn={() => setShow(true)}
        onHoverOut={() => setShow(false)}
        style={styles.qmark}
      >
        <Text style={styles.qmarkTxt}>?</Text>
      </Pressable>
      {show && (
        <View style={[styles.qtip, openLeft ? styles.qtipLeft : styles.qtipRight]}>
          <Text style={styles.qtipTxt}>{tip}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  qmarkWrap: { position: 'relative' },
  qmark: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  qmarkTxt: { color: '#fff', fontSize: 11, fontWeight: '900' },
  qtip: { position: 'absolute', bottom: 26, width: 240, backgroundColor: '#16202E', borderRadius: 14, padding: 14, zIndex: 100 },
  qtipRight: { left: -4 },
  qtipLeft: { right: -4 },
  qtipTxt: { color: '#fff', fontSize: 12, fontWeight: '600', lineHeight: 18 },
  btn: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnLabel: { fontWeight: '800', letterSpacing: -0.3 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.line,
    ...cardShadow,
  },
  cardFlat: {
    backgroundColor: colors.surface2,
    borderRadius: radii.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  pillText: { fontWeight: '800', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bigNum: { fontWeight: '800', letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  won: { fontSize: 24, fontWeight: '800' },
});
