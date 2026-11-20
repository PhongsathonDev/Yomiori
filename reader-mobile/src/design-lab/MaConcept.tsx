import React from 'react';
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
  bookMeta,
  chapterNumber,
} from './shared';
import { FONT } from './tokens';

function MaShelf({ palette, onOpenBook, onOpenReader }: ConceptProps) {
  const continueBook = PREVIEW_BOOKS[0];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={maStyles.shelf}
      showsVerticalScrollIndicator={false}
    >
      <View style={maStyles.topBar}>
        <Text style={[maStyles.wordmark, { color: palette.text }]}>Yomiori</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ค้นหา"
          style={({ pressed }) => [maStyles.iconButton, pressed && { opacity: 0.5 }]}
        >
          <Search size={19} color={palette.text} strokeWidth={1.6} />
        </Pressable>
      </View>

      <View style={maStyles.titleBlock}>
        <Text style={[maStyles.pageTitle, { color: palette.text }]}>ชั้นหนังสือ</Text>
        <Text style={[maStyles.pageSub, { color: palette.muted }]}>
          {PREVIEW_BOOKS.length} เรื่อง · อ่านต่อ {READING_COUNT} เรื่อง
        </Text>
      </View>

      <View style={[maStyles.rule, { backgroundColor: palette.line }]} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`อ่านต่อ ${continueBook.title}`}
        onPress={() => onOpenReader(continueBook)}
        style={({ pressed }) => [maStyles.continueRow, pressed && { opacity: 0.65 }]}
      >
        <PreviewCover book={continueBook} style={maStyles.continueCover} radius={2} />
        <View style={maStyles.continueInfo}>
          <Text numberOfLines={2} style={[maStyles.continueTitle, { color: palette.text }]}>
            {continueBook.title}
          </Text>
          <Text style={[maStyles.continueMeta, { color: palette.muted }]}>
            {continueBook.currentChapterTitle || bookMeta(continueBook)}
          </Text>
          <View style={maStyles.progressRow}>
            <ProgressLine
              value={continueBook.progress}
              color={palette.accent}
              track={palette.line}
              height={1}
              radius={0}
            />
            <Text style={[maStyles.progressText, { color: palette.muted }]}>
              {Math.round(continueBook.progress * 100)}%
            </Text>
          </View>
        </View>
        <View style={[maStyles.playCircle, { borderColor: palette.line }]}>
          <Play size={11} color={palette.accent} strokeWidth={1.8} />
        </View>
      </Pressable>

      <View style={[maStyles.rule, { backgroundColor: palette.line }]} />

      <View style={maStyles.sectionRow}>
        <Text style={[maStyles.sectionTitle, { color: palette.text }]}>เรื่องทั้งหมด</Text>
        <Text style={[maStyles.sectionCount, { color: palette.muted }]}>
          {PREVIEW_BOOKS.length} เรื่อง
        </Text>
      </View>

      {PREVIEW_BOOKS.map(book => (
        <Pressable
          key={book.id}
          accessibilityRole="button"
          accessibilityLabel={`รายละเอียด ${book.title}`}
          onPress={() => onOpenBook(book)}
          style={({ pressed }) => [maStyles.bookRow, pressed && { opacity: 0.55 }]}
        >
          <PreviewCover book={book} style={maStyles.bookCover} radius={1} />
          <View style={maStyles.bookInfo}>
            <Text numberOfLines={1} style={[maStyles.bookTitle, { color: palette.text }]}>
              {book.title}
            </Text>
            <Text style={[maStyles.bookMeta, { color: palette.muted }]}>{bookMeta(book)}</Text>
            {book.status === 'reading' ? (
              <View style={maStyles.bookProgress}>
                <ProgressLine
                  value={book.progress}
                  color={palette.accent}
                  track={palette.line}
                  height={1}
                  radius={0}
                />
              </View>
            ) : null}
          </View>
          <View style={maStyles.bookEnd}>
            {book.status === 'done' ? (
              <Check size={14} color={palette.accent} strokeWidth={1.8} />
            ) : (
              <ChevronRight size={14} color={palette.muted} strokeWidth={1.5} />
            )}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function MaDetail({ palette, book, onOpenReader, onBack }: ConceptProps) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={maStyles.detail}
      showsVerticalScrollIndicator={false}
    >
      <View style={maStyles.detailTop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="กลับ"
          onPress={onBack}
          style={({ pressed }) => [maStyles.iconButton, pressed && { opacity: 0.5 }]}
        >
          <ArrowLeft size={20} color={palette.text} strokeWidth={1.6} />
        </Pressable>
        <Text style={[maStyles.detailLabel, { color: palette.muted }]}>รายละเอียด</Text>
        <View style={maStyles.iconSpacer} />
      </View>

      <View style={maStyles.detailHero}>
        <PreviewCover book={book} style={maStyles.detailCover} radius={2} />
        <View style={maStyles.detailInfo}>
          <Text style={[maStyles.detailTags, { color: palette.accent }]}>
            {book.tags.slice(0, 2).join('  /  ')}
          </Text>
          <Text style={[maStyles.detailTitle, { color: palette.text }]}>{book.title}</Text>
          <Text style={[maStyles.detailMeta, { color: palette.muted }]}>{book.author}</Text>
          <Text style={[maStyles.detailMeta, { color: palette.muted }]}>
            {book.totalChapters} ตอน · แปลไทย
          </Text>
          <View style={maStyles.detailProgress}>
            <ProgressLine
              value={book.progress}
              color={palette.accent}
              track={palette.line}
              height={1}
              radius={0}
            />
            <Text style={[maStyles.progressText, { color: palette.muted }]}>
              {Math.round(book.progress * 100)}%
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={chapterNumber(book)}
            onPress={() => onOpenReader(book)}
            style={({ pressed }) => [
              maStyles.detailCta,
              { borderColor: palette.line },
              pressed && { opacity: 0.55 },
            ]}
          >
            <Play size={12} color={palette.accent} strokeWidth={1.8} />
            <Text style={[maStyles.detailCtaText, { color: palette.accent }]}>
              {chapterNumber(book)}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[maStyles.rule, { backgroundColor: palette.line, marginTop: 30 }]} />

      <Text style={[maStyles.sectionTitle, { color: palette.text, marginTop: 22 }]}>เรื่องย่อ</Text>
      <Text style={[maStyles.synopsis, { color: palette.text }]}>{book.synopsis}</Text>

      <View style={[maStyles.rule, { backgroundColor: palette.line, marginTop: 28 }]} />

      <View style={maStyles.chapterHead}>
        <Text style={[maStyles.sectionTitle, { color: palette.text }]}>สารบัญ</Text>
        <Text style={[maStyles.sectionCount, { color: palette.muted }]}>
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
              maStyles.chapterRow,
              { borderTopColor: palette.line },
              pressed && { opacity: 0.55 },
            ]}
          >
            <Text style={[maStyles.chapterNo, { color: palette.muted }]}>
              {chapter.number === 0 ? '序' : chapter.number}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                maStyles.chapterTitle,
                { color: current ? palette.accent : palette.text },
              ]}
            >
              {chapter.title}
            </Text>
            {read ? (
              <Check size={13} color={palette.accent} strokeWidth={1.7} />
            ) : (
              <ChevronRight size={13} color={palette.muted} strokeWidth={1.4} />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function MaReader({ palette, book, onBack }: ConceptProps) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={maStyles.readerTop}>
        <ProgressLine
          value={READER_SAMPLE.progress / 100}
          color={palette.accent}
          track={palette.line}
          height={1}
          radius={0}
        />
        <View style={maStyles.readerTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="กลับ"
            onPress={onBack}
            style={({ pressed }) => [maStyles.iconButton, pressed && { opacity: 0.5 }]}
          >
            <ArrowLeft size={19} color={palette.text} strokeWidth={1.6} />
          </Pressable>
          <View style={maStyles.readerTopTitle}>
            <Text numberOfLines={1} style={[maStyles.readerTopName, { color: palette.text }]}>
              {book.title}
            </Text>
            <Text style={[maStyles.readerTopMeta, { color: palette.muted }]}>
              ตอนที่ {READER_SAMPLE.chapterNumber} · {READER_SAMPLE.progress}%
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="สารบัญ"
            style={({ pressed }) => [maStyles.iconButton, pressed && { opacity: 0.5 }]}
          >
            <List size={19} color={palette.text} strokeWidth={1.6} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={maStyles.readerBody}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[maStyles.readerKicker, { color: palette.accent }]}>
          ตอนที่ {READER_SAMPLE.chapterNumber}
        </Text>
        <Text style={[maStyles.readerTitle, { color: palette.text }]}>
          {READER_SAMPLE.chapterTitle}
        </Text>
        <View style={[maStyles.readerRule, { backgroundColor: palette.line }]} />

        {READER_SAMPLE.paragraphs.map((paragraph, index) => (
          <Text key={`p-${index}`} style={[maStyles.paragraph, { color: palette.text }]}>
            {'\u00A0\u00A0\u00A0\u00A0'}{paragraph}
          </Text>
        ))}

        <View style={maStyles.dialogue}>
          <Text style={[maStyles.speaker, { color: palette.accent }]}>
            {READER_SAMPLE.dialogue.speaker}
          </Text>
          <Text style={[maStyles.dialogueText, { color: palette.text }]}>
            {READER_SAMPLE.dialogue.text}
          </Text>
        </View>

        {READER_SAMPLE.after.map((paragraph, index) => (
          <Text key={`after-${index}`} style={[maStyles.paragraph, { color: palette.text }]}>
            {'\u00A0\u00A0\u00A0\u00A0'}{paragraph}
          </Text>
        ))}

        <View style={maStyles.sceneBreak}>
          <View style={[maStyles.sceneDot, { backgroundColor: palette.accent }]} />
        </View>

        <Text style={[maStyles.paragraph, { color: palette.text }]}>
          {'\u00A0\u00A0\u00A0\u00A0'}และแล้วเช้าวันธรรมดาก็ไม่ธรรมดาอีกต่อไป
        </Text>
      </ScrollView>

      <View style={[maStyles.readerDock, { borderTopColor: palette.line }]}>
        <View style={maStyles.dockItem}>
          <Type size={15} color={palette.muted} strokeWidth={1.6} />
          <Text style={[maStyles.dockText, { color: palette.muted }]}>17 / 33</Text>
        </View>
        <View style={maStyles.themes}>
          <View
            style={[
              maStyles.themeDot,
              {
                borderColor: palette.isDark ? 'transparent' : palette.accent,
                backgroundColor: palette.bg,
              },
            ]}
          >
            <Sun size={11} color={palette.muted} strokeWidth={1.5} />
          </View>
          <View style={[maStyles.themeDot, { borderColor: 'transparent', backgroundColor: palette.surfaceAlt }]}>
            <Coffee size={11} color={palette.muted} strokeWidth={1.5} />
          </View>
          <View
            style={[
              maStyles.themeDot,
              {
                borderColor: palette.isDark ? palette.accent : 'transparent',
                backgroundColor: palette.text,
              },
            ]}
          >
            <Moon size={11} color={palette.bg} strokeWidth={1.5} />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="สารบัญ"
          style={({ pressed }) => [maStyles.dockItem, pressed && { opacity: 0.5 }]}
        >
          <List size={15} color={palette.muted} strokeWidth={1.6} />
          <Text style={[maStyles.dockText, { color: palette.muted }]}>สารบัญ</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function MaConcept(props: ConceptProps) {
  if (props.screen === 'detail') return <MaDetail {...props} />;
  if (props.screen === 'reader') return <MaReader {...props} />;
  return <MaShelf {...props} />;
}

const maStyles = StyleSheet.create({
  shelf: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 48,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { fontFamily: FONT.modern, fontSize: 17, lineHeight: 23, letterSpacing: 1.6 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconSpacer: { width: 44, height: 44 },
  titleBlock: { marginTop: 32, marginBottom: 18 },
  pageTitle: { fontFamily: FONT.modernLight, fontSize: 37, lineHeight: 46, letterSpacing: -0.4 },
  pageSub: { fontFamily: FONT.ui, fontSize: 12.5, marginTop: 5 },
  rule: { height: 1, width: '100%' },
  continueRow: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingVertical: 22 },
  continueCover: { width: 76, height: 114 },
  continueInfo: { flex: 1, minWidth: 0 },
  continueTitle: { fontFamily: FONT.modernLight, fontSize: 21, lineHeight: 30 },
  continueMeta: { fontFamily: FONT.ui, fontSize: 11.5, marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 13 },
  progressText: { fontFamily: FONT.ui, fontSize: 10.5, minWidth: 30, textAlign: 'right' },
  playCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 2 },
  sectionTitle: { fontFamily: FONT.modernLight, fontSize: 21, lineHeight: 28 },
  sectionCount: { fontFamily: FONT.ui, fontSize: 10.5 },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 96, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(120,120,110,0.16)' },
  bookCover: { width: 44, height: 66 },
  bookInfo: { flex: 1, minWidth: 0 },
  bookTitle: { fontFamily: FONT.modern, fontSize: 15.5, lineHeight: 22 },
  bookMeta: { fontFamily: FONT.ui, fontSize: 10.5, marginTop: 3 },
  bookProgress: { marginTop: 9, width: '72%' },
  bookEnd: { width: 24, alignItems: 'center' },
  detail: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 48,
  },
  detailTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailLabel: { fontFamily: FONT.ui, fontSize: 11, letterSpacing: 1.2 },
  detailHero: { flexDirection: 'row', gap: 20, alignItems: 'flex-start', marginTop: 22 },
  detailCover: { width: 126, height: 189 },
  detailInfo: { flex: 1, minWidth: 0 },
  detailTags: { fontFamily: FONT.ui, fontSize: 11, marginBottom: 8 },
  detailTitle: { fontFamily: FONT.modernLight, fontSize: 26, lineHeight: 35 },
  detailMeta: { fontFamily: FONT.ui, fontSize: 11.5, marginTop: 5 },
  detailProgress: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  detailCta: { alignSelf: 'flex-start', minHeight: 44, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, marginTop: 16 },
  detailCtaText: { fontFamily: FONT.ui, fontSize: 12.5 },
  synopsis: { fontFamily: FONT.ui, fontSize: 13.5, lineHeight: 23, marginTop: 10 },
  chapterHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 4 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 50, borderTopWidth: StyleSheet.hairlineWidth },
  chapterNo: { fontFamily: FONT.ui, fontSize: 11.5, width: 24, textAlign: 'center' },
  chapterTitle: { flex: 1, fontFamily: FONT.ui, fontSize: 13, lineHeight: 19 },
  readerTop: { paddingBottom: 2 },
  readerTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  readerTopTitle: { flex: 1, minWidth: 0, paddingHorizontal: 8 },
  readerTopName: { fontFamily: FONT.uiSemi, fontSize: 11.5 },
  readerTopMeta: { fontFamily: FONT.ui, fontSize: 10, marginTop: 1 },
  readerBody: { width: '100%', maxWidth: 580, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 34, paddingBottom: 42 },
  readerKicker: { fontFamily: FONT.ui, fontSize: 10.5, letterSpacing: 1.8, textAlign: 'center' },
  readerTitle: { fontFamily: FONT.modernLight, fontSize: 27, lineHeight: 37, textAlign: 'center', marginTop: 8 },
  readerRule: { height: 1, width: 40, alignSelf: 'center', marginTop: 20, marginBottom: 28 },
  paragraph: { fontFamily: FONT.ui, fontSize: 17, lineHeight: 33, marginBottom: 16 },
  dialogue: { marginVertical: 6, marginBottom: 22 },
  speaker: { fontFamily: FONT.uiSemi, fontSize: 11.5, marginBottom: 5 },
  dialogueText: { fontFamily: FONT.ui, fontSize: 17, lineHeight: 33 },
  sceneBreak: { alignItems: 'center', paddingVertical: 24 },
  sceneDot: { width: 4, height: 4, borderRadius: 2 },
  readerDock: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 12, minHeight: 58 },
  dockItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 },
  dockText: { fontFamily: FONT.ui, fontSize: 11 },
  themes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
