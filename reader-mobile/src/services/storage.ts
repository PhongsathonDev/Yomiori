import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chapter, ReaderTheme, ReadingProgress } from '../types';

// Fallback bundled chapter 1 for initial offline test
import bundledCh01 from '../data/novels/kyudo-senpai/chapters/ch-01.json';

const NOVELS_DIR = `${FileSystem.documentDirectory}novels/`;

async function ensureDir(dirPath: string) {
  const dirInfo = await FileSystem.getInfoAsync(dirPath);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
}

export function getChapterFilePath(novelId: string, chapterId: string): string {
  return `${NOVELS_DIR}${novelId}/${chapterId}.json`;
}

export async function isChapterDownloaded(novelId: string, chapterId: string): Promise<boolean> {
  // Bundled ch-01 is always considered available
  if (novelId === 'kyudo-senpai' && chapterId === 'ch-01') {
    return true;
  }
  const filePath = getChapterFilePath(novelId, chapterId);
  const info = await FileSystem.getInfoAsync(filePath);
  return info.exists;
}

export async function saveChapterOffline(chapter: Chapter): Promise<void> {
  const novelDir = `${NOVELS_DIR}${chapter.novelId}/`;
  await ensureDir(novelDir);
  const filePath = getChapterFilePath(chapter.novelId, chapter.id);
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(chapter), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Pre-cache any illustrations in this chapter
  if (chapter.blocks) {
    for (const b of chapter.blocks) {
      if (b.type === 'illustration' && (b as any).src) {
        await cacheIllustrationOffline(chapter.novelId, (b as any).src).catch(() => {});
      }
    }
  }
}

export async function loadChapterOffline(novelId: string, chapterId: string): Promise<Chapter | null> {
  const filePath = getChapterFilePath(novelId, chapterId);
  const info = await FileSystem.getInfoAsync(filePath);

  if (info.exists) {
    const raw = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return JSON.parse(raw) as Chapter;
  }

  // Fallback to bundled data if present
  if (novelId === 'kyudo-senpai' && chapterId === 'ch-01') {
    return bundledCh01 as unknown as Chapter;
  }

  return null;
}

export async function deleteChapterOffline(novelId: string, chapterId: string): Promise<void> {
  const filePath = getChapterFilePath(novelId, chapterId);
  const info = await FileSystem.getInfoAsync(filePath);
  if (info.exists) {
    await FileSystem.deleteAsync(filePath);
  }
}

export async function clearNovelOfflineStorage(novelId: string): Promise<void> {
  const novelDir = `${NOVELS_DIR}${novelId}/`;
  const info = await FileSystem.getInfoAsync(novelDir);
  if (info.exists) {
    await FileSystem.deleteAsync(novelDir, { idempotent: true });
  }
}

export async function getNovelOfflineStats(novelId: string): Promise<{ count: number; totalBytes: number }> {
  const novelDir = `${NOVELS_DIR}${novelId}/`;
  const dirInfo = await FileSystem.getInfoAsync(novelDir);
  if (!dirInfo.exists) {
    return { count: 0, totalBytes: 0 };
  }
  try {
    const files = await FileSystem.readDirectoryAsync(novelDir);
    let totalBytes = 0;
    let count = 0;
    for (const f of files) {
      if (f.endsWith('.json')) {
        const fileInfo = await FileSystem.getInfoAsync(`${novelDir}${f}`);
        if (fileInfo.exists && (fileInfo as any).size) {
          totalBytes += (fileInfo as any).size;
        }
        count++;
      }
    }

    // Include cached illustrations size
    const illustDir = `${novelDir}illustrations/`;
    const illustDirInfo = await FileSystem.getInfoAsync(illustDir);
    if (illustDirInfo.exists) {
      const imgFiles = await FileSystem.readDirectoryAsync(illustDir);
      for (const img of imgFiles) {
        const imgInfo = await FileSystem.getInfoAsync(`${illustDir}${img}`);
        if (imgInfo.exists && (imgInfo as any).size) {
          totalBytes += (imgInfo as any).size;
        }
      }
    }

    return { count, totalBytes };
  } catch {
    return { count: 0, totalBytes: 0 };
  }
}

