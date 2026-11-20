import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
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

      <View style={washiStyles.titleBlock}>
        <Text style={[washiStyles.pageTitle, { color: palette.text }]}>ชั้นหนังสือ</Text>
        <Text style={[washiStyles.pageSub, { color: palette.muted }]}>
          {PREVIEW_BOOKS.length} เรื่องในชั้น · อ่านต่อ {READING_COUNT} เรื่อง
        </Text>
      </View>

      <View style={[washiStyles.rule, { backgroundColor: palette.line }]} />

      {continueBook ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`อ่านต่อ ${continueBook.title}`}
          onPress={() => onOpenReader(continueBook)}
          style={({ pressed }) => [washiStyles.continueRow, pressed && { opacity: 0.78 }]}
        >
          <PreviewCover book={continueBook} style={washiStyles.continueCover} radius={2} />
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
          <View style={[washiStyles.playCircle, { borderColor: palette.accent }]}>
            <Play size={13} color={palette.accent} fill={palette.accent} />
          </View>
        </Pressable>
      ) : null}

      <View style={[washiStyles.rule, { backgroundColor: palette.line }]} />

      <View style={washiStyles.shelfHeadingRow}>
        <Text style={[washiStyles.shelfHeading, { color: palette.text }]}>เรื่องที่กำลังอ่าน</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ดูทั้งหมด"
          onPress={() => setTab('all')}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <Text style={[washiStyles.shelfLink, { color: palette.accent }]}>ดูทั้งหมด</Text>
        </Pressable>
      </View>

      <View style={washiStyles.tabRow}>
        {TABS.map(item => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(item.id)}
              style={({ pressed }) => [washiStyles.tab, pressed && { opacity: 0.65 }]}
            >
              <Text
                style={[
                  washiStyles.tabText,
                  { color: active ? palette.text : palette.muted },
                  active && { borderBottomColor: palette.accent },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
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
                  backgroundColor: active ? palette.accentSoft : 'transparent',
                },
                pressed && { opacity: 0.65 },
              ]}
            >
              <Text style={[washiStyles.tagText, { color: active ? palette.accent : palette.muted }]}>
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
            style={({ pressed }) => [{ width: widthPercent }, pressed && { opacity: 0.75 }]}
          >
            <PreviewCover book={book} style={washiStyles.gridCover} radius={2} />
            <Text numberOfLines={2} style={[washiStyles.gridTitle, { color: palette.text }]}>
              {book.title}
            </Text>
            <Text style={[washiStyles.gridMeta, { color: palette.muted }]}>{bookMeta(book)}</Text>
            {book.status === 'reading' ? (
              <View style={washiStyles.gridProgress}>
                <ProgressLine value={book.progress} color={palette.accent} track={palette.line} height={2} />
              </View>
            ) : book.status === 'new' ? (
              <Text style={[washiStyles.newMark, { color: palette.accent }]}>ยังไม่เริ่ม</Text>
            ) : (
              <View style={washiStyles.doneRow}>
                <Check size={12} color={palette.accent} />
                <Text style={[washiStyles.doneText, { color: palette.accent }]}>อ่านจบแล้ว</Text>
              </View>
            )}
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

      <View style={washiStyles.detailHero}>
        <PreviewCover book={book} style={washiStyles.detailCover} radius={2} />
        <View style={washiStyles.detailInfo}>
          <View style={washiStyles.detailTags}>
            {book.tags.slice(0, 2).map(tag => (
              <Text key={tag} style={[washiStyles.detailTag, { color: palette.accent }]}>
                {tag}
              </Text>
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

      <View style={[washiStyles.rule, { backgroundColor: palette.line }]} />

      <Text style={[washiStyles.detailSection, { color: palette.text }]}>เรื่องย่อ</Text>
      <Text style={[washiStyles.synopsis, { color: palette.text }]}>
        {book.synopsis}
      </Text>

      <View style={[washiStyles.rule, { backgroundColor: palette.line }]} />

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
            style={({ pressed }) => [washiStyles.chapterRow, { borderTopColor: palette.line }, pressed && { opacity: 0.6 }]}
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

        <View style={[washiStyles.dialogueRule, { borderLeftColor: palette.accent }]}>
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

      <View style={[washiStyles.readerDock, { borderTopColor: palette.line, backgroundColor: palette.surface }]}>
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
  seal: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 2 },
  sealText: { fontFamily: FONT.serifBold, fontSize: 18, lineHeight: 24 },
  wordmark: { fontFamily: FONT.serifSemi, fontSize: 23, lineHeight: 28, letterSpacing: -0.3 },
  wordmarkJp: { fontFamily: FONT.ui, fontSize: 10, letterSpacing: 3, marginTop: -1 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { marginTop: 30, marginBottom: 18 },
  pageTitle: { fontFamily: FONT.serifSemi, fontSize: 34, lineHeight: 44, letterSpacing: -0.6 },
  pageSub: { fontFamily: FONT.ui, fontSize: 12.5, marginTop: 4 },
  rule: { height: 1, width: '100%' },
  continueRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 20 },
  continueCover: { width: 94, height: 140 },
  continueInfo: { flex: 1, minWidth: 0 },
  continueKicker: { fontFamily: FONT.uiSemi, fontSize: 12, marginBottom: 5 },
  continueTitle: { fontFamily: FONT.serifSemi, fontSize: 20, lineHeight: 28 },
  continueMeta: { fontFamily: FONT.ui, fontSize: 12, marginTop: 4 },
  continueProgress: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  continuePercent: { fontFamily: FONT.uiSemi, fontSize: 11, minWidth: 30, textAlign: 'right' },
  playCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  shelfHeadingRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22 },
  shelfHeading: { fontFamily: FONT.serifSemi, fontSize: 22, lineHeight: 30 },
  shelfLink: { fontFamily: FONT.uiSemi, fontSize: 12 },
  tabRow: { flexDirection: 'row', gap: 20, marginTop: 6 },
  tab: { minHeight: 44, justifyContent: 'center' },
  tabText: { fontFamily: FONT.uiSemi, fontSize: 13, paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tagRow: { gap: 8, paddingVertical: 8 },
  tag: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderRadius: 2, paddingHorizontal: 11 },
  tagText: { fontFamily: FONT.ui, fontSize: 11.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  gridCover: { width: '100%', aspectRatio: 2 / 3, marginBottom: 9 },
  gridTitle: { fontFamily: FONT.serifSemi, fontSize: 14.5, lineHeight: 21 },
  gridMeta: { fontFamily: FONT.ui, fontSize: 11, marginTop: 3, marginBottom: 18 },
  gridProgress: { marginTop: -11, marginBottom: 15 },
  newMark: { fontFamily: FONT.uiSemi, fontSize: 11, marginTop: -11, marginBottom: 15 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -12, marginBottom: 14 },
  doneText: { fontFamily: FONT.uiSemi, fontSize: 11 },
  empty: { fontFamily: FONT.ui, fontSize: 13, textAlign: 'center', paddingVertical: 40 },
  footerRule: { height: 1, width: 56, alignSelf: 'center', marginTop: 18, marginBottom: 12 },
  footerNote: { fontFamily: FONT.ui, fontSize: 11, textAlign: 'center', letterSpacing: 1 },
  detailContent: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 40 },
  detailTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  detailTopLabel: { fontFamily: FONT.ui, fontSize: 12, letterSpacing: 1 },
  detailHero: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  detailCover: { width: 132, aspectRatio: 2 / 3 },
  detailInfo: { flex: 1, minWidth: 0 },
  detailTags: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 6 },
  detailTag: { fontFamily: FONT.uiSemi, fontSize: 11 },
  detailTitle: { fontFamily: FONT.serifBold, fontSize: 24, lineHeight: 33 },
  detailMeta: { fontFamily: FONT.ui, fontSize: 12, marginTop: 4 },
  detailProgress: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  detailPercent: { fontFamily: FONT.uiSemi, fontSize: 11, minWidth: 30, textAlign: 'right' },
  detailCta: { minHeight: 46, borderRadius: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingHorizontal: 16 },
  detailCtaText: { fontFamily: FONT.uiSemi, fontSize: 13.5 },
  detailSection: { fontFamily: FONT.serifSemi, fontSize: 20, lineHeight: 28, marginTop: 20, marginBottom: 10 },
  synopsis: { fontFamily: FONT.ui, fontSize: 13.5, lineHeight: 22 },
  chapterHeadingRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  chapterCount: { fontFamily: FONT.ui, fontSize: 11 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 49, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(120,105,85,0.25)' },
  chapterNo: { fontFamily: FONT.serifSemi, fontSize: 17, width: 28, textAlign: 'center' },
  chapterTitle: { fontFamily: FONT.ui, fontSize: 13.5, flex: 1 },
  readerTop: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 4 },
  readerTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  readerTopTitle: { flex: 1, minWidth: 0, paddingHorizontal: 6 },
  readerTopName: { fontFamily: FONT.uiSemi, fontSize: 12.5 },
  readerTopMeta: { fontFamily: FONT.ui, fontSize: 10.5, marginTop: 1 },
  readerContent: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 26, paddingTop: 26, paddingBottom: 40 },
  readerKicker: { fontFamily: FONT.uiSemi, fontSize: 11, letterSpacing: 1.6, textAlign: 'center', marginBottom: 8 },
  readerChapterTitle: { fontFamily: FONT.serifSemi, fontSize: 26, lineHeight: 36, textAlign: 'center' },
  readerRule: { height: 1, width: 48, alignSelf: 'center', marginTop: 16, marginBottom: 24 },
  readerBody: { fontFamily: FONT.serif, fontSize: 17.5, lineHeight: 33, marginBottom: 16 },
  dialogueRule: { borderLeftWidth: 1, paddingLeft: 15, marginVertical: 8, marginBottom: 20 },
  dialogueSpeaker: { fontFamily: FONT.uiSemi, fontSize: 11.5, marginBottom: 4 },
  readerDialogue: { fontFamily: FONT.serif, fontSize: 18, lineHeight: 33 },
  sceneBreak: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  sceneLine: { flex: 1, height: 1 },
  sceneDot: { width: 5, height: 5, transform: [{ rotate: '45deg' }] },
  readerDock: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10, minHeight: 62 },
  dockItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  dockText: { fontFamily: FONT.ui, fontSize: 11.5 },
  dockThemes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
