import React, { memo, useCallback, useEffect, useRef } from 'react';
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

const MAX_AUTO_SCROLL_ATTEMPTS = 20;

const keyExtractor = (chapter: ChapterListItem) => chapter.id;

export const ChapterPickerModal = memo(function ChapterPickerModal({ visible, chapters, currentChapterId, colors, status, onSelect, onClose, onRetry }: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChapterListItem>>(null);
  const pendingIndex = useRef<number | null>(null);
  const viewportHeight = useRef(0);
  const attempts = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIndex = chapters.findIndex(chapter => chapter.id === currentChapterId);

  const cancelAutoScroll = useCallback(() => {
    pendingIndex.current = null;
    if (retryTimer.current !== null) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  const scrollToCurrent = useCallback(() => {
    if (pendingIndex.current === null || !listRef.current || viewportHeight.current <= 0) return;
    if (retryTimer.current !== null) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    const index = pendingIndex.current;
    pendingIndex.current = null;
    attempts.current++;
    listRef.current.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
  }, []);

  const startAutoScroll = useCallback(() => {
    cancelAutoScroll();
    attempts.current = 0;
    if (visible && status === 'ready' && currentIndex >= 0) {
      pendingIndex.current = currentIndex;
      scrollToCurrent();
    }
  }, [cancelAutoScroll, currentIndex, scrollToCurrent, status, visible]);

  useEffect(() => {
    startAutoScroll();
    return cancelAutoScroll;
  }, [startAutoScroll, cancelAutoScroll]);

  const onScrollToIndexFailed = useCallback((info: { index: number; averageItemLength: number }) => {
    if (!visible || status !== 'ready' || info.index !== currentIndex || attempts.current >= MAX_AUTO_SCROLL_ATTEMPTS) return;
    // Titles wrap and the selected row has an extra label: fixed row heights would
    // misplace later chapters. Render near the target, then retry with measured rows.
    pendingIndex.current = info.index;
    listRef.current?.scrollToOffset({
      offset: Math.max(0, info.averageItemLength * info.index - viewportHeight.current / 2), animated: false,
    });
    retryTimer.current = setTimeout(scrollToCurrent, 100);
  }, [currentIndex, scrollToCurrent, status, visible]);

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

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={startAutoScroll}>
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
          </View> : <FlatList ref={listRef} testID="chapter-picker-list" data={chapters} keyExtractor={keyExtractor} renderItem={renderItem}
            onLayout={event => { viewportHeight.current = event.nativeEvent.layout.height; scrollToCurrent(); }}
            onScrollToIndexFailed={onScrollToIndexFailed}
            onScrollBeginDrag={cancelAutoScroll}
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