// ======================== Illustration Assets ========================

const CDN_BASE_URL = 'https://phongsathondev.github.io/Yomiori/data';

export function getIllustrationUrl(novelId: string, src: string): string {
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('file://')) {
    return src;
  }
  const clean = src.replace(/^(\/)?(illustrations\/)?/, '');
  return `${CDN_BASE_URL}/novels/${novelId}/illustrations/${clean}`;
}

export function getIllustrationLocalPath(novelId: string, src: string): string {
  const clean = src.replace(/^(\/)?(illustrations\/)?/, '');
  return `${NOVELS_DIR}${novelId}/illustrations/${clean}`;
}

export async function resolveIllustrationUri(novelId: string, src: string): Promise<string> {
  const localPath = getIllustrationLocalPath(novelId, src);
  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists) {
    return info.uri;
  }
  return getIllustrationUrl(novelId, src);
}

export async function cacheIllustrationOffline(novelId: string, src: string): Promise<string> {
  const localPath = getIllustrationLocalPath(novelId, src);
  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists) {
    return info.uri;
  }
  const dir = localPath.substring(0, localPath.lastIndexOf('/') + 1);
  await ensureDir(dir);
  const remoteUrl = getIllustrationUrl(novelId, src);
  try {
    const downloadRes = await FileSystem.downloadAsync(remoteUrl, localPath);
    return downloadRes.uri;
  } catch (err) {
    console.warn(`Failed to download illustration ${src}:`, err);
    return remoteUrl;
  }
}

// ======================== Settings & Progress ========================

const KEY_THEME = 'yomiori_theme';
const KEY_FONT_SIZE = 'yomiori_font_size';
const KEY_FONT_FAMILY = 'yomiori_font_family';
const KEY_LINE_HEIGHT = 'yomiori_line_height';
const KEY_PROGRESS = 'yomiori_progress_';

export async function getSavedTheme(): Promise<ReaderTheme> {
  const val = await AsyncStorage.getItem(KEY_THEME);
  return (val as ReaderTheme) || 'light';
}

export async function saveTheme(theme: ReaderTheme): Promise<void> {
  await AsyncStorage.setItem(KEY_THEME, theme);
}

export async function getSavedFontSize(defaultSize: number = 17): Promise<number> {
  const val = await AsyncStorage.getItem(KEY_FONT_SIZE);
  return val ? Number(val) : defaultSize;
}

export async function saveFontSize(size: number): Promise<void> {
  await AsyncStorage.setItem(KEY_FONT_SIZE, String(size));
}

export async function getSavedFontFamily(): Promise<string> {
  const val = await AsyncStorage.getItem(KEY_FONT_FAMILY);
  return val || 'Sarabun';
}

export async function saveFontFamily(family: string): Promise<void> {
  await AsyncStorage.setItem(KEY_FONT_FAMILY, family);
}

export async function getSavedLineHeight(): Promise<number> {
  const val = await AsyncStorage.getItem(KEY_LINE_HEIGHT);
  return val ? Number(val) : 1.85;
}

export async function saveLineHeight(ratio: number): Promise<void> {
  await AsyncStorage.setItem(KEY_LINE_HEIGHT, String(ratio));
}

export async function saveReadingProgress(novelId: string, chapterId: string, percent: number): Promise<void> {
  const progress: ReadingProgress = {
    novelId,
    chapterId,
    scrollPercent: percent,
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(`${KEY_PROGRESS}${novelId}`, JSON.stringify(progress));
}

export async function getReadingProgress(novelId: string): Promise<ReadingProgress | null> {
  const val = await AsyncStorage.getItem(`${KEY_PROGRESS}${novelId}`);
  if (!val) return null;
  try {
    return JSON.parse(val) as ReadingProgress;
  } catch {
    return null;
  }
}

