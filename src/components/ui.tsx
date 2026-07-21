/** 공용 UI 컴포넌트 — 다크 테마 토큰 기반. docs/09-design-dark-theme.md */
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

const styles = StyleSheet.create({
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
