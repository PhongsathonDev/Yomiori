import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  Minus,
  Plus,
  Bookmark,
} from 'lucide-react-native';
import { RootStackParamList, Chapter, Character, DialogueBlock, ReaderTheme } from '../types';
import { getChapter, fetchCharacters } from '../services/api';
import {
  getSavedTheme,
  saveTheme,
  getSavedFontSize,
  saveFontSize,
  saveReadingProgress,
  getReadingProgress,
} from '../services/storage';
import { themes } from '../theme/colors';

type ReaderRouteProp = RouteProp<RootStackParamList, 'Reader'>;
type ReaderNavProp = NativeStackNavigationProp<RootStackParamList, 'Reader'>;

interface Props {
  route: ReaderRouteProp;
  navigation: ReaderNavProp;
}

export const ReaderScreen: React.FC<Props> = ({ route, navigation }) => {
  const { novelId, chapterId } = route.params;
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);

  // Settings
  const [currentTheme, setCurrentTheme] = useState<ReaderTheme>('light');
  const [fontSize, setFontSize] = useState(17);
  const [showControls, setShowControls] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const themeColors = themes[currentTheme];

  useEffect(() => {
    loadChapterData();
  }, [novelId, chapterId]);

  const loadChapterData = async () => {
    setLoading(true);
    const [theme, savedSize, chars, chData, progress] = await Promise.all([
      getSavedTheme(),
      getSavedFontSize(),
      fetchCharacters(novelId),
      getChapter(novelId, chapterId),
      getReadingProgress(novelId),
    ]);

    setCurrentTheme(theme);
    setFontSize(savedSize);
    setCharacters(chars);
    setChapter(chData);
    setLoading(false);

    // Save that user is reading this chapter
    saveReadingProgress(novelId, chapterId, progress?.scrollPercent || 0);
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

  // Character lookup
  const characterMap = React.useMemo(() => {
    const map = new Map<string, Character>();
    characters.forEach((c) => map.set(c.id, c));
    return map;
  }, [characters]);

  // Navigate to other chapters
  const currentChapterNum = chapter?.chapterNumber || 1;
  const hasPrev = currentChapterNum > 1;
  const hasNext = currentChapterNum < 25; // Known chapters up to 25

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

      {/* Top Header / Progress Track */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={themeColors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={[styles.headerChapterTitle, { color: themeColors.text }]} numberOfLines={1}>
            {chapter ? chapter.title : `ตอนที่ ${chapterId}`}
          </Text>
        </View>

        <View style={styles.progressPercentBadge}>
          <Text style={[styles.progressPercentText, { color: themeColors.primary }]}>
            {Math.round(readingProgress)}%
          </Text>
        </View>
      </View>

      {/* Linear Reading Progress Bar */}
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
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={false}
        >
          {/* Chapter Heading Banner */}
          <View style={[styles.chapterHero, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.chapterHeroNum, { color: themeColors.primary }]}>
              CHAPTER {chapter.chapterNumber}
            </Text>
            <Text style={[styles.chapterHeroTitle, { color: themeColors.text }]}>
              {chapter.title}
            </Text>
          </View>

          {/* Story Blocks */}
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
                      lineHeight: fontSize * 1.85,
                    },
                  ]}
                >
                  {block.text}
                </Text>
              );
            }

            if (block.type === 'dialogue') {
              const dBlock = block as DialogueBlock;
              const char = characterMap.get(dBlock.speakerId);
              const charColor = char?.color || themeColors.primary;

              return (
                <View
                  key={block.id}
                  style={[
                    styles.dialogueCard,
                    {
                      backgroundColor: themeColors.dialogueBg,
                      borderColor: themeColors.dialogueBorder,
                    },
                  ]}
                >
                  {/* Speaker Label with accent indicator */}
                  <View style={styles.speakerRow}>
                    <View style={[styles.speakerColorDot, { backgroundColor: charColor }]} />
                    <Text style={[styles.speakerName, { color: charColor }]}>
                      {dBlock.speakerName}
                    </Text>
                  </View>

                  {/* Dialogue Quote Text */}
                  <Text
                    style={[
                      styles.dialogueText,
                      {
                        color: themeColors.text,
                        fontSize: fontSize,
                        lineHeight: fontSize * 1.75,
                      },
                    ]}
                  >
                    {dBlock.text}
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

            return null;
          })}

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
        </ScrollView>
      )}

      {/* Floating Bottom Quick Settings Bar */}
      <View
        style={[
          styles.floatingBar,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.cardBorder,
          },
        ]}
      >
        {/* Font Size Adjusters */}
        <View style={styles.fontSizeGroup}>
          <TouchableOpacity
            style={[styles.miniBtn, { backgroundColor: themeColors.primaryBg }]}
            onPress={() => handleChangeFontSize(-1)}
          >
            <Minus size={14} color={themeColors.primary} />
          </TouchableOpacity>
          <Text style={[styles.fontSizeLabel, { color: themeColors.text }]}>{fontSize}</Text>
          <TouchableOpacity
            style={[styles.miniBtn, { backgroundColor: themeColors.primaryBg }]}
            onPress={() => handleChangeFontSize(1)}
          >
            <Plus size={14} color={themeColors.primary} />
          </TouchableOpacity>
        </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
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
    height: 3,
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
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 110,
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
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  dialogueCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  speakerColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  speakerName: {
    fontSize: 13,
    fontWeight: '700',
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
    left: 20,
    right: 20,
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
  fontSizeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeLabel: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'center',
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
});
