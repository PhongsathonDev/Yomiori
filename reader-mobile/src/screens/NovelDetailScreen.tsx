import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
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
  BookOpen,
  Images,
  Sparkles,
  Users,
} from 'lucide-react-native';
import { RootStackParamList, Novel, ReaderTheme, IllustrationItem, Character, ChapterListItem, ChapterOfflineStatus } from '../types';
import {
  fetchNovels,
  getAvailableChapterList,
  downloadChapterOnDemand,
  fetchIllustrations,
  fetchCharacters,
} from '../services/api';
import {
  getSavedTheme,
  readMetadata,
  getChapterOfflineStatus,
  withOfflineJob,
  clearNovelOfflineStorage,
  getNovelOfflineStats,
  getIllustrationUrl,
} from '../services/storage';
import { ImageLightboxModal } from '../components/ImageLightboxModal';
import { themes } from '../theme/colors';
import { isNovelList } from '../services/validation';
import bundledNovels from '../data/novels.json';
import { BookCover } from '../components/BookCover';
import { ScreenState } from '../components/ScreenState';
import { OfflineImage } from '../components/OfflineImage';

type DetailRouteProp = RouteProp<RootStackParamList, 'NovelDetail'>;
type DetailNavProp = NativeStackNavigationProp<RootStackParamList, 'NovelDetail'>;

interface Props {
  route: DetailRouteProp;
  navigation: DetailNavProp;
}

export const NovelDetailScreen: React.FC<Props> = props => (
  <NovelDetailContent key={props.route.params.novelId} {...props} />
);

