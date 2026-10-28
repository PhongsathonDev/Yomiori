import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Type, EyeOff, Eye, Sun, Coffee, Moon } from 'lucide-react-native';
import { ReaderTheme } from '../types';
import { ThemeColors } from '../theme/colors';
import { radius, shadowSoft, typeScale } from '../theme/layout';

interface HeaderProps {
  visible: boolean;
  colors: ThemeColors;
  novelTitle: string;
  chapterTitle: string;
  topInset: number;
  progress: number;
  onBack: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onHide: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

export const ReaderHeader = memo(function ReaderHeader({ visible, colors, novelTitle, chapterTitle, topInset, progress, onBack, hasPrev, hasNext, onPrev, onNext, onHide, onLayout }: HeaderProps) {
  return (
    <View testID="reader-header" onLayout={onLayout} pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible} importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.header, { top: topInset + 2, backgroundColor: colors.background, borderBottomColor: colors.border, opacity: visible ? 1 : 0 }]}>
      <View style={styles.headerInner}>
        <Pressable accessibilityRole="button" accessibilityLabel="กลับ" onPress={onBack} style={styles.iconButton}>
          <ArrowLeft size={18} color={colors.textMuted} />
        </Pressable>
        <View style={styles.titles}>
          <Text accessibilityLabel={`${novelTitle}, ${chapterTitle}`} numberOfLines={1} style={[styles.chapterTitle, { color: colors.textMuted }]}>{chapterTitle}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="อ่านตอนก่อนหน้า" disabled={!hasPrev} onPress={onPrev} style={[styles.smallButton, { opacity: hasPrev ? 1 : 0.3 }]}><ChevronLeft size={16} color={colors.textMuted} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="อ่านตอนถัดไป" disabled={!hasNext} onPress={onNext} style={[styles.smallButton, { opacity: hasNext ? 1 : 0.3 }]}><ChevronRight size={16} color={colors.textMuted} /></Pressable>
        <Text style={[styles.percent, { color: colors.primary }]}>{progress}%</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="ซ่อนเครื่องมืออ่าน" onPress={onHide} style={styles.smallButton}><EyeOff size={16} color={colors.textMuted} /></Pressable>
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
  onContents: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

export const ReaderDock = memo(function ReaderDock({ visible, enabled, colors, theme, fontFamily, fontSize, bottomInset, onTheme, onSettings, onContents, onLayout }: DockProps) {
  return (
    <View testID="reader-dock" onLayout={onLayout} pointerEvents={visible ? 'box-none' : 'none'}
      accessibilityElementsHidden={!visible} importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.dock, { paddingBottom: Math.max(20, bottomInset + 10), opacity: visible ? 1 : 0 }]}>
      <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="ตั้งค่าการอ่าน" disabled={!enabled} onPress={onSettings}
          style={[styles.fontButton, { opacity: enabled ? 1 : 0.4 }]}>
          <View style={[styles.fontChip, { backgroundColor: colors.primaryBg }]}>
            <Type size={13} color={colors.primary} />
            <Text numberOfLines={1} style={[styles.fontLabel, { color: colors.primary }]}>{fontFamily === 'System' ? 'ระบบ' : fontFamily} · {fontSize}</Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="เปิดสารบัญ" onPress={onContents} disabled={!enabled} style={styles.smallButton}>
          <List size={16} color={colors.textMuted} />
        </Pressable>
        {([{ id: 'light', label: 'ธีมสว่าง', Icon: Sun }, { id: 'sepia', label: 'ธีมโทนอุ่น', Icon: Coffee }, { id: 'dark', label: 'ธีมมืด', Icon: Moon }] as const).map(({ id, label, Icon }) => (
          <Pressable key={id} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected: theme === id, disabled: !enabled }}
            disabled={!enabled} onPress={() => onTheme(id)} style={styles.smallButton}>
            <View style={[styles.themeIcon, { borderColor: theme === id ? colors.primary : 'transparent', borderWidth: theme === id ? 1.5 : 0, backgroundColor: theme === id ? colors.primaryBg : 'transparent' }]}>
              <Icon size={15} color={theme === id ? colors.primary : colors.textMuted} />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
});

export function ReaderReveal({ colors, bottomInset, onPress }: { colors: ThemeColors; bottomInset: number; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="แสดงเครื่องมืออ่าน" onPress={onPress}
    style={[styles.reveal, { backgroundColor: colors.card, borderColor: colors.cardBorder, bottom: Math.max(6, bottomInset) }]}>
    <Eye size={17} color={colors.textMuted} />
  </Pressable>;
}

const styles = StyleSheet.create({
  header: { position: 'absolute', left: 0, right: 0, zIndex: 10, paddingHorizontal: 6, borderBottomWidth: 1 },
  headerInner: { width: '100%', maxWidth: 720, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 46 },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  smallButton: { minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1, minWidth: 0, paddingHorizontal: 2 },
  chapterTitle: { fontSize: typeScale.meta + 0.5, lineHeight: 17 },
  dock: { position: 'absolute', bottom: 0, left: '3%', right: '3%', zIndex: 10, paddingTop: 8 },
  pill: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 7,
    ...shadowSoft,
  },
  fontButton: { flex: 1, minWidth: 0, minHeight: 44, justifyContent: 'center' },
  fontChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.sm, paddingHorizontal: 10, height: 32, maxWidth: '100%' },
  fontLabel: { fontSize: typeScale.caption, fontWeight: '700', flexShrink: 1 },
  themeIcon: { width: 38, height: 38, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  percent: { fontSize: typeScale.meta, lineHeight: 16, minWidth: 30, textAlign: 'center', fontVariant: ['tabular-nums'] },
  reveal: {
    position: 'absolute',
    right: 14,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    ...shadowSoft,
  },
});
