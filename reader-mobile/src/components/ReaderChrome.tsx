import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { ArrowLeft, Type, Eye, Sun, Coffee, Moon } from 'lucide-react-native';
import { ReaderTheme } from '../types';
import { ThemeColors } from '../theme/colors';

interface HeaderProps {
  visible: boolean;
  colors: ThemeColors;
  novelTitle: string;
  chapterTitle: string;
  topInset: number;
  progress: number;
  onBack: () => void;
  fontFamily?: string;
  onContents: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

export const ReaderHeader = memo(function ReaderHeader({ visible, colors, novelTitle, chapterTitle, topInset, progress, onBack, fontFamily, onContents, onLayout }: HeaderProps) {
  return (
    <View testID="reader-header" onLayout={onLayout} pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible} importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.header, { top: topInset, backgroundColor: colors.background, borderBottomColor: colors.border, opacity: visible ? 1 : 0 }]}>
      <View style={styles.headerInner}>
        <Pressable accessibilityRole="button" accessibilityLabel="กลับ" hitSlop={7} onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="เปิดสารบัญ" accessibilityHint={`${novelTitle}, ${chapterTitle}`} hitSlop={7} onPress={onContents} style={styles.titles}>
          <Text numberOfLines={1} style={[styles.chapterTitle, { color: colors.text, fontFamily }]}>{chapterTitle}</Text>
        </Pressable>
        <Text style={[styles.percent, { color: colors.primary }]}>{progress}%</Text>
      </View>
    </View>
  );
});

interface DockProps {
  visible: boolean;
  enabled: boolean;
  colors: ThemeColors;
  theme: ReaderTheme;
  fontFamily: string;
  fontSize: number;
  bottomInset: number;
  onTheme: (theme: ReaderTheme) => void;
  onSettings: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

export const ReaderDock = memo(function ReaderDock({ visible, enabled, colors, theme, fontFamily, fontSize, bottomInset, onTheme, onSettings, onLayout }: DockProps) {
  return (
    <View testID="reader-dock" onLayout={onLayout} pointerEvents={visible ? 'box-none' : 'none'}
      accessibilityElementsHidden={!visible} importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.dock, { paddingBottom: Math.max(24, bottomInset + 12), opacity: visible ? 1 : 0 }]}>
      <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="ตั้งค่าการอ่าน" hitSlop={8} disabled={!enabled} onPress={onSettings}
          style={[styles.fontButton, { opacity: enabled ? 1 : 0.4 }]}>
          <View style={[styles.fontChip, { backgroundColor: colors.primaryBg }]}>
            <Type size={16} color={colors.primary} />
            <Text numberOfLines={1} style={[styles.fontLabel, { color: colors.primary }]}>{fontFamily === 'System' ? 'ระบบ' : fontFamily} · {fontSize}</Text>
          </View>
        </Pressable>
        <View style={styles.themeGroup}>
          {([{ id: 'light', label: 'ธีมสว่าง', Icon: Sun, color: '#d97706' }, { id: 'sepia', label: 'ธีมโทนอุ่น', Icon: Coffee, color: '#9e432a' }, { id: 'dark', label: 'ธีมมืด', Icon: Moon, color: '#e26d83' }] as const).map(({ id, label, Icon, color }) => (
            <Pressable key={id} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected: theme === id, disabled: !enabled }}
              disabled={!enabled} hitSlop={8} onPress={() => onTheme(id)}>
              <View testID={`reader-theme-${id}`} style={[styles.themeIcon, { borderColor: theme === id ? colors.primary : 'transparent', borderWidth: theme === id ? 2 : 0 }]}>
                <Icon size={16} color={color} />
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
});

export function ReaderReveal({ colors, bottomInset, onPress }: { colors: ThemeColors; bottomInset: number; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="แสดงเครื่องมืออ่าน" onPress={onPress}
    style={[styles.reveal, { backgroundColor: colors.background, borderColor: colors.border, bottom: Math.max(4, bottomInset) }]}>
    <Eye size={18} color={colors.textMuted} />
  </Pressable>;
}

const styles = StyleSheet.create({
  header: { position: 'absolute', left: 0, right: 0, zIndex: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  headerInner: { width: '100%', maxWidth: 720, alignSelf: 'center', flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 6 },
  titles: { flex: 1, minWidth: 0, minHeight: 34, justifyContent: 'center', marginLeft: 10 },
  chapterTitle: { fontSize: 14, fontWeight: '700' },
  dock: { position: 'absolute', bottom: 0, left: '5%', right: '5%', zIndex: 10 },
  pill: { width: '100%', maxWidth: 480, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 30, paddingHorizontal: 16, paddingVertical: 10, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 },
  fontButton: { flexShrink: 1, minWidth: 0, minHeight: 32, justifyContent: 'center', marginRight: 16 },
  fontChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, maxWidth: '100%' },
  fontLabel: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
  themeGroup: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  themeIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' },
  percent: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, textAlign: 'center' },
  reveal: { position: 'absolute', right: 12, minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
});
