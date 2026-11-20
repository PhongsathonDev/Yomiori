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
  Settings2,
  Sun,
  Type,
} from 'lucide-react-native';
import {
  PREVIEW_BOOKS,
  PREVIEW_CHAPTERS,
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

function CalmShelf({ palette, onOpenBook, onOpenReader }: ConceptProps) {
  const { widthPercent } = usePreviewGrid();
  const continueBook = PREVIEW_BOOKS[0];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={calmStyles.shelf}
      showsVerticalScrollIndicator={false}
    >
      <View style={calmStyles.topBar}>
        <View style={calmStyles.brand}>
          <View style={[calmStyles.brandDot, { backgroundColor: palette.accent }]} />
          <Text style={[calmStyles.wordmark, { color: palette.text }]}>Yomiori</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ค้นหา"
          style={({ pressed }) => [calmStyles.iconButton, pressed && { opacity: 0.55 }]}
        >
          <Search size={20} color={palette.muted} strokeWidth={1.7} />
        </Pressable>
      </View>

      <View style={calmStyles.titleBlock}>
        <Text style={[calmStyles.pageTitle, { color: palette.text }]}>คืนนี้จะอ่านอะไรดี</Text>
        <Text style={[calmStyles.pageSub, { color: palette.muted }]}>
          มี {PREVIEW_BOOKS.length} เรื่องรออยู่บนชั้น
        </Text>
      </View>

      <View
        style={[
          calmStyles.continueCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.isDark ? palette.border : 'transparent',
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`อ่านต่อ ${continueBook.title}`}
          onPress={() => onOpenReader(continueBook)}
          style={({ pressed }) => [calmStyles.continueRow, pressed && { opacity: 0.75 }]}
        >
          <PreviewCover book={continueBook} style={calmStyles.continueCover} radius={12} />
          <View style={calmStyles.continueInfo}>
            <Text numberOfLines={2} style={[calmStyles.continueTitle, { color: palette.text }]}>
              {continueBook.title}
            </Text>
            <Text style={[calmStyles.continueMeta, { color: palette.muted }]}>
              {continueBook.currentChapterTitle || bookMeta(continueBook)}
            </Text>
            <View style={calmStyles.continueProgress}>
              <ProgressLine
                value={continueBook.progress}
                color={palette.accent}
                track={palette.surfaceAlt}
                height={4}
              />
            </View>
            <View style={calmStyles.continueBottom}>
              <Text style={[calmStyles.continuePercent, { color: palette.muted }]}>
                {Math.round(continueBook.progress * 100)}%
              </Text>
              <View style={[calmStyles.continuePill, { backgroundColor: palette.accent }]}>
                <Play size={11} color={palette.accentInk} fill={palette.accentInk} />
                <Text style={[calmStyles.continuePillText, { color: palette.accentInk }]}>อ่านต่อ</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="ค้นหาในชั้นหนังสือ"
        style={({ pressed }) => [
          calmStyles.searchPill,
          { backgroundColor: palette.surface },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Search size={18} color={palette.muted} strokeWidth={1.7} />
        <Text style={[calmStyles.searchText, { color: palette.muted }]}>ค้นหาเรื่องที่อยากอ่าน</Text>
      </Pressable>

      <View style={calmStyles.sectionRow}>
        <Text style={[calmStyles.sectionTitle, { color: palette.text }]}>ชั้นหนังสือ</Text>
        <Text style={[calmStyles.sectionAction, { color: palette.muted }]}>ดูทั้งหมด</Text>
      </View>

      <View style={calmStyles.grid}>
        {PREVIEW_BOOKS.map(book => (
          <Pressable
            key={book.id}
            accessibilityRole="button"
            accessibilityLabel={`รายละเอียด ${book.title}`}
            onPress={() => onOpenBook(book)}
            style={({ pressed }) => [
              calmStyles.card,
              {
                width: widthPercent,
                backgroundColor: palette.surface,
                borderColor: palette.isDark ? palette.border : 'transparent',
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            <PreviewCover book={book} style={calmStyles.cardCover} radius={11} />
            <View style={calmStyles.cardBody}>
              <Text numberOfLines={2} style={[calmStyles.cardTitle, { color: palette.text }]}>
                {book.title}
              </Text>
              <Text style={[calmStyles.cardMeta, { color: palette.muted }]}>{bookMeta(book)}</Text>
              {book.status === 'done' ? (
                <View style={calmStyles.doneRow}>
                  <Check size={11} color={palette.accent} strokeWidth={2} />
                  <Text style={[calmStyles.doneText, { color: palette.accent }]}>อ่านจบแล้ว</Text>
                </View>
              ) : (
                <View style={calmStyles.cardProgress}>
                  <ProgressLine
                    value={book.progress}
                    color={palette.accent}
                    track={palette.surfaceAlt}
                    height={3}
                  />
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>

      <Text style={[calmStyles.footer, { color: palette.muted }]}>อ่านอย่างสบายใจ</Text>
    </ScrollView>
  );
}

function CalmDetail({ palette, book, onOpenReader, onBack }: ConceptProps) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={calmStyles.detail}
      showsVerticalScrollIndicator={false}
    >
      <View style={calmStyles.detailTop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="กลับ"
          onPress={onBack}
          style={({ pressed }) => [
            calmStyles.roundButton,
            { backgroundColor: palette.surface },
            pressed && { opacity: 0.65 },
          ]}
        >
          <ArrowLeft size={19} color={palette.text} strokeWidth={1.7} />
        </Pressable>
        <Text style={[calmStyles.detailLabel, { color: palette.muted }]}>รายละเอียด</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ตั้งค่า"
          style={({ pressed }) => [
            calmStyles.roundButton,
            { backgroundColor: palette.surface },
            pressed && { opacity: 0.65 },
          ]}
        >
          <Settings2 size={18} color={palette.text} strokeWidth={1.7} />
        </Pressable>
      </View>

      <View style={calmStyles.detailHero}>
        <View style={calmStyles.detailCoverShadow}>
          <PreviewCover book={book} style={calmStyles.detailCover} radius={16} />
        </View>
        <View style={calmStyles.detailTags}>
          {book.tags.slice(0, 2).map(tag => (
            <View key={tag} style={[calmStyles.detailTag, { backgroundColor: palette.accentSoft }]}>
              <Text style={[calmStyles.detailTagText, { color: palette.accent }]}>{tag}</Text>
            </View>
          ))}
        </View>
        <Text style={[calmStyles.detailTitle, { color: palette.text }]}>{book.title}</Text>
        <Text style={[calmStyles.detailMeta, { color: palette.muted }]}>
          {book.author} · {book.totalChapters} ตอน
        </Text>
        <View style={calmStyles.detailProgress}>
          <ProgressLine
            value={book.progress}
            color={palette.accent}
            track={palette.surfaceAlt}
            height={4}
          />
          <Text style={[calmStyles.detailPercent, { color: palette.muted }]}>
            {Math.round(book.progress * 100)}%
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={chapterNumber(book)}
          onPress={() => onOpenReader(book)}
          style={({ pressed }) => [
            calmStyles.detailCta,
            { backgroundColor: palette.accent },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Play size={14} color={palette.accentInk} fill={palette.accentInk} />
          <Text style={[calmStyles.detailCtaText, { color: palette.accentInk }]}>
            {chapterNumber(book)}
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          calmStyles.synopsisCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.isDark ? palette.border : 'transparent',
          },
        ]}
      >
        <Text style={[calmStyles.sectionTitle, { color: palette.text }]}>เรื่องย่อ</Text>
        <Text style={[calmStyles.synopsis, { color: palette.text }]}>{book.synopsis}</Text>
      </View>

      <View style={calmStyles.chapterHeadingRow}>
        <Text style={[calmStyles.sectionTitle, { color: palette.text }]}>สารบัญ</Text>
        <Text style={[calmStyles.sectionAction, { color: palette.muted }]}>
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
              calmStyles.chapterRow,
              {
                backgroundColor: current ? palette.accentSoft : palette.surface,
                borderColor: palette.isDark ? palette.border : 'transparent',
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[calmStyles.chapterNo, { color: current ? palette.accent : palette.muted }]}>
              {chapter.number === 0 ? '序' : chapter.number}
            </Text>
            <Text
              numberOfLines={1}
              style={[calmStyles.chapterTitle, { color: current ? palette.accent : palette.text }]}
            >
              {chapter.title}
            </Text>
            {read ? (
              <Check size={14} color={palette.accent} strokeWidth={1.9} />
            ) : (
              <ChevronRight size={14} color={palette.muted} strokeWidth={1.6} />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function CalmReader({ palette, book, onBack }: ConceptProps) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={calmStyles.readerTop}>
        <ProgressLine
          value={READER_SAMPLE.progress / 100}
          color={palette.accent}
          track={palette.surfaceAlt}
          height={2}
        />
        <View style={calmStyles.readerTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="กลับ"
            onPress={onBack}
            style={({ pressed }) => [calmStyles.iconButton, pressed && { opacity: 0.55 }]}
          >
            <ArrowLeft size={19} color={palette.text} strokeWidth={1.7} />
          </Pressable>
          <View style={calmStyles.readerTopTitle}>
            <Text numberOfLines={1} style={[calmStyles.readerTopName, { color: palette.text }]}>
              {book.title}
            </Text>
            <Text style={[calmStyles.readerTopMeta, { color: palette.muted }]}>
              ตอนที่ {READER_SAMPLE.chapterNumber} · {READER_SAMPLE.progress}%
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="สารบัญ"
            style={({ pressed }) => [calmStyles.iconButton, pressed && { opacity: 0.55 }]}
          >
            <List size={19} color={palette.text} strokeWidth={1.7} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={calmStyles.readerBody}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[calmStyles.readerKicker, { color: palette.accent }]}>
          ตอนที่ {READER_SAMPLE.chapterNumber}
        </Text>
        <Text style={[calmStyles.readerTitle, { color: palette.text }]}>
          {READER_SAMPLE.chapterTitle}
        </Text>

        {READER_SAMPLE.paragraphs.map((paragraph, index) => (
          <Text key={`p-${index}`} style={[calmStyles.paragraph, { color: palette.text }]}>
            {paragraph}
          </Text>
        ))}

        <View style={[calmStyles.dialogueCard, { backgroundColor: palette.accentSoft }]}>
          <View style={calmStyles.dialogueSpeakerRow}>
            <View style={[calmStyles.dialogueDot, { backgroundColor: palette.accent }]} />
            <Text style={[calmStyles.dialogueSpeaker, { color: palette.accent }]}>
              {READER_SAMPLE.dialogue.speaker}
            </Text>
            <Text style={[calmStyles.dialogueRole, { color: palette.muted }]}>
              {READER_SAMPLE.dialogue.role}
            </Text>
          </View>
          <Text style={[calmStyles.dialogueText, { color: palette.text }]}>
            {READER_SAMPLE.dialogue.text}
          </Text>
        </View>

        {READER_SAMPLE.after.map((paragraph, index) => (
          <Text key={`after-${index}`} style={[calmStyles.paragraph, { color: palette.text }]}>
            {paragraph}
          </Text>
        ))}

        <View style={calmStyles.sceneBreak}>
          <View style={[calmStyles.sceneDot, { backgroundColor: palette.accent }]} />
        </View>

        <Text style={[calmStyles.paragraph, { color: palette.text }]}>
          และแล้วเช้าวันธรรมดาก็ไม่ธรรมดาอีกต่อไป
        </Text>
      </ScrollView>

      <View style={calmStyles.dockWrap}>
        <View
          style={[
            calmStyles.dock,
            {
              backgroundColor: palette.surface,
              borderColor: palette.isDark ? palette.border : 'transparent',
            },
          ]}
        >
          <View style={calmStyles.dockItem}>
            <Type size={15} color={palette.muted} strokeWidth={1.7} />
            <Text style={[calmStyles.dockText, { color: palette.muted }]}>17 / 33</Text>
          </View>
          <View style={calmStyles.themes}>
            <View
              style={[
                calmStyles.themeDot,
                {
                  borderColor: palette.isDark ? 'transparent' : palette.accent,
                  backgroundColor: palette.surfaceAlt,
                },
              ]}
            >
              <Sun size={11} color={palette.muted} strokeWidth={1.6} />
            </View>
            <View style={[calmStyles.themeDot, { borderColor: 'transparent', backgroundColor: palette.surfaceAlt }]}>
              <Coffee size={11} color={palette.muted} strokeWidth={1.6} />
            </View>
            <View
              style={[
                calmStyles.themeDot,
                {
                  borderColor: palette.isDark ? palette.accent : 'transparent',
                  backgroundColor: palette.text,
                },
              ]}
            >
              <Moon size={11} color={palette.bg} strokeWidth={1.6} />
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="สารบัญ"
            style={({ pressed }) => [calmStyles.dockItem, pressed && { opacity: 0.55 }]}
          >
            <List size={15} color={palette.muted} strokeWidth={1.7} />
            <Text style={[calmStyles.dockText, { color: palette.muted }]}>สารบัญ</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function CalmConcept(props: ConceptProps) {
  if (props.screen === 'detail') return <CalmDetail {...props} />;
  if (props.screen === 'reader') return <CalmReader {...props} />;
  return <CalmShelf {...props} />;
}

const calmStyles = StyleSheet.create({
  shelf: {
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 44,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandDot: { width: 7, height: 7, borderRadius: 4 },
  wordmark: { fontFamily: FONT.modern, fontSize: 20, lineHeight: 26, letterSpacing: 0.4 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { marginTop: 22, marginBottom: 18 },
  pageTitle: { fontFamily: FONT.modernLight, fontSize: 28, lineHeight: 38, letterSpacing: -0.3 },
  pageSub: { fontFamily: FONT.ui, fontSize: 12, marginTop: 4 },
  continueCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#6E756D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  continueRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  continueCover: { width: 82, height: 123 },
  continueInfo: { flex: 1, minWidth: 0 },
  continueTitle: { fontFamily: FONT.modern, fontSize: 18, lineHeight: 25 },
  continueMeta: { fontFamily: FONT.ui, fontSize: 10.5, marginTop: 3 },
  continueProgress: { marginTop: 12 },
  continueBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  continuePercent: { fontFamily: FONT.ui, fontSize: 10 },
  continuePill: { minHeight: 32, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12 },
  continuePillText: { fontFamily: FONT.uiSemi, fontSize: 10.5 },
  searchPill: { minHeight: 46, borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16, marginTop: 18 },
  searchText: { fontFamily: FONT.ui, fontSize: 12.5 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 26, marginBottom: 14 },
  sectionTitle: { fontFamily: FONT.modernLight, fontSize: 22, lineHeight: 29 },
  sectionAction: { fontFamily: FONT.ui, fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 8,
    shadowColor: '#6E756D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  cardCover: { width: '100%', aspectRatio: 2 / 3 },
  cardBody: { paddingHorizontal: 3, paddingTop: 8, paddingBottom: 3 },
  cardTitle: { fontFamily: FONT.modern, fontSize: 13, lineHeight: 18 },
  cardMeta: { fontFamily: FONT.ui, fontSize: 10, marginTop: 2 },
  cardProgress: { marginTop: 8 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  doneText: { fontFamily: FONT.ui, fontSize: 9.5 },
  footer: { fontFamily: FONT.ui, fontSize: 10.5, textAlign: 'center', letterSpacing: 0.6, marginTop: 30 },
  detail: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 46,
  },
  detailTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontFamily: FONT.ui, fontSize: 11, letterSpacing: 0.6 },
  detailHero: { alignItems: 'center', marginTop: 18, maxWidth: 560, alignSelf: 'center', width: '100%' },
  detailCoverShadow: { borderRadius: 16, shadowColor: '#6E756D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 3 },
  detailCover: { width: 132, height: 198 },
  detailTags: { flexDirection: 'row', gap: 6, marginTop: 18 },
  detailTag: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
  detailTagText: { fontFamily: FONT.ui, fontSize: 10 },
  detailTitle: { fontFamily: FONT.modernLight, fontSize: 26, lineHeight: 35, textAlign: 'center', marginTop: 10 },
  detailMeta: { fontFamily: FONT.ui, fontSize: 11.5, marginTop: 4, textAlign: 'center' },
  detailProgress: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginTop: 18 },
  detailPercent: { fontFamily: FONT.ui, fontSize: 10, minWidth: 30, textAlign: 'right' },
  detailCta: { minHeight: 46, borderRadius: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, alignSelf: 'stretch', marginTop: 16, paddingHorizontal: 18 },
  detailCtaText: { fontFamily: FONT.uiSemi, fontSize: 12.5 },
  synopsisCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginTop: 24, shadowColor: '#6E756D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  synopsis: { fontFamily: FONT.ui, fontSize: 13, lineHeight: 22, marginTop: 6 },
  chapterHeadingRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 26, marginBottom: 10 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, marginBottom: 7 },
  chapterNo: { fontFamily: FONT.ui, fontSize: 11, width: 22, textAlign: 'center' },
  chapterTitle: { flex: 1, fontFamily: FONT.ui, fontSize: 12.5 },
  readerTop: { paddingBottom: 2 },
  readerTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  readerTopTitle: { flex: 1, minWidth: 0, paddingHorizontal: 8 },
  readerTopName: { fontFamily: FONT.uiSemi, fontSize: 11.5 },
  readerTopMeta: { fontFamily: FONT.ui, fontSize: 10, marginTop: 1 },
  readerBody: { width: '100%', maxWidth: 580, alignSelf: 'center', paddingHorizontal: 26, paddingTop: 30, paddingBottom: 36 },
  readerKicker: { fontFamily: FONT.ui, fontSize: 10.5, letterSpacing: 1.4, textAlign: 'center' },
  readerTitle: { fontFamily: FONT.modernLight, fontSize: 27, lineHeight: 37, textAlign: 'center', marginTop: 8, marginBottom: 26 },
  paragraph: { fontFamily: FONT.ui, fontSize: 17, lineHeight: 33, marginBottom: 16 },
  dialogueCard: { borderRadius: 18, padding: 15, marginVertical: 7, marginBottom: 22 },
  dialogueSpeakerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  dialogueDot: { width: 5, height: 5, borderRadius: 3 },
  dialogueSpeaker: { fontFamily: FONT.uiSemi, fontSize: 11.5 },
  dialogueRole: { fontFamily: FONT.ui, fontSize: 9.5 },
  dialogueText: { fontFamily: FONT.ui, fontSize: 17, lineHeight: 33 },
  sceneBreak: { alignItems: 'center', paddingVertical: 22 },
  sceneDot: { width: 5, height: 5, borderRadius: 3 },
  dockWrap: { paddingHorizontal: 14, paddingBottom: 12 },
  dock: { minHeight: 58, borderRadius: 29, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, shadowColor: '#6E756D', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 4 },
  dockItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 42 },
  dockText: { fontFamily: FONT.ui, fontSize: 10.5 },
  themes: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  themeDot: { width: 27, height: 27, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
