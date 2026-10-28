import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { radius, typeScale } from '../theme/layout';

interface Props {
  colors: ThemeColors;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  backLabel?: string;
}

export function ScreenState({ colors, message, onRetry, onBack, backLabel = 'กลับไปสารบัญ' }: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.mark, { backgroundColor: colors.primary }]} />
      <Text accessibilityRole="alert" style={[styles.message, { color: colors.text }]}>{message}</Text>
      {onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={[styles.button, { backgroundColor: colors.primary }]}>
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>ลองอีกครั้ง</Text>
      </Pressable>}
      {onBack && <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: colors.primary }]}>{backLabel}</Text>
      </Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  mark: { width: 22, height: 2, borderRadius: 1, marginBottom: 2 },
  message: { fontSize: typeScale.bodyLg, lineHeight: 23, textAlign: 'center', maxWidth: 320 },
  button: { minHeight: 44, minWidth: 112, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', borderRadius: radius.sm },
  buttonText: { fontSize: typeScale.body, fontWeight: '700' },
  backButton: { minHeight: 40, minWidth: 100, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: typeScale.body, fontWeight: '600' },
});
