import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Type, EyeOff, Eye } from 'lucide-react-native';
import { ThemeColors } from '../theme/colors';

interface HeaderProps {
  visible: boolean;
  colors: ThemeColors;
  novelTitle: string;
  chapterTitle: string;
  topInset: number;
  onBack: () => void;
  onContents: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

export const ReaderHeader = memo(function ReaderHeader({ visible, colors, novelTitle, chapterTitle, topInset, onBack, onContents, onLayout }: HeaderProps) {
  return (
    <View testID="reader-header" onLayout={onLayout} pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible} importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.header, { top: topInset + 3, backgroundColor: colors.background, opacity: visible ? 1 : 0 }]}>
      <View style={styles.headerInner}>
        <Pressable accessibilityRole="button" accessibilityLabel="กลับ" onPress={onBack} style={styles.iconButton}>
          <ArrowLeft size={18} color={colors.textMuted} />
        </Pressable>
        <View style={styles.titles}>
          <Text accessibilityLabel={`${novelTitle}, ${chapterTitle}`} numberOfLines={1} style={[styles.chapterTitle, { color: colors.textMuted }]}>{chapterTitle}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="เปิดสารบัญ" onPress={onContents} style={styles.iconButton}>
          <List size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
});

interface DockProps {
  visible: boolean;
  enabled: boolean;
  colors: ThemeColors;
  positionLabel: string;
  progress: number;
  bottomInset: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSettings: () => void;
  onContents: () => void;
  onHide: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

export const ReaderDock = memo(function ReaderDock({ visible, enabled, colors, positionLabel, progress, bottomInset, hasPrev, hasNext, onPrev, onNext, onSettings, onContents, onHide, onLayout }: DockProps) {
  return (
    <View testID="reader-dock" onLayout={onLayout} pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible} importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.dock, { backgroundColor: colors.background, paddingBottom: Math.max(4, bottomInset), opacity: visible ? 1 : 0 }]}>
      <View style={styles.dockInner}>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="อ่านตอนก่อนหน้า" disabled={!enabled || !hasPrev}
            accessibilityState={{ disabled: !enabled || !hasPrev }} onPress={onPrev}
            style={[styles.iconButton, { opacity: enabled && hasPrev ? 1 : 0.35 }]}>
            <ChevronLeft size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="สารบัญตอน" onPress={onContents} disabled={!enabled}
            style={[styles.actionButton, { opacity: enabled ? 1 : 0.4 }]}>
            <List size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="ตั้งค่าการอ่าน" onPress={onSettings} disabled={!enabled}
            style={[styles.actionButton, { opacity: enabled ? 1 : 0.4 }]}>
            <Type size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="อ่านตอนถัดไป" disabled={!enabled || !hasNext}
            accessibilityState={{ disabled: !enabled || !hasNext }} onPress={onNext}
            style={[styles.iconButton, { opacity: enabled && hasNext ? 1 : 0.35 }]}>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
          <Text accessibilityLabel={`${positionLabel}, อ่านแล้ว ${progress}%`} style={[styles.percent, { color: colors.textMuted }]}>{progress}%</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="ซ่อนเครื่องมืออ่าน" onPress={onHide} style={styles.iconButton}>
            <EyeOff size={16} color={colors.textMuted} />
          </Pressable>
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
  header: { position: 'absolute', top: 3, left: 0, right: 0, zIndex: 10, paddingHorizontal: 8 },
  headerInner: { width: '100%', maxWidth: 720, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1, minWidth: 0 },
  chapterTitle: { fontSize: 12, lineHeight: 18 },
  dock: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, paddingTop: 2 },
  dockInner: { width: '100%', maxWidth: 360, alignSelf: 'center', paddingHorizontal: 8 },
  percent: { fontSize: 11, lineHeight: 16, minWidth: 32, textAlign: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  reveal: { position: 'absolute', right: 12, minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
});
