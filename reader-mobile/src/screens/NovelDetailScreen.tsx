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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, CheckCircle2, DownloadCloud, BookOpen, Trash2 } from 'lucide-react-native';
import { RootStackParamList, Novel, ReaderTheme } from '../types';
import { fetchNovels, getAvailableChapterList, downloadChapterOnDemand } from '../services/api';
import { getSavedTheme, isChapterDownloaded, deleteChapterOffline } from '../services/storage';
import { themes } from '../theme/colors';

type DetailRouteProp = RouteProp<RootStackParamList, 'NovelDetail'>;
type DetailNavProp = NativeStackNavigationProp<RootStackParamList, 'NovelDetail'>;

interface Props {
  route: DetailRouteProp;
  navigation: DetailNavProp;
}

export const NovelDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { novelId } = route.params;
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [downloadedMap, setDownloadedMap] = useState<Record<string, boolean>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ReaderTheme>('light');
  const [loading, setLoading] = useState(true);

  const themeColors = themes[currentTheme];

  useEffect(() => {
    loadData();
  }, [novelId]);

  const loadData = async () => {
    setLoading(true);
    const theme = await getSavedTheme();
    setCurrentTheme(theme);

    const novelList = await fetchNovels();
    const found = novelList.find((n) => n.id === novelId);
    setNovel(found || null);

    const chapterList = getAvailableChapterList(novelId, 25);
    setChapters(chapterList);

    // Check offline download status for each chapter
    const statusMap: Record<string, boolean> = {};
    for (const ch of chapterList) {
      statusMap[ch.id] = await isChapterDownloaded(novelId, ch.id);
    }
    setDownloadedMap(statusMap);
    setLoading(false);
  };

  const handleDownloadChapter = async (chapterId: string) => {
    if (downloadingId) return;
    setDownloadingId(chapterId);
    const success = await downloadChapterOnDemand(novelId, chapterId);
    if (success) {
      setDownloadedMap((prev) => ({ ...prev, [chapterId]: true }));
    } else {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถดาวน์โหลดตอนได้ กรุณาตรวจสอบอินเทอร์เน็ต');
    }
    setDownloadingId(null);
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (chapterId === 'ch-01') {
      Alert.alert('คำเตือน', 'ตอนที่ 1 เป็นตอนตั้งต้นของระบบ ไม่สามารถลบได้');
      return;
    }
    await deleteChapterOffline(novelId, chapterId);
    setDownloadedMap((prev) => ({ ...prev, [chapterId]: false }));
  };

  const handleDownloadAll = async () => {
    if (isDownloadingAll) return;
    setIsDownloadingAll(true);
    let count = 0;
    for (const ch of chapters) {
      if (!downloadedMap[ch.id]) {
        setDownloadingId(ch.id);
        const ok = await downloadChapterOnDemand(novelId, ch.id);
        if (ok) {
          setDownloadedMap((prev) => ({ ...prev, [ch.id]: true }));
          count++;
        }
      }
    }
    setDownloadingId(null);
    setIsDownloadingAll(false);
    Alert.alert('ดาวน์โหลดสำเร็จ', `ดาวน์โหลดเพิ่ม ${count} ตอนเรียบร้อยแล้ว อ่านออฟไลน์ได้ทันที!`);
  };

  const downloadedCount = Object.values(downloadedMap).filter(Boolean).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar
        barStyle={themeColors.statusBar === 'dark' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />

      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]} numberOfLines={1}>
          {novel?.title || 'รายละเอียดนิยาย'}
        </Text>
      </View>

      {loading || !novel ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Novel Info Banner */}
          <View style={styles.novelInfoCard}>
            <Image
              source={{
                uri: novel.coverUrl.startsWith('http')
                  ? novel.coverUrl
                  : `https://phongsathondev.github.io/Yomiori/${novel.coverUrl.replace(/^\//, '')}`,
              }}
              style={styles.coverImage}
            />

            <View style={styles.infoRight}>
              <Text style={[styles.title, { color: themeColors.text }]}>{novel.title}</Text>
              <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                ผู้แต่ง: {novel.author}
              </Text>
              <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                ผู้แปล: {novel.translator || 'ไม่ระบุ'}
              </Text>

              {/* Offline stats */}
              <View style={[styles.offlineStatusBar, { backgroundColor: themeColors.primaryBg }]}>
                <DownloadCloud size={14} color={themeColors.primary} />
                <Text style={[styles.offlineStatsText, { color: themeColors.primary }]}>
                  ออฟไลน์ในเครื่อง: {downloadedCount}/{chapters.length} ตอน
                </Text>
              </View>
            </View>
          </View>

          {/* Download All Button */}
          <TouchableOpacity
            style={[
              styles.downloadAllBtn,
              {
                backgroundColor: isDownloadingAll ? themeColors.border : themeColors.primary,
              },
            ]}
            onPress={handleDownloadAll}
            disabled={isDownloadingAll || downloadedCount === chapters.length}
          >
            {isDownloadingAll ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <DownloadCloud size={18} color="#ffffff" />
            )}
            <Text style={styles.downloadAllBtnText}>
              {downloadedCount === chapters.length
                ? 'ดาวน์โหลดครบทุกตอนแล้ว (อ่านออฟไลน์ได้ 100%)'
                : isDownloadingAll
                ? `กำลังดาวน์โหลด... (${downloadingId})`
                : 'ดาวน์โหลดทุกตอนไว้อ่านออฟไลน์'}
            </Text>
          </TouchableOpacity>

          {/* Synopsis */}
          <View style={[styles.synopsisCard, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
            <Text style={[styles.synopsisTitle, { color: themeColors.text }]}>เรื่องย่อ</Text>
            <Text style={[styles.synopsisBody, { color: themeColors.narrationText }]}>
              {novel.synopsis}
            </Text>
          </View>

          {/* Chapters List */}
          <Text style={[styles.chaptersHeading, { color: themeColors.text }]}>
            รายการตอน ({chapters.length})
          </Text>

          {chapters.map((ch) => {
            const isDownloaded = downloadedMap[ch.id];
            const isDownloading = downloadingId === ch.id;

            return (
              <View
                key={ch.id}
                style={[
                  styles.chapterItem,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.cardBorder,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.chapterTouch}
                  onPress={() =>
                    navigation.navigate('Reader', {
                      novelId: novel.id,
                      chapterId: ch.id,
                    })
                  }
                >
                  <View style={[styles.chapterNumBadge, { backgroundColor: themeColors.primaryBg }]}>
                    <Text style={[styles.chapterNumText, { color: themeColors.primary }]}>
                      {ch.chapterNumber}
                    </Text>
                  </View>
                  <View style={styles.chapterTitles}>
                    <Text style={[styles.chapterTitle, { color: themeColors.text }]}>
                      ตอนที่ {ch.chapterNumber}
                    </Text>
                    <Text style={[styles.chapterSubTitle, { color: themeColors.textMuted }]}>
                      {isDownloaded ? 'พร้อมอ่านออฟไลน์' : 'ยังไม่ได้ดาวน์โหลด'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Download / Status Action */}
                <View style={styles.chapterActions}>
                  {isDownloading ? (
                    <ActivityIndicator size="small" color={themeColors.primary} />
                  ) : isDownloaded ? (
                    <View style={styles.downloadedGroup}>
                      <CheckCircle2 size={20} color="#10b981" />
                      {ch.id !== 'ch-01' && (
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteChapter(ch.id)}
                        >
                          <Trash2 size={16} color={themeColors.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.downloadIconBtn, { backgroundColor: themeColors.primaryBg }]}
                      onPress={() => handleDownloadChapter(ch.id)}
                    >
                      <DownloadCloud size={18} color={themeColors.primary} />
                    </TouchableOpacity>
                  )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  novelInfoCard: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  coverImage: {
    width: 100,
    height: 145,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  infoRight: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    marginBottom: 2,
  },
  offlineStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  offlineStatsText: {
    fontSize: 11,
    fontWeight: '600',
  },
  downloadAllBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  downloadAllBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  synopsisCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  synopsisTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  synopsisBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  chaptersHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  chapterTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chapterNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chapterTitles: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  chapterSubTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  chapterActions: {
    paddingLeft: 8,
  },
  downloadedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteBtn: {
    padding: 4,
  },
  downloadIconBtn: {
    padding: 8,
    borderRadius: 8,
  },
});
