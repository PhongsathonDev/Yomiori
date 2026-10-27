import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ThemeColors } from '../theme/colors';

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
      <Text accessibilityRole="alert" style={[styles.message, { color: colors.text }]}>{message}</Text>
      {onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={[styles.button, { backgroundColor: colors.primary }]}>
        <Text style={styles.buttonText}>ลองอีกครั้ง</Text>
      </Pressable>}
      {onBack && <Pressable accessibilityRole="button" onPress={onBack} style={styles.button}>
        <Text style={{ color: colors.primary }}>{backLabel}</Text>
      </Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  message: { fontSize: 15, lineHeight: 24, textAlign: 'left' },
  button: { minHeight: 44, minWidth: 100, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});
