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
    return { count, totalBytes };
  } catch {
    return { count: 0, totalBytes: 0 };
  }
}

// ======================== Settings & Progress ========================

const KEY_THEME = 'yomiori_theme';
const KEY_FONT_SIZE = 'yomiori_font_size';
const KEY_PROGRESS = 'yomiori_progress_';

export async function getSavedTheme(): Promise<ReaderTheme> {
  const val = await AsyncStorage.getItem(KEY_THEME);
  return (val as ReaderTheme) || 'light';
}

export async function saveTheme(theme: ReaderTheme): Promise<void> {
  await AsyncStorage.setItem(KEY_THEME, theme);
}

export async function getSavedFontSize(): Promise<number> {
  const val = await AsyncStorage.getItem(KEY_FONT_SIZE);
  return val ? Number(val) : 17;
}

export async function saveFontSize(size: number): Promise<void> {
  await AsyncStorage.setItem(KEY_FONT_SIZE, String(size));
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
