import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StatusBar,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  AppState,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationBar } from 'expo-navigation-bar';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  Type,
  List,
} from 'lucide-react-native';
import { RootStackParamList, Chapter, Character, ReaderTheme, ChapterListItem } from '../types';
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
import { useReaderFonts } from '../components/ReaderFontProvider';
import { ScreenState } from '../components/ScreenState';
import { createProgressWriter, getResumeOffset } from '../services/readingProgress';
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

  // Lightbox Modal State
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string | undefined>();

  const scrollRef = useRef<ScrollView>(null);
  const hasRestoredScroll = useRef(false);
  const savedProgressPercent = useRef(0);
  const themeColors = themes[currentTheme];
  const fonts = useReaderFonts();
  const activeFont = FONT_MAP[fonts === 'ready' ? fontFamily : 'System'];

  const progressWriter = useRef<ReturnType<typeof createProgressWriter> | null>(null);
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const userStartedReading = useRef(false);

  useEffect(() => {
    let active = true;
    hasRestoredScroll.current = false;
    savedProgressPercent.current = 0;
    userStartedReading.current = false;
    viewportHeight.current = 0;
    contentHeight.current = 0;
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
      savedProgressPercent.current = percent;
      setReadingProgress(Math.round(percent));
      setLoadState('ready');
      writer.update(percent);
    }).catch(() => { if (active) setLoadState('error'); });
    // Optional metadata is independent of the reading content.
    void fetchCharacters(novelId, true).then(data => { if (active) setCharacters(data); }).catch(() => undefined);
    void getAvailableChapterList(novelId, true).then(data => { if (active) setChapterList(data); }).catch(() => undefined);
    return () => {
      active = false;
      writer.dispose();
      blur();
      appState.remove();
      if (progressWriter.current === writer) progressWriter.current = null;
    };
  }, [novelId, chapterId, retryKey, defaultFontSize, navigation]);

  const retryChapter = () => { setLoadState('loading'); setRetryKey(key => key + 1); };
  const restoreScroll = () => {
    if (hasRestoredScroll.current || userStartedReading.current || !viewportHeight.current || !contentHeight.current) return;
    hasRestoredScroll.current = true;
    scrollRef.current?.scrollTo({ y: getResumeOffset(savedProgressPercent.current, contentHeight.current, viewportHeight.current), animated: false });
  };
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasRestoredScroll.current || !userStartedReading.current) return;
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    const percent = scrollable > 0 ? Math.min(100, Math.max(0, contentOffset.y / scrollable * 100)) : 100;
    const display = Math.round(percent);
    setReadingProgress(previous => previous === display ? previous : display);
    progressWriter.current?.update(percent);
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

  const goToChapterAt = (index: number) => {
    const target = chapterList[index];
    if (!target) return;
    progressWriter.current?.flush();
    navigation.replace('Reader', { novelId, chapterId: target.id });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar
        barStyle={themeColors.statusBar === 'dark' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />
      <NavigationBar hidden={true} />

      {/* Top Header (Collapsible in Zen Mode) */}
      {showControls && (
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <View style={[styles.centeredRow, { maxWidth: isTablet ? 720 : '100%' }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={22} color={themeColors.text} />
            </TouchableOpacity>

            <View style={styles.headerTitles}>
              <Text
                style={[
                  styles.headerChapterTitle,
                  { color: themeColors.text, fontFamily: activeFont.bold || activeFont.regular },
                ]}
                numberOfLines={1}
              >
                {chapter ? chapter.title : `ตอนที่ ${chapterId}`}
              </Text>
            </View>

            <View style={styles.progressPercentBadge}>
              <Text style={[styles.progressPercentText, { color: themeColors.primary }]}>
                {Math.round(readingProgress)}%
              </Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="เปิดสารบัญ" style={styles.backBtn} onPress={() => {
              progressWriter.current?.flush();
              navigation.navigate('NovelDetail', { novelId });
            }}>
              <List size={22} color={themeColors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Always Visible Linear Reading Progress Bar (Ultra-sleek top indicator) */}
      <View style={[styles.progressBarTrack, { backgroundColor: themeColors.progressTrack }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: themeColors.progressBar,
              width: `${readingProgress}%`,
            },
          ]}
        />
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
            { paddingBottom: Math.max(110, insets.bottom + 95) },
            !showControls && { paddingTop: 28 },
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={false}
          onLayout={event => { viewportHeight.current = event.nativeEvent.layout.height; restoreScroll(); }}
          onContentSizeChange={(_width, height) => {
            contentHeight.current = height;
            if (!userStartedReading.current) hasRestoredScroll.current = false;
            restoreScroll();
          }}
          onScrollBeginDrag={() => { userStartedReading.current = true; hasRestoredScroll.current = true; }}
          onScrollEndDrag={event => { handleScroll(event); progressWriter.current?.flush(); }}
          onMomentumScrollEnd={event => { handleScroll(event); progressWriter.current?.flush(); }}
        >
          {/* Centered Book Spine: Ergonomic line length on both Phones and Tablets */}
          <View style={[styles.bookSpine, { maxWidth: isTablet ? 720 : '100%' }]}>
            {/* Chapter Heading Banner */}
            <Pressable onPress={toggleControls}>
              <View style={[styles.chapterHero, { borderBottomColor: themeColors.border }]}>
                <Text style={[styles.chapterHeroNum, { color: themeColors.primary }]}>
                  CHAPTER {chapter.chapterNumber}
                </Text>
                <Text
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
              onToggleControls={toggleControls} onSelectCharacter={setSelectedCharacter} onOpenIllustration={openIllustration} />

            {/* Co-Reading Community Comments Section */}
            <ChapterCommentsSection key={`${novelId}:${chapterId}`}
              novelId={novelId}
              chapterId={chapterId}
              theme={currentTheme}
            />

            {/* End of Chapter Navigation */}
            <View style={[styles.bottomChapterNav, { borderTopColor: themeColors.border }]}>
              <TouchableOpacity
                style={[
                  styles.navChapterBtn,
                  { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
                  !hasPrev && { opacity: 0.4 },
                ]}
                disabled={!hasPrev}
                onPress={() => goToChapterAt(currentChapterIndex - 1)}
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
                onPress={() => goToChapterAt(currentChapterIndex + 1)}
              >
                <Text style={styles.navChapterBtnNextText}>ตอนถัดไป</Text>
                <ChevronRight size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Floating Bottom Quick Settings Bar (Centered on both Phones & Tablets) */}
      {showControls && (
        <View
          style={[
            styles.floatingBar,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.cardBorder,
              bottom: Math.max(24, insets.bottom + 12),
            },
          ]}
        >
          {/* Typography Settings Button */}
          <TouchableOpacity
            style={[styles.typographyPillBtn, { backgroundColor: themeColors.primaryBg }]}
            onPress={() => setShowTypographyModal(true)}
            activeOpacity={0.7}
          >
            <Type size={16} color={themeColors.primary} />
            <Text numberOfLines={1} style={[styles.typographyBtnText, { color: themeColors.primary }]}>
              {fontFamily === 'System' ? 'ระบบ' : fontFamily} · {fontSize}
            </Text>
          </TouchableOpacity>

          {/* Theme Toggles */}
          <View style={styles.themeGroup}>
            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                currentTheme === 'light' && { borderColor: themeColors.primary, borderWidth: 2 },
              ]}
              onPress={() => handleToggleTheme('light')}
            >
              <Sun size={16} color="#d97706" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                currentTheme === 'sepia' && { borderColor: themeColors.primary, borderWidth: 2 },
              ]}
              onPress={() => handleToggleTheme('sepia')}
            >
              <Coffee size={16} color="#9e432a" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                currentTheme === 'dark' && { borderColor: themeColors.primary, borderWidth: 2 },
              ]}
              onPress={() => handleToggleTheme('dark')}
            >
              <Moon size={16} color="#e26d83" />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
