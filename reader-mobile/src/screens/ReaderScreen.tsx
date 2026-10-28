import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  type ScrollViewInstance,
  type LayoutChangeEvent,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  AppState,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationBar } from 'expo-navigation-bar';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { RootStackParamList, Chapter, Character, ReaderTheme, ChapterListItem, ReadingAnchor } from '../types';
import { getChapterForReading, fetchCharacters, getAvailableChapterList } from '../services/api';
import {
  getSavedTheme,
  saveTheme,
  getSavedFontSize,
  saveFontSize,
  getSavedFontFamily,
  saveFontFamily,
  getSavedLineHeight,
  saveLineHeight,
  getReadingProgress,
} from '../services/storage';
import { themes } from '../theme/colors';
import { readerStyles as styles } from '../theme/readerStyles';
import { ReaderStory } from '../components/ReaderStory';
import { ReaderHeader, ReaderDock, ReaderReveal } from '../components/ReaderChrome';
import { useReaderFonts } from '../components/ReaderFontProvider';
import { ScreenState } from '../components/ScreenState';
import { createProgressWriter, getResumeOffset, anchorAtOffset, offsetForAnchor, BlockLayout } from '../services/readingProgress';
import { CharacterDetailModal } from '../components/CharacterDetailModal';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
import { ChapterCommentsSection } from '../components/ChapterCommentsSection';
import {
  TypographyModal,
  FontOption,
  LineHeightOption,
  FONT_MAP,
} from '../components/TypographyModal';

type ReaderRouteProp = RouteProp<RootStackParamList, 'Reader'>;
type ReaderNavProp = NativeStackNavigationProp<RootStackParamList, 'Reader'>;

interface Props {
  route: ReaderRouteProp;
  navigation: ReaderNavProp;
}

export const ReaderScreen: React.FC<Props> = props => (
  <ReaderContent key={`${props.route.params.novelId}:${props.route.params.chapterId}`} {...props} />
);

