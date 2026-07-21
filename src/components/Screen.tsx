/** 화면 컨테이너 — 다크 배경 + 세이프에어리어 + 스크롤. */
import React from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';

export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 };

  if (!scroll) {
    return <View style={[styles.container, pad, styles.pageX, contentStyle]}>{children}</View>;
  }
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.pageX, pad, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  pageX: { paddingHorizontal: 22 },
});