const NovelDetailContent: React.FC<Props> = ({ route, navigation }) => {
  const { novelId } = route.params;
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterListItem[]>([]);
  const [downloadedMap, setDownloadedMap] = useState<Record<string, ChapterOfflineStatus>>({});
  const [job, setJob] = useState<{ kind: 'single' | 'all' | 'clear'; chapterId?: string } | null>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const requestId = useRef(0);
  const isDownloadingAll = job?.kind === 'all';
  const downloadingId = job?.chapterId;
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ReaderTheme>('light');
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(true);

  // Settings & Storage Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [storageStats, setStorageStats] = useState<{ count: number; totalBytes: number }>({
    count: 0,
    totalBytes: 0,
  });

  // Gallery & Cast State
  const [illustrations, setIllustrations] = useState<IllustrationItem[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeTab, setActiveTab] = useState<'chapters' | 'gallery'>('chapters');

  // Lightbox Modal State
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string | undefined>();
  const [lightboxCaption, setLightboxCaption] = useState<string | undefined>();

  const themeColors = themes[currentTheme];

  const loadData = useCallback(async (isActive: () => boolean, preferCache = true) => {
    try {
      if (preferCache) {
        const [theme, catalog] = await Promise.all([getSavedTheme(), readMetadata('novels', isNovelList)]);
        const initial = (catalog ?? bundledNovels as Novel[]).find(novel => novel.id === novelId);
        if (!isActive()) return;
        setCurrentTheme(theme);
        if (initial) { setNovel(initial); setLoading(false); }
      }
      const [theme, novelList, chapterList] = await Promise.all([
        getSavedTheme(), fetchNovels(preferCache), getAvailableChapterList(novelId, preferCache),
      ]);
      if (!isActive()) return;
      setCurrentTheme(theme);
      setNovel(novelList.find(n => n.id === novelId) ?? null);
      setChapters(chapterList);
      setChaptersLoading(false);
      setError(false);
      setLoading(false);
      // Byte totals are only needed when the storage sheet is opened.
      const statuses = await Promise.all(chapterList.map(async ch => [ch.id, ch.offlineStatus ?? await getChapterOfflineStatus(novelId, ch.id)] as const));
      if (!isActive()) return;
      setDownloadedMap(Object.fromEntries(statuses));
    } catch {
      if (isActive()) setError(true);
    } finally {
      if (isActive()) { setLoading(false); setChaptersLoading(false); }
    }
  }, [novelId]);

  useEffect(() => {
    mounted.current = true;
    const refresh = () => {
      if (busy.current) return;
      const id = ++requestId.current;
      const isActive = () => mounted.current && requestId.current === id;
      void (async () => {
        await loadData(isActive);
        if (isActive() && !busy.current) await loadData(isActive, false);
      })();
      void fetchIllustrations(novelId).then(data => {
        if (mounted.current && requestId.current === id) setIllustrations(data);
      });
      void fetchCharacters(novelId, true).then(data => {
        if (mounted.current && requestId.current === id) setCharacters(data);
      });
    };
    const unsubscribe = navigation.addListener('focus', refresh);
    refresh();
    return () => { mounted.current = false; unsubscribe(); };
  }, [loadData, navigation, novelId]);

  const retry = () => {
    setLoading(true);
    const id = ++requestId.current;
    void loadData(() => mounted.current && requestId.current === id, false);
  };

  const handleRefresh = async () => {
    if (refreshing || busy.current) return;
    setRefreshing(true);
    const id = ++requestId.current;
    const isActive = () => mounted.current && requestId.current === id;
    try {
      await Promise.all([
        loadData(isActive, false),
        fetchCharacters(novelId).then(data => { if (isActive()) setCharacters(data); }),
        fetchIllustrations(novelId).then(data => { if (isActive()) setIllustrations(data); }),
      ]);
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  };

  const openLightbox = (url: string, title?: string, caption?: string) => {
    setLightboxUrl(url);
    setLightboxTitle(title);
    setLightboxCaption(caption);
    setLightboxVisible(true);
  };

  const refreshStorageStats = async () => {
    const stats = await getNovelOfflineStats(novelId);
    if (mounted.current) setStorageStats(stats);
  };

  const runJob = async (kind: 'single' | 'all' | 'clear', work: () => Promise<void>, chapterId?: string) => {
    if (busy.current) return;
    busy.current = true;
    setJob({ kind, chapterId });
    // Invalidate any status scan which started before this operation.
    requestId.current++;
    try {
      await withOfflineJob(novelId, work);
    } catch (cause) {
      if (mounted.current) Alert.alert('จัดการข้อมูลไม่ได้', cause instanceof Error ? cause.message : 'กรุณาลองอีกครั้ง');
    } finally {
      if (mounted.current) { await refreshStorageStats(); setJob(null); }
      busy.current = false;
    }
  };

  const handleDownloadChapter = (chapterId: string) => runJob('single', async () => {
    const result = await downloadChapterOnDemand(novelId, chapterId);
    if (!mounted.current) return;
    setDownloadedMap(previous => ({ ...previous, [chapterId]: result.status === 'failed' ? previous[chapterId] ?? 'missing' : result.status }));
    if (result.status === 'failed') Alert.alert('ดาวน์โหลดไม่ได้', 'ตรวจสอบอินเทอร์เน็ตและพื้นที่เครื่อง แล้วลองอีกครั้ง');
    if (result.status === 'text-only') Alert.alert('บันทึกข้อความแล้ว', 'ภาพประกอบยังไม่ครบ แตะดาวน์โหลดอีกครั้งเพื่อโหลดภาพที่ขาด');
  }, chapterId);

  const handleDownloadAll = (refreshText = false) => runJob('all', async () => {
    const counts = { complete: 0, 'text-only': 0, failed: 0 };
    for (const chapter of chapters) {
      if (!mounted.current) break;
      if (refreshText ? !downloadedMap[chapter.id] || downloadedMap[chapter.id] === 'missing'
        : downloadedMap[chapter.id] === 'complete') continue;
      setJob({ kind: 'all', chapterId: chapter.id });
      const result = await downloadChapterOnDemand(novelId, chapter.id, refreshText);
      counts[result.status]++;
      if (mounted.current && result.status !== 'failed') {
        const status = result.status;
        setDownloadedMap(previous => ({ ...previous, [chapter.id]: status }));
      }
    }
    if (mounted.current) Alert.alert(refreshText ? 'ผลการอัปเดต (ตอนที่ไม่สำเร็จยังเก็บฉบับเดิมไว้)' : 'ผลการดาวน์โหลด', `ครบ ${counts.complete} ตอน\nข้อความพร้อม รูปยังไม่ครบ ${counts['text-only']} ตอน\nไม่สำเร็จ ${counts.failed} ตอน`);
  });

  const handleClearAllOffline = () => {
    if (busy.current) return;
    Alert.alert('ล้างข้อมูลออฟไลน์', 'ลบไฟล์ที่ดาวน์โหลดของเรื่องนี้หรือไม่? ตอนที่มากับแอปยังอ่านได้ และตำแหน่งอ่านจะยังอยู่', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบข้อมูล', style: 'destructive', onPress: () => {
        void runJob('clear', async () => {
          await clearNovelOfflineStorage(novelId);
          const statuses = await Promise.all(chapters.map(async chapter => [chapter.id, await getChapterOfflineStatus(novelId, chapter.id)] as const));
          if (mounted.current) {
            setDownloadedMap(Object.fromEntries(statuses));
            setShowSettingsModal(false);
            Alert.alert('ลบข้อมูลเรียบร้อย', 'ลบไฟล์ที่ดาวน์โหลดของเรื่องนี้แล้ว');
          }
        });
      } },
    ]);
  };

  const downloadedCount = Object.values(downloadedMap).filter(status => status !== 'missing').length;
  const remainingCount = chapters.filter(chapter => downloadedMap[chapter.id] !== 'complete').length;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={themeColors.statusBar === 'dark' ? 'dark' : 'light'} />
      <NavigationBar hidden={false} style={currentTheme === 'dark' ? 'dark' : 'light'} />

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
            accessibilityLabel="จัดการข้อมูลออฟไลน์"
            onPress={() => {
              refreshStorageStats();
              setShowSettingsModal(true);
            }}
          >
            <Settings2 size={21} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : error || !novel ? (
        <ScreenState colors={themeColors} message={error ? 'โหลดรายละเอียดไม่ได้ กรุณาลองอีกครั้ง' : 'ไม่พบข้อมูลนิยายเรื่องนี้'} onRetry={retry} onBack={() => navigation.goBack()} backLabel="กลับชั้นหนังสือ" />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl testID="chapter-refresh" refreshing={refreshing} enabled={job === null} onRefresh={() => { void handleRefresh(); }} tintColor={themeColors.primary} colors={[themeColors.primary]} />}
        >
          {/* Novel Info Banner */}
          <View style={styles.novelInfoCard}>
            <BookCover uri={novel.coverUrl} style={styles.coverImage} />

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
                  เนื้อหาออฟไลน์: {downloadedCount}/{chapters.length} ตอน
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

          {/* Segmented Tab Switcher */}
          <View style={[styles.tabSwitcher, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'chapters' && { backgroundColor: themeColors.primaryBg },
              ]}
              accessibilityRole="tab"
              accessibilityLabel="สารบัญ"
              accessibilityState={{ selected: activeTab === 'chapters' }}
              onPress={() => setActiveTab('chapters')}
              activeOpacity={0.8}
            >
              <BookOpen size={16} color={activeTab === 'chapters' ? themeColors.primary : themeColors.textMuted} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'chapters' ? themeColors.primary : themeColors.textMuted },
                  activeTab === 'chapters' && styles.tabTextActive,
                ]}
              >
                สารบัญ ({chapters.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'gallery' && { backgroundColor: themeColors.primaryBg },
              ]}
              accessibilityRole="tab"
              accessibilityLabel="ภาพและตัวละคร"
              accessibilityState={{ selected: activeTab === 'gallery' }}
              onPress={() => setActiveTab('gallery')}
              activeOpacity={0.8}
            >
              <Images size={16} color={activeTab === 'gallery' ? themeColors.primary : themeColors.textMuted} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'gallery' ? themeColors.primary : themeColors.textMuted },
                  activeTab === 'gallery' && styles.tabTextActive,
                ]}
              >
                ภาพ & ตัวละคร ({illustrations.length + characters.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: CHAPTERS LIST */}
          {activeTab === 'chapters' && (
            <View>
              {chaptersLoading ? <View style={{ paddingVertical: 24 }}><ActivityIndicator color={themeColors.primary} /></View>
                : chapters.length === 0 && <ScreenState colors={themeColors} message="ยังไม่มีตอนให้อ่าน" onRetry={retry} />}
              {chapters.map((ch) => {
                const offlineStatus = downloadedMap[ch.id] ?? 'missing';
                const isDownloaded = offlineStatus === 'complete';
                const isDownloading = downloadingId === ch.id;
                const isCh0 = ch.chapterNumber === 0;

                return (
                  <View
                    key={ch.id}
                    style={[
                      styles.chapterItem,
                      {
                        backgroundColor: themeColors.card,
                        borderColor: isCh0 ? themeColors.primary : themeColors.cardBorder,
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
                      <View
                        style={[
                          styles.chapterNumBadge,
                          { backgroundColor: isCh0 ? `${themeColors.primary}20` : themeColors.primaryBg },
                        ]}
                      >
                        {isCh0 ? (
                          <Sparkles size={14} color={themeColors.primary} />
                        ) : (
                          <Text style={[styles.chapterNumText, { color: themeColors.primary }]}>
                            {ch.chapterNumber}
                          </Text>
                        )}
                      </View>
                      <View style={styles.chapterTitles}>
                        <Text
                          style={[
                            styles.chapterTitle,
                            { color: isCh0 ? themeColors.primary : themeColors.text },
                            isCh0 && { fontWeight: '700' },
                          ]}
                          numberOfLines={2}
                        >
                          {ch.title || `ตอนที่ ${ch.chapterNumber}`}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {offlineStatus === 'text-only' && <Text style={{ color: themeColors.textMuted, fontSize: 11, maxWidth: 80 }}>ข้อความพร้อม รูปยังไม่ครบ</Text>}
                    {/* Right Action: Show download icon only if not downloaded */}
                    <View style={styles.chapterActions}>
                      {isDownloading ? (
                        <ActivityIndicator size="small" color={themeColors.primary} />
                      ) : !isDownloaded ? (
                        <TouchableOpacity
                          style={[styles.downloadIconBtn, { backgroundColor: themeColors.primaryBg }]}
                          disabled={job !== null}
                          accessibilityLabel={offlineStatus === 'text-only' ? 'ดาวน์โหลดภาพที่ขาด' : 'ดาวน์โหลดตอน'}
                          onPress={() => { void handleDownloadChapter(ch.id); }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Download size={16} color={themeColors.primary} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* TAB 2: GALLERY & CHARACTERS */}
          {activeTab === 'gallery' && (
            <View style={styles.galleryContainer}>
              {/* Section 1: Characters Cast */}
              {characters.length > 0 && (
                <View style={styles.gallerySection}>
                  <View style={styles.sectionHeaderRow}>
                    <Users size={16} color={themeColors.primary} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                      ตัวละครหลัก ({characters.length})
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.charactersScroll}
                  >
                    {characters.map((char) => {
                      const avatarUri = char.avatarUrl
                        ? `https://phongsathondev.github.io/Yomiori/${char.avatarUrl.replace(/^\//, '')}`
                        : null;
                      return (
                        <TouchableOpacity
                          key={char.id}
                          style={[
                            styles.characterCard,
                            { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
                          ]}
                          activeOpacity={0.8}
                          onPress={() => {
                            if (avatarUri) {
                              openLightbox(avatarUri, char.name, char.description || char.role);
                            }
                          }}
                        >
                          {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.charAvatar} resizeMode="cover" />
                          ) : (
                            <View style={[styles.charAvatarPlaceholder, { backgroundColor: `${char.color}20` }]}>
                              <Text style={[styles.charInitial, { color: char.color }]}>
                                {char.name.charAt(0)}
                              </Text>
                            </View>
                          )}
                          <View style={styles.charCardBody}>
                            <Text style={[styles.charName, { color: themeColors.text }]} numberOfLines={1}>
                              {char.name}
                            </Text>
                            <View style={[styles.charRoleBadge, { backgroundColor: `${char.color}18` }]}>
                              <Text style={[styles.charRoleText, { color: char.color }]} numberOfLines={1}>
                                {char.role}
                              </Text>
                            </View>
                            {char.description ? (
                              <Text style={[styles.charDesc, { color: themeColors.textMuted }]} numberOfLines={3}>
                                {char.description}
                              </Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Section 2: Official Illustrations */}
              <View style={styles.gallerySection}>
                <View style={styles.sectionHeaderRow}>
                  <Sparkles size={16} color={themeColors.primary} />
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                    ภาพประกอบนิยายทางการ ({illustrations.length})
                  </Text>
                </View>

                {illustrations.length === 0 && <Text style={{ color: themeColors.textMuted }}>ยังไม่มีภาพประกอบที่แสดงได้</Text>}
                <View style={styles.illustrationsGrid}>
                  {illustrations.map((item) => {
                    const imgUrl = getIllustrationUrl(novelId, item.filename);
                    const typeBadge =
                      item.type === 'color_spread'
                        ? 'ภาพสีเปิดเล่ม'
                        : item.type === 'cover'
                        ? 'ภาพปก'
                        : 'ภาพประกอบ';

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.illustrationGridItem,
                          { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
                        ]}
                        activeOpacity={0.85}
                        onPress={() => openLightbox(imgUrl, item.title, item.caption)}
                      >
                        <OfflineImage novelId={novelId} src={item.filename} style={styles.gridImage} color={themeColors.primary} />
                        <View style={styles.gridItemOverlay}>
                          <View style={[styles.gridTypeBadge, { backgroundColor: 'rgba(0,0,0,0.68)' }]}>
                            <Text style={styles.gridTypeBadgeText}>{typeBadge}</Text>
                          </View>
                        </View>
                        <View style={styles.gridItemBody}>
                          <Text style={[styles.gridItemTitle, { color: themeColors.text }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {item.caption ? (
                            <Text
                              style={[styles.gridItemCaption, { color: themeColors.textMuted }]}
                              numberOfLines={2}
                            >
                              {item.caption}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Lightbox Zoom Modal */}
      <ImageLightboxModal
        visible={lightboxVisible}
        imageUrl={lightboxUrl}
        title={lightboxTitle}
        caption={lightboxCaption}
        novelId={novelId}
        onClose={() => setLightboxVisible(false)}
      />

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
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>ตอนที่มีเนื้อหาอ่านได้:</Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  {downloadedCount} / {chapters.length} ตอน
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: themeColors.textMuted }]}>พื้นที่ไฟล์ที่ลบคืนได้:</Text>
                <Text style={[styles.infoValue, { color: themeColors.text }]}>
                  {formatFileSize(storageStats.totalBytes)}
                </Text>
              </View>
            </View>

            {/* Action 1: Download All */}
            <TouchableOpacity
              accessibilityLabel="ดาวน์โหลดตอนที่ยังไม่ครบทั้งหมด"
              style={[
                styles.modalActionBtn,
                {
                  backgroundColor: remainingCount === 0 ? themeColors.border : themeColors.primary,
                  opacity: remainingCount === 0 || job !== null ? 0.6 : 1,
                },
              ]}
              onPress={() => { void handleDownloadAll(); }}
              disabled={remainingCount === 0 || job !== null}
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
                  ? 'ทุกตอนพร้อมอ่านออฟไลน์แล้ว'
                  : isDownloadingAll
                  ? `กำลังดาวน์โหลด... (${downloadingId})`
                  : `ดาวน์โหลดทุกตอนที่เหลือ (${remainingCount} ตอน)`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityLabel="อัปเดตตอนที่มีในเครื่อง"
              style={[styles.modalActionBtn, { backgroundColor: themeColors.primary, opacity: downloadedCount === 0 || job !== null ? 0.6 : 1 }]}
              disabled={downloadedCount === 0 || job !== null}
              onPress={() => { void handleDownloadAll(true); }}
            >
              <Download size={18} color="#ffffff" />
              <Text style={styles.modalActionBtnText}>อัปเดตตอนที่มีในเครื่อง</Text>
            </TouchableOpacity>
            <Text style={{ color: themeColors.textMuted, marginBottom: 16 }}>
              ดึงข้อความฉบับล่าสุดและภาพที่ขาด หากอัปเดตไม่สำเร็จจะเก็บตอนเดิมไว้ ตำแหน่งอ่านยังอยู่
            </Text>

            {/* Action 2: Clear Offline Storage */}
            <TouchableOpacity
              accessibilityLabel="ลบไฟล์ออฟไลน์ทั้งหมดของเรื่องนี้"
              style={[
                styles.modalDestructiveBtn,
                {
                  borderColor: '#ef444433',
                  backgroundColor: '#ef444410',
                  opacity: storageStats.totalBytes === 0 || job !== null ? 0.4 : 1,
                },
              ]}
              onPress={handleClearAllOffline}
              disabled={storageStats.totalBytes === 0 || job !== null}
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
    minWidth: 44,
    minHeight: 44,
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
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
    minHeight: 44,
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
    minHeight: 44,
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
  // Segmented Tab Switcher Styles
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginVertical: 14,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  // Gallery & Cast Styles
  galleryContainer: {
    paddingBottom: 24,
  },
  gallerySection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  charactersScroll: {
    paddingVertical: 4,
    gap: 12,
  },
  characterCard: {
    width: 175,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  charAvatar: {
    width: '100%',
    height: 150,
    backgroundColor: '#eee',
  },
  charAvatarPlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charInitial: {
    fontSize: 36,
    fontWeight: '700',
  },
  charCardBody: {
    padding: 10,
  },
  charName: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  charRoleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  charRoleText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  charDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  illustrationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  illustrationGridItem: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 135,
    backgroundColor: '#eee',
  },
  gridItemOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  gridTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridTypeBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '600',
  },
  gridItemBody: {
    padding: 8,
  },
  gridItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  gridItemCaption: {
    fontSize: 10.5,
    lineHeight: 14,
  },
});
