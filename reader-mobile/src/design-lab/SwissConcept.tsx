import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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
  PREVIEW_CHAPTERS,
  READER_SAMPLE,
  READING_COUNT,
} from './data';
import {
  ConceptProps,
  PreviewCover,
  ProgressLine,
  chapterNumber,
} from './shared';
import { FONT } from './tokens';

function SwissShelf({ palette, onOpenBook, onOpenReader }: ConceptProps) {
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  const continueBook = PREVIEW_BOOKS[0];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={swissStyles.shelf}
      showsVerticalScrollIndicator={false}
    >
      <View style={swissStyles.topBar}>
        <Text style={[swissStyles.wordmark, { color: palette.text }]}>YOMIORI</Text>
        <View style={swissStyles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ค้นหา"
            style={({ pressed }) => [swissStyles.iconButton, pressed && { opacity: 0.45 }]}
          >
            <Search size={18} color={palette.text} strokeWidth={1.7} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ตั้งค่า"
            style={({ pressed }) => [swissStyles.iconButton, pressed && { opacity: 0.45 }]}
          >
            <Settings2 size={18} color={palette.text} strokeWidth={1.7} />
          </Pressable>
        </View>
      </View>

      <Text style={[swissStyles.pageTitle, { color: palette.text }]}>ชั้นหนังสือ</Text>
      <View style={swissStyles.metaRow}>
        <Text style={[swissStyles.metaText, { color: palette.muted }]}>
          {PREVIEW_BOOKS.length} เล่ม
        </Text>
        <Text style={[swissStyles.metaText, { color: palette.muted }]}>
          อ่านต่อ {READING_COUNT}
        </Text>
      </View>
      <View style={[swissStyles.heavyRule, { backgroundColor: palette.text }]} />

      <View style={swissStyles.continueRow}>
        <PreviewCover book={continueBook} style={swissStyles.continueCover} radius={0} />
        <View style={swissStyles.continueInfo}>
          <View style={swissStyles.kickerRow}>
            <View style={[swissStyles.kickerBlock, { backgroundColor: palette.accent }]} />
            <Text style={[swissStyles.kicker, { color: palette.accent }]}>อ่านต่อ</Text>
          </View>
          <Text numberOfLines={2} style={[swissStyles.continueTitle, { color: palette.text }]}>
            {continueBook.title}
          </Text>
          <Text style={[swissStyles.continueMeta, { color: palette.muted }]}>
            {continueBook.currentChapterTitle} · ตอนที่ {continueBook.currentChapter}
          </Text>
          <View style={swissStyles.progressRow}>
            <ProgressLine
              value={continueBook.progress}
              color={palette.accent}
              track={palette.line}
              height={2}
              radius={0}
            />
            <Text style={[swissStyles.progressValue, { color: palette.muted }]}>
              {Math.round(continueBook.progress * 100)}%
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={chapterNumber(continueBook)}
            onPress={() => onOpenReader(continueBook)}
            style={({ pressed }) => [
              swissStyles.continueCta,
              { backgroundColor: palette.accent },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Play size={13} color={palette.accentInk} fill={palette.accentInk} />
            <Text style={[swissStyles.continueCtaText, { color: palette.accentInk }]}>
              {chapterNumber(continueBook)}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={swissStyles.sectionRow}>
        <Text style={[swissStyles.sectionTitle, { color: palette.text }]}>รายการหนังสือ</Text>
        <Text style={[swissStyles.metaText, { color: palette.muted }]}>
          {PREVIEW_BOOKS.length} รายการ
        </Text>
      </View>

      <View style={[swissStyles.tableHead, { borderBottomColor: palette.line }]}>
        <Text style={[swissStyles.headTitle, { color: palette.muted }]}>เรื่อง</Text>
        {wide ? <Text style={[swissStyles.headAuthor, { color: palette.muted }]}>ผู้เขียน</Text> : null}
        <Text style={[swissStyles.headProgress, { color: palette.muted }]}>อ่านแล้ว</Text>
        <View style={swissStyles.headEnd} />
      </View>

      {PREVIEW_BOOKS.map(book => (
        <Pressable
          key={book.id}
          accessibilityRole="button"
          accessibilityLabel={`รายละเอียด ${book.title}`}
          onPress={() => onOpenBook(book)}
          style={({ pressed }) => [
            swissStyles.tableRow,
            { borderBottomColor: palette.line },
            pressed && { opacity: 0.5 },
          ]}
        >
          <View style={swissStyles.titleCell}>
            <PreviewCover book={book} style={swissStyles.thumb} radius={0} />
            <View style={swissStyles.titleText}>
              <Text numberOfLines={2} style={[swissStyles.rowTitle, { color: palette.text }]}>
                {book.title}
              </Text>
              <Text style={[swissStyles.rowMeta, { color: palette.muted }]}>
                {book.totalChapters} ตอน
              </Text>
            </View>
          </View>
          {wide ? (
            <Text numberOfLines={1} style={[swissStyles.authorCell, { color: palette.muted }]}>
              {book.author}
            </Text>
          ) : null}
          <View style={swissStyles.progressCell}>
            <Text style={[swissStyles.progressValue, { color: palette.muted }]}>
              {book.status === 'done' ? 'จบ' : `${Math.round(book.progress * 100)}%`}
            </Text>
            <View style={swissStyles.smallBar}>
              <ProgressLine
                value={book.progress}
                color={palette.accent}
                track={palette.line}
                height={1}
                radius={0}
              />
            </View>
          </View>
          <View style={swissStyles.endCell}>
            {book.status === 'done' ? (
              <Check size={14} color={palette.accent} strokeWidth={2} />
            ) : (
              <ChevronRight size={14} color={palette.muted} strokeWidth={1.6} />
            )}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function SwissDetail({ palette, book, onOpenReader, onBack }: ConceptProps) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={swissStyles.detail}
      showsVerticalScrollIndicator={false}
    >
      <View style={swissStyles.detailTop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="กลับ"
          onPress={onBack}
          style={({ pressed }) => [swissStyles.iconButton, pressed && { opacity: 0.45 }]}
        >
          <ArrowLeft size={20} color={palette.text} strokeWidth={1.7} />
        </Pressable>
        <Text style={[swissStyles.wordmark, { color: palette.text }]}>YOMIORI</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ตั้งค่า"
          style={({ pressed }) => [swissStyles.iconButton, pressed && { opacity: 0.45 }]}
        >
          <Settings2 size={18} color={palette.text} strokeWidth={1.7} />
        </Pressable>
      </View>
      <View style={[swissStyles.heavyRule, { backgroundColor: palette.text }]} />

      <View style={swissStyles.detailHero}>
        <PreviewCover book={book} style={swissStyles.detailCover} radius={0} />
        <View style={swissStyles.detailInfo}>
          <Text style={[swissStyles.detailTags, { color: palette.accent }]}>
            {book.tags.slice(0, 2).join('  /  ')}
          </Text>
          <Text style={[swissStyles.detailTitle, { color: palette.text }]}>{book.title}</Text>
          <View style={[swissStyles.metaTable, { borderTopColor: palette.line }]}>
            <View style={[swissStyles.metaTableRow, { borderBottomColor: palette.line }]}>
              <Text style={[swissStyles.metaLabel, { color: palette.muted }]}>ผู้เขียน</Text>
              <Text style={[swissStyles.metaValue, { color: palette.text }]}>{book.author}</Text>
            </View>
            <View style={[swissStyles.metaTableRow, { borderBottomColor: palette.line }]}>
              <Text style={[swissStyles.metaLabel, { color: palette.muted }]}>จำนวนตอน</Text>
              <Text style={[swissStyles.metaValue, { color: palette.text }]}>
                {book.totalChapters} ตอน
              </Text>
            </View>
            <View style={[swissStyles.metaTableRow, { borderBottomColor: palette.line }]}>
              <Text style={[swissStyles.metaLabel, { color: palette.muted }]}>อ่านแล้ว</Text>
              <Text style={[swissStyles.metaValue, { color: palette.text }]}>
                {Math.round(book.progress * 100)}%
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={chapterNumber(book)}
            onPress={() => onOpenReader(book)}
            style={({ pressed }) => [
              swissStyles.detailCta,
              { backgroundColor: palette.accent },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Play size={13} color={palette.accentInk} fill={palette.accentInk} />
            <Text style={[swissStyles.detailCtaText, { color: palette.accentInk }]}>
              {chapterNumber(book)}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={swissStyles.sectionHeadingRow}>
        <View style={[swissStyles.sectionMark, { backgroundColor: palette.accent }]} />
        <Text style={[swissStyles.sectionTitle, { color: palette.text }]}>เรื่องย่อ</Text>
      </View>
      <Text style={[swissStyles.synopsis, { color: palette.text }]}>{book.synopsis}</Text>

      <View style={swissStyles.chapterHeadingRow}>
        <Text style={[swissStyles.sectionTitle, { color: palette.text }]}>สารบัญ</Text>
        <Text style={[swissStyles.metaText, { color: palette.muted }]}>
          {PREVIEW_CHAPTERS.length} ตอน
        </Text>
      </View>

      <View style={[swissStyles.chapterHead, { borderBottomColor: palette.line }]}>
        <Text style={[swissStyles.chapterHeadNo, { color: palette.muted }]}>บท</Text>
        <Text style={[swissStyles.chapterHeadTitle, { color: palette.muted }]}>ชื่อตอน</Text>
        <Text style={[swissStyles.chapterHeadState, { color: palette.muted }]}>สถานะ</Text>
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
              swissStyles.chapterRow,
              { borderBottomColor: palette.line },
              pressed && { opacity: 0.55 },
            ]}
          >
            <Text style={[swissStyles.chapterNo, { color: current ? palette.accent : palette.muted }]}>
              {chapter.number === 0 ? '序' : chapter.number}
            </Text>
            <Text
              numberOfLines={1}
              style={[swissStyles.chapterTitle, { color: current ? palette.accent : palette.text }]}
            >
              {chapter.title}
            </Text>
            <View style={swissStyles.chapterState}>
              {current ? (
                <Text style={[swissStyles.currentLabel, { color: palette.accent }]}>กำลังอ่าน</Text>
              ) : read ? (
                <Check size={13} color={palette.muted} strokeWidth={1.8} />
              ) : (
                <ChevronRight size={13} color={palette.muted} strokeWidth={1.6} />
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SwissReader({ palette, book, onBack }: ConceptProps) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={swissStyles.readerTop}>
        <ProgressLine
          value={READER_SAMPLE.progress / 100}
          color={palette.accent}
          track={palette.line}
          height={2}
          radius={0}
        />
        <View style={swissStyles.readerTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="กลับ"
            onPress={onBack}
            style={({ pressed }) => [swissStyles.iconButton, pressed && { opacity: 0.45 }]}
          >
            <ArrowLeft size={19} color={palette.text} strokeWidth={1.7} />
          </Pressable>
          <View style={swissStyles.readerTopTitle}>
            <Text numberOfLines={1} style={[swissStyles.readerTopName, { color: palette.text }]}>
              {book.title}
            </Text>
            <Text style={[swissStyles.readerTopMeta, { color: palette.muted }]}>
              ตอนที่ {READER_SAMPLE.chapterNumber} · {READER_SAMPLE.progress}%
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="สารบัญ"
            style={({ pressed }) => [swissStyles.iconButton, pressed && { opacity: 0.45 }]}
          >
            <List size={19} color={palette.text} strokeWidth={1.7} />
          </Pressable>
        </View>
        <View style={[swissStyles.readerHeadRule, { backgroundColor: palette.line }]} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={swissStyles.readerBody}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[swissStyles.readerKicker, { color: palette.muted }]}>
          ตอนที่ {READER_SAMPLE.chapterNumber}
        </Text>
        <Text style={[swissStyles.readerTitle, { color: palette.text }]}>
          {READER_SAMPLE.chapterTitle}
        </Text>
        <View style={[swissStyles.readerMark, { backgroundColor: palette.accent }]} />

        {READER_SAMPLE.paragraphs.map((paragraph, index) => (
          <Text key={`p-${index}`} style={[swissStyles.paragraph, { color: palette.text }]}>
            {paragraph}
          </Text>
        ))}

        <View style={[swissStyles.dialogue, { borderTopColor: palette.line, borderBottomColor: palette.line }]}>
          <View style={swissStyles.dialogueSpeakerRow}>
            <View style={[swissStyles.dialogueMark, { backgroundColor: palette.accent }]} />
            <Text style={[swissStyles.dialogueSpeaker, { color: palette.accent }]}>
              {READER_SAMPLE.dialogue.speaker}
            </Text>
          </View>
          <Text style={[swissStyles.dialogueText, { color: palette.text }]}>
            {READER_SAMPLE.dialogue.text}
          </Text>
        </View>

        {READER_SAMPLE.after.map((paragraph, index) => (
          <Text key={`after-${index}`} style={[swissStyles.paragraph, { color: palette.text }]}>
            {paragraph}
          </Text>
        ))}

        <View style={swissStyles.sceneBreak}>
          <View style={[swissStyles.sceneLine, { backgroundColor: palette.accent }]} />
        </View>

        <Text style={[swissStyles.paragraph, { color: palette.text }]}>
          และแล้วเช้าวันธรรมดาก็ไม่ธรรมดาอีกต่อไป
        </Text>
      </ScrollView>

      <View style={[swissStyles.readerDock, { borderTopColor: palette.line }]}>
        <View style={swissStyles.dockItem}>
          <Type size={15} color={palette.muted} strokeWidth={1.7} />
          <Text style={[swissStyles.dockText, { color: palette.muted }]}>Sarabun 17</Text>
        </View>
        <View style={swissStyles.themes}>
          <View style={[swissStyles.themeDot, { borderColor: palette.isDark ? 'transparent' : palette.accent }]}>
            <Sun size={11} color={palette.muted} strokeWidth={1.6} />
          </View>
          <View style={[swissStyles.themeDot, { borderColor: 'transparent' }]}>
            <Coffee size={11} color={palette.muted} strokeWidth={1.6} />
          </View>
          <View style={[swissStyles.themeDot, { borderColor: palette.isDark ? palette.accent : 'transparent' }]}>
            <Moon size={11} color={palette.muted} strokeWidth={1.6} />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="สารบัญ"
          style={({ pressed }) => [swissStyles.dockItem, pressed && { opacity: 0.45 }]}
        >
          <List size={15} color={palette.muted} strokeWidth={1.7} />
          <Text style={[swissStyles.dockText, { color: palette.muted }]}>สารบัญ</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SwissConcept(props: ConceptProps) {
  if (props.screen === 'detail') return <SwissDetail {...props} />;
  if (props.screen === 'reader') return <SwissReader {...props} />;
  return <SwissShelf {...props} />;
}

const swissStyles = StyleSheet.create({
  shelf: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 44,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { fontFamily: FONT.modernSemi, fontSize: 13, letterSpacing: 2.4 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontFamily: FONT.modernSemi, fontSize: 48, lineHeight: 54, letterSpacing: -1.2, marginTop: 28 },
  metaRow: { flexDirection: 'row', gap: 18, marginTop: 8, marginBottom: 14 },
  metaText: { fontFamily: FONT.ui, fontSize: 10.5 },
  heavyRule: { height: 2, width: '100%' },
  continueRow: { flexDirection: 'row', gap: 24, alignItems: 'flex-start', marginTop: 24, marginBottom: 30 },
  continueCover: { width: 136, height: 204 },
  continueInfo: { flex: 1, minWidth: 0 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  kickerBlock: { width: 18, height: 2 },
  kicker: { fontFamily: FONT.uiSemi, fontSize: 10.5, letterSpacing: 0.6 },
  continueTitle: { fontFamily: FONT.modernSemi, fontSize: 28, lineHeight: 36, letterSpacing: -0.5 },
  continueMeta: { fontFamily: FONT.ui, fontSize: 11.5, marginTop: 5 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  progressValue: { fontFamily: FONT.ui, fontSize: 10.5, minWidth: 34, textAlign: 'right' },
  continueCta: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 18 },
  continueCtaText: { fontFamily: FONT.uiSemi, fontSize: 12.5 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontFamily: FONT.modernSemi, fontSize: 22, lineHeight: 29, letterSpacing: -0.3 },
  tableHead: { flexDirection: 'row', alignItems: 'center', minHeight: 32, borderBottomWidth: 1 },
  headTitle: { flex: 1.8, fontFamily: FONT.ui, fontSize: 10 },
  headAuthor: { flex: 1, fontFamily: FONT.ui, fontSize: 10 },
  headProgress: { width: 86, fontFamily: FONT.ui, fontSize: 10 },
  headEnd: { width: 24 },
  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 72, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  titleCell: { flex: 1.8, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  thumb: { width: 30, height: 45 },
  titleText: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: FONT.modern, fontSize: 13.5, lineHeight: 19 },
  rowMeta: { fontFamily: FONT.ui, fontSize: 10, marginTop: 2 },
  authorCell: { flex: 1, fontFamily: FONT.ui, fontSize: 10.5, paddingRight: 12 },
  progressCell: { width: 86, paddingRight: 12 },
  smallBar: { marginTop: 5 },
  endCell: { width: 24, alignItems: 'center' },
  detail: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 44,
  },
  detailTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  detailHero: { flexDirection: 'row', gap: 24, alignItems: 'flex-start', marginTop: 26 },
  detailCover: { width: 148, height: 222 },
  detailInfo: { flex: 1, minWidth: 0 },
  detailTags: { fontFamily: FONT.ui, fontSize: 10.5, letterSpacing: 0.5, marginBottom: 8 },
  detailTitle: { fontFamily: FONT.modernSemi, fontSize: 30, lineHeight: 38, letterSpacing: -0.7 },
  metaTable: { borderTopWidth: 1, marginTop: 16, marginBottom: 16 },
  metaTableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 31, borderBottomWidth: StyleSheet.hairlineWidth },
  metaLabel: { width: 78, fontFamily: FONT.ui, fontSize: 10 },
  metaValue: { flex: 1, fontFamily: FONT.ui, fontSize: 11.5 },
  detailCta: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  detailCtaText: { fontFamily: FONT.uiSemi, fontSize: 12.5 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 30, marginBottom: 10 },
  sectionMark: { width: 16, height: 2 },
  synopsis: { fontFamily: FONT.ui, fontSize: 14, lineHeight: 24 },
  chapterHeadingRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 30, marginBottom: 10 },
  chapterHead: { flexDirection: 'row', alignItems: 'center', minHeight: 28, borderBottomWidth: 1 },
  chapterHeadNo: { width: 34, fontFamily: FONT.ui, fontSize: 9.5 },
  chapterHeadTitle: { flex: 1, fontFamily: FONT.ui, fontSize: 9.5 },
  chapterHeadState: { width: 66, fontFamily: FONT.ui, fontSize: 9.5, textAlign: 'right' },
  chapterRow: { flexDirection: 'row', alignItems: 'center', minHeight: 46, borderBottomWidth: StyleSheet.hairlineWidth },
  chapterNo: { width: 34, fontFamily: FONT.ui, fontSize: 11 },
  chapterTitle: { flex: 1, fontFamily: FONT.ui, fontSize: 12.5 },
  chapterState: { width: 66, alignItems: 'flex-end' },
  currentLabel: { fontFamily: FONT.ui, fontSize: 10 },
  readerTop: { paddingBottom: 0 },
  readerTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 48 },
  readerTopTitle: { flex: 1, minWidth: 0, paddingHorizontal: 8 },
  readerTopName: { fontFamily: FONT.uiSemi, fontSize: 11.5 },
  readerTopMeta: { fontFamily: FONT.ui, fontSize: 10, marginTop: 1 },
  readerHeadRule: { height: 1 },
  readerBody: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 30, paddingBottom: 44 },
  readerKicker: { fontFamily: FONT.ui, fontSize: 10.5, letterSpacing: 1.4 },
  readerTitle: { fontFamily: FONT.modernSemi, fontSize: 30, lineHeight: 38, letterSpacing: -0.6, marginTop: 8 },
  readerMark: { width: 48, height: 2, marginTop: 16, marginBottom: 26 },
  paragraph: { fontFamily: FONT.ui, fontSize: 17, lineHeight: 31, marginBottom: 15 },
  dialogue: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 14, marginVertical: 8, marginBottom: 20 },
  dialogueSpeakerRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  dialogueMark: { width: 5, height: 5 },
  dialogueSpeaker: { fontFamily: FONT.uiSemi, fontSize: 11.5 },
  dialogueText: { fontFamily: FONT.ui, fontSize: 17, lineHeight: 31 },
  sceneBreak: { alignItems: 'center', paddingVertical: 22 },
  sceneLine: { width: 24, height: 2 },
  readerDock: { borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, minHeight: 56 },
  dockItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 },
  dockText: { fontFamily: FONT.ui, fontSize: 10.5 },
  themes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