const ReaderContent: React.FC<Props> = ({ route, navigation }) => {
  const { novelId, chapterId } = route.params;
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 600;
  const insets = useSafeAreaInsets();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [chapterList, setChapterList] = useState<ChapterListItem[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const [cacheWarning, setCacheWarning] = useState(false);
  const [progressWarning, setProgressWarning] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Settings & Immersion
  const [currentTheme, setCurrentTheme] = useState<ReaderTheme>('light');
  const [fontSize, setFontSize] = useState(isTablet ? 19 : 17);
  const [defaultFontSize] = useState(isTablet ? 19 : 17);
  const [fontFamily, setFontFamily] = useState<FontOption>('Sarabun');
  const [lineHeightRatio, setLineHeightRatio] = useState<LineHeightOption>(1.85);
  const [showControls, setShowControls] = useState(true);
  const [showTypographyModal, setShowTypographyModal] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(48);
  const [dockHeight, setDockHeight] = useState(54);

  // Lightbox Modal State
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string | undefined>();

  const scrollRef = useRef<ScrollViewInstance>(null);
  const hasRestoredScroll = useRef(false);
  const savedProgressPercent = useRef(0);
  const themeColors = themes[currentTheme];
  const fonts = useReaderFonts();
  const activeFont = FONT_MAP[fonts === 'ready' ? fontFamily : 'System'];

  const progressWriter = useRef<ReturnType<typeof createProgressWriter> | null>(null);
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const userStartedReading = useRef(false);
  const currentAnchor = useRef<ReadingAnchor | undefined>(undefined);
  const blockLayouts = useRef(new Map<string, BlockLayout>());
  const blockCount = useRef(0);
  const spineY = useRef<number | null>(null);
  const storyY = useRef<number | null>(null);
  const dragging = useRef(false);
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const programmatic = useRef(false);
  const programmaticTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const restoreRef = useRef<() => void>(() => {});
  const scheduleRestore = useCallback(() => {
    if (dragging.current) return;
    clearTimeout(restoreTimer.current);
    restoreTimer.current = setTimeout(() => restoreRef.current(), 80);
  }, []);
  const onStoryLayout = useCallback((event: LayoutChangeEvent) => {
    storyY.current = event.nativeEvent.layout.y;
    scheduleRestore();
  }, [scheduleRestore]);
  const onBlockLayout = useCallback((id: string, index: number, y: number, height: number) => {
    blockLayouts.current.set(id, { id, index, y, height });
    scheduleRestore();
  }, [scheduleRestore]);

  useEffect(() => {
    let active = true;
    hasRestoredScroll.current = false;
    savedProgressPercent.current = 0;
    userStartedReading.current = false;
    viewportHeight.current = 0;
    contentHeight.current = 0;
    blockLayouts.current.clear();
    blockCount.current = 0;
    spineY.current = null;
    storyY.current = null;
    currentAnchor.current = undefined;
    dragging.current = false;
    const writer = createProgressWriter(novelId, chapterId, () => {
      if (active) setProgressWarning(true);
    });
    progressWriter.current = writer;
    const blur = navigation.addListener('blur', writer.flush);
    const appState = AppState.addEventListener('change', state => {
      if (state !== 'active') writer.flush();
    });
    void Promise.all([
      getSavedTheme(), getSavedFontSize(defaultFontSize), getSavedFontFamily(),
      getSavedLineHeight(), getChapterForReading(novelId, chapterId), getReadingProgress(novelId),
    ]).then(([theme, size, family, lineHeight, result, progress]) => {
      if (!active) return;
      setCurrentTheme(theme);
      setFontSize(size);
      setFontFamily(family);
      setLineHeightRatio(lineHeight);
      setChapter(result.chapter);
      setCacheWarning(result.cacheWarning);
      setProgressWarning(false);
      if (!result.chapter) { setLoadState('error'); return; }
      const percent = progress?.chapterId === chapterId ? progress.scrollPercent : 0;
      currentAnchor.current = progress?.chapterId === chapterId ? progress.anchor : undefined;
      blockCount.current = result.chapter.blocks.filter(block => block.type === 'narration' || block.type === 'dialogue').length;
      savedProgressPercent.current = percent;
      setReadingProgress(Math.round(percent));
      setLoadState('ready');
      writer.update(percent, currentAnchor.current);
    }).catch(() => { if (active) setLoadState('error'); });
    // Optional metadata is independent of the reading content.
    void fetchCharacters(novelId, true).then(data => { if (active) setCharacters(data); }).catch(() => undefined);
    void getAvailableChapterList(novelId, true).then(data => { if (active) setChapterList(data); }).catch(() => undefined);
    return () => {
      active = false;
      clearTimeout(restoreTimer.current);
      clearTimeout(programmaticTimer.current);
      writer.dispose();
      blur();
      appState.remove();
      if (progressWriter.current === writer) progressWriter.current = null;
    };
  }, [novelId, chapterId, retryKey, defaultFontSize, navigation]);

  const retryChapter = () => { setLoadState('loading'); setRetryKey(key => key + 1); };
  const restoreScroll = () => {
    if (dragging.current || !viewportHeight.current || !contentHeight.current) return;
    if (!currentAnchor.current && (hasRestoredScroll.current || userStartedReading.current)) return;
    let offset = getResumeOffset(savedProgressPercent.current, contentHeight.current, viewportHeight.current);
    if (currentAnchor.current) {
      if (spineY.current === null || storyY.current === null || blockLayouts.current.size < blockCount.current) return;
      const y = offsetForAnchor(currentAnchor.current, [...blockLayouts.current.values()]);
      if (y !== undefined) offset = spineY.current + storyY.current + y;
    }
    hasRestoredScroll.current = true;
    programmatic.current = true;
    clearTimeout(programmaticTimer.current);
    programmaticTimer.current = setTimeout(() => { programmatic.current = false; }, 150);
    scrollRef.current?.scrollTo({ y: Math.max(0, Math.min(offset, Math.max(0, contentHeight.current - viewportHeight.current))), animated: false });
  };
  useEffect(() => { restoreRef.current = restoreScroll; });
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasRestoredScroll.current || !userStartedReading.current || programmatic.current) return;
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    const percent = scrollable > 0 ? Math.min(100, Math.max(0, contentOffset.y / scrollable * 100)) : 100;
    const display = Math.round(percent);
    setReadingProgress(previous => previous === display ? previous : display);
    const relative = contentOffset.y - (spineY.current ?? 0) - (storyY.current ?? 0);
    currentAnchor.current = anchorAtOffset([...blockLayouts.current.values()], relative);
    progressWriter.current?.update(percent, currentAnchor.current);
  };
  const toggleControls = useCallback(() => setShowControls(previous => !previous), []);
  const openIllustration = useCallback((uri: string, caption?: string) => {
    setLightboxUrl(uri);
    setLightboxCaption(caption);
    setLightboxVisible(true);
  }, []);

  const handleToggleTheme = async (nextTheme: ReaderTheme) => {
    setCurrentTheme(nextTheme);
    await saveTheme(nextTheme).catch(() => setProgressWarning(true));
  };

  const handleChangeFontSize = async (delta: number) => {
    const nextSize = Math.max(14, Math.min(26, fontSize + delta));
    setFontSize(nextSize);
    await saveFontSize(nextSize).catch(() => setProgressWarning(true));
  };

  const handleChangeFontFamily = async (family: FontOption) => {
    setFontFamily(family);
    await saveFontFamily(family).catch(() => setProgressWarning(true));
  };

  const handleChangeLineHeight = async (ratio: LineHeightOption) => {
    setLineHeightRatio(ratio);
    await saveLineHeight(ratio).catch(() => setProgressWarning(true));
  };

  // Character lookup
  const characterMap = useMemo(() => {
    const map = new Map<string, Character>();
    characters.forEach((c) => map.set(c.id, c));
    return map;
  }, [characters]);

  // Navigate to other chapters using the actual available chapter list
  const currentChapterIndex = chapterList.findIndex((c) => c.id === chapterId);
  const hasPrev = currentChapterIndex > 0;
  const hasNext = currentChapterIndex !== -1 && currentChapterIndex < chapterList.length - 1;

  const goToChapterAt = useCallback((index: number) => {
    const target = chapterList[index];
    if (!target) return;
    progressWriter.current?.flush();
    navigation.replace('Reader', { novelId, chapterId: target.id });
  }, [chapterList, navigation, novelId]);
  const openContents = useCallback(() => {
    progressWriter.current?.flush();
    navigation.navigate('NovelDetail', { novelId });
  }, [navigation, novelId]);
  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  const goPrev = useCallback(() => goToChapterAt(currentChapterIndex - 1), [currentChapterIndex, goToChapterAt]);
  const goNext = useCallback(() => goToChapterAt(currentChapterIndex + 1), [currentChapterIndex, goToChapterAt]);
  const openSettings = useCallback(() => setShowTypographyModal(true), []);
  const revealControls = useCallback(() => setShowControls(true), []);
  const measureHeader = useCallback((event: LayoutChangeEvent) => setHeaderHeight(Math.ceil(event.nativeEvent.layout.height)), []);
  const measureDock = useCallback((event: LayoutChangeEvent) => setDockHeight(Math.ceil(event.nativeEvent.layout.height)), []);


  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={themeColors.statusBar === 'dark' ? 'dark' : 'light'} />
      <NavigationBar hidden={true} />
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: themeColors.background, zIndex: 40 }} />

      <View accessibilityRole="progressbar" accessibilityLabel="ความคืบหน้าการอ่าน"
        accessibilityValue={{ min: 0, max: 100, now: readingProgress }}
        style={[styles.progressBarTrack, { top: insets.top, backgroundColor: themeColors.progressTrack }]}>
        <View style={[styles.progressBarFill, { backgroundColor: themeColors.progressBar, width: `${readingProgress}%` }]} />
      </View>

      {loadState === 'loading' ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>
            กำลังเตรียมเนื้อหา...
          </Text>
        </View>
      ) : loadState === 'error' || !chapter ? (
        <ScreenState colors={themeColors} message="เปิดตอนนี้ไม่ได้ หากยังไม่ได้ดาวน์โหลดไว้ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง"
          onRetry={retryChapter} onBack={() => navigation.goBack()} />
      ) : (
        <ScrollView
          testID="reader-scroll"
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + headerHeight + 16, paddingBottom: Math.max(110, dockHeight + 24), paddingHorizontal: 22 },
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={false}
          onLayout={event => { viewportHeight.current = event.nativeEvent.layout.height; restoreScroll(); }}
          onContentSizeChange={(_width, height) => {
            contentHeight.current = height;
            if (!userStartedReading.current) hasRestoredScroll.current = false;
            if (currentAnchor.current) scheduleRestore(); else restoreScroll();
          }}
          onScrollBeginDrag={() => { clearTimeout(restoreTimer.current); clearTimeout(programmaticTimer.current); programmatic.current = false; dragging.current = true; userStartedReading.current = true; hasRestoredScroll.current = true; }}
          onScrollEndDrag={event => { handleScroll(event); dragging.current = false; progressWriter.current?.flush(); }}
          onMomentumScrollEnd={event => { handleScroll(event); dragging.current = false; progressWriter.current?.flush(); }}
        >
          {/* Centered Book Spine: Ergonomic line length on both Phones and Tablets */}
          <View testID="reader-spine" onLayout={event => { spineY.current = event.nativeEvent.layout.y; scheduleRestore(); }} style={[styles.bookSpine, { maxWidth: isTablet ? 720 : '100%' }]}>
            {/* Chapter Heading Banner */}
            <Pressable accessibilityRole="button" accessibilityLabel={showControls ? 'ซ่อนเครื่องมืออ่าน' : 'แสดงเครื่องมืออ่านจากหัวตอน'} onPress={toggleControls}>
              <View style={[styles.chapterHero, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.chapterHeroNum, { color: themeColors.primary }]}>CHAPTER {chapter.chapterNumber}</Text>
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.chapterHeroTitle,
                    { color: themeColors.text, fontFamily: activeFont.bold || activeFont.regular },
                  ]}
                >
                  {chapter.title}
                </Text>
              </View>
            </Pressable>

            {(cacheWarning || progressWarning) && <Text accessibilityRole="alert" style={[styles.loadingText, { color: themeColors.primary }]}>
              {cacheWarning ? 'อ่านตอนนี้ได้ แต่ยังบันทึกออฟไลน์ไม่ได้ กรุณาตรวจสอบพื้นที่เครื่องแล้วลองอีกครั้ง' : 'ยังบันทึกการอ่านหรือการตั้งค่าไม่ได้ กรุณาตรวจสอบพื้นที่เครื่อง'}
            </Text>}
            {cacheWarning && <Pressable accessibilityRole="button" onPress={retryChapter} style={styles.navChapterBtn}>
              <Text style={{ color: themeColors.primary }}>ลองบันทึกออฟไลน์อีกครั้ง</Text>
            </Pressable>}
            <ReaderStory novelId={novelId} blocks={chapter.blocks} characterMap={characterMap} colors={themeColors}
              fontSize={fontSize} fontFamily={fontFamily} lineHeightRatio={lineHeightRatio}
              onStoryLayout={onStoryLayout} onBlockLayout={onBlockLayout}
              onToggleControls={toggleControls} onSelectCharacter={setSelectedCharacter} onOpenIllustration={openIllustration} />

            {/* Historical 1.0.0 order; comment persistence remains unchanged. */}
            <ChapterCommentsSection key={`${novelId}:${chapterId}`}
              novelId={novelId}
              chapterId={chapterId}
              theme={currentTheme}
            />
            <View style={[styles.bottomChapterNav, { borderTopColor: themeColors.border }]}>
              <TouchableOpacity
                style={[
                  styles.navChapterBtn,
                  { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
                  !hasPrev && { opacity: 0.4 },
                ]}
                disabled={!hasPrev}
                accessibilityRole="button"
                accessibilityLabel="อ่านตอนก่อนหน้า"
                onPress={goPrev}
              >
                <ChevronLeft size={18} color={themeColors.text} />
                <Text style={[styles.navChapterBtnText, { color: themeColors.text }]}>ตอนก่อนหน้า</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navChapterBtn,
                  { backgroundColor: themeColors.primary },
                  !hasNext && { opacity: 0.4 },
                ]}
                disabled={!hasNext}
                accessibilityRole="button"
                accessibilityLabel="อ่านตอนถัดไป"
                onPress={goNext}
              >
                <Text style={styles.navChapterBtnNextText}>ตอนถัดไป</Text>
                <ChevronRight size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
            {!hasNext && <Pressable accessibilityRole="button" onPress={openContents} style={styles.chapterContentsLink}>
              <Text style={{ color: themeColors.primary }}>ดูตอนทั้งหมดในสารบัญ</Text>
            </Pressable>}

          </View>
        </ScrollView>
      )}

      <ReaderHeader visible={showControls} colors={themeColors} topInset={insets.top} progress={readingProgress} novelTitle={chapter?.novelTitle ?? 'Yomiori'}
        chapterTitle={chapter?.title ?? 'เปิดตอนนิยาย'} fontFamily={activeFont.bold || activeFont.regular} onBack={goBack} onContents={openContents} onLayout={measureHeader} />
      <ReaderDock visible={showControls && !showTypographyModal} enabled={loadState === 'ready'} colors={themeColors}
        theme={currentTheme} fontFamily={fontFamily} fontSize={fontSize} onTheme={handleToggleTheme} bottomInset={insets.bottom}
        onSettings={openSettings} onLayout={measureDock} />
      {!showControls && <ReaderReveal colors={themeColors} bottomInset={insets.bottom} onPress={revealControls} />}

      {/* Typography & Layout Settings Modal */}
      <TypographyModal
        visible={showTypographyModal}
        theme={currentTheme}
        fontSize={fontSize}
        fontFamily={fontFamily}
        lineHeightRatio={lineHeightRatio}
        onChangeFontSize={handleChangeFontSize}
        onChangeFontFamily={handleChangeFontFamily}
        onChangeLineHeight={handleChangeLineHeight}
        onChangeTheme={handleToggleTheme}
        onClose={() => setShowTypographyModal(false)}
      />

      {/* Character Profile Modal */}
      <CharacterDetailModal
        visible={!!selectedCharacter}
        character={selectedCharacter}
        theme={currentTheme}
        onClose={() => setSelectedCharacter(null)}
      />

      {/* Fullscreen Lightbox Zoom Modal */}
      <ImageLightboxModal
        visible={lightboxVisible}
        imageUrl={lightboxUrl}
        caption={lightboxCaption}
        onClose={() => setLightboxVisible(false)}
      />
    </SafeAreaView>
  );
};
