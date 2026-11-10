import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList, TextInput,
  RefreshControl, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Play, Sun, Moon, Coffee, Search, X, MoreHorizontal, ArrowDownUp, Check, ArchiveRestore } from 'lucide-react-native';
import { Novel, RootStackParamList, ReaderTheme, ReadingProgress, ChapterListItem } from '../types';
import { fetchNovels, getAvailableChapterList } from '../services/api';
import { getSavedTheme, saveTheme, getReadingProgress } from '../services/storage';
import {
  ShelfStatuses, ShelfTab, ShelfSort, getShelfStatuses, saveShelfStatus,
  getShelfSort, saveShelfSort, selectShelfNovels, selectContinueNovel,
} from '../services/bookshelf';
import { themes } from '../theme/colors';
import bundledNovels from '../data/novels.json';
import { ScreenState } from '../components/ScreenState';
import { BookCover } from '../components/BookCover';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Bookshelf'> };
const tabs: { value: ShelfTab; label: string }[] = [
  { value: 'active', label: 'ชั้นหนังสือ' }, { value: 'completed', label: 'อ่านจบแล้ว' }, { value: 'all', label: 'ทั้งหมด' },
];

export const BookshelfScreen: React.FC<Props> = ({ navigation }) => {
  const [novels, setNovels] = useState<Novel[]>(bundledNovels as Novel[]);
  const novelsRef = useRef(novels);
  const [currentTheme, setCurrentTheme] = useState<ReaderTheme>('light');
  const [progress, setProgress] = useState<Record<string, ReadingProgress | null>>({});
  const [chapters, setChapters] = useState<Record<string, ChapterListItem[]>>({});
  const [statuses, setStatuses] = useState<ShelfStatuses>({});
  const [personalReady, setPersonalReady] = useState(false);
  const [personalError, setPersonalError] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<ShelfTab>('active');
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('all');
  const [sort, setSort] = useState<ShelfSort>('recent');
  const [menuNovel, setMenuNovel] = useState<Novel | null>(null);
  const [showSort, setShowSort] = useState(false);
  const [saving, setSaving] = useState(false);
  const mounted = useRef(false);
  const request = useRef(0);
  const personalRevision = useRef(0);
  const writing = useRef(false);
  const listRef = useRef<FlatList<Novel>>(null);
  const colors = themes[currentTheme];

  const loadData = useCallback(async (isActive: () => boolean) => {
    const loadPersonal = async (list: Novel[]) => {
      const revision = personalRevision.current;
      try {
        const [savedStatuses, savedSort, savedProgress] = await Promise.all([
          getShelfStatuses(list.map(novel => novel.id)), getShelfSort(),
          Promise.all(list.map(async novel => [novel.id, await getReadingProgress(novel.id)] as const)),
        ]);
        if (!isActive() || revision !== personalRevision.current) return;
        setStatuses(savedStatuses);
        setSort(savedSort);
        setProgress(Object.fromEntries(savedProgress));
        setPersonalReady(true);
        setPersonalError(false);
      } catch {
        if (isActive() && revision === personalRevision.current) setPersonalError(true);
      }
    };
    const loadChapters = async (list: Novel[]) => {
      await Promise.all(list.map(async novel => {
        try {
          const available = await getAvailableChapterList(novel.id, true);
          if (isActive()) setChapters(previous => ({ ...previous, [novel.id]: available }));
        } catch { /* Counts are secondary; keep the catalog and personal state usable. */ }
      }));
    };
    // Personal state and the local catalog do not wait for the remote catalog.
    void loadPersonal(novelsRef.current);
    void getSavedTheme().then(theme => { if (isActive()) setCurrentTheme(theme); });
    try {
      const cached = await fetchNovels(true);
      if (!isActive()) return;
      novelsRef.current = cached;
      setNovels(cached);
      void loadPersonal(cached);
      void loadChapters(cached);
      const fresh = await fetchNovels();
      if (!isActive()) return;
      novelsRef.current = fresh;
      setNovels(fresh);
      setCatalogError(false);
      await Promise.all([loadPersonal(fresh), loadChapters(fresh)]);
    } catch {
      if (isActive()) setCatalogError(true);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const refresh = () => {
      const id = ++request.current;
      void loadData(() => mounted.current && id === request.current);
    };
    const unsubscribe = navigation.addListener('focus', refresh);
    refresh();
    return () => { mounted.current = false; unsubscribe(); };
  }, [navigation, loadData]);

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    const id = ++request.current;
    try { await loadData(() => mounted.current && id === request.current); }
    finally { if (mounted.current) setRefreshing(false); }
  };

  const changeStatus = async () => {
    if (!menuNovel || writing.current || !personalReady) return;
    const id = menuNovel.id;
    const next = statuses[id] === 'completed' ? 'active' : 'completed';
    writing.current = true;
    personalRevision.current++;
    setSaving(true);
    try {
      await saveShelfStatus(id, next);
      if (mounted.current) {
        setStatuses(previous => ({ ...previous, [id]: next }));
        setMenuNovel(null);
      }
    } catch {
      if (mounted.current) Alert.alert('บันทึกสถานะไม่ได้', 'สถานะเดิมยังอยู่ กรุณาลองอีกครั้ง');
    } finally {
      personalRevision.current++;
      writing.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  const changeSort = async (next: ShelfSort) => {
    if (writing.current || !personalReady) return;
    writing.current = true;
    personalRevision.current++;
    setSaving(true);
    try {
      await saveShelfSort(next);
      if (mounted.current) { setSort(next); setShowSort(false); }
    } catch {
      if (mounted.current) Alert.alert('บันทึกการเรียงไม่ได้', 'กรุณาลองอีกครั้ง');
    } finally {
      personalRevision.current++;
      writing.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  const toggleTheme = async () => {
    const next = currentTheme === 'light' ? 'sepia' : currentTheme === 'sepia' ? 'dark' : 'light';
    setCurrentTheme(next);
    try { await saveTheme(next); }
    catch { if (mounted.current) Alert.alert('บันทึกธีมไม่ได้', 'กรุณาลองอีกครั้ง'); }
  };

  const visible = selectShelfNovels(novels, statuses, progress, tab, query, tag, sort);
  const continueNovel = personalReady ? selectContinueNovel(novels, statuses, progress) : undefined;
  const continueProgress = continueNovel ? progress[continueNovel.id] : null;
  const allTags = Array.from(new Set(novels.flatMap(novel => novel.tags ?? [])));
  const completedCount = novels.filter(novel => statuses[novel.id] === 'completed').length;
  const counts = { active: novels.length - completedCount, completed: completedCount, all: novels.length };
  const clearFilters = () => { setQuery(''); setTag('all'); };
  const chooseTab = (next: ShelfTab) => {
    setTab(next);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };
  const readLabel = (novel: Novel) => {
    if (statuses[novel.id] === 'completed') return 'อ่านจบแล้ว';
    const last = progress[novel.id];
    if (!last) return 'ยังไม่เริ่ม';
    const chapter = chapters[novel.id]?.find(item => item.id === last.chapterId);
    return chapter ? `อ่านถึงตอนที่ ${chapter.chapterNumber}` : 'อ่านค้างไว้';
  };
  const closeSheet = () => { if (!writing.current) { setMenuNovel(null); setShowSort(false); } };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.statusBar} />
      <NavigationBar hidden={false} style={currentTheme === 'dark' ? 'dark' : 'light'} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerInner}>
          <View style={styles.brand}><Text style={[styles.appTitle, { color: colors.primary }]}>Yomiori</Text><Text style={{ color: colors.textMuted }}>読織</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="เปลี่ยนธีม" onPress={() => { void toggleTheme(); }} style={[styles.iconButton, { backgroundColor: colors.primaryBg }]}>
            {currentTheme === 'light' ? <Sun size={19} color={colors.primary} /> : currentTheme === 'sepia' ? <Coffee size={19} color={colors.primary} /> : <Moon size={19} color={colors.primary} />}
          </Pressable>
        </View>
      </View>
      <FlatList
        ref={listRef}
        data={personalReady ? visible : []}
        numColumns={2}
        keyExtractor={novel => novel.id}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        initialNumToRender={8}
        windowSize={5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void refresh(); }} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={<View style={styles.listHeader}>
          {continueNovel && continueProgress && <Pressable
            accessibilityRole="button" accessibilityLabel={`อ่านต่อ ${continueNovel.title}`}
            onPress={() => navigation.navigate('Reader', { novelId: continueNovel.id, chapterId: continueProgress.chapterId })}
            style={[styles.continueCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <BookCover uri={continueNovel.coverUrl} style={styles.continueCover} />
            <View style={styles.continueInfo}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>อ่านต่อ</Text>
              <Text numberOfLines={2} style={[styles.continueTitle, { color: colors.text }]}>{continueNovel.title}</Text>
              <Text style={[styles.small, { color: colors.textMuted }]}>{readLabel(continueNovel)} · ในตอนนี้ {Math.round(continueProgress.scrollPercent)}%</Text>
            </View>
            <Play size={18} color={colors.primary} />
          </Pressable>}
          <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>ชั้นหนังสือของฉัน</Text>
          <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search size={18} color={colors.textMuted} />
            <TextInput accessibilityLabel="ค้นหานิยาย" placeholder="ค้นหาชื่อเรื่องหรือผู้เขียน" placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery} autoCorrect={false} autoCapitalize="none" returnKeyType="search" style={[styles.searchInput, { color: colors.text }]} />
            {!!query && <Pressable accessibilityRole="button" accessibilityLabel="ล้างคำค้น" onPress={() => setQuery('')} style={styles.iconButton}><X size={18} color={colors.textMuted} /></Pressable>}
          </View>
          <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
            {tabs.map(item => <Pressable key={item.value} accessibilityRole="tab" accessibilityState={{ selected: tab === item.value }} onPress={() => chooseTab(item.value)} style={[styles.tab, { borderBottomColor: tab === item.value ? colors.primary : 'transparent' }]}>
              <Text style={[styles.tabText, { color: tab === item.value ? colors.primary : colors.textMuted }]}>{item.label}</Text>
              <Text style={[styles.small, { color: colors.textMuted }]}>{personalReady ? counts[item.value] : '…'}</Text>
            </Pressable>)}
          </View>
          <View style={styles.filterRow}>
            <Text style={[styles.small, styles.flex, { color: colors.textMuted }]}>{personalReady ? `${visible.length} เรื่อง` : 'กำลังโหลดสถานะการอ่าน'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="เลือกการเรียงเรื่อง" disabled={!personalReady} onPress={() => setShowSort(true)} style={styles.sortButton}>
              <ArrowDownUp size={16} color={colors.primary} /><Text style={[styles.small, { color: colors.primary }]}>{sort === 'recent' ? 'อ่านล่าสุดก่อน' : 'ชื่อเรื่อง'}</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tags} keyboardShouldPersistTaps="handled">
            {['all', ...allTags].map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: tag === value }} onPress={() => setTag(value)} style={[styles.tag, { backgroundColor: tag === value ? colors.primary : colors.card, borderColor: tag === value ? colors.primary : colors.border }]}>
              <Text style={[styles.small, { color: tag === value ? '#ffffff' : colors.textMuted }]}>{value === 'all' ? 'ทุกแนว' : value}</Text>
            </Pressable>)}
          </ScrollView>
          {personalError && <ScreenState colors={colors} message="โหลดสถานะชั้นหนังสือไม่ได้" onRetry={() => { void refresh(); }} />}
          {catalogError && <ScreenState colors={colors} message="รีเฟรชข้อมูลบางส่วนไม่ได้ ยังเปิดเรื่องที่มีในเครื่องได้" onRetry={() => { void refresh(); }} />}
        </View>}
        ListEmptyComponent={!personalReady ? (!personalError ? <ActivityIndicator accessibilityLabel="กำลังโหลดสถานะชั้นหนังสือ" color={colors.primary} /> : undefined) : <ScreenState colors={colors}
          message={query.trim() || tag !== 'all' ? 'ไม่พบเรื่องที่ตรงกับตัวกรอง' : tab === 'completed' ? 'ยังไม่มีเรื่องที่ทำเครื่องหมายว่าอ่านจบแล้ว' : tab === 'active' && completedCount > 0 ? 'อ่านจบทุกเรื่องแล้ว เลือกดูเรื่องเก่าได้ที่แท็บอ่านจบแล้ว' : 'ยังไม่มีนิยายในชั้นหนังสือ'}
          onBack={query.trim() || tag !== 'all' ? clearFilters : tab === 'active' && completedCount > 0 ? () => chooseTab('completed') : undefined}
          backLabel={query.trim() || tag !== 'all' ? 'ล้างตัวกรอง' : 'ดูเรื่องที่อ่านจบแล้ว'} />}
        renderItem={({ item: novel }) => <View style={[styles.book, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`รายละเอียด ${novel.title}`} accessibilityHint={novel.tags?.length ? `แท็ก: ${novel.tags.join(', ')}` : undefined} onPress={() => navigation.navigate('NovelDetail', { novelId: novel.id })}>
            <BookCover uri={novel.coverUrl} style={styles.cover} />
            <View style={styles.bookInfo}>
              <Text numberOfLines={3} style={[styles.bookTitle, { color: colors.text }]}>{novel.title}</Text>
              {!!novel.tags?.length && <View style={styles.bookTags}>
                {novel.tags.map((novelTag, index) => <View key={`${novelTag}-${index}`} style={[styles.bookTag, { backgroundColor: colors.primaryBg }]}>
                  <Text style={[styles.bookTagText, { color: colors.primary }]}>{novelTag}</Text>
                </View>)}
              </View>}
              <Text style={[styles.small, { color: colors.textMuted }]}>{chapters[novel.id] === undefined ? 'กำลังโหลดจำนวนตอน' : `${chapters[novel.id].length} ตอน`}</Text>
              <Text style={[styles.small, { color: statuses[novel.id] === 'completed' ? colors.primary : colors.textMuted }]}>{readLabel(novel)}</Text>
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`จัดการ ${novel.title}`} onPress={() => setMenuNovel(novel)} style={[styles.bookMenu, styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MoreHorizontal size={20} color={colors.text} />
          </Pressable>
        </View>}
      />
      <Modal visible={!!menuNovel || showSort} transparent animationType="fade" onRequestClose={closeSheet}>
        <View style={styles.modalRoot}>
          <Pressable accessible={false} onPress={closeSheet} style={styles.backdrop} />
          <SafeAreaView edges={['bottom']} accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Text accessibilityRole="header" style={[styles.sheetTitle, { color: colors.text }]}>{menuNovel?.title ?? 'เรียงเรื่อง'}</Text>
              {menuNovel ? <Pressable accessibilityRole="button" disabled={saving} onPress={() => { void changeStatus(); }} style={[styles.sheetAction, { backgroundColor: colors.primaryBg }]}>
                {saving ? <ActivityIndicator color={colors.primary} /> : statuses[menuNovel.id] === 'completed' ? <ArchiveRestore size={20} color={colors.primary} /> : <Check size={20} color={colors.primary} />}
                <Text style={[styles.actionText, { color: colors.primary }]}>{statuses[menuNovel.id] === 'completed' ? 'ย้ายกลับชั้นหนังสือ' : 'ทำเครื่องหมายว่าอ่านจบแล้ว'}</Text>
              </Pressable> : <>
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: sort === 'recent' }} disabled={saving} onPress={() => { void changeSort('recent'); }} style={[styles.sheetAction, { backgroundColor: sort === 'recent' ? colors.primaryBg : colors.card }]}>
                  <Text style={[styles.actionText, styles.flex, { color: colors.text }]}>อ่านล่าสุดก่อน</Text>
                  {sort === 'recent' && <Check size={20} color={colors.primary} />}
                </Pressable>
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: sort === 'title' }} disabled={saving} onPress={() => { void changeSort('title'); }} style={[styles.sheetAction, { backgroundColor: sort === 'title' ? colors.primaryBg : colors.card }]}>
                  <Text style={[styles.actionText, styles.flex, { color: colors.text }]}>ชื่อเรื่อง</Text>
                  {sort === 'title' && <Check size={20} color={colors.primary} />}
                </Pressable>
              </>}
              <Pressable accessibilityRole="button" disabled={saving} onPress={closeSheet} style={styles.sheetAction}><Text style={[styles.actionText, { color: colors.textMuted }]}>ยกเลิก</Text></Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
  headerInner: { width: '100%', maxWidth: 688, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  appTitle: { fontSize: 23, fontWeight: '800' },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  list: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, paddingBottom: 32 },
  listHeader: { gap: 14, paddingBottom: 16 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 12 },
  continueCover: { width: 46, height: 66, borderRadius: 6 },
  continueInfo: { flex: 1, gap: 4 },
  eyebrow: { fontSize: 12, fontWeight: '700' },
  continueTitle: { fontSize: 14, fontWeight: '700' },
  heading: { fontSize: 22, fontWeight: '700' },
  search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingLeft: 12, gap: 8, minHeight: 48 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 12, fontSize: 14 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 2, borderBottomWidth: 2, minHeight: 56 },
  tabText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  small: { fontSize: 12, lineHeight: 19 },
  flex: { flex: 1 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 4, flexShrink: 1 },
  tags: { gap: 8 },
  tag: { borderRadius: 24, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  book: { width: '48%', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  cover: { width: '100%', aspectRatio: 2 / 3 },
  bookInfo: { padding: 10, gap: 6 },
  bookTitle: { fontSize: 14, lineHeight: 21, fontWeight: '700' },
  bookTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  bookTag: { maxWidth: '100%', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  bookTagText: { fontSize: 11, lineHeight: 16 },
  bookMenu: { position: 'absolute', top: 6, right: 6, borderWidth: 1 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { maxHeight: '80%', width: '100%', maxWidth: 720, alignSelf: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1 },
  sheetContent: { padding: 20, gap: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  sheetAction: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderRadius: 12, padding: 14 },
  actionText: { fontSize: 15, flexShrink: 1 },
});
