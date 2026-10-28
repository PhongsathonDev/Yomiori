import React, { memo, useCallback } from 'react';
import { Modal, View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { ChapterListItem } from '../types';
import { ThemeColors } from '../theme/colors';

interface Props {
  visible: boolean;
  chapters: ChapterListItem[];
  currentChapterId: string;
  colors: ThemeColors;
  status: 'loading' | 'ready' | 'error';
  onSelect: (index: number) => void;
  onClose: () => void;
  onRetry: () => void;
}

const keyExtractor = (chapter: ChapterListItem) => chapter.id;

export const ChapterPickerModal = memo(function ChapterPickerModal({ visible, chapters, currentChapterId, colors, status, onSelect, onClose, onRetry }: Props) {
  const insets = useSafeAreaInsets();
  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<ChapterListItem>) => {
    const selected = item.id === currentChapterId;
    return <Pressable accessibilityRole="button" accessibilityLabel={`เลือกตอน ${item.title}`}
      accessibilityState={{ selected }} onPress={() => onSelect(index)}
      style={[styles.row, { backgroundColor: selected ? colors.primaryBg : colors.card, borderBottomColor: colors.border }]}>
      <Text style={[styles.number, { color: colors.primary }]}>{item.chapterNumber}</Text>
      <View style={styles.titleGroup}>
        <Text style={[styles.chapterTitle, { color: selected ? colors.primary : colors.text }]}>{item.title}</Text>
        {selected && <Text style={[styles.current, { color: colors.primary }]}>กำลังอ่าน</Text>}
      </View>
      {selected && <Check size={18} color={colors.primary} />}
    </Pressable>;
  }, [colors, currentChapterId, onSelect]);

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={[styles.overlay, { paddingTop: Math.max(16, insets.top), paddingBottom: Math.max(16, insets.bottom) }]}>
      <Pressable testID="chapter-picker-backdrop" accessibilityRole="button" accessibilityLabel="ปิดสารบัญจากพื้นหลัง" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>เลือกตอน</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="ปิดสารบัญ" onPress={onClose} style={styles.close}>
            <X size={20} color={colors.textMuted} />
          </Pressable>
        </View>
        {status === 'loading' ? <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.textMuted }}>กำลังโหลดรายชื่อตอน...</Text></View>
          : status === 'error' || chapters.length === 0 ? <View style={styles.state}>
            <Text style={{ color: colors.textMuted }}>{status === 'error' ? 'โหลดรายชื่อตอนไม่ได้' : 'ยังไม่มีรายชื่อตอน'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="ลองโหลดสารบัญอีกครั้ง" onPress={onRetry} style={styles.retry}>
              <Text style={{ color: colors.primary }}>ลองอีกครั้ง</Text>
            </Pressable>
          </View> : <FlatList data={chapters} keyExtractor={keyExtractor} renderItem={renderItem}
            extraData={currentChapterId} initialNumToRender={12} contentContainerStyle={styles.list} />}
      </View>
    </View>
  </Modal>;
});

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  sheet: { width: '100%', maxWidth: 560, height: '75%', maxHeight: 680, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8, paddingVertical: 8, borderBottomWidth: 1 },
  heading: { flex: 1, fontSize: 18, fontWeight: '700' },
  close: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 12 },
  row: { minHeight: 64, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 },
  number: { fontSize: 13, minWidth: 28, textAlign: 'center' },
  titleGroup: { flex: 1, minWidth: 0 },
  chapterTitle: { fontSize: 14, lineHeight: 22 },
  current: { fontSize: 12, marginTop: 4 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  retry: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 },
});
