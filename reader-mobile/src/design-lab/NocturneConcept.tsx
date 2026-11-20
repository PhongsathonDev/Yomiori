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
  Download,
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
  FRESH_BOOKS,
  READER_SAMPLE,
  type PreviewBook,
} from './data';
import {
  ConceptProps,
  CoverScrim,
  PreviewCover,
  ProgressLine,
  bookMeta,
  chapterNumber,
  usePreviewGrid,
} from './shared';
import { FONT, type LabPalette } from './tokens';

function Poster({
  book,
  palette,
  onPress,
  style,
  horizontal = false,
}: {
  book: PreviewBook;
  palette: LabPalette;
  onPress: () => void;
  style?: object;
  horizontal?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`รายละเอียด ${book.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        nocturneStyles.poster,
        horizontal && nocturneStyles.posterHorizontal,
        { borderColor: palette.border },
        style,
        pressed && { opacity: 0.78 },
      ]}
    >
      <PreviewCover book={book} style={StyleSheet.absoluteFill} radius={0} />
      <CoverScrim from={0.08} to={0.96} />
      {book.status === 'new' ? (
        <View style={[nocturneStyles.newBadge, { backgroundColor: palette.gold }]}>
          <Text style={[nocturneStyles.newBadgeText, { color: palette.accentInk }]}>ใหม่</Text>
        </View>
      ) : null}
      {book.status === 'done' ? (
        <View style={[nocturneStyles.doneBadge, { borderColor: palette.gold }]}>
          <Check size={13} color={palette.gold} />
        </View>
      ) : null}
      <View style={nocturneStyles.posterInfo}>
        <Text numberOfLines={2} style={nocturneStyles.posterTitle}>
          {book.title}
        </Text>
        <Text style={nocturneStyles.posterMeta}>{bookMeta(book)}</Text>
        {book.status === 'reading' ? (
          <View style={nocturneStyles.posterProgress}>
            <ProgressLine
              value={book.progress}
              color={palette.gold}
              track="rgba(255,255,255,0.25)"
              height={2}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function NocturneShelf({ palette, onOpenBook, onOpenReader }: ConceptProps) {
  const { widthPercent } = usePreviewGrid();
  const { width } = useWindowDimensions();
  const compact = width < 560;
  const heroCoverWidth = compact ? 104 : 146;
  const heroCoverHeight = Math.round(heroCoverWidth * 1.5);
  const continueBook = PREVIEW_BOOKS[0];
  const fresh = FRESH_BOOKS;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={nocturneStyles.shelfContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={nocturneStyles.topBar}>
        <View>
          <Text style={[nocturneStyles.wordmark, { color: palette.text }]}>Yomiori</Text>
          <Text style={[nocturneStyles.wordmarkSub, { color: palette.muted }]}>読織</Text>
        </View>
        <View style={nocturneStyles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ค้นหา"
            style={({ pressed }) => [nocturneStyles.iconButton, pressed && { opacity: 0.6 }]}
          >
            <Search size={20} color={palette.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ตั้งค่า"
            style={({ pressed }) => [nocturneStyles.iconButton, pressed && { opacity: 0.6 }]}
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
          nocturneStyles.hero,
          { borderColor: palette.border, backgroundColor: palette.surface },
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={StyleSheet.absoluteFill}>
          <PreviewCover book={continueBook} style={StyleSheet.absoluteFill} radius={0} />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: palette.bg, opacity: palette.isDark ? 0.86 : 0.88 },
            ]}
          />
        </View>
        <View style={nocturneStyles.heroBody}>
          <View
            style={[
              nocturneStyles.heroCoverFrame,
              { borderColor: palette.gold, backgroundColor: palette.surface },
            ]}
          >
            <PreviewCover
              book={continueBook}
              style={{ width: heroCoverWidth, height: heroCoverHeight }}
              radius={8}
            />
          </View>
          <View style={nocturneStyles.heroText}>
            <View style={nocturneStyles.heroKickerRow}>
              <View style={[nocturneStyles.heroKickerLine, { backgroundColor: palette.gold }]} />
              <Text style={[nocturneStyles.heroKicker, { color: palette.accent }]}>อ่านต่อ</Text>
            </View>
            <Text
              numberOfLines={2}
              style={[
                nocturneStyles.heroTitle,
                { color: palette.text, fontSize: compact ? 22 : 27, lineHeight: compact ? 31 : 37 },
              ]}
            >
              {continueBook.title}
            </Text>
            <Text style={[nocturneStyles.heroMeta, { color: palette.muted }]}>
              {continueBook.currentChapterTitle} · ตอนที่ {continueBook.currentChapter}
            </Text>
            <View style={nocturneStyles.heroBottom}>
              <View style={nocturneStyles.heroProgress}>
                <ProgressLine
                  value={continueBook.progress}
                  color={palette.gold}
                  track={palette.line}
                  height={2}
                />
                <Text style={[nocturneStyles.heroPercent, { color: palette.muted }]}>
                  {Math.round(continueBook.progress * 100)}%
                </Text>
              </View>
              <View style={[nocturneStyles.heroPlay, { backgroundColor: palette.gold }]}>
                <Play size={17} color={palette.accentInk} fill={palette.accentInk} />
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      <View style={nocturneStyles.sectionRow}>
        <Text style={[nocturneStyles.sectionTitle, { color: palette.text }]}>คืนนี้มีตอนใหม่</Text>
        <Text style={[nocturneStyles.sectionAction, { color: palette.muted }]}>ดูทั้งหมด</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={nocturneStyles.freshRow}
      >
        {fresh.map(book => (
          <Poster
            key={book.id}
            book={book}
            palette={palette}
            horizontal
            onPress={() => onOpenBook(book)}
          />
        ))}
      </ScrollView>

      <View style={[nocturneStyles.sectionRow, { marginTop: 28 }]}>
        <Text style={[nocturneStyles.sectionTitle, { color: palette.text }]}>ชั้นหนังสือ</Text>
        <Text style={[nocturneStyles.sectionAction, { color: palette.muted }]}>
          {PREVIEW_BOOKS.length} เรื่อง
        </Text>
      </View>

      <View style={nocturneStyles.grid}>
        {PREVIEW_BOOKS.map(book => (
          <Poster
            key={book.id}
            book={book}
            palette={palette}
            onPress={() => onOpenBook(book)}
            style={{ width: widthPercent }}
          />
        ))}
      </View>

      <View style={[nocturneStyles.footerRule, { backgroundColor: palette.line }]} />
      <Text style={[nocturneStyles.footerText, { color: palette.muted }]}>
        อ่านในที่แสงน้อย
      </Text>
    </ScrollView>
  );
}

function NocturneDetail({ palette, book, onOpenReader, onBack }: ConceptProps) {
  const { width } = useWindowDimensions();
  const compact = width < 560;
  const coverWidth = compact ? 112 : 148;
  const coverHeight = Math.round(coverWidth * 1.5);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={nocturneStyles.detailContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[nocturneStyles.detailHero, { borderColor: palette.border }]}>
        <View style={StyleSheet.absoluteFill}>
          <PreviewCover book={book} style={StyleSheet.absoluteFill} radius={0} />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: palette.bg, opacity: palette.isDark ? 0.87 : 0.9 },
            ]}
          />
        </View>
        <View style={nocturneStyles.detailTopBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="กลับ"
            onPress={onBack}
            style={({ pressed }) => [
              nocturneStyles.detailBack,
              { backgroundColor: palette.surface, borderColor: palette.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <ArrowLeft size={21} color={palette.text} />
          </Pressable>
          <View
            style={[
              nocturneStyles.detailTopPill,
              { borderColor: palette.border, backgroundColor: palette.surface },
            ]}
          >
            <Text style={[nocturneStyles.detailTopPillText, { color: palette.muted }]}>
              รายละเอียด
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ตั้งค่า"
            style={({ pressed }) => [
              nocturneStyles.detailBack,
              { backgroundColor: palette.surface, borderColor: palette.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Settings2 size={20} color={palette.text} />
          </Pressable>
        </View>

        <View style={nocturneStyles.detailHeroBody}>
          <View
            style={[
              nocturneStyles.detailCoverFrame,
              { borderColor: palette.gold, backgroundColor: palette.surface },
            ]}
          >
            <PreviewCover
              book={book}
              style={{ width: coverWidth, height: coverHeight }}
              radius={9}
            />
          </View>
          <View style={nocturneStyles.detailHeroText}>
            <View style={nocturneStyles.detailTags}>
              {book.tags.slice(0, 2).map(tag => (
                <Text key={tag} style={[nocturneStyles.detailTag, { color: palette.accent }]}>
                  {tag}
                </Text>
              ))}
            </View>
            <Text
              style={[
                nocturneStyles.detailTitle,
                {
                  color: palette.text,
                  fontSize: compact ? 22 : 28,
                  lineHeight: compact ? 31 : 38,
                },
              ]}
            >
              {book.title}
            </Text>
            <Text style={[nocturneStyles.detailMeta, { color: palette.muted }]}>
              {book.author} · {book.totalChapters} ตอน
            </Text>
          </View>
        </View>
      </View>

      <View style={nocturneStyles.detailBody}>
        <View style={nocturneStyles.detailProgressRow}>
          <View style={nocturneStyles.detailProgressBar}>
            <ProgressLine
              value={book.progress}
              color={palette.gold}
              track={palette.line}
              height={3}
            />
          </View>
          <Text style={[nocturneStyles.detailPercent, { color: palette.muted }]}>
            อ่านแล้ว {Math.round(book.progress * 100)}%
          </Text>
        </View>

        <View style={nocturneStyles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={chapterNumber(book)}
            onPress={() => onOpenReader(book)}
            style={({ pressed }) => [
              nocturneStyles.primaryButton,
              { backgroundColor: palette.gold },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Play size={16} color={palette.accentInk} fill={palette.accentInk} />
            <Text style={[nocturneStyles.primaryButtonText, { color: palette.accentInk }]}>
              {chapterNumber(book)}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ดาวน์โหลดตอน"
            style={({ pressed }) => [
              nocturneStyles.secondaryButton,
              { borderColor: palette.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Download size={18} color={palette.text} />
          </Pressable>
        </View>

        <Text style={[nocturneStyles.detailSection, { color: palette.text }]}>เรื่องย่อ</Text>
        <Text style={[nocturneStyles.synopsis, { color: palette.muted }]}>
          {book.synopsis}
        </Text>

        <View style={[nocturneStyles.detailRule, { backgroundColor: palette.line }]} />

        <View style={nocturneStyles.chapterHeadingRow}>
          <Text style={[nocturneStyles.detailSection, { color: palette.text, marginTop: 0 }]}>
            สารบัญ
          </Text>
          <Text style={[nocturneStyles.chapterCount, { color: palette.muted }]}>
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
                nocturneStyles.chapterRow,
                { borderBottomColor: palette.line },
                pressed && { opacity: 0.65 },
              ]}
            >
              <Text
                style={[
                  nocturneStyles.chapterNo,
                  { color: current ? palette.gold : palette.muted },
                ]}
              >
                {chapter.number === 0 ? '序' : chapter.number}
              </Text>
              <View style={nocturneStyles.chapterTitleWrap}>
                <Text
                  numberOfLines={1}
                  style={[
                    nocturneStyles.chapterTitle,
                    { color: current ? palette.gold : palette.text },
                  ]}
                >
                  {chapter.title}
                </Text>
                {current ? (
                  <Text style={[nocturneStyles.chapterCurrent, { color: palette.muted }]}>
                    กำลังอ่าน
                  </Text>
                ) : null}
              </View>
              {read ? (
                <Check size={15} color={current ? palette.gold : palette.muted} />
              ) : (
                <ChevronRight size={15} color={palette.muted} />
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function NocturneReader({ palette, book, onBack }: ConceptProps) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={[nocturneStyles.readerTop, { borderBottomColor: palette.line }]}>
        <View style={nocturneStyles.readerTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="กลับ"
            onPress={onBack}
            style={({ pressed }) => [nocturneStyles.iconButton, pressed && { opacity: 0.6 }]}
          >
            <ArrowLeft size={21} color={palette.text} />
          </Pressable>
          <View style={nocturneStyles.readerTopTitle}>
            <Text numberOfLines={1} style={[nocturneStyles.readerTopName, { color: palette.text }]}>
              {book.title}
            </Text>
            <Text style={[nocturneStyles.readerTopMeta, { color: palette.muted }]}>
              ตอนที่ {READER_SAMPLE.chapterNumber} · {READER_SAMPLE.progress}%
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="สารบัญ"
            style={({ pressed }) => [nocturneStyles.iconButton, pressed && { opacity: 0.6 }]}
          >
            <List size={20} color={palette.gold} />
          </Pressable>
        </View>
        <View style={nocturneStyles.readerProgress}>
          <ProgressLine
            value={READER_SAMPLE.progress / 100}
            color={palette.gold}
            track={palette.line}
            height={2}
            radius={0}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={nocturneStyles.readerContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[nocturneStyles.readerKicker, { color: palette.gold }]}>
          ตอนที่ {READER_SAMPLE.chapterNumber}
        </Text>
        <Text style={[nocturneStyles.readerChapterTitle, { color: palette.text }]}>
          {READER_SAMPLE.chapterTitle}
        </Text>
        <View style={[nocturneStyles.readerRule, { backgroundColor: palette.line }]} />

        {READER_SAMPLE.paragraphs.map((paragraph, index) => (
          <Text key={`p-${index}`} style={[nocturneStyles.readerBody, { color: palette.text }]}>
            {paragraph}
          </Text>
        ))}

        <View
          style={[
            nocturneStyles.dialogueCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <View style={nocturneStyles.dialogueSpeakerRow}>
            <View style={[nocturneStyles.dialogueDot, { backgroundColor: palette.gold }]} />
            <Text style={[nocturneStyles.dialogueSpeaker, { color: palette.gold }]}>
              {READER_SAMPLE.dialogue.speaker}
            </Text>
            <Text style={[nocturneStyles.dialogueRole, { color: palette.muted }]}>
              {READER_SAMPLE.dialogue.role}
            </Text>
          </View>
          <Text style={[nocturneStyles.readerDialogue, { color: palette.text }]}>
            {READER_SAMPLE.dialogue.text}
          </Text>
        </View>

        {READER_SAMPLE.after.map((paragraph, index) => (
          <Text key={`after-${index}`} style={[nocturneStyles.readerBody, { color: palette.text }]}>
            {paragraph}
          </Text>
        ))}

        <View style={nocturneStyles.sceneBreak}>
          <View style={[nocturneStyles.sceneLine, { backgroundColor: palette.line }]} />
          <View style={[nocturneStyles.sceneDiamond, { borderColor: palette.gold }]} />
          <View style={[nocturneStyles.sceneLine, { backgroundColor: palette.line }]} />
        </View>

        <Text style={[nocturneStyles.readerBody, { color: palette.text }]}>
          และนั่นคือจุดเริ่มต้นของวันธรรมดา ที่ไม่ธรรมดาอีกต่อไป
        </Text>
      </ScrollView>

      <View style={[nocturneStyles.readerDock, { backgroundColor: palette.surface, borderTopColor: palette.line }]}>
        <View style={nocturneStyles.dockItem}>
          <Type size={17} color={palette.gold} />
          <Text style={[nocturneStyles.dockText, { color: palette.text }]}>Prompt 18</Text>
        </View>
        <View style={nocturneStyles.dockThemes}>
          <View style={[nocturneStyles.themeDot, { borderColor: palette.isDark ? 'transparent' : palette.gold, backgroundColor: palette.bg }]}>
            <Sun size={13} color={palette.muted} />
          </View>
          <View style={[nocturneStyles.themeDot, { borderColor: 'transparent', backgroundColor: palette.surfaceAlt }]}>
            <Coffee size={13} color={palette.muted} />
          </View>
          <View style={[nocturneStyles.themeDot, { borderColor: palette.isDark ? palette.gold : 'transparent', backgroundColor: palette.text }]}>
            <Moon size={13} color={palette.bg} />
          </View>
        </View>
        <View style={nocturneStyles.dockItem}>
          <List size={17} color={palette.gold} />
          <Text style={[nocturneStyles.dockText, { color: palette.text }]}>สารบัญ</Text>
        </View>
      </View>
    </View>
  );
}

export function NocturneConcept(props: ConceptProps) {
  if (props.screen === 'detail') return <NocturneDetail {...props} />;
  if (props.screen === 'reader') return <NocturneReader {...props} />;
  return <NocturneShelf {...props} />;
}

const nocturneStyles = StyleSheet.create({
  shelfContent: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { fontFamily: FONT.modernSemi, fontSize: 20, lineHeight: 26, letterSpacing: 1.8 },
  wordmarkSub: { fontFamily: FONT.modern, fontSize: 10.5, letterSpacing: 0.8, marginTop: 1 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  hero: { marginTop: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1, padding: 16 },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroCoverFrame: { borderWidth: 1, borderRadius: 12, padding: 3 },
  heroText: { flex: 1, minWidth: 0 },
  heroKickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  heroKickerLine: { width: 22, height: 1 },
  heroKicker: { fontFamily: FONT.modernSemi, fontSize: 11, letterSpacing: 1.2 },
  heroTitle: { fontFamily: FONT.serifSemi },
  heroMeta: { fontFamily: FONT.modern, fontSize: 11.5, marginTop: 5 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 },
  heroProgress: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroPercent: { fontFamily: FONT.modernSemi, fontSize: 10.5, minWidth: 30, textAlign: 'right' },
  heroPlay: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontFamily: FONT.serifSemi, fontSize: 23, lineHeight: 31 },
  sectionAction: { fontFamily: FONT.modern, fontSize: 11 },
  freshRow: { gap: 11, paddingRight: 6 },
  poster: { position: 'relative', borderRadius: 16, overflow: 'hidden', borderWidth: 1, aspectRatio: 2 / 3, backgroundColor: '#10141C' },
  posterHorizontal: { width: 146, aspectRatio: undefined, height: 212 },
  newBadge: { position: 'absolute', top: 9, left: 9, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  newBadgeText: { fontFamily: FONT.modernSemi, fontSize: 9.5 },
  doneBadge: { position: 'absolute', top: 9, right: 9, width: 25, height: 25, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  posterInfo: { position: 'absolute', left: 10, right: 10, bottom: 10 },
  posterTitle: { fontFamily: FONT.serifSemi, fontSize: 14, lineHeight: 20, color: '#F7F2E8' },
  posterMeta: { fontFamily: FONT.modern, fontSize: 9.5, color: 'rgba(247,242,232,0.68)', marginTop: 3 },
  posterProgress: { marginTop: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 11 },
  footerRule: { height: 1, width: 48, alignSelf: 'center', marginTop: 30, marginBottom: 12 },
  footerText: { fontFamily: FONT.modern, fontSize: 10, letterSpacing: 1.2, textAlign: 'center' },
  detailContent: { paddingBottom: 40 },
  detailHero: { position: 'relative', borderBottomLeftRadius: 26, borderBottomRightRadius: 26, overflow: 'hidden', borderBottomWidth: 1, paddingBottom: 20 },
  detailTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 18 },
  detailBack: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.32)' },
  detailTopPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.25)' },
  detailTopPillText: { fontFamily: FONT.modern, fontSize: 10.5, letterSpacing: 0.8 },
  detailHeroBody: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20 },
  detailCoverFrame: { borderWidth: 1, borderRadius: 12, padding: 3 },
  detailHeroText: { flex: 1, minWidth: 0 },
  detailTags: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 6 },
  detailTag: { fontFamily: FONT.modernSemi, fontSize: 10.5, letterSpacing: 0.5 },
  detailTitle: { fontFamily: FONT.serifBold },
  detailMeta: { fontFamily: FONT.modern, fontSize: 11.5, marginTop: 5 },
  detailBody: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 18 },
  detailProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailProgressBar: { flex: 1 },
  detailPercent: { fontFamily: FONT.modern, fontSize: 10.5, minWidth: 76, textAlign: 'right' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryButton: { flex: 1, minHeight: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  primaryButtonText: { fontFamily: FONT.modernSemi, fontSize: 13 },
  secondaryButton: { width: 48, minHeight: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  detailSection: { fontFamily: FONT.serifSemi, fontSize: 20, lineHeight: 28, marginTop: 26, marginBottom: 8 },
  synopsis: { fontFamily: FONT.modern, fontSize: 13.5, lineHeight: 23 },
  detailRule: { height: 1, marginTop: 24 },
  chapterHeadingRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 4 },
  chapterCount: { fontFamily: FONT.modern, fontSize: 10.5 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderBottomWidth: StyleSheet.hairlineWidth },
  chapterNo: { fontFamily: FONT.serifSemi, fontSize: 17, width: 26, textAlign: 'center' },
  chapterTitleWrap: { flex: 1, minWidth: 0 },
  chapterTitle: { fontFamily: FONT.modern, fontSize: 12.5 },
  chapterCurrent: { fontFamily: FONT.modern, fontSize: 9.5, marginTop: 2 },
  readerTop: { borderBottomWidth: StyleSheet.hairlineWidth },
  readerTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 52 },
  readerTopTitle: { flex: 1, minWidth: 0, paddingHorizontal: 6 },
  readerTopName: { fontFamily: FONT.modernSemi, fontSize: 12 },
  readerTopMeta: { fontFamily: FONT.modern, fontSize: 10, marginTop: 1 },
  readerProgress: { paddingHorizontal: 16, paddingBottom: 0 },
  readerContent: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },
  readerKicker: { fontFamily: FONT.modernSemi, fontSize: 10.5, letterSpacing: 1.8, textAlign: 'center', marginBottom: 8 },
  readerChapterTitle: { fontFamily: FONT.serifSemi, fontSize: 28, lineHeight: 38, textAlign: 'center' },
  readerRule: { height: 1, width: 44, alignSelf: 'center', marginTop: 18, marginBottom: 26 },
  readerBody: { fontFamily: FONT.modernLight, fontSize: 17.5, lineHeight: 34, marginBottom: 16 },
  dialogueCard: { borderWidth: 1, borderRadius: 14, padding: 15, marginVertical: 8, marginBottom: 22 },
  dialogueSpeakerRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  dialogueDot: { width: 5, height: 5, borderRadius: 3 },
  dialogueSpeaker: { fontFamily: FONT.modernSemi, fontSize: 11.5 },
  dialogueRole: { fontFamily: FONT.modern, fontSize: 9.5 },
  readerDialogue: { fontFamily: FONT.modern, fontSize: 17.5, lineHeight: 33 },
  sceneBreak: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  sceneLine: { flex: 1, height: 1 },
  sceneDiamond: { width: 7, height: 7, borderWidth: 1, transform: [{ rotate: '45deg' }] },
  readerDock: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10, minHeight: 62 },
  dockItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  dockText: { fontFamily: FONT.modern, fontSize: 11 },
  dockThemes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
