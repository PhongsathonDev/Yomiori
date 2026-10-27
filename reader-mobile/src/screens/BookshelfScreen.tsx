import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  BookOpen,
  ChevronRight,
  Play,
  Sun,
  Moon,
  Coffee,
} from 'lucide-react-native';
import { Novel, RootStackParamList, ReaderTheme, ReadingProgress, Character } from '../types';
import { fetchNovels, fetchCharacters, getAvailableChapterList } from '../services/api';
import {
  getSavedTheme,
  saveTheme,
  getReadingProgress,
  isChapterDownloaded,
} from '../services/storage';
import { themes } from '../theme/colors';
import bundledNovels from '../data/novels.json';
import { ScreenState } from '../components/ScreenState';
import { BookCover } from '../components/BookCover';
import { CharacterDetailModal, getAvatarSource } from '../components/CharacterDetailModal';

type BookshelfNavProp = NativeStackNavigationProp<RootStackParamList, 'Bookshelf'>;

interface Props {
  navigation: BookshelfNavProp;
}

export const BookshelfScreen: React.FC<Props> = ({ navigation }) => {
  const [novels, setNovels] = useState<Novel[]>(bundledNovels as Novel[]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const activeRequest = useRef(0);
  const mounted = useRef(false);
  const [currentTheme, setCurrentTheme] = useState<ReaderTheme>('light');
  const [lastProgress, setLastProgress] = useState<Record<string, ReadingProgress | null>>({});
  const [charactersMap, setCharactersMap] = useState<Record<string, Character[]>>({});
  const [downloadCountMap, setDownloadCountMap] = useState<Record<string, number>>({});
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const themeColors = themes[currentTheme];

  const loadData = useCallback(async (isActive: () => boolean) => {
    try {
      const [theme, cached] = await Promise.all([getSavedTheme(), fetchNovels(true)]);
      if (!isActive()) return;
      setCurrentTheme(theme);
      const loadExtras = async (novelList: Novel[]) => {
        await Promise.all(novelList.map(async novel => {
          const progress = await getReadingProgress(novel.id);
          if (!isActive()) return;
          setLastProgress(previous => ({ ...previous, [novel.id]: progress }));
          const [characters, chapters] = await Promise.all([
            fetchCharacters(novel.id, true), getAvailableChapterList(novel.id, true),
          ]);
          const statuses = await Promise.all(chapters.map(ch => ch.offlineStatus !== undefined ? Promise.resolve(ch.offlineStatus !== 'missing') : isChapterDownloaded(novel.id, ch.id)));
          if (!isActive()) return;
          setCharactersMap(previous => ({ ...previous, [novel.id]: characters }));
          setDownloadCountMap(previous => ({ ...previous, [novel.id]: statuses.filter(Boolean).length }));
        }));
      };
      const initialNovels = cached ?? bundledNovels as Novel[];
      setNovels(initialNovels);
      setLoading(false);
      // Progress comes from disk immediately, independently of catalog refresh.
      void loadExtras(initialNovels).catch(() => { if (isActive()) setError(true); });
      const freshNovels = await fetchNovels();
      if (!isActive()) return;
      setNovels(freshNovels);
      setError(false);
      await loadExtras(freshNovels);
    } catch {
      if (isActive()) { setError(true); setLoading(false); }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const refresh = () => {
      const request = ++activeRequest.current;
      void loadData(() => mounted.current && request === activeRequest.current);
    };
    const unsubscribe = navigation.addListener('focus', refresh);
    refresh();
    return () => { mounted.current = false; unsubscribe(); };
  }, [navigation, loadData]);

  const retry = () => {
    setLoading(true);
    const request = ++activeRequest.current;
    void loadData(() => mounted.current && request === activeRequest.current);
  };

  const handleToggleTheme = async () => {
    const nextTheme: ReaderTheme =
      currentTheme === 'light' ? 'sepia' : currentTheme === 'sepia' ? 'dark' : 'light';
    setCurrentTheme(nextTheme);
    await saveTheme(nextTheme).catch(() => setError(true));
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    const request = ++activeRequest.current;
    try {
      await loadData(() => mounted.current && request === activeRequest.current);
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  };

  // Find most recent novel & chapter read
  const mostRecentProgress = Object.entries(lastProgress)
    .filter(([novelId, progress]) => progress !== null && novels.some(novel => novel.id === novelId))
    .sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0))[0];

  const continueNovel = mostRecentProgress
    ? novels.find((n) => n.id === mostRecentProgress[0]) || novels[0]
    : novels[0];

  const continueChapterId = (mostRecentProgress ? mostRecentProgress[1]?.chapterId : null) || 'ch-01';
  const continuePercent = mostRecentProgress ? Math.round(mostRecentProgress[1]?.scrollPercent || 0) : 0;

  // Collect all unique tags
  const allTags = Array.from(new Set(novels.flatMap((n) => n.tags || [])));

  // Filter novels by tag
  const filteredNovels =
    selectedTag === 'all'
      ? novels
      : novels.filter((n) => n.tags?.includes(selectedTag));


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar
        barStyle={themeColors.statusBar === 'dark' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />
      <NavigationBar hidden={false} style={currentTheme === 'dark' ? 'dark' : 'light'} />

      {/* Top App Header with Theme Switcher */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <View style={styles.headerInner}>
          <View style={styles.titleRow}>
            <Text style={[styles.appTitle, { color: themeColors.primary }]}>Yomiori</Text>
            <Text style={[styles.appKanji, { color: themeColors.textMuted }]}> 読織</Text>
          </View>

          {/* Theme Quick Toggle */}
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: themeColors.primaryBg }]}
            onPress={handleToggleTheme}
          >
            {currentTheme === 'light' && <Sun size={17} color="#d97706" />}
            {currentTheme === 'sepia' && <Coffee size={17} color="#9e432a" />}
            {currentTheme === 'dark' && <Moon size={17} color="#e26d83" />}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>
            กำลังโหลด...
          </Text>
        </View>
      ) : error && novels.length === 0 ? (
        <ScreenState colors={themeColors} message="โหลดชั้นหนังสือไม่ได้ กรุณาลองอีกครั้ง" onRetry={retry} />
      ) : novels.length === 0 ? (
        <ScreenState colors={themeColors} message="ยังไม่มีนิยายในชั้นหนังสือ" onRetry={retry} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void handleRefresh(); }} tintColor={themeColors.primary} colors={[themeColors.primary]} />}
        >
          {/* HERO: CONTINUE READING CARD */}
          {continueNovel && (
            <TouchableOpacity
              style={[
                styles.heroCard,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.cardBorder,
                },
              ]}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate('Reader', {
                  novelId: continueNovel.id,
                  chapterId: continueChapterId,
                })
              }
            >
              <View style={styles.heroTopRow}>
                <BookCover uri={continueNovel.coverUrl} style={styles.heroCover} />

                <View style={styles.heroInfo}>
                  <Text style={[styles.heroSectionLabel, { color: themeColors.primary }]}>
                    อ่านต่อ
                  </Text>
                  <Text style={[styles.heroNovelTitle, { color: themeColors.text }]} numberOfLines={1}>
                    {continueNovel.title.split('ผม')[0].trim()}
                  </Text>
                  <Text style={[styles.heroChapterTitle, { color: themeColors.textMuted }]} numberOfLines={1}>
                    {continueChapterId.replace('ch-', 'ตอนที่ ')}
                    {continuePercent > 0 ? ` • ${continuePercent}%` : ''}
                  </Text>

                  {/* Reading Progress Bar */}
                  <View style={[styles.heroProgressBarTrack, { backgroundColor: themeColors.progressTrack }]}>
                    <View
                      style={[
                        styles.heroProgressBarFill,
                        {
                          backgroundColor: themeColors.progressBar,
                          width: `${Math.max(4, continuePercent)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={[styles.heroPlayButton, { backgroundColor: themeColors.primary }]}>
                  <Play size={16} color="#ffffff" fill="#ffffff" />
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* SECTION HEADER */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: themeColors.text }]}>
              ชั้นหนังสือ
            </Text>
          </View>

          {/* HORIZONTAL TAG FILTER CHIPS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.tagChip,
                {
                  backgroundColor: selectedTag === 'all' ? themeColors.primary : themeColors.card,
                  borderColor: selectedTag === 'all' ? themeColors.primary : themeColors.border,
                },
              ]}
              onPress={() => setSelectedTag('all')}
            >
              <Text
                style={[
                  styles.tagChipText,
                  { color: selectedTag === 'all' ? '#ffffff' : themeColors.textMuted },
                ]}
              >
                ทั้งหมด ({novels.length})
              </Text>
            </TouchableOpacity>

            {allTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: selectedTag === tag ? themeColors.primary : themeColors.card,
                    borderColor: selectedTag === tag ? themeColors.primary : themeColors.border,
                  },
                ]}
                onPress={() => setSelectedTag(tag)}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    { color: selectedTag === tag ? '#ffffff' : themeColors.textMuted },
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredNovels.length === 0 && <ScreenState colors={themeColors} message="ไม่มีนิยายในหมวดนี้" onBack={() => setSelectedTag('all')} backLabel="ดูทั้งหมด" />}
          {error && <ScreenState colors={themeColors} message="รีเฟรชข้อมูลบางส่วนไม่ได้" onRetry={retry} />}
          {/* NOVELS LIST CARDS */}
          {filteredNovels.map((novel) => {
            const progress = lastProgress[novel.id];
            const currentChapterId = progress?.chapterId || 'ch-01';
            const chars = charactersMap[novel.id] || [];
            const downloadedCount = downloadCountMap[novel.id] || 0;

            return (
              <View
                key={novel.id}
                style={[
                  styles.novelCard,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.cardBorder,
                  },
                ]}
              >
                {/* Main Card Content */}
                <View style={styles.cardTop}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('NovelDetail', { novelId: novel.id })}
                  >
                    <BookCover uri={novel.coverUrl} style={styles.coverImage} />
                  </TouchableOpacity>

                  <View style={styles.cardInfo}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('NovelDetail', { novelId: novel.id })}
                    >
                      <Text style={[styles.novelTitle, { color: themeColors.text }]} numberOfLines={2}>
                        {novel.title}
                      </Text>
                    </TouchableOpacity>

                    {novel.originalTitle && (
                      <Text style={[styles.novelOrigTitle, { color: themeColors.textMuted }]} numberOfLines={1}>
                        {novel.originalTitle}
                      </Text>
                    )}

                    {/* Metadata & Author */}
                    <View style={styles.authorBadgeRow}>
                      <Text style={[styles.authorText, { color: themeColors.textMuted }]}>
                        {novel.author}
                      </Text>
                      <Text style={[styles.metaDivider, { color: themeColors.border }]}>•</Text>
                      <Text style={[styles.authorText, { color: themeColors.textMuted }]}>
                        25 ตอน
                      </Text>
                      {downloadedCount > 0 && (
                        <>
                          <Text style={[styles.metaDivider, { color: themeColors.border }]}>•</Text>
                          <Text style={[styles.authorText, { color: themeColors.primary }]}>
                            ในเครื่อง {downloadedCount} ตอน
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                {/* Character Roster Avatar Stack */}
                {chars.length > 0 && (
                  <View style={[styles.characterRosterSection, { borderTopColor: themeColors.border }]}>
                    <Text style={[styles.rosterHeadingText, { color: themeColors.textMuted }]}>
                      ตัวละคร
                    </Text>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.avatarRow}
                    >
                      {chars.slice(0, 6).map((c) => {
                        const avatarSrc = getAvatarSource(c.avatarUrl);
                        const cColor = c.color || themeColors.primary;

                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[
                              styles.charAvatarPill,
                              { backgroundColor: themeColors.background, borderColor: cColor },
                            ]}
                            activeOpacity={0.7}
                            onPress={() => setSelectedCharacter(c)}
                          >
                            {avatarSrc ? (
                              <Image source={avatarSrc} style={styles.rosterAvatar} />
                            ) : (
                              <View
                                style={[
                                  styles.rosterAvatarPlaceholder,
                                  { backgroundColor: `${cColor}20` },
                                ]}
                              >
                                <Text style={[styles.rosterInitial, { color: cColor }]}>
                                  {c.name.charAt(0)}
                                </Text>
                              </View>
                            )}
                            <Text style={[styles.rosterName, { color: themeColors.text }]} numberOfLines={1}>
                              {c.name.split(' ')[0]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Synopsis */}
                <Text style={[styles.synopsisText, { color: themeColors.narrationText }]} numberOfLines={3}>
                  {novel.synopsis}
                </Text>

                {/* Card Bottom Actions */}
                <View style={[styles.cardActions, { borderTopColor: themeColors.border }]}>
                  <TouchableOpacity
                    style={[styles.continueButton, { backgroundColor: themeColors.primary }]}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate('Reader', {
                        novelId: novel.id,
                        chapterId: currentChapterId,
                      })
                    }
                  >
                    <BookOpen size={16} color="#ffffff" />
                    <Text style={styles.continueButtonText}>
                      {progress ? `อ่านต่อ ${progress.chapterId.replace('ch-', 'ตอนที่ ')}` : 'เริ่มอ่าน'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailButton, { borderColor: themeColors.border }]}
                    onPress={() =>
                      navigation.navigate('NovelDetail', {
                        novelId: novel.id,
                      })
                    }
                  >
                    <Text style={[styles.detailButtonText, { color: themeColors.text }]}>
                      สารบัญ
                    </Text>
                    <ChevronRight size={16} color={themeColors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Character Profile Modal (Accessible directly from Home!) */}
      <CharacterDetailModal
        visible={!!selectedCharacter}
        character={selectedCharacter}
        theme={currentTheme}
        onClose={() => setSelectedCharacter(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerInner: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appKanji: {
    fontSize: 15,
    fontWeight: '600',
  },
  appSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  offlineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    padding: 18,
    paddingBottom: 40,
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
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroCover: {
    width: 52,
    height: 74,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  heroInfo: {
    flex: 1,
  },
  heroSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  heroNovelTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  heroChapterTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  heroProgressBarTrack: {
    height: 3,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  heroProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  heroPlayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubHeading: {
    fontSize: 12,
    marginTop: 2,
  },
  tagScrollContent: {
    gap: 8,
    paddingBottom: 16,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  novelCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
  },
  coverImage: {
    width: 95,
    height: 135,
    borderRadius: 10,
    backgroundColor: '#e2d9cd',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  novelTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  novelOrigTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  authorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaDivider: {
    marginHorizontal: 2,
    fontSize: 10,
  },
  characterRosterSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rosterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rosterHeadingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rosterHint: {
    fontSize: 10,
  },
  avatarRow: {
    gap: 8,
    paddingVertical: 2,
  },
  charAvatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  rosterAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  rosterAvatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosterInitial: {
    fontSize: 10,
    fontWeight: '700',
  },
  rosterName: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 70,
  },
  synopsisText: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontSize: 12,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  continueButton: {
    flex: 1.2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  detailButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
