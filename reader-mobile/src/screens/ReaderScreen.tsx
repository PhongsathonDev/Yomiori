import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StatusBar,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
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
} from 'lucide-react-native';
import { RootStackParamList, Chapter, Character, DialogueBlock, ReaderTheme, IllustrationBlock } from '../types';
import { getChapter, fetchCharacters, getAvailableChapterList } from '../services/api';
import {
  getSavedTheme,
  saveTheme,
  getSavedFontSize,
  saveFontSize,
  getSavedFontFamily,
  saveFontFamily,
  getSavedLineHeight,
  saveLineHeight,
  saveReadingProgress,
  getReadingProgress,
  getIllustrationUrl,
} from '../services/storage';
import { themes } from '../theme/colors';
import { CharacterDetailModal, getAvatarSource } from '../components/CharacterDetailModal';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
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

/**
 * Ensures dialogue text is neatly formatted with quotes
 * without ever causing double quotes like ““...””
 */
function formatDialogueText(rawText: string): string {
  if (!rawText) return '';
  const trimmed = rawText.trim();

  // If it already starts and ends with paired quotes, return as-is
  if (
    (trimmed.startsWith('“') && trimmed.endsWith('”')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('「') && trimmed.endsWith('」')) ||
    (trimmed.startsWith('『') && trimmed.endsWith('』'))
  ) {
    return trimmed;
  }

  // If it has loose leading/trailing quotes, clean and neatly wrap
  const cleaned = trimmed
    .replace(/^[“”"「」『』]+/, '')
    .replace(/[“”"「」『』]+$/, '')
    .trim();
  return `“${cleaned}”`;
}

export const ReaderScreen: React.FC<Props> = ({ route, navigation }) => {
  const { novelId, chapterId } = route.params;
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 600;
  const insets = useSafeAreaInsets();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [totalChapters, setTotalChapters] = useState(25);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Settings & Immersion
  const [currentTheme, setCurrentTheme] = useState<ReaderTheme>('light');
  const [fontSize, setFontSize] = useState(isTablet ? 19 : 17);
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
  const activeFont = FONT_MAP[fontFamily] || FONT_MAP.Sarabun;

  useEffect(() => {
    loadChapterData();
  }, [novelId, chapterId]);

  const loadChapterData = async () => {
    setLoading(true);
    hasRestoredScroll.current = false;

    const [
      theme,
      savedSize,
      savedFamily,
      savedLH,
      chars,
      chData,
      progress,
      availList,
    ] = await Promise.all([
      getSavedTheme(),
      getSavedFontSize(isTablet ? 19 : 17),
      getSavedFontFamily(),
      getSavedLineHeight(),
      fetchCharacters(novelId),
      getChapter(novelId, chapterId),
      getReadingProgress(novelId),
      getAvailableChapterList(novelId),
    ]);

    setCurrentTheme(theme);
    setFontSize(savedSize);
    setFontFamily((savedFamily as FontOption) || 'Sarabun');
    setLineHeightRatio((savedLH as LineHeightOption) || 1.85);
    setCharacters(chars);
    setChapter(chData);
    setTotalChapters(availList.length > 0 ? availList.length : 25);

    // If reading this chapter previously, queue auto-scroll resume
    if (progress && progress.chapterId === chapterId && progress.scrollPercent > 0) {
      savedProgressPercent.current = progress.scrollPercent;
      setReadingProgress(progress.scrollPercent);
    } else {
      savedProgressPercent.current = 0;
      setReadingProgress(0);
    }

    setLoading(false);
    saveReadingProgress(novelId, chapterId, savedProgressPercent.current);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const totalScrollable = contentSize.height - layoutMeasurement.height;
    if (totalScrollable > 0) {
      const percent = Math.min(100, Math.max(0, (contentOffset.y / totalScrollable) * 100));
      setReadingProgress(percent);
      saveReadingProgress(novelId, chapterId, percent);
    }
  };

  const handleToggleTheme = async (nextTheme: ReaderTheme) => {
    setCurrentTheme(nextTheme);
    await saveTheme(nextTheme);
  };

  const handleChangeFontSize = async (delta: number) => {
    const nextSize = Math.max(14, Math.min(26, fontSize + delta));
    setFontSize(nextSize);
    await saveFontSize(nextSize);
  };

  const handleChangeFontFamily = async (family: FontOption) => {
    setFontFamily(family);
    await saveFontFamily(family);
  };

  const handleChangeLineHeight = async (ratio: LineHeightOption) => {
    setLineHeightRatio(ratio);
    await saveLineHeight(ratio);
  };

  // Character lookup
  const characterMap = React.useMemo(() => {
    const map = new Map<string, Character>();
    characters.forEach((c) => map.set(c.id, c));
    return map;
  }, [characters]);

  // Navigate to other chapters dynamically
  const currentChapterNum = chapter?.chapterNumber || 1;
  const hasPrev = currentChapterNum > 1;
  const hasNext = currentChapterNum < totalChapters;

  const goToChapter = (num: number) => {
    const nextId = `ch-${String(num).padStart(2, '0')}`;
    navigation.replace('Reader', { novelId, chapterId: nextId });
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

      {loading || !chapter ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>
            กำลังเตรียมเนื้อหา...
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(110, insets.bottom + 95) },
            !showControls && { paddingTop: 28 },
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={(_w, h) => {
            // Auto-scroll resume to previous position
            if (!hasRestoredScroll.current && savedProgressPercent.current > 0 && h > 0) {
              const targetY = (savedProgressPercent.current / 100) * (h - 600);
              if (targetY > 0) {
                scrollRef.current?.scrollTo({ y: targetY, animated: false });
              }
              hasRestoredScroll.current = true;
            }
          }}
        >
          {/* Centered Book Spine: Ergonomic line length on both Phones and Tablets */}
          <View style={[styles.bookSpine, { maxWidth: isTablet ? 720 : '100%' }]}>
            {/* Chapter Heading Banner */}
            <Pressable onPress={() => setShowControls((prev) => !prev)}>
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

            {/* Story Blocks */}
            <Pressable onPress={() => setShowControls((prev) => !prev)}>
              {chapter.blocks.map((block) => {
                if (block.type === 'narration') {
                  return (
                    <Text
                      key={block.id}
                      style={[
                        styles.narrationBlock,
                        {
                          color: themeColors.narrationText,
                          fontSize: fontSize,
                          fontFamily: activeFont.regular,
                          lineHeight: fontSize * lineHeightRatio,
                        },
                      ]}
                    >
                      {'\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}{block.text}
                    </Text>
                  );
                }

                if (block.type === 'dialogue') {
                  const dBlock = block as DialogueBlock;
                  const char = characterMap.get(dBlock.speakerId);
                  const charColor = char?.color || themeColors.primary;
                  const avatarSrc = getAvatarSource(char?.avatarUrl);

                  return (
                    <View
                      key={block.id}
                      style={[
                        styles.dialogueNovelCard,
                        {
                          backgroundColor: `${charColor}0a`,
                          borderLeftColor: charColor,
                        },
                      ]}
                    >
                      {/* Speaker Label with Avatar & Role */}
                      <TouchableOpacity
                        style={styles.speakerRow}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (char) {
                            setSelectedCharacter(char);
                          } else {
                            setSelectedCharacter({
                              id: dBlock.speakerId,
                              name: dBlock.speakerName,
                              role: 'ตัวละครประกอบ',
                              color: charColor,
                            });
                          }
                        }}
                      >
                        {avatarSrc ? (
                          <Image
                            source={avatarSrc}
                            style={[styles.speakerAvatar, { borderColor: charColor }]}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.speakerAvatarPlaceholder,
                              { backgroundColor: `${charColor}20`, borderColor: charColor },
                            ]}
                          >
                            <Text style={[styles.speakerInitial, { color: charColor }]}>
                              {dBlock.speakerName.charAt(0)}
                            </Text>
                          </View>
                        )}

                        <View style={styles.speakerTextContainer}>
                          <View style={styles.speakerNameAndRole}>
                            <Text
                              style={[
                                styles.speakerName,
                                {
                                  color: charColor,
                                  fontFamily: activeFont.bold || activeFont.regular,
                                },
                              ]}
                            >
                              {dBlock.speakerName}
                            </Text>
                            {char?.role ? (
                              <View
                                style={[
                                  styles.speakerRoleBadge,
                                  { backgroundColor: `${charColor}15` },
                                ]}
                              >
                                <Text
                                  style={[styles.speakerRoleText, { color: charColor }]}
                                  numberOfLines={1}
                                >
                                  {char.role}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* Dialogue Quote Text with clean single pair of quotes */}
                      <Text
                        style={[
                          styles.dialogueText,
                          {
                            color: themeColors.text,
                            fontSize: fontSize,
                            fontFamily: activeFont.regular,
                            lineHeight: fontSize * (lineHeightRatio * 0.95),
                          },
                        ]}
                      >
                        {formatDialogueText(dBlock.text)}
                      </Text>
                    </View>
                  );
                }

                if (block.type === 'scene_break') {
                  return (
                    <View key={block.id} style={styles.sceneBreakRow}>
                      <View style={[styles.sceneBreakLine, { backgroundColor: themeColors.border }]} />
                      <Text style={[styles.sceneBreakSymbol, { color: themeColors.textMuted }]}>◆</Text>
                      <View style={[styles.sceneBreakLine, { backgroundColor: themeColors.border }]} />
                    </View>
                  );
                }

                if (block.type === 'illustration') {
                  const iBlock = block as IllustrationBlock;
                  const imgUrl = getIllustrationUrl(novelId, iBlock.src);

                  return (
                    <View key={block.id} style={styles.illustrationBlockContainer}>
                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => {
                          setLightboxUrl(imgUrl);
                          setLightboxCaption(iBlock.caption);
                          setLightboxVisible(true);
                        }}
                        style={[
                          styles.illustrationCard,
                          {
                            backgroundColor: themeColors.card,
                            borderColor: themeColors.cardBorder,
                          },
                        ]}
                      >
                        <Image
                          source={{ uri: imgUrl }}
                          style={styles.illustrationImg}
                          resizeMode="cover"
                        />
                        <View style={styles.illustrationFooter}>
                          <Text
                            style={[
                              styles.illustrationCaption,
                              { color: themeColors.narrationText, fontFamily: activeFont.regular },
                            ]}
                          >
                            {iBlock.caption || 'ภาพประกอบนิยาย'}
                          </Text>
                          <Text style={[styles.illustrationZoomHint, { color: themeColors.primary }]}>
                            แตะเพื่อขยาย ↗
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                }

                return null;
              })}
            </Pressable>

            {/* End of Chapter Navigation */}
            <View style={[styles.bottomChapterNav, { borderTopColor: themeColors.border }]}>
              <TouchableOpacity
                style={[
                  styles.navChapterBtn,
                  { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
                  !hasPrev && { opacity: 0.4 },
                ]}
                disabled={!hasPrev}
                onPress={() => goToChapter(currentChapterNum - 1)}
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
                onPress={() => goToChapter(currentChapterNum + 1)}
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
            <Text style={[styles.typographyBtnText, { color: themeColors.primary }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  centeredRow: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitles: {
    flex: 1,
  },
  headerChapterTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressPercentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 2.5,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 110,
  },
  bookSpine: {
    width: '100%',
    alignSelf: 'center',
  },
  chapterHero: {
    paddingBottom: 18,
    marginBottom: 22,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  chapterHeroNum: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  chapterHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 25,
  },
  narrationBlock: {
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  // Classic Novel Dialogue (Soft, Left-border Accent)
  dialogueNovelCard: {
    borderLeftWidth: 3.5,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  speakerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  speakerAvatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerInitial: {
    fontSize: 11,
    fontWeight: '700',
  },
  speakerTextContainer: {
    flex: 1,
  },
  speakerNameAndRole: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  speakerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  speakerRoleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  speakerRoleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dialogueText: {
    fontWeight: '500',
  },
  sceneBreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  sceneBreakLine: {
    flex: 1,
    height: 1,
  },
  sceneBreakSymbol: {
    fontSize: 14,
  },
  bottomChapterNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 24,
    marginTop: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  navChapterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  navChapterBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  navChapterBtnNextText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  floatingBar: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 480,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  typographyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typographyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeOptionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  illustrationBlockContainer: {
    marginVertical: 20,
    width: '100%',
  },
  illustrationCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  illustrationImg: {
    width: '100%',
    height: 340,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  illustrationFooter: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  illustrationCaption: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  illustrationZoomHint: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
