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
import { BookOpen, Sparkles, DownloadCloud, ChevronRight } from 'lucide-react-native';
import { Novel, RootStackParamList, ReaderTheme, ReadingProgress } from '../types';
import { fetchNovels } from '../services/api';
import { getSavedTheme, getReadingProgress } from '../services/storage';
import { themes } from '../theme/colors';

type BookshelfNavProp = NativeStackNavigationProp<RootStackParamList, 'Bookshelf'>;

interface Props {
  navigation: BookshelfNavProp;
}

export const BookshelfScreen: React.FC<Props> = ({ navigation }) => {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<ReaderTheme>('light');
  const [lastProgress, setLastProgress] = useState<Record<string, ReadingProgress | null>>({});

  const themeColors = themes[currentTheme];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const theme = await getSavedTheme();
    setCurrentTheme(theme);

    const novelList = await fetchNovels();
    setNovels(novelList);

    const progMap: Record<string, ReadingProgress | null> = {};
    for (const n of novelList) {
      progMap[n.id] = await getReadingProgress(n.id);
    }
    setLastProgress(progMap);
    setLoading(false);
  };

  const getCoverSource = (coverUrl: string) => {
    if (coverUrl.startsWith('http')) {
      return { uri: coverUrl };
    }
    // GitHub Pages absolute CDN URL for cover
    return { uri: `https://phongsathondev.github.io/Yomiori/${coverUrl.replace(/^\//, '')}` };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar
        barStyle={themeColors.statusBar === 'dark' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />

      {/* App Header */}
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

        <View style={[styles.offlineBadge, { backgroundColor: themeColors.primaryBg }]}>
          <DownloadCloud size={14} color={themeColors.primary} />
          <Text style={[styles.offlineBadgeText, { color: themeColors.primary }]}>Offline-Ready</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>กำลังโหลดคลังนิยาย...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionHeading, { color: themeColors.text }]}>นิยายทั้งหมดในคลัง</Text>

          {novels.map((novel) => {
            const progress = lastProgress[novel.id];
            const currentChapterId = progress?.chapterId || 'ch-01';

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
                <View style={styles.cardTop}>
                  <Image
                    source={getCoverSource(novel.coverUrl)}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />

                  <View style={styles.cardInfo}>
                    <Text style={[styles.novelTitle, { color: themeColors.text }]} numberOfLines={2}>
                      {novel.title}
                    </Text>
                    {novel.originalTitle && (
                      <Text style={[styles.novelOrigTitle, { color: themeColors.textMuted }]} numberOfLines={1}>
                        {novel.originalTitle}
                      </Text>
                    )}

                    <View style={styles.authorBadgeRow}>
                      <Text style={[styles.authorText, { color: themeColors.textMuted }]}>
                        ผู้แต่ง: {novel.author}
                      </Text>
                    </View>

                    {/* Tags */}
                    <View style={styles.tagsContainer}>
                      {novel.tags?.slice(0, 3).map((tag, idx) => (
                        <View
                          key={idx}
                          style={[styles.tagBadge, { backgroundColor: themeColors.primaryBg }]}
                        >
                          <Text style={[styles.tagText, { color: themeColors.primary }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Synopsis */}
                <Text style={[styles.synopsisText, { color: themeColors.narrationText }]} numberOfLines={3}>
                  {novel.synopsis}
                </Text>

                {/* Card Actions */}
                <View style={[styles.cardActions, { borderTopColor: themeColors.border }]}>
                  <TouchableOpacity
                    style={[styles.continueButton, { backgroundColor: themeColors.primary }]}
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
                    <Text style={[styles.detailButtonText, { color: themeColors.text }]}>ตอนทั้งหมด</Text>
                    <ChevronRight size={16} color={themeColors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appKanji: {
    fontSize: 16,
    fontWeight: '500',
  },
  appSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  novelCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
  },
  coverImage: {
    width: 100,
    height: 140,
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
    fontSize: 12,
    marginTop: 2,
  },
  authorBadgeRow: {
    marginTop: 6,
  },
  authorText: {
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  synopsisText: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 13,
    lineHeight: 19,
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
    fontSize: 13,
    fontWeight: '500',
  },
});
