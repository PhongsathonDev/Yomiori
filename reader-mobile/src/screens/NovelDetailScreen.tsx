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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Download,
  Settings2,
  Trash2,
  X,
  HardDrive,
  Check,
} from 'lucide-react-native';
import { RootStackParamList, Novel, ReaderTheme } from '../types';
import { fetchNovels, getAvailableChapterList, downloadChapterOnDemand } from '../services/api';
import {
  getSavedTheme,
  isChapterDownloaded,
  clearNovelOfflineStorage,
  getNovelOfflineStats,
} from '../services/storage';
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

  // Settings & Storage Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [storageStats, setStorageStats] = useState<{ count: number; totalBytes: number }>({
    count: 0,
    totalBytes: 0,
  });

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

    const chapterList = await getAvailableChapterList(novelId);
    setChapters(chapterList);

    // Check offline download status for each chapter
    const statusMap: Record<string, boolean> = {};
    for (const ch of chapterList) {
      statusMap[ch.id] = await isChapterDownloaded(novelId, ch.id);
    }
    setDownloadedMap(statusMap);

    const stats = await getNovelOfflineStats(novelId);
    setStorageStats(stats);

    setLoading(false);
  };

  const refreshStorageStats = async () => {
    const stats = await getNovelOfflineStats(novelId);
    setStorageStats(stats);
  };

  const handleDownloadChapter = async (chapterId: string) => {
    if (downloadingId) return;
    setDownloadingId(chapterId);
    const success = await downloadChapterOnDemand(novelId, chapterId);
    if (success) {
      setDownloadedMap((prev) => ({ ...prev, [chapterId]: true }));
      await refreshStorageStats();
    } else {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถดาวน์โหลดตอนได้ กรุณาตรวจสอบอินเทอร์เน็ต');
    }
    setDownloadingId(null);
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
    await refreshStorageStats();
    Alert.alert('ดาวน์โหลดสำเร็จ', `ดาวน์โหลดเพิ่ม ${count} ตอนเรียบร้อยแล้ว อ่านออฟไลน์ได้ทันที!`);
  };

  const handleClearAllOffline = () => {
    Alert.alert(
      'ล้างข้อมูลออฟไลน์',
      'คุณต้องการลบไฟล์ตอนทั้งหมดที่ดาวน์โหลดไว้ในเครื่องใช่หรือไม่? (ยังสามารถดาวน์โหลดใหม่ได้ตลอดเวลา)',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบข้อมูล',
          style: 'destructive',
          onPress: async () => {
            await clearNovelOfflineStorage(novelId);
            // Re-sync status
            const statusMap: Record<string, boolean> = {};
            for (const ch of chapters) {
              statusMap[ch.id] = await isChapterDownloaded(novelId, ch.id);
            }
            setDownloadedMap(statusMap);
            await refreshStorageStats();
            setShowSettingsModal(false);
            Alert.alert('ลบข้อมูลเรียบร้อย', 'คืนพื้นที่ความจุเครื่องเรียบร้อยแล้ว');
          },
        },
      ]
    );
  };

  const downloadedCount = Object.values(downloadedMap).filter(Boolean).length;
  const remainingCount = Math.max(0, chapters.length - downloadedCount);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar
        barStyle={themeColors.statusBar === 'dark' ? 'dark-content' : 'light-content'}
        backgroundColor={themeColors.background}
      />

      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <View style={styles.headerCenteredRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={themeColors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: themeColors.text }]} numberOfLines={1}>
            {novel?.title || 'รายละเอียดนิยาย'}
          </Text>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              refreshStorageStats();
              setShowSettingsModal(true);
            }}
          >
            <Settings2 size={21} color={themeColors.text} />
          </TouchableOpacity>
        </View>
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

              {/* Clean Offline Counter Badge */}
              <View style={[styles.offlineStatusBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <HardDrive size={13} color={themeColors.textMuted} />
                <Text style={[styles.offlineStatsText, { color: themeColors.textMuted }]}>
                  ออฟไลน์ในเครื่อง: {downloadedCount}/{chapters.length} ตอน
                </Text>
              </View>
            </View>
          </View>

          {/* Synopsis */}
          <View style={[styles.synopsisCard, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
            <Text style={[styles.synopsisTitle, { color: themeColors.text }]}>เรื่องย่อ</Text>
            <Text style={[styles.synopsisBody, { color: themeColors.narrationText }]}>
              {novel.synopsis}
            </Text>
          </View>

          {/* Chapters List Heading */}
          <View style={styles.chaptersHeaderRow}>
            <Text style={[styles.chaptersHeading, { color: themeColors.text }]}>
              สารบัญ ({chapters.length} ตอน)
            </Text>
          </View>

          {/* Chapters Table */}
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
                  activeOpacity={0.7}
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
                    <Text
                      style={[styles.chapterTitle, { color: themeColors.text }]}
                      numberOfLines={2}
                    >
                      {ch.title || `ตอนที่ ${ch.chapterNumber}`}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Right Action: Show download icon only if not downloaded */}
                <View style={styles.chapterActions}>
                  {isDownloading ? (
                    <ActivityIndicator size="small" color={themeColors.primary} />
                  ) : !isDownloaded ? (
                    <TouchableOpacity
                      style={[styles.downloadIconBtn, { backgroundColor: themeColors.primaryBg }]}
                      onPress={() => handleDownloadChapter(ch.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Download size={16} color={themeColors.primary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Storage & Download Management Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}
        >
          <TouchableOpacity
            style={[styles.modalContent, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
            activeOpacity={1}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <HardDrive size={18} color={themeColors.primary} />
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>จัดการข้อมูลออฟไลน์</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSettingsModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Storage Info Card */}
            <View style={[styles.modalInfoBox, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>ตอนที่บันทึกแล้ว:</Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  {downloadedCount} / {chapters.length} ตอน
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>พื้นที่ในเครื่องที่ใช้:</Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  {formatFileSize(storageStats.totalBytes)}
                </Text>
              </View>
            </View>

            {/* Action 1: Download All */}
            <TouchableOpacity
              style={[
                styles.modalActionBtn,
                {
                  backgroundColor: remainingCount === 0 ? themeColors.border : themeColors.primary,
                  opacity: remainingCount === 0 || isDownloadingAll ? 0.6 : 1,
                },
              ]}
              onPress={handleDownloadAll}
              disabled={remainingCount === 0 || isDownloadingAll}
            >
              {isDownloadingAll ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : remainingCount === 0 ? (
                <Check size={18} color="#ffffff" />
              ) : (
                <Download size={18} color="#ffffff" />
              )}
              <Text style={styles.modalActionBtnText}>
                {remainingCount === 0
                  ? 'ดาวน์โหลดครบทุกตอนแล้ว'
                  : isDownloadingAll
                  ? `กำลังดาวน์โหลด... (${downloadingId})`
                  : `ดาวน์โหลดทุกตอนที่เหลือ (${remainingCount} ตอน)`}
              </Text>
            </TouchableOpacity>

            {/* Action 2: Clear Offline Storage */}
            <TouchableOpacity
              style={[
                styles.modalDestructiveBtn,
                {
                  borderColor: '#ef444433',
                  backgroundColor: '#ef444410',
                  opacity: storageStats.count === 0 ? 0.4 : 1,
                },
              ]}
              onPress={handleClearAllOffline}
              disabled={storageStats.count === 0}
            >
              <Trash2 size={16} color="#ef4444" />
              <Text style={styles.modalDestructiveText}>ลบไฟล์ออฟไลน์ทั้งหมดของเรื่องนี้</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerCenteredRow: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
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
    marginBottom: 3,
  },
  offlineStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  offlineStatsText: {
    fontSize: 11,
    fontWeight: '500',
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
  chaptersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chaptersHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chapterTitles: {
    flex: 1,
    paddingRight: 8,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  chapterActions: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadIconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalInfoBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalDestructiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalDestructiveText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
