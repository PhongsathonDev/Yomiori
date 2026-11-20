import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowDownUp,
  ArrowLeft,
  Check,
  ChevronRight,
  Coffee,
  List,
  Moon,
  Play,
  Search,
  Settings2,
  Sun,
  Type,
} from 'lucide-react-native';
import {
  DONE_COUNT,
  PREVIEW_BOOKS,
  READING_COUNT,
  PREVIEW_CHAPTERS,
  PREVIEW_TAGS,
  READER_SAMPLE,
} from './data';
import {
  ConceptProps,
  PreviewCover,
  ProgressLine,
  bookMeta,
  chapterNumber,
  usePreviewGrid,
} from './shared';
import { FONT } from './tokens';

const TABS = [
  { id: 'reading', label: 'กำลังอ่าน' },
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'done', label: 'อ่านจบ' },
] as const;

type WashiTab = (typeof TABS)[number]['id'];

function WashiShelf({ palette, onOpenBook, onOpenReader }: ConceptProps) {
  const [tab, setTab] = useState<WashiTab>('reading');
  const [tag, setTag] = useState(PREVIEW_TAGS[0]);
  const { widthPercent } = usePreviewGrid();
  const continueBook = PREVIEW_BOOKS[0];

  const visible = PREVIEW_BOOKS.filter(book => {
    const tabOK =
      tab === 'all' ||
      (tab === 'reading' && book.status === 'reading') ||
      (tab === 'done' && book.status === 'done');
    const tagOK = tag === PREVIEW_TAGS[0] || book.tags.includes(tag);
    return tabOK && tagOK;
  });

  const tabCount = (id: WashiTab) =>
    id === 'reading' ? READING_COUNT : id === 'done' ? DONE_COUNT : PREVIEW_BOOKS.length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={washiStyles.shelfContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={washiStyles.topBar}>
        <View style={washiStyles.brandRow}>
          <View style={[washiStyles.seal, { backgroundColor: palette.accent }]}>
            <Text style={[washiStyles.sealText, { color: palette.accentInk }]}>読</Text>
          </View>
          <View>
            <Text style={[washiStyles.wordmark, { color: palette.text }]}>Yomiori</Text>
            <Text style={[washiStyles.wordmarkJp, { color: palette.muted }]}>読織</Text>
          </View>
        </View>
        <View style={washiStyles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ค้นหา"
            style={({ pressed }) => [washiStyles.iconButton, pressed && { opacity: 0.6 }]}
          >
            <Search size={20} color={palette.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ตั้งค่า"
            style={({ pressed }) => [washiStyles.iconButton, pressed && { opacity: 0.6 }]}
          >
            <Settings2 size={20} color={palette.text} />
          </Pressable>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`อ่านต่อ ${continueBook.title}`}
        onPress={() => onOpenReader(continueBook)}
        style={({ pressed }) => [
          washiStyles.continueCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
            shadowOpacity: palette.isDark ? 0.24 : 0.05,
          },
          pressed && { opacity: 0.78 },
        ]}
      >
        <PreviewCover book={continueBook} style={washiStyles.continueCover} radius={10} />
        <View style={washiStyles.continueInfo}>
          <Text style={[washiStyles.continueKicker, { color: palette.accent }]}>อ่านต่อ</Text>
          <Text numberOfLines={2} style={[washiStyles.continueTitle, { color: palette.text }]}>
            {continueBook.title}
          </Text>
          <Text style={[washiStyles.continueMeta, { color: palette.muted }]}>
            {continueBook.currentChapterTitle || bookMeta(continueBook)}
          </Text>
          <View style={washiStyles.continueProgress}>
            <ProgressLine
              value={continueBook.progress}
              color={palette.accent}
              track={palette.line}
              height={2}
            />
            <Text style={[washiStyles.continuePercent, { color: palette.muted }]}>
              {Math.round(continueBook.progress * 100)}%
            </Text>
          </View>
        </View>
        <View style={[washiStyles.playCircle, { backgroundColor: palette.accentSoft }]}>
          <Play size={13} color={palette.accent} fill={palette.accent} />
        </View>
      </Pressable>

      <View style={washiStyles.shelfHeadingRow}>
        <Text style={[washiStyles.pageTitle, { color: palette.text }]}>ชั้นหนังสือของฉัน</Text>
        <Text style={[washiStyles.pageCount, { color: palette.muted }]}>
          {PREVIEW_BOOKS.length} เรื่อง
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="ค้นหาหนังสือ"
        style={({ pressed }) => [
          washiStyles.searchBar,
          { backgroundColor: palette.surface, borderColor: palette.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Search size={17} color={palette.muted} />
        <Text style={[washiStyles.searchPlaceholder, { color: palette.muted }]}>
          ค้นหาชื่อเรื่องหรือผู้เขียน
        </Text>
      </Pressable>

      <View style={[washiStyles.tabs, { borderBottomColor: palette.line }]}>
        {TABS.map(item => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(item.id)}
              style={({ pressed }) => [
                washiStyles.tab,
                { borderBottomColor: active ? palette.accent : 'transparent' },
                pressed && { opacity: 0.65 },
              ]}
            >
              <Text style={[washiStyles.tabText, { color: active ? palette.accent : palette.muted }]}>
                {item.label}
              </Text>
              <Text style={[washiStyles.tabCount, { color: palette.muted }]}>{tabCount(item.id)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={washiStyles.filterRow}>
        <Text style={[washiStyles.filterCount, { color: palette.muted }]}>
          {visible.length} เรื่อง
        </Text>
        <View style={washiStyles.sortRow}>
          <ArrowDownUp size={13} color={palette.accent} />
          <Text style={[washiStyles.sortText, { color: palette.accent }]}>อ่านล่าสุดก่อน</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={washiStyles.tagRow}
      >
        {PREVIEW_TAGS.map(item => {
          const active = tag === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setTag(item)}
              style={({ pressed }) => [
                washiStyles.tag,
                {
                  borderColor: active ? palette.accent : palette.line,
                  backgroundColor: active ? palette.accent : palette.surface,
                },
                pressed && { opacity: 0.65 },
              ]}
            >
              <Text style={[washiStyles.tagText, { color: active ? palette.accentInk : palette.muted }]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={washiStyles.grid}>
        {visible.map(book => (
          <Pressable
            key={book.id}
            accessibilityRole="button"
            accessibilityLabel={`รายละเอียด ${book.title}`}
            onPress={() => onOpenBook(book)}
            style={({ pressed }) => [
              washiStyles.bookCard,
              {
                width: widthPercent,
                backgroundColor: palette.surface,
                borderColor: palette.border,
                shadowColor: palette.shadow,
                shadowOpacity: palette.isDark ? 0.24 : 0.05,
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            <PreviewCover book={book} style={washiStyles.gridCover} radius={0} />
            <View style={washiStyles.bookBody}>
              <Text numberOfLines={2} style={[washiStyles.gridTitle, { color: palette.text }]}>
                {book.title}
              </Text>
              <View style={washiStyles.bookTags}>
                {book.tags.slice(0, 2).map((bookTag, index) => (
                  <View key={`${bookTag}-${index}`} style={[washiStyles.bookTag, { backgroundColor: palette.tagBg }]}>
                    <Text style={[washiStyles.bookTagText, { color: palette.muted }]}>{bookTag}</Text>
                  </View>
                ))}
              </View>
              <Text style={[washiStyles.gridMeta, { color: palette.muted }]}>{book.totalChapters} ตอน</Text>
              <Text
                style={[
                  washiStyles.bookRead,
                  { color: book.status === 'reading' ? palette.accent : palette.muted },
                ]}
              >
                {book.status === 'reading'
                  ? `อ่านถึงตอนที่ ${book.currentChapter}`
                  : book.status === 'done'
                    ? 'อ่านจบแล้ว'
                    : 'ยังไม่เริ่ม'}
              </Text>
              {book.status === 'reading' ? (
                <View style={washiStyles.gridProgress}>
                  <ProgressLine value={book.progress} color={palette.accent} track={palette.line} height={2} />
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>

      {visible.length === 0 ? (
        <Text style={[washiStyles.empty, { color: palette.muted }]}>ไม่พบเรื่องในหมวดนี้</Text>
      ) : null}

      <View style={[washiStyles.footerRule, { backgroundColor: palette.line }]} />
      <Text style={[washiStyles.footerNote, { color: palette.muted }]}>
        อ่านอย่างใจเย็น
      </Text>
    </ScrollView>
  );
}

function WashiDetail({ palette, book, onOpenReader, onBack }: ConceptProps) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={washiStyles.detailContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={washiStyles.detailTopBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="กลับ"
          onPress={onBack}
          style={({ pressed }) => [washiStyles.iconButton, pressed && { opacity: 0.6 }]}
        >
          <ArrowLeft size={22} color={palette.text} />
        </Pressable>
        <Text style={[washiStyles.detailTopLabel, { color: palette.muted }]}>รายละเอียด</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ตั้งค่า"
          style={({ pressed }) => [washiStyles.iconButton, pressed && { opacity: 0.6 }]}
        >
          <Settings2 size={20} color={palette.text} />
        </Pressable>
      </View>

      <View
        style={[
          washiStyles.detailCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
            shadowOpacity: palette.isDark ? 0.28 : 0.06,
          },
        ]}
      >
        <View style={washiStyles.detailHero}>
          <PreviewCover book={book} style={washiStyles.detailCover} radius={10} />
          <View style={washiStyles.detailInfo}>
            <View style={washiStyles.detailTags}>
              {book.tags.slice(0, 2).map(tag => (
                <View key={tag} style={[washiStyles.detailTagPill, { backgroundColor: palette.accentSoft }]}>
                  <Text style={[washiStyles.detailTag, { color: palette.accent }]}>{tag}</Text>
                </View>
              ))}
            </View>
            <Text style={[washiStyles.detailTitle, { color: palette.text }]}>{book.title}</Text>
            <Text style={[washiStyles.detailMeta, { color: palette.muted }]}>{book.author}</Text>
            <Text style={[washiStyles.detailMeta, { color: palette.muted }]}>
              {book.totalChapters} ตอน · แปลไทย
            </Text>
            <View style={washiStyles.detailProgress}>
              <ProgressLine value={book.progress} color={palette.accent} track={palette.line} height={2} />
              <Text style={[washiStyles.detailPercent, { color: palette.muted }]}>
                {Math.round(book.progress * 100)}%
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={chapterNumber(book)}
              onPress={() => onOpenReader(book)}
              style={({ pressed }) => [
                washiStyles.detailCta,
                { backgroundColor: palette.accent },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Play size={15} color={palette.accentInk} fill={palette.accentInk} />
              <Text style={[washiStyles.detailCtaText, { color: palette.accentInk }]}>
                {chapterNumber(book)}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View
        style={[
          washiStyles.synopsisCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
            shadowOpacity: palette.isDark ? 0.28 : 0.05,
          },
        ]}
      >
        <Text style={[washiStyles.detailSection, { color: palette.text }]}>เรื่องย่อ</Text>
        <Text style={[washiStyles.synopsis, { color: palette.text }]}>{book.synopsis}</Text>
      </View>

      <View style={washiStyles.chapterHeadingRow}>
        <Text style={[washiStyles.detailSection, { color: palette.text }]}>สารบัญ</Text>
        <Text style={[washiStyles.chapterCount, { color: palette.muted }]}>
          {PREVIEW_CHAPTERS.length} ตอน
        </Text>
      </View>

      {PREVIEW_CHAPTERS.map(chapter => {
        const current = chapter.state === 'current';
        const read = chapter.state !== 'unread';
        return (
          <Pressable
            key={chapter.number}
            accessibilityRole="button"
            accessibilityLabel={`ตอนที่ ${chapter.number} ${chapter.title}`}
            onPress={() => onOpenReader(book)}
            style={({ pressed }) => [
              washiStyles.chapterRow,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={[washiStyles.chapterNo, { color: current ? palette.accent : palette.muted }]}>
              {chapter.number === 0 ? '序' : chapter.number}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                washiStyles.chapterTitle,
                { color: current ? palette.accent : palette.text },
                current && { fontFamily: FONT.uiSemi },
              ]}
            >
              {chapter.title}
            </Text>
            {read ? <Check size={14} color={palette.accent} /> : <ChevronRight size={15} color={palette.muted} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function WashiReader({ palette, book, onBack }: ConceptProps) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={[washiStyles.readerTop, { borderBottomColor: palette.line }]}>
        <ProgressLine value={READER_SAMPLE.progress / 100} color={palette.accent} track={palette.line} height={2} radius={0} />
        <View style={washiStyles.readerTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="กลับ"
            onPress={onBack}
            style={({ pressed }) => [washiStyles.iconButton, pressed && { opacity: 0.6 }]}
          >
            <ArrowLeft size={21} color={palette.text} />
          </Pressable>
          <View style={washiStyles.readerTopTitle}>
            <Text numberOfLines={1} style={[washiStyles.readerTopName, { color: palette.text }]}>
              {book.title}
            </Text>
            <Text style={[washiStyles.readerTopMeta, { color: palette.muted }]}>
              ตอนที่ {READER_SAMPLE.chapterNumber} · {READER_SAMPLE.progress}%
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="สารบัญ"
            style={({ pressed }) => [washiStyles.iconButton, pressed && { opacity: 0.6 }]}
          >
            <List size={20} color={palette.accent} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={washiStyles.readerContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[washiStyles.readerKicker, { color: palette.accent }]}>
          ตอนที่ {READER_SAMPLE.chapterNumber}
        </Text>
        <Text style={[washiStyles.readerChapterTitle, { color: palette.text }]}>
          {READER_SAMPLE.chapterTitle}
        </Text>
        <View style={[washiStyles.readerRule, { backgroundColor: palette.line }]} />

        {READER_SAMPLE.paragraphs.map((paragraph, index) => (
          <Text key={`p-${index}`} style={[washiStyles.readerBody, { color: palette.text }]}>
            {'\u00A0\u00A0\u00A0\u00A0'}{paragraph}
          </Text>
        ))}

        <View style={[washiStyles.dialogueCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[washiStyles.dialogueSpeaker, { color: palette.accent }]}>
            {READER_SAMPLE.dialogue.speaker}
          </Text>
          <Text style={[washiStyles.readerDialogue, { color: palette.text }]}>
            {READER_SAMPLE.dialogue.text}
          </Text>
        </View>

        {READER_SAMPLE.after.map((paragraph, index) => (
          <Text key={`after-${index}`} style={[washiStyles.readerBody, { color: palette.text }]}>
            {'\u00A0\u00A0\u00A0\u00A0'}{paragraph}
          </Text>
        ))}

        <View style={washiStyles.sceneBreak}>
          <View style={[washiStyles.sceneLine, { backgroundColor: palette.line }]} />
          <View style={[washiStyles.sceneDot, { backgroundColor: palette.accent }]} />
          <View style={[washiStyles.sceneLine, { backgroundColor: palette.line }]} />
        </View>

        <Text style={[washiStyles.readerBody, { color: palette.text }]}>
          {'\u00A0\u00A0\u00A0\u00A0'}และนั่นคือจุดเริ่มต้นของวันธรรมดา
          ที่ไม่ธรรมดาอีกต่อไป
        </Text>
      </ScrollView>

      <View style={[washiStyles.readerDock, { borderColor: palette.border, backgroundColor: palette.surface, shadowColor: palette.shadow }]}>
        <View style={washiStyles.dockItem}>
          <Type size={17} color={palette.accent} />
          <Text style={[washiStyles.dockText, { color: palette.text }]}>Serif 18</Text>
        </View>
        <View style={washiStyles.dockThemes}>
          <View style={[washiStyles.themeDot, { borderColor: palette.isDark ? 'transparent' : palette.accent, backgroundColor: palette.bg }]}>
            <Sun size={13} color={palette.muted} />
          </View>
          <View style={[washiStyles.themeDot, { borderColor: 'transparent', backgroundColor: palette.surfaceAlt }]}>
            <Coffee size={13} color={palette.muted} />
          </View>
          <View style={[washiStyles.themeDot, { borderColor: palette.isDark ? palette.accent : 'transparent', backgroundColor: palette.text }]}>
            <Moon size={13} color={palette.bg} />
          </View>
        </View>
        <View style={washiStyles.dockItem}>
          <List size={17} color={palette.accent} />
          <Text style={[washiStyles.dockText, { color: palette.text }]}>สารบัญ</Text>
        </View>
      </View>
    </View>
  );
}

export function WashiConcept(props: ConceptProps) {
  if (props.screen === 'detail') return <WashiDetail {...props} />;
  if (props.screen === 'reader') return <WashiReader {...props} />;
  return <WashiShelf {...props} />;
}

const washiStyles = StyleSheet.create({
  shelfContent: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seal: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  sealText: { fontFamily: FONT.serifBold, fontSize: 18, lineHeight: 24 },
  wordmark: { fontFamily: FONT.serifSemi, fontSize: 23, lineHeight: 28, letterSpacing: -0.3 },
  wordmarkJp: { fontFamily: FONT.ui, fontSize: 10, letterSpacing: 3, marginTop: -1 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  continueCard: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  continueCover: { width: 70, height: 105 },
  continueInfo: { flex: 1, minWidth: 0 },
  continueKicker: { fontFamily: FONT.uiSemi, fontSize: 11, marginBottom: 4 },
  continueTitle: { fontFamily: FONT.serifSemi, fontSize: 18, lineHeight: 25 },
  continueMeta: { fontFamily: FONT.ui, fontSize: 10.5, marginTop: 3 },
  continueProgress: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 },
  continuePercent: { fontFamily: FONT.ui, fontSize: 10, minWidth: 28, textAlign: 'right' },
  playCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  shelfHeadingRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 26 },
  pageTitle: { fontFamily: FONT.serifSemi, fontSize: 28, lineHeight: 37, letterSpacing: -0.4 },
  pageCount: { fontFamily: FONT.ui, fontSize: 11.5 },
  searchBar: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    marginTop: 12,
  },
  searchPlaceholder: { fontFamily: FONT.ui, fontSize: 12.5 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginTop: 12 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 58, paddingVertical: 8, borderBottomWidth: 2 },
  tabText: { fontFamily: FONT.uiSemi, fontSize: 12.5 },
  tabCount: { fontFamily: FONT.ui, fontSize: 9.5, marginTop: 2 },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  filterCount: { fontFamily: FONT.ui, fontSize: 10.5 },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sortText: { fontFamily: FONT.ui, fontSize: 10.5 },
  tagRow: { gap: 8, paddingVertical: 10 },
  tag: { minHeight: 40, justifyContent: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 13 },
  tagText: { fontFamily: FONT.ui, fontSize: 11.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14, marginTop: 4 },
  bookCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 1,
  },
  gridCover: { width: '100%', aspectRatio: 2 / 3 },
  bookBody: { padding: 10, gap: 5 },
  gridTitle: { fontFamily: FONT.serifSemi, fontSize: 14.5, lineHeight: 21 },
  bookTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  bookTag: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  bookTagText: { fontFamily: FONT.ui, fontSize: 9 },
  gridMeta: { fontFamily: FONT.ui, fontSize: 10.5, marginTop: 1 },
  bookRead: { fontFamily: FONT.uiSemi, fontSize: 10.5 },
  gridProgress: { marginTop: 2 },
  empty: { fontFamily: FONT.ui, fontSize: 13, textAlign: 'center', paddingVertical: 40 },
  footerRule: { height: 1, width: 56, alignSelf: 'center', marginTop: 26, marginBottom: 12 },
  footerNote: { fontFamily: FONT.ui, fontSize: 11, textAlign: 'center', letterSpacing: 1 },
  detailContent: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 40 },
  detailTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  detailTopLabel: { fontFamily: FONT.ui, fontSize: 12, letterSpacing: 1 },
  detailCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  detailHero: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
  detailCover: { width: 128, aspectRatio: 2 / 3 },
  detailInfo: { flex: 1, minWidth: 0 },
  detailTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 7 },
  detailTagPill: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  detailTag: { fontFamily: FONT.uiSemi, fontSize: 10 },
  detailTitle: { fontFamily: FONT.serifBold, fontSize: 24, lineHeight: 33 },
  detailMeta: { fontFamily: FONT.ui, fontSize: 12, marginTop: 4 },
  detailProgress: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  detailPercent: { fontFamily: FONT.ui, fontSize: 10.5, minWidth: 28, textAlign: 'right' },
  detailCta: { minHeight: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingHorizontal: 16 },
  detailCtaText: { fontFamily: FONT.uiSemi, fontSize: 13 },
  synopsisCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 1,
  },
  detailSection: { fontFamily: FONT.serifSemi, fontSize: 20, lineHeight: 28, marginBottom: 8 },
  synopsis: { fontFamily: FONT.ui, fontSize: 13.5, lineHeight: 22 },
  chapterHeadingRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  chapterCount: { fontFamily: FONT.ui, fontSize: 11 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 6 },
  chapterNo: { fontFamily: FONT.serifSemi, fontSize: 17, width: 28, textAlign: 'center' },
  chapterTitle: { fontFamily: FONT.ui, fontSize: 13.5, flex: 1 },
  readerTop: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 4 },
  readerTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  readerTopTitle: { flex: 1, minWidth: 0, paddingHorizontal: 6 },
  readerTopName: { fontFamily: FONT.uiSemi, fontSize: 12.5 },
  readerTopMeta: { fontFamily: FONT.ui, fontSize: 10.5, marginTop: 1 },
  readerContent: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 26, paddingTop: 26, paddingBottom: 28 },
  readerKicker: { fontFamily: FONT.uiSemi, fontSize: 11, letterSpacing: 1.6, textAlign: 'center', marginBottom: 8 },
  readerChapterTitle: { fontFamily: FONT.serifSemi, fontSize: 26, lineHeight: 36, textAlign: 'center' },
  readerRule: { height: 1, width: 48, alignSelf: 'center', marginTop: 16, marginBottom: 24 },
  readerBody: { fontFamily: FONT.serif, fontSize: 17.5, lineHeight: 33, marginBottom: 16 },
  dialogueCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 8, marginBottom: 20 },
  dialogueSpeaker: { fontFamily: FONT.uiSemi, fontSize: 11.5, marginBottom: 4 },
  readerDialogue: { fontFamily: FONT.serif, fontSize: 18, lineHeight: 33 },
  sceneBreak: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  sceneLine: { flex: 1, height: 1 },
  sceneDot: { width: 5, height: 5, transform: [{ rotate: '45deg' }] },
  readerDock: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 58,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  dockItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 42 },
  dockText: { fontFamily: FONT.ui, fontSize: 11.5 },
  dockThemes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
