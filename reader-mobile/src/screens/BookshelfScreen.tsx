import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
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
import { radius, shadowSoft, space, typeScale } from '../theme/layout';
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
  const [chapterCountMap, setChapterCountMap] = useState<Record<string, number>>({});
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
          setChapterCountMap(previous => ({ ...previous, [novel.id]: chapters.length }));
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
      <StatusBar style={themeColors.statusBar === 'dark' ? 'dark' : 'light'} />
      <NavigationBar hidden={false} style={currentTheme === 'dark' ? 'dark' : 'light'} />

      {/* Wordmark on plain paper — no bar, no rule, just the name. */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.titleRow}>
            <Text style={[styles.appTitle, { color: themeColors.primary }]}>Yomiori</Text>
            <Text style={[styles.appKanji, { color: themeColors.textFaint }]}>読織</Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="เปลี่ยนธีมการอ่าน"
            style={[styles.themeBtn, { backgroundColor: themeColors.card, borderColor: themeColors.borderStrong }]}
            onPress={handleToggleTheme}
            activeOpacity={0.7}
          >
            {currentTheme === 'light' && <Sun size={16} color={themeColors.primary} />}
            {currentTheme === 'sepia' && <Coffee size={16} color={themeColors.primary} />}
            {currentTheme === 'dark' && <Moon size={16} color={themeColors.primary} />}
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
          {/* Continue reading: the newest page in the book, marked with a spine. */}
          {continueNovel && (
            <TouchableOpacity
              style={[styles.heroCard, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
              activeOpacity={0.92}
              onPress={() =>
                navigation.navigate('Reader', {
                  novelId: continueNovel.id,
                  chapterId: continueChapterId,
                })
              }
            >
              <View style={[styles.heroSpine, { backgroundColor: themeColors.primary }]} />
              <BookCover uri={continueNovel.coverUrl} style={styles.heroCover} />

              <View style={styles.heroInfo}>
                <View style={styles.heroTopRow}>
                  <Text style={[styles.heroLabel, { color: themeColors.primary, backgroundColor: themeColors.primaryBg }]}>
                    อ่านต่อ
                  </Text>
                  {continuePercent > 0 ? (
                    <Text style={[styles.heroPercent, { color: themeColors.textFaint }]}>{continuePercent}%</Text>
                  ) : null}
                </View>
                <Text style={[styles.heroNovelTitle, { color: themeColors.text }]} numberOfLines={2}>
                  {continueNovel.title}
                </Text>
                <Text style={[styles.heroChapterTitle, { color: themeColors.textMuted }]} numberOfLines={1}>
                  {continueChapterId.replace('ch-', 'ตอนที่ ')}
                </Text>

                <View style={[styles.heroProgressTrack, { backgroundColor: themeColors.progressTrack }]}>
                  <View
                    style={[
                      styles.heroProgressFill,
                      {
                        backgroundColor: themeColors.progressBar,
                        width: `${Math.max(4, continuePercent)}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={[styles.heroPlayButton, { backgroundColor: themeColors.primary }]}>
                <Play size={14} color={themeColors.onPrimary} fill={themeColors.onPrimary} />
              </View>
            </TouchableOpacity>
          )}

          {/* Shelf heading */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionHeading, { color: themeColors.text }]}>
                ชั้นหนังสือ
              </Text>
              <Text style={[styles.sectionSubHeading, { color: themeColors.textMuted }]}>
                {novels.length} เรื่องในชั้น
              </Text>
            </View>
          </View>

          {/* Tag filters */}
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
                  borderColor: selectedTag === 'all' ? themeColors.primary : themeColors.borderStrong,
                },
              ]}
              onPress={() => setSelectedTag('all')}
            >
              <Text
                style={[
                  styles.tagChipText,
                  { color: selectedTag === 'all' ? themeColors.onPrimary : themeColors.textMuted },
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
                    borderColor: selectedTag === tag ? themeColors.primary : themeColors.borderStrong,
                  },
                ]}
                onPress={() => setSelectedTag(tag)}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    { color: selectedTag === tag ? themeColors.onPrimary : themeColors.textMuted },
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredNovels.length === 0 && <ScreenState colors={themeColors} message="ไม่มีนิยายในหมวดนี้" onBack={() => setSelectedTag('all')} backLabel="ดูทั้งหมด" />}
          {error && <ScreenState colors={themeColors} message="รีเฟรชข้อมูลบางส่วนไม่ได้" onRetry={retry} />}

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
                  { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
                ]}
              >
                <View style={styles.cardTop}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('NovelDetail', { novelId: novel.id })}
                  >
                    <BookCover uri={novel.coverUrl} style={[styles.coverImage, { borderColor: themeColors.border }]} />
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
                      <Text style={[styles.novelOrigTitle, { color: themeColors.textFaint }]} numberOfLines={1}>
                        {novel.originalTitle}
                      </Text>
                    )}

                    <View style={styles.authorBadgeRow}>
                      <Text style={[styles.authorText, { color: themeColors.textMuted }]}>
                        {novel.author}
                      </Text>
                      <Text style={[styles.metaDivider, { color: themeColors.textFaint }]}>·</Text>
                      <Text style={[styles.authorText, { color: themeColors.textMuted }]}>
                        {chapterCountMap[novel.id] === undefined ? 'กำลังโหลดจำนวนตอน' : `${chapterCountMap[novel.id]} ตอน`}
                      </Text>
                      {downloadedCount > 0 && (
                        <>
                          <Text style={[styles.metaDivider, { color: themeColors.textFaint }]}>·</Text>
                          <Text style={[styles.authorText, { color: themeColors.primary }]}>
                            ในเครื่อง {downloadedCount} ตอน
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                {chars.length > 0 && (
                  <View style={[styles.characterRosterSection, { borderTopColor: themeColors.border }]}>
                    <Text style={[styles.rosterHeadingText, { color: themeColors.textFaint }]}>
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
                              { backgroundColor: themeColors.backgroundElevated, borderColor: themeColors.border },
                            ]}
                            activeOpacity={0.7}
                            onPress={() => setSelectedCharacter(c)}
                          >
                            {avatarSrc ? (
                              <Image source={avatarSrc} style={[styles.rosterAvatar, { borderColor: cColor }]} />
                            ) : (
                              <View
                                style={[styles.rosterAvatarPlaceholder, { backgroundColor: `${cColor}1f` }]}
                              >
                                <Text style={[styles.rosterInitial, { color: cColor }]}>
                                  {c.name.charAt(0)}
                                </Text>
                              </View>
                            )}
                            <Text style={[styles.rosterName, { color: themeColors.textMuted }]} numberOfLines={1}>
                              {c.name.split(' ')[0]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <Text style={[styles.synopsisText, { color: themeColors.narrationText }]} numberOfLines={3}>
                  {novel.synopsis}
                </Text>

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
                    <BookOpen size={15} color={themeColors.onPrimary} />
                    <Text style={[styles.continueButtonText, { color: themeColors.onPrimary }]}>
                      {progress ? `อ่านต่อ ${progress.chapterId.replace('ch-', 'ตอนที่ ')}` : 'เริ่มอ่าน'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailButton, { borderColor: themeColors.borderStrong }]}
                    onPress={() =>
                      navigation.navigate('NovelDetail', {
                        novelId: novel.id,
                      })
                    }
                  >
                    <Text style={[styles.detailButtonText, { color: themeColors.text }]}>
                      สารบัญ
                    </Text>
                    <ChevronRight size={15} color={themeColors.textFaint} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

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
    paddingTop: space.xs,
    paddingBottom: space.md,
  },
  headerInner: {
    width: '100%',
    maxWidth: 760,
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
    fontSize: typeScale.hero,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  appKanji: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 7,
    letterSpacing: 0.5,
  },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: space.md,
    fontSize: typeScale.caption,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 14,
    marginBottom: space.xl,
    overflow: 'hidden',
    ...shadowSoft,
  },
  heroSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  heroCover: {
    width: 54,
    height: 78,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: space.sm,
  },
  heroLabel: {
    fontSize: typeScale.micro + 0.5,
    fontWeight: '700',
    letterSpacing: 0,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.xs,
    overflow: 'hidden',
  },
  heroPercent: {
    fontSize: typeScale.micro + 0.5,
    fontVariant: ['tabular-nums'],
  },
  heroNovelTitle: {
    fontSize: typeScale.title,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  heroChapterTitle: {
    fontSize: typeScale.caption,
    marginBottom: 9,
  },
  heroProgressTrack: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 1,
  },
  heroPlayButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: space.md,
  },
  sectionHeading: {
    fontSize: typeScale.display,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionSubHeading: {
    fontSize: typeScale.caption,
    marginTop: 3,
  },
  tagScrollContent: {
    gap: space.sm,
    paddingBottom: space.lg,
  },
  tagChip: {
    paddingHorizontal: 13,
    height: 32,
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: typeScale.caption,
    fontWeight: '600',
  },
  novelCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: space.lg,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    padding: 14,
    gap: 14,
  },
  coverImage: {
    width: 86,
    height: 122,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  novelTitle: {
    fontSize: typeScale.title,
    fontWeight: '700',
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  novelOrigTitle: {
    fontSize: typeScale.meta,
    marginTop: 3,
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 5,
  },
  authorText: {
    fontSize: typeScale.caption,
  },
  metaDivider: {
    fontSize: typeScale.caption,
  },
  characterRosterSection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  rosterHeadingText: {
    fontSize: typeScale.meta,
    fontWeight: '600',
    marginBottom: 7,
  },
  avatarRow: {
    gap: 7,
    paddingVertical: 1,
  },
  charAvatarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingLeft: 3,
    paddingRight: 9,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 6,
  },
  rosterAvatar: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  rosterAvatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosterInitial: {
    fontSize: typeScale.micro,
    fontWeight: '700',
  },
  rosterName: {
    fontSize: typeScale.meta + 0.5,
    fontWeight: '600',
    maxWidth: 74,
  },
  synopsisText: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    fontSize: typeScale.body,
    lineHeight: 21,
  },
  cardActions: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    gap: space.sm,
  },
  continueButton: {
    flex: 1.35,
    minHeight: 42,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
    gap: 7,
  },
  continueButtonText: {
    fontSize: typeScale.body,
    fontWeight: '700',
  },
  detailButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: 4,
  },
  detailButtonText: {
    fontSize: typeScale.body,
    fontWeight: '600',
  },
});
