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
      style={[styles.header, { top: topInset + 3, backgroundColor: colors.background, borderBottomColor: colors.border, opacity: visible ? 1 : 0 }]}>
      <View style={styles.headerInner}>
        <Pressable accessibilityRole="button" accessibilityLabel="กลับ" onPress={onBack} style={styles.iconButton}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={styles.titles}>
          <Text numberOfLines={1} style={[styles.novelTitle, { color: colors.textMuted }]}>{novelTitle}</Text>
          <Text numberOfLines={1} style={[styles.chapterTitle, { color: colors.text }]}>{chapterTitle}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="เปิดสารบัญ" onPress={onContents} style={styles.iconButton}>
          <List size={22} color={colors.text} />
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
      style={[styles.dock, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(12, bottomInset), opacity: visible ? 1 : 0 }]}>
      <View style={styles.dockInner}>
        <View style={styles.statusRow}>
          <Text style={[styles.position, { color: colors.textMuted }]}>{positionLabel}</Text>
          <Text style={[styles.percent, { color: colors.primary }]}>{progress}%</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="ซ่อนเครื่องมืออ่าน" onPress={onHide} style={styles.iconButton}>
            <EyeOff size={19} color={colors.textMuted} />
          </Pressable>
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="อ่านตอนก่อนหน้า" disabled={!enabled || !hasPrev}
            accessibilityState={{ disabled: !enabled || !hasPrev }} onPress={onPrev}
            style={[styles.iconButton, { opacity: enabled && hasPrev ? 1 : 0.35 }]}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="สารบัญตอน" onPress={onContents} disabled={!enabled}
            style={[styles.actionButton, { backgroundColor: colors.primaryBg, opacity: enabled ? 1 : 0.4 }]}>
            <List size={19} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.primary }]}>สารบัญ</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="ตั้งค่าการอ่าน" onPress={onSettings} disabled={!enabled}
            style={[styles.actionButton, { backgroundColor: colors.primaryBg, opacity: enabled ? 1 : 0.4 }]}>
            <Type size={19} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.primary }]}>ตั้งค่า</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="อ่านตอนถัดไป" disabled={!enabled || !hasNext}
            accessibilityState={{ disabled: !enabled || !hasNext }} onPress={onNext}
            style={[styles.iconButton, { opacity: enabled && hasNext ? 1 : 0.35 }]}>
            <ChevronRight size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

export function ReaderReveal({ colors, bottomInset, onPress }: { colors: ThemeColors; bottomInset: number; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="แสดงเครื่องมืออ่าน" onPress={onPress}
    style={[styles.reveal, { backgroundColor: colors.card, borderColor: colors.border, bottom: Math.max(12, bottomInset) }]}>
    <Eye size={18} color={colors.primary} />
    <Text style={{ color: colors.primary, fontSize: 12 }}>เครื่องมือ</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 3, left: 0, right: 0, zIndex: 10, borderBottomWidth: 1, paddingVertical: 8, paddingHorizontal: 8 },
  headerInner: { width: '100%', maxWidth: 720, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1, minWidth: 0, gap: 2 },
  novelTitle: { fontSize: 12, lineHeight: 18 },
  chapterTitle: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  dock: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, borderTopWidth: 1, paddingTop: 4 },
  dockInner: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  position: { flex: 1, fontSize: 12, lineHeight: 18 },
  percent: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  actionButton: { flex: 1, minWidth: 48, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 4, gap: 4 },
  actionLabel: { fontSize: 12, lineHeight: 18, textAlign: 'center', fontWeight: '600' },
  reveal: { position: 'absolute', right: 16, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1 },
});
