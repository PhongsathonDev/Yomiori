import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  BookOpen,
  Sparkles,
  DownloadCloud,
  ChevronRight,
  Play,
  Users,
  Feather,
  Sun,
  Moon,
  Coffee,
  CheckCircle2,
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
import { CharacterDetailModal, getAvatarSource } from '../components/CharacterDetailModal';

type BookshelfNavProp = NativeStackNavigationProp<RootStackParamList, 'Bookshelf'>;

interface Props {
  navigation: BookshelfNavProp;
}

export const BookshelfScreen: React.FC<Props> = ({ navigation }) => {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<ReaderTheme>('light');
  const [lastProgress, setLastProgress] = useState<Record<string, ReadingProgress | null>>({});
  const [charactersMap, setCharactersMap] = useState<Record<string, Character[]>>({});
  const [downloadCountMap, setDownloadCountMap] = useState<Record<string, number>>({});
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const themeColors = themes[currentTheme];

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    setLoading(true);
    const theme = await getSavedTheme();
    setCurrentTheme(theme);

    const novelList = await fetchNovels();
    setNovels(novelList);

    const progMap: Record<string, ReadingProgress | null> = {};
    const charMap: Record<string, Character[]> = {};
    const dlMap: Record<string, number> = {};

    for (const n of novelList) {
      // Progress
      progMap[n.id] = await getReadingProgress(n.id);

      // Characters
      charMap[n.id] = await fetchCharacters(n.id);

      // Download counts
      const chList = getAvailableChapterList(n.id, 25);
      let downloaded = 0;
      for (const ch of chList) {
        if (await isChapterDownloaded(n.id, ch.id)) {
          downloaded++;
        }
      }
      dlMap[n.id] = downloaded;
    }

    setLastProgress(progMap);
    setCharactersMap(charMap);
    setDownloadCountMap(dlMap);
    setLoading(false);
  };

  const handleToggleTheme = async () => {
    const nextTheme: ReaderTheme =
      currentTheme === 'light' ? 'sepia' : currentTheme === 'sepia' ? 'dark' : 'light';
    setCurrentTheme(nextTheme);
    await saveTheme(nextTheme);
  };

  // Find most recent novel & chapter read
  const mostRecentProgress = Object.entries(lastProgress)
    .filter(([_, p]) => p !== null)
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

  const getCoverSource = (coverUrl: string) => {
    if (coverUrl.startsWith('http')) {
      return { uri: coverUrl };
    }
    return { uri: `https://phongsathondev.github.io/Yomiori/${coverUrl.replace(/^\//, '')}` };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar
        barStyle={themeColors.statusBar === 'dark' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />

      {/* Top App Header with Theme Switcher */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <View>
          <View style={styles.titleRow}>
            <Text style={[styles.appTitle, { color: themeColors.primary }]}>Yomiori</Text>
            <Text style={[styles.appKanji, { color: themeColors.textMuted }]}> (読織)</Text>
          </View>
          <Text style={[styles.appSubtitle, { color: themeColors.textMuted }]}>
            คลังนิยายไลท์โนเวล • ฉบับพกพาออฟไลน์
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          {/* Theme Quick Toggle */}
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: themeColors.primaryBg }]}
            onPress={handleToggleTheme}
          >
            {currentTheme === 'light' && <Sun size={16} color="#d97706" />}
            {currentTheme === 'sepia' && <Coffee size={16} color="#9e432a" />}
            {currentTheme === 'dark' && <Moon size={16} color="#e26d83" />}
          </TouchableOpacity>

          {/* Offline Ready Badge */}
          <View style={[styles.offlineBadge, { backgroundColor: themeColors.primaryBg }]}>
            <DownloadCloud size={13} color={themeColors.primary} />
            <Text style={[styles.offlineBadgeText, { color: themeColors.primary }]}>Offline-Ready</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>
            กำลังโหลดคลังนิยายและข้อมูลตัวละคร...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* HERO: CONTINUE READING CARD (อ่านค้างไว้ล่าสุด) */}
          {continueNovel && (
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.cardBorder,
                },
              ]}
            >
              <View style={styles.heroTopRow}>
                <Image
                  source={getCoverSource(continueNovel.coverUrl)}
                  style={styles.heroCover}
                  resizeMode="cover"
                />

                <View style={styles.heroInfo}>
                  <View style={styles.heroBadgeRow}>
                    <View style={[styles.sparkleBadge, { backgroundColor: themeColors.primaryBg }]}>
                      <Sparkles size={11} color={themeColors.primary} />
                      <Text style={[styles.sparkleBadgeText, { color: themeColors.primary }]}>
                        อ่านค้างไว้ล่าสุด
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.heroNovelTitle, { color: themeColors.text }]} numberOfLines={1}>
                    {continueNovel.title.split('ผม')[0].trim()}
                  </Text>

                  <Text style={[styles.heroChapterTitle, { color: themeColors.textMuted }]} numberOfLines={1}>
                    {continueChapterId.replace('ch-', 'ตอนที่ ')} • อ่านไปแล้ว {continuePercent}%
                  </Text>

                  {/* Reading Progress Bar */}
                  <View style={[styles.heroProgressBarTrack, { backgroundColor: themeColors.progressTrack }]}>
                    <View
                      style={[
                        styles.heroProgressBarFill,
                        {
                          backgroundColor: themeColors.progressBar,
                          width: `${Math.max(5, continuePercent)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.heroPlayButton, { backgroundColor: themeColors.primary }]}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('Reader', {
                    novelId: continueNovel.id,
                    chapterId: continueChapterId,
                  })
                }
              >
                <Play size={15} color="#ffffff" fill="#ffffff" />
                <Text style={styles.heroPlayButtonText}>อ่านต่อทันที</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SECTION HEADER & STATS */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionHeading, { color: themeColors.text }]}>
                ชั้นวางหนังสือ (Bookshelf)
              </Text>
              <Text style={[styles.sectionSubHeading, { color: themeColors.textMuted }]}>
                {novels.length} เรื่อง • พร้อมอ่าน 25 ตอนในระบบ
              </Text>
            </View>
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

          {/* NOVELS LIST CARDS */}
          {filteredNovels.map((novel) => {
            const progress = lastProgress[novel.id];
            const currentChapterId = progress?.chapterId || 'ch-01';
            const chars = charactersMap[novel.id] || [];
            const downloadedCount = downloadCountMap[novel.id] || 0;
            const isFullyDownloaded = downloadedCount >= 25;

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
                    <Image
                      source={getCoverSource(novel.coverUrl)}
                      style={styles.coverImage}
                      resizeMode="cover"
                    />
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
                      <View style={styles.metaRow}>
                        <Feather size={12} color={themeColors.textMuted} />
                        <Text style={[styles.authorText, { color: themeColors.textMuted }]}>
                          ผู้แต่ง: {novel.author}
                        </Text>
                      </View>
                    </View>

                    {/* Stats Badges */}
                    <View style={styles.statsBadgesRow}>
                      <View style={[styles.statBadge, { backgroundColor: themeColors.primaryBg }]}>
                        <BookOpen size={11} color={themeColors.primary} />
                        <Text style={[styles.statBadgeText, { color: themeColors.primary }]}>
                          25 ตอน
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statBadge,
                          {
                            backgroundColor: isFullyDownloaded
                              ? 'rgba(16, 185, 129, 0.12)'
                              : themeColors.primaryBg,
                          },
                        ]}
                      >
                        {isFullyDownloaded ? (
                          <CheckCircle2 size={11} color="#10b981" />
                        ) : (
                          <DownloadCloud size={11} color={themeColors.primary} />
                        )}
                        <Text
                          style={[
                            styles.statBadgeText,
                            { color: isFullyDownloaded ? '#10b981' : themeColors.primary },
                          ]}
                        >
                          {downloadedCount > 0 ? `ออฟไลน์ ${downloadedCount} ตอน` : 'ยังไม่โหลด'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Character Roster Avatar Stack */}
                {chars.length > 0 && (
                  <View style={[styles.characterRosterSection, { borderTopColor: themeColors.border }]}>
                    <View style={styles.rosterHeader}>
                      <View style={styles.rosterHeaderLeft}>
                        <Users size={13} color={themeColors.primary} />
                        <Text style={[styles.rosterHeadingText, { color: themeColors.text }]}>
                          ตัวละครหลักในเรื่อง ({chars.length})
                        </Text>
                      </View>
                      <Text style={[styles.rosterHint, { color: themeColors.textMuted }]}>
                        (แตะรูปเพื่อดูข้อมูล)
                      </Text>
                    </View>

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
                      {progress ? `อ่านต่อ ${progress.chapterId}` : 'เริ่มอ่านตอนที่ 1'}
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
                      สารบัญ & ออฟไลน์
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
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
    marginBottom: 14,
  },
  heroCover: {
    width: 58,
    height: 84,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  heroInfo: {
    flex: 1,
  },
  heroBadgeRow: {
    marginBottom: 4,
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  sparkleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
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
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  heroProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  heroPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  heroPlayButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  authorText: {
    fontSize: 11,
  },
  statsBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statBadgeText: {
    fontSize: 10,
    fontWeight: '700',
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
