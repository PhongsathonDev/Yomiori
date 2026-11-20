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
  Download,
  List,
  Moon,
  Play,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Type,
} from 'lucide-react-native';
import {
  PREVIEW_BOOKS,
  PREVIEW_CHAPTERS,
  PREVIEW_TAGS,
  READER_SAMPLE,
} from './data';
import {
  ConceptProps,
  HardShadow,
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

type ZineTab = (typeof TABS)[number]['id'];

function Tape({ left = 22, rotate = '-5deg' }: { left?: number; rotate?: string }) {
  return <View style={[zineStyles.tape, { left, transform: [{ rotate }] }]} />;
}

function Sticker({
  children,
  background,
  color,
  borderColor = '#111',
  rotate = '0deg',
}: {
  children: React.ReactNode;
  background: string;
  color: string;
  borderColor?: string;
  rotate?: string;
}) {
  return (
    <View style={[zineStyles.sticker, { backgroundColor: background, borderColor, transform: [{ rotate }] }]}>
      <Text style={[zineStyles.stickerText, { color }]}>{children}</Text>
    </View>
  );
}

function ZineShelf({ palette, onOpenBook, onOpenReader }: ConceptProps) {
  const [tab, setTab] = useState<ZineTab>('reading');
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
      contentContainerStyle={zineStyles.shelfContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={zineStyles.masthead}>
        <View style={zineStyles.mastheadBrand}>
          <View style={[zineStyles.brandBlock, { backgroundColor: palette.gold, borderColor: palette.border }]}>
            <Sparkles size={17} color={palette.text} strokeWidth={2.4} />
          </View>
          <Text style={[zineStyles.wordmark, { color: palette.text }]}>YOMIORI</Text>
        </View>
        <View style={zineStyles.mastheadActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ค้นหา"
            style={({ pressed }) => [zineStyles.iconButton, pressed && { opacity: 0.55 }]}
          >
            <Search size={21} color={palette.text} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ตั้งค่า"
            style={({ pressed }) => [zineStyles.iconButton, pressed && { opacity: 0.55 }]}
          >
            <Settings2 size={21} color={palette.text} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      <View style={zineStyles.titleRow}>
        <Text style={[zineStyles.pageTitle, { color: palette.text }]}>ชั้นหนังสือ</Text>
        <Sticker background={palette.gold} color={palette.text} borderColor={palette.border} rotate="4deg">
          {PREVIEW_BOOKS.length} เรื่อง
        </Sticker>
      </View>

      <HardShadow color={palette.shadow} radius={16} offset={5} style={{ marginTop: 16 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`อ่านต่อ ${continueBook.title}`}
          onPress={() => onOpenReader(continueBook)}
          style={({ pressed }) => [
            zineStyles.continueCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Tape />
          <View style={zineStyles.continueCoverWrap}>
            <PreviewCover book={continueBook} style={[zineStyles.continueCover, { borderColor: palette.border }]} radius={6} />
          </View>
          <View style={zineStyles.continueInfo}>
            <Sticker background={palette.accent} color={palette.accentInk} borderColor={palette.border} rotate="-2deg">
              อ่านต่อ
            </Sticker>
            <Text numberOfLines={2} style={[zineStyles.continueTitle, { color: palette.text }]}>
              {continueBook.title}
            </Text>
            <Text style={[zineStyles.continueMeta, { color: palette.muted }]}>
              ตอนที่ {continueBook.currentChapter} / {continueBook.totalChapters}
            </Text>
            <View style={[zineStyles.chunkyProgress, { borderColor: palette.border }]}>
              <ProgressLine
                value={continueBook.progress}
                color={palette.accent}
                track={palette.surfaceAlt}
                height={9}
                radius={0}
              />
            </View>
            <Text style={[zineStyles.continuePercent, { color: palette.text }]}>
              อ่านแล้ว {Math.round(continueBook.progress * 100)}%
            </Text>
          </View>
          <View style={[zineStyles.playButton, { backgroundColor: palette.text, borderColor: palette.border }]}>
            <Play size={19} color={palette.surface} fill={palette.surface} />
          </View>
        </Pressable>
      </HardShadow>

      <HardShadow color={palette.shadow} radius={8} offset={3} style={{ marginTop: 18 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ค้นหาในชั้นหนังสือ"
          style={({ pressed }) => [
            zineStyles.searchBar,
            { backgroundColor: palette.surface, borderColor: palette.border },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Search size={19} color={palette.text} strokeWidth={2.2} />
          <Text style={[zineStyles.searchText, { color: palette.muted }]}>
            ค้นหาเรื่องที่อยากอ่าน
          </Text>
          <View style={[zineStyles.filterSquare, { backgroundColor: palette.gold, borderColor: palette.border }]}>
            <SlidersHorizontal size={15} color={palette.text} strokeWidth={2.2} />
          </View>
        </Pressable>
      </HardShadow>

      <View style={zineStyles.tabRow}>
        {TABS.map(item => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(item.id)}
              style={({ pressed }) => [
                zineStyles.tab,
                {
                  backgroundColor: active ? palette.text : palette.surface,
                  borderColor: palette.border,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[zineStyles.tabText, { color: active ? palette.surface : palette.text }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={zineStyles.tagRow}
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
                zineStyles.tag,
                {
                  backgroundColor: active ? palette.gold : 'transparent',
                  borderColor: active ? palette.border : palette.line,
                },
                pressed && { opacity: 0.65 },
              ]}
            >
              <Text style={[zineStyles.tagText, { color: palette.text }]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={zineStyles.sectionRow}>
        <Text style={[zineStyles.sectionTitle, { color: palette.text }]}>หยิบมาอ่าน</Text>
        <Text style={[zineStyles.sectionCount, { color: palette.muted }]}>
          {visible.length} เรื่อง
        </Text>
      </View>

      <View style={zineStyles.grid}>
        {visible.map(book => (
          <Pressable
            key={book.id}
            accessibilityRole="button"
            accessibilityLabel={`รายละเอียด ${book.title}`}
            onPress={() => onOpenBook(book)}
            style={({ pressed }) => [{ width: widthPercent }, pressed && { opacity: 0.75 }]}
          >
            <HardShadow color={palette.shadow} radius={10} offset={4}>
              <View
                style={[
                  zineStyles.bookCard,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                ]}
              >
                <View style={zineStyles.bookCoverWrap}>
                  <PreviewCover book={book} style={zineStyles.bookCover} radius={0} />
                  {book.status === 'new' ? (
                    <View style={zineStyles.bookNew}>
                      <Sticker background={palette.gold} color={palette.text} borderColor={palette.border} rotate="-5deg">
                        ใหม่
                      </Sticker>
                    </View>
                  ) : null}
                  {book.status === 'done' ? (
                    <View style={zineStyles.bookNew}>
                      <Sticker background={palette.secondary} color={palette.secondaryInk} borderColor={palette.border} rotate="4deg">
                        จบแล้ว
                      </Sticker>
                    </View>
                  ) : null}
                </View>
                <View style={zineStyles.bookBody}>
                  <Text numberOfLines={2} style={[zineStyles.bookTitle, { color: palette.text }]}>
                    {book.title}
                  </Text>
                  <Text style={[zineStyles.bookMeta, { color: palette.muted }]}>
                    {bookMeta(book)}
                  </Text>
                  <View style={[zineStyles.bookProgress, { borderColor: palette.border }]}>
                    <ProgressLine
                      value={book.progress}
                      color={palette.accent}
                      track={palette.surfaceAlt}
                      height={6}
                      radius={0}
                    />
                  </View>
                </View>
              </View>
            </HardShadow>
          </Pressable>
        ))}
      </View>

      {visible.length === 0 ? (
        <Text style={[zineStyles.empty, { color: palette.muted }]}>ไม่พบเรื่องในหมวดนี้</Text>
      ) : null}

      <View style={[zineStyles.footerStrip, { backgroundColor: palette.text, borderColor: palette.border }]}>
        <Text style={[zineStyles.footerStripText, { color: palette.surface }]}>
          อ่านต่อทุกคืน · YOMIORI · อ่านต่อทุกคืน
        </Text>
        <Text style={[zineStyles.footerStripText, { color: palette.surface }]}>読織</Text>
      </View>
    </ScrollView>
  );
}

function ZineDetail({ palette, book, onOpenReader, onBack }: ConceptProps) {
  const barBg = palette.isDark ? palette.surface : palette.text;
  const barInk = palette.isDark ? palette.text : palette.surface;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={zineStyles.detailContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[zineStyles.detailTopBar, { backgroundColor: barBg }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="กลับ"
          onPress={onBack}
          style={({ pressed }) => [zineStyles.iconButton, pressed && { opacity: 0.55 }]}
        >
          <ArrowLeft size={22} color={barInk} strokeWidth={2.3} />
        </Pressable>
        <Text style={[zineStyles.detailTopWord, { color: barInk }]}>YOMIORI</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ตั้งค่า"
          style={({ pressed }) => [zineStyles.iconButton, pressed && { opacity: 0.55 }]}
        >
          <Settings2 size={20} color={barInk} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={zineStyles.detailHero}>
        <View style={zineStyles.detailCoverWrap}>
          <HardShadow color={palette.shadow} radius={8} offset={5}>
            <View style={[zineStyles.detailCoverFrame, { borderColor: palette.border }]}>
              <PreviewCover book={book} style={zineStyles.detailCover} radius={0} />
            </View>
          </HardShadow>
          <Tape left={28} rotate="3deg" />
        </View>
        <View style={zineStyles.detailInfo}>
          <View style={zineStyles.detailTags}>
            {book.tags.slice(0, 2).map((tag, index) => (
              <Sticker
                key={tag}
                background={index === 0 ? palette.gold : palette.secondary}
                color={index === 0 ? palette.text : palette.secondaryInk}
                borderColor={palette.border}
                rotate={index === 0 ? '-2deg' : '2deg'}
              >
                {tag}
              </Sticker>
            ))}
          </View>
          <Text style={[zineStyles.detailTitle, { color: palette.text }]}>{book.title}</Text>
          <Text style={[zineStyles.detailAuthor, { color: palette.muted }]}>{book.author}</Text>
          <Text style={[zineStyles.detailMeta, { color: palette.muted }]}>
            {book.totalChapters} ตอน · แปลไทย
          </Text>
          <HardShadow color={palette.shadow} radius={8} offset={4} style={{ marginTop: 14 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={chapterNumber(book)}
              onPress={() => onOpenReader(book)}
              style={({ pressed }) => [
                zineStyles.detailCta,
                { backgroundColor: palette.accent, borderColor: palette.border },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Play size={16} color={palette.accentInk} fill={palette.accentInk} strokeWidth={2.2} />
              <Text style={[zineStyles.detailCtaText, { color: palette.accentInk }]}>
                {chapterNumber(book)}
              </Text>
            </Pressable>
          </HardShadow>
        </View>
      </View>

      <View style={zineStyles.detailRuleRow}>
        <View style={[zineStyles.detailRule, { backgroundColor: palette.border }]} />
        <Text style={[zineStyles.detailRuleLabel, { color: palette.text }]}>เรื่องย่อ</Text>
        <View style={[zineStyles.detailRule, { backgroundColor: palette.border }]} />
      </View>
      <Text style={[zineStyles.synopsis, { color: palette.text }]}>
        {book.synopsis}
      </Text>

      <View style={zineStyles.chapterHeadingRow}>
        <Text style={[zineStyles.chapterHeading, { color: palette.text }]}>สารบัญ</Text>
        <Sticker background={palette.gold} color={palette.text} borderColor={palette.border} rotate="2deg">
          {PREVIEW_CHAPTERS.length} ตอน
        </Sticker>
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
              zineStyles.chapterRow,
              {
                borderColor: current ? palette.accent : palette.border,
                backgroundColor: current ? palette.accentSoft : palette.surface,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View
              style={[
                zineStyles.chapterNoBox,
                { backgroundColor: current ? palette.accent : palette.text },
              ]}
            >
              <Text style={[zineStyles.chapterNo, { color: current ? palette.accentInk : palette.surface }]}>
                {chapter.number === 0 ? '序' : chapter.number}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                zineStyles.chapterTitle,
                { color: palette.text },
                current && { color: palette.accent },
              ]}
            >
              {chapter.title}
            </Text>
            {read ? (
              <Check size={17} color={palette.accent} strokeWidth={2.4} />
            ) : (
              <Download size={16} color={palette.muted} strokeWidth={2.2} />
            )}
            <ChevronRight size={16} color={palette.muted} strokeWidth={2.2} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ZineReader({ palette, book, onBack }: ConceptProps) {
  const barBg = palette.isDark ? palette.surface : palette.text;
  const barInk = palette.isDark ? palette.text : palette.surface;
  const barTrack = palette.isDark ? palette.surfaceAlt : 'rgba(255,255,255,0.22)';
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={[zineStyles.readerTop, { backgroundColor: barBg }]}>
        <View style={zineStyles.readerTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="กลับ"
            onPress={onBack}
            style={({ pressed }) => [zineStyles.iconButton, pressed && { opacity: 0.55 }]}
          >
            <ArrowLeft size={21} color={barInk} strokeWidth={2.3} />
          </Pressable>
          <View style={zineStyles.readerTopTitle}>
            <Text numberOfLines={1} style={[zineStyles.readerTopName, { color: barInk }]}>
              {book.title}
            </Text>
            <Text style={[zineStyles.readerTopMeta, { color: palette.gold }]}>
              ตอนที่ {READER_SAMPLE.chapterNumber} · {READER_SAMPLE.progress}%
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="สารบัญ"
            style={({ pressed }) => [zineStyles.iconButton, pressed && { opacity: 0.55 }]}
          >
            <List size={20} color={barInk} strokeWidth={2.3} />
          </Pressable>
        </View>
        <ProgressLine
          value={READER_SAMPLE.progress / 100}
          color={palette.accent}
          track={barTrack}
          height={4}
          radius={0}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={zineStyles.readerContent}
        showsVerticalScrollIndicator={false}
      >
        <Sticker background={palette.accent} color={palette.accentInk} borderColor={palette.border} rotate="-2deg">
          ตอนที่ {READER_SAMPLE.chapterNumber}
        </Sticker>
        <Text style={[zineStyles.readerChapterTitle, { color: palette.text }]}>
          {READER_SAMPLE.chapterTitle}
        </Text>
        <View style={[zineStyles.readerTitleRule, { backgroundColor: palette.border }]} />

        {READER_SAMPLE.paragraphs.map((paragraph, index) => (
          <Text key={`p-${index}`} style={[zineStyles.readerBody, { color: palette.text }]}>
            {paragraph}
          </Text>
        ))}

        <HardShadow color={palette.shadow} radius={8} offset={5}>
          <View
            style={[
              zineStyles.dialogueBox,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <View style={[zineStyles.dialogueSpeakerTag, { backgroundColor: palette.gold, borderColor: palette.border }]}>
              <Text style={[zineStyles.dialogueSpeaker, { color: palette.text }]}>
                {READER_SAMPLE.dialogue.speaker}
              </Text>
            </View>
            <Text style={[zineStyles.readerDialogue, { color: palette.text }]}>
              {READER_SAMPLE.dialogue.text}
            </Text>
          </View>
        </HardShadow>

        {READER_SAMPLE.after.map((paragraph, index) => (
          <Text key={`after-${index}`} style={[zineStyles.readerBody, { color: palette.text }]}>
            {paragraph}
          </Text>
        ))}

        <View style={zineStyles.sceneBreak}>
          <View style={[zineStyles.sceneLine, { backgroundColor: palette.border }]} />
          <Sparkles size={16} color={palette.accent} strokeWidth={2.4} />
          <View style={[zineStyles.sceneLine, { backgroundColor: palette.border }]} />
        </View>

        <Text style={[zineStyles.readerBody, { color: palette.text }]}>
          และนั่นคือจุดเริ่มต้นของวันธรรมดา ที่ไม่ธรรมดาอีกต่อไป
        </Text>
      </ScrollView>

      <View
        style={[
          zineStyles.readerDock,
          { backgroundColor: palette.text, borderTopColor: palette.border },
        ]}
      >
        <View style={zineStyles.dockItem}>
          <Type size={18} color={palette.surface} strokeWidth={2.3} />
          <Text style={[zineStyles.dockText, { color: palette.surface }]}>Kanit 17</Text>
        </View>
        <View style={zineStyles.dockThemes}>
          <View style={[zineStyles.themeDot, { borderColor: palette.isDark ? 'transparent' : palette.accent }]}>
            <Sun size={13} color={palette.accent} />
          </View>
          <View style={[zineStyles.themeDot, { borderColor: 'transparent' }]}>
            <Coffee size={13} color={palette.surface} />
          </View>
          <View style={[zineStyles.themeDot, { borderColor: palette.isDark ? palette.accent : 'transparent' }]}>
            <Moon size={13} color={palette.surface} />
          </View>
        </View>
        <View style={zineStyles.dockItem}>
          <List size={18} color={palette.surface} strokeWidth={2.3} />
          <Text style={[zineStyles.dockText, { color: palette.surface }]}>สารบัญ</Text>
        </View>
      </View>
    </View>
  );
}

export function ZineConcept(props: ConceptProps) {
  if (props.screen === 'detail') return <ZineDetail {...props} />;
  if (props.screen === 'reader') return <ZineReader {...props} />;
  return <ZineShelf {...props} />;
}

const zineStyles = StyleSheet.create({
  shelfContent: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  masthead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mastheadBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandBlock: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#111' },
  wordmark: { fontFamily: FONT.displayHeavy, fontSize: 30, lineHeight: 36, letterSpacing: -0.7 },
  mastheadActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' },
  pageTitle: { fontFamily: FONT.displayHeavy, fontSize: 39, lineHeight: 46, letterSpacing: -1 },
  sticker: { alignSelf: 'flex-start', borderWidth: 2, borderColor: '#111', paddingHorizontal: 8, paddingVertical: 3 },
  stickerText: { fontFamily: FONT.display, fontSize: 11, lineHeight: 16 },
  tape: { position: 'absolute', top: -9, width: 66, height: 17, backgroundColor: '#F1DFC0', opacity: 0.9, zIndex: 3 },
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 2, padding: 13 },
  continueCoverWrap: { transform: [{ rotate: '-1.5deg' }] },
  continueCover: { width: 96, height: 144, borderWidth: 2, borderColor: '#111' },
  continueInfo: { flex: 1, minWidth: 0, gap: 4 },
  continueTitle: { fontFamily: FONT.display, fontSize: 19, lineHeight: 26, letterSpacing: -0.2 },
  continueMeta: { fontFamily: FONT.ui, fontSize: 11.5 },
  chunkyProgress: { marginTop: 6, borderWidth: 1, borderColor: '#111', padding: 1 },
  continuePercent: { fontFamily: FONT.uiSemi, fontSize: 10.5 },
  playButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#111' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 2, minHeight: 50, paddingLeft: 13, paddingRight: 7 },
  searchText: { flex: 1, fontFamily: FONT.ui, fontSize: 13 },
  filterSquare: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#111' },
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  tab: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2, paddingHorizontal: 8 },
  tabText: { fontFamily: FONT.uiSemi, fontSize: 12 },
  tagRow: { gap: 7, paddingVertical: 12 },
  tag: { minHeight: 40, justifyContent: 'center', borderWidth: 1.5, paddingHorizontal: 10 },
  tagText: { fontFamily: FONT.ui, fontSize: 11 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontFamily: FONT.display, fontSize: 23, lineHeight: 30 },
  sectionCount: { fontFamily: FONT.ui, fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  bookCard: { borderWidth: 2, overflow: 'hidden' },
  bookCoverWrap: { position: 'relative' },
  bookCover: { width: '100%', aspectRatio: 2 / 3 },
  bookNew: { position: 'absolute', top: 7, left: 7, zIndex: 2 },
  bookBody: { padding: 8 },
  bookTitle: { fontFamily: FONT.display, fontSize: 13.5, lineHeight: 19 },
  bookMeta: { fontFamily: FONT.ui, fontSize: 10.5, marginTop: 3 },
  bookProgress: { marginTop: 7, borderWidth: 1, borderColor: '#111', padding: 1 },
  empty: { fontFamily: FONT.ui, fontSize: 13, textAlign: 'center', paddingVertical: 40 },
  footerStrip: { marginTop: 26, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderWidth: 2, borderColor: '#111' },
  footerStripText: { fontFamily: FONT.display, fontSize: 11, letterSpacing: 0.8 },
  detailContent: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingBottom: 40 },
  detailTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, paddingHorizontal: 8 },
  detailTopWord: { fontFamily: FONT.displayHeavy, fontSize: 18, letterSpacing: 1 },
  detailHero: { flexDirection: 'row', gap: 18, alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 22 },
  detailCoverWrap: { position: 'relative' },
  detailCoverFrame: { borderWidth: 2 },
  detailCover: { width: 128, aspectRatio: 2 / 3 },
  detailInfo: { flex: 1, minWidth: 0 },
  detailTags: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginBottom: 9 },
  detailTitle: { fontFamily: FONT.displayHeavy, fontSize: 24, lineHeight: 31, letterSpacing: -0.4 },
  detailAuthor: { fontFamily: FONT.ui, fontSize: 12, marginTop: 5 },
  detailMeta: { fontFamily: FONT.ui, fontSize: 11, marginTop: 2 },
  detailCta: { minHeight: 46, borderWidth: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12 },
  detailCtaText: { fontFamily: FONT.display, fontSize: 13.5 },
  detailRuleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 26, marginBottom: 12, paddingHorizontal: 16 },
  detailRule: { flex: 1, height: 2 },
  detailRuleLabel: { fontFamily: FONT.display, fontSize: 18 },
  synopsis: { fontFamily: FONT.ui, fontSize: 13.5, lineHeight: 22, paddingHorizontal: 16 },
  chapterHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 26, marginBottom: 12 },
  chapterHeading: { fontFamily: FONT.displayHeavy, fontSize: 25, lineHeight: 32 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, borderWidth: 2, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 9 },
  chapterNoBox: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  chapterNo: { fontFamily: FONT.display, fontSize: 13 },
  chapterTitle: { flex: 1, fontFamily: FONT.uiSemi, fontSize: 12.5 },
  readerTop: { paddingBottom: 0 },
  readerTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 54 },
  readerTopTitle: { flex: 1, minWidth: 0, paddingHorizontal: 6 },
  readerTopName: { fontFamily: FONT.uiSemi, fontSize: 12.5 },
  readerTopMeta: { fontFamily: FONT.ui, fontSize: 10.5, marginTop: 1 },
  readerContent: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 24, paddingBottom: 40 },
  readerChapterTitle: { fontFamily: FONT.displayHeavy, fontSize: 29, lineHeight: 37, marginTop: 12, letterSpacing: -0.5 },
  readerTitleRule: { height: 3, width: 72, marginTop: 14, marginBottom: 22 },
  readerBody: { fontFamily: FONT.ui, fontSize: 17, lineHeight: 31, marginBottom: 15 },
  dialogueBox: { borderWidth: 2, padding: 14, marginVertical: 8, marginBottom: 20 },
  dialogueSpeakerTag: { alignSelf: 'flex-start', borderWidth: 2, borderColor: '#111', paddingHorizontal: 8, paddingVertical: 2, marginTop: -27, marginBottom: 8 },
  dialogueSpeaker: { fontFamily: FONT.display, fontSize: 11 },
  readerDialogue: { fontFamily: FONT.ui, fontSize: 17.5, lineHeight: 31 },
  sceneBreak: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  sceneLine: { flex: 1, height: 2 },
  readerDock: { borderTopWidth: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 9, minHeight: 62 },
  dockItem: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  dockText: { fontFamily: FONT.uiSemi, fontSize: 11.5 },
  dockThemes: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  themeDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
