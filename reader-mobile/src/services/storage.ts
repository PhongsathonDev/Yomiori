import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chapter, ReaderTheme, ReadingProgress, ReaderFont, ReaderLineHeight, ChapterOfflineStatus, CommentItem, SavedNovelSummary } from '../types';
import bundledCh01 from '../data/novels/kyudo-senpai/chapters/ch-01.json';
import { blackCatChapters } from '../data/novels/black-cat-hangout/chapters';
import { isChapter, isRecord, isSafeId } from './validation';
import { createKeyedQueue } from './queue';
import { REQUEST_TIMEOUT_MS } from './request';

const NOVELS_DIR = `${FileSystem.documentDirectory}novels/`;
const enqueueFile = createKeyedQueue();
const enqueueImage = createKeyedQueue();
const enqueueProgress = createKeyedQueue();
const enqueueComments = createKeyedQueue();
const generations = new Map<string, number>();
const activeJobs = new Set<string>();
const savedNovelScans = new Map<string, Promise<SavedNovelSummary | null>>();
// Session-only summaries: a fresh process always verifies the files again.
const savedNovelSummaries = new Map<string, { revision: number; generation: number; summary: SavedNovelSummary }>();
const fileRevisions = new Map<string, number>();
const markFilesChanged = (novelId: string) => {
  fileRevisions.set(novelId, (fileRevisions.get(novelId) ?? 0) + 1);
  savedNovelSummaries.delete(novelId);
};

export const getOfflineGeneration = (novelId: string) => generations.get(novelId) ?? 0;

/** Held for the entire UI job (including a batch), even if its screen unmounts. */
export async function withOfflineJob<T>(novelId: string, work: () => Promise<T>): Promise<T> {
  if (activeJobs.has(novelId)) throw new Error('กำลังจัดการข้อมูลเรื่องนี้อยู่ กรุณารอสักครู่');
  activeJobs.add(novelId);
  try { return await work(); } finally { activeJobs.delete(novelId); }
}

function novelDirectory(novelId: string) {
  if (!isSafeId(novelId)) throw new Error('Invalid novel ID');
  return `${NOVELS_DIR}${novelId}/`;
}

async function ensureDir(dir: string) {
  if (!(await FileSystem.getInfoAsync(dir)).exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

function checkGeneration(novelId: string, generation: number) {
  if (generation !== getOfflineGeneration(novelId)) throw new Error('Offline data was cleared');
}

export function getChapterFilePath(novelId: string, chapterId: string): string {
  if (!isSafeId(chapterId)) throw new Error('Invalid chapter ID');
  return `${novelDirectory(novelId)}${chapterId}.json`;
}

async function loadSavedChapter(novelId: string, chapterId: string): Promise<Chapter | null> {
  if (!isSafeId(novelId) || !isSafeId(chapterId)) return null;
  const path = getChapterFilePath(novelId, chapterId);
  // Legacy iOS move removes the destination first. A backup also survives an
  // interrupted promotion, including an app termination between native calls.
  for (const candidate of [path, `${path}.bak`]) {
    try {
      if ((await FileSystem.getInfoAsync(candidate)).exists) {
        const value: unknown = JSON.parse(await FileSystem.readAsStringAsync(candidate));
        if (isChapter(value, novelId, chapterId)) return value;
      }
    } catch {
      // A damaged cache or unavailable disk must not prevent an online retry.
    }
  }
  return null;
}

export function getBundledChapter(novelId: string, chapterId: string): Chapter | null {
  if (novelId === 'kyudo-senpai' && chapterId === 'ch-01') return bundledCh01 as Chapter;
  return novelId === 'black-cat-hangout'
    ? (blackCatChapters as Chapter[]).find(chapter => chapter.id === chapterId) ?? null : null;
}

export async function loadChapterOffline(novelId: string, chapterId: string): Promise<Chapter | null> {
  return await loadSavedChapter(novelId, chapterId)
    ?? getBundledChapter(novelId, chapterId);
}

/** Files remain authoritative even if AsyncStorage or CDN metadata is missing.
 * Only summaries are retained; long chapter bodies are released each iteration.
 */
export function getSavedNovel(novelId: string): Promise<SavedNovelSummary | null> {
  const generation = getOfflineGeneration(novelId);
  const revision = fileRevisions.get(novelId) ?? 0;
  const cached = savedNovelSummaries.get(novelId);
  if (cached && cached.generation === generation && cached.revision === revision) return Promise.resolve(cached.summary);
  const key = `${novelId}:${generation}:${revision}`;
  const pending = savedNovelScans.get(key);
  if (pending) return pending;
  const scan = scanSavedNovel(novelId).then(summary => {
    // Never publish a scan which overlapped a write or clear.
    if (generation !== getOfflineGeneration(novelId) || revision !== (fileRevisions.get(novelId) ?? 0)) return getSavedNovel(novelId);
    // Null can mean an I/O error; retry on the next request instead of caching it.
    if (summary) savedNovelSummaries.set(novelId, { generation, revision, summary });
    return summary;
  })
    .finally(() => { if (savedNovelScans.get(key) === scan) savedNovelScans.delete(key); });
  savedNovelScans.set(key, scan);
  return scan;
}

async function scanSavedNovel(novelId: string): Promise<SavedNovelSummary | null> {
  if (!isSafeId(novelId)) return null;
  try {
    const names = await FileSystem.readDirectoryAsync(novelDirectory(novelId));
    const ids = new Set(names.map(name => /^(.*)\.json(?:\.bak)?$/.exec(name)?.[1]).filter(isSafeId));
    const summary: SavedNovelSummary = { id: novelId, title: '', chapters: [] };
    for (const id of ids) {
      const chapter = await loadSavedChapter(novelId, id);
      if (!chapter) continue;
      summary.title ||= chapter.novelTitle;
      let offlineStatus: ChapterOfflineStatus = 'complete';
      for (const block of chapter.blocks) {
        if (block.type === 'illustration' && !await localIllustration(novelId, block.src)) { offlineStatus = 'text-only'; break; }
      }
      summary.chapters.push({ id, novelId, title: chapter.title, chapterNumber: chapter.chapterNumber, isDownloaded: true, offlineStatus });
    }
    summary.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    return summary.chapters.length ? summary : null;
  } catch { return null; }
}

export async function getSavedLibrary(): Promise<SavedNovelSummary[]> {
  try {
    const names = await FileSystem.readDirectoryAsync(NOVELS_DIR);
    const result: SavedNovelSummary[] = [];
    for (const id of names.filter(isSafeId)) {
      const novel = await getSavedNovel(id);
      if (novel) result.push(novel);
    }
    return result;
  } catch { return []; }
}

export async function isChapterDownloaded(novelId: string, chapterId: string): Promise<boolean> {
  return (await loadChapterOffline(novelId, chapterId)) !== null;
}

export async function saveChapterOffline(chapter: Chapter, generation = getOfflineGeneration(chapter.novelId)): Promise<void> {
  if (!isChapter(chapter)) throw new Error('Invalid chapter');
  return enqueueFile(chapter.novelId, async () => {
    checkGeneration(chapter.novelId, generation);
    const path = getChapterFilePath(chapter.novelId, chapter.id);
    const temporary = `${path}.tmp`;
    const backup = `${path}.bak`;
    let promoted = false;
    await ensureDir(novelDirectory(chapter.novelId));
    try {
      await FileSystem.writeAsStringAsync(temporary, JSON.stringify(chapter), { encoding: FileSystem.EncodingType.UTF8 });
      const staged: unknown = JSON.parse(await FileSystem.readAsStringAsync(temporary));
      if (!isChapter(staged, chapter.novelId, chapter.id)) throw new Error('Invalid staged chapter');
      let validCurrentFile = false;
      try {
        validCurrentFile = isChapter(JSON.parse(await FileSystem.readAsStringAsync(path)), chapter.novelId, chapter.id);
      } catch { /* A valid recovery backup must not be replaced by a damaged file. */ }
      if (validCurrentFile) {
        // Leave the old file untouched if there is no room for a backup.
        await FileSystem.copyAsync({ from: path, to: backup });
      }
      checkGeneration(chapter.novelId, generation);
      await FileSystem.moveAsync({ from: temporary, to: path });
      promoted = true;
    } finally {
      await FileSystem.deleteAsync(temporary, { idempotent: true }).catch(() => undefined);
      if (promoted) await FileSystem.deleteAsync(backup, { idempotent: true }).catch(() => undefined);
      markFilesChanged(chapter.novelId);
    }
  });
}

export async function deleteChapterOffline(novelId: string, chapterId: string): Promise<void> {
  await enqueueFile(novelId, async () => {
    const path = getChapterFilePath(novelId, chapterId);
    try {
      await FileSystem.deleteAsync(path, { idempotent: true });
      await FileSystem.deleteAsync(`${path}.bak`, { idempotent: true });
    } finally { markFilesChanged(novelId); }
  });
}

export async function clearNovelOfflineStorage(novelId: string): Promise<void> {
  const dir = novelDirectory(novelId);
  // Invalidate already-started fetches before waiting for a file operation.
  generations.set(novelId, getOfflineGeneration(novelId) + 1);
  await enqueueFile(novelId, async () => {
    try { await FileSystem.deleteAsync(dir, { idempotent: true }); }
    finally { markFilesChanged(novelId); }
  });
}

export async function getNovelOfflineStats(novelId: string): Promise<{ count: number; totalBytes: number }> {
  try {
    const dir = novelDirectory(novelId);
    if (!(await FileSystem.getInfoAsync(dir)).exists) return { count: 0, totalBytes: 0 };
    let count = 0;
    let totalBytes = 0;
    const measure = async (path: string): Promise<void> => {
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return;
      if (info.isDirectory) {
        for (const name of await FileSystem.readDirectoryAsync(path)) await measure(`${path}/${name}`);
      } else {
        totalBytes += info.size;
      }
    };
    for (const name of await FileSystem.readDirectoryAsync(dir)) {
      if (name.endsWith('.json') && isSafeId(name.slice(0, -5))) {
        try {
          const value: unknown = JSON.parse(await FileSystem.readAsStringAsync(`${dir}${name}`));
          if (isChapter(value, novelId, name.slice(0, -5))) count++;
        } catch { /* Still include corrupt file bytes in reclaimable storage. */ }
      }
      await measure(`${dir}${name}`);
    }
    return { count, totalBytes };
  } catch { return { count: 0, totalBytes: 0 }; }
}

// ======================== Illustration Assets ========================
const CDN_BASE_URL = 'https://phongsathondev.github.io/Yomiori/data';

export function getIllustrationUrl(novelId: string, src: string): string {
  if (/^(https?:|file:)\/\//.test(src)) return src;
  const clean = src.replace(/^(\/)?(illustrations\/)?/, '');
  return `${CDN_BASE_URL}/novels/${novelId}/illustrations/${clean}`;
}

export function getIllustrationLocalPath(novelId: string, src: string): string {
  const relative = src.startsWith(`${CDN_BASE_URL}/novels/${novelId}/illustrations/`)
    ? src.slice(`${CDN_BASE_URL}/novels/${novelId}/illustrations/`.length) : src;
  const clean = relative.replace(/^(\/)?(illustrations\/)?/, '');
  // Preserve existing simple relative caches; encode external URLs and nested paths.
  const filename = /^[a-zA-Z0-9_.-]+$/.test(clean) && clean !== '.' && clean !== '..' ? clean : encodeURIComponent(src);
  return `${novelDirectory(novelId)}illustrations/${filename}`;
}

async function localIllustration(novelId: string, src: string): Promise<string | null> {
  const path = src.startsWith('file://') ? src : getIllustrationLocalPath(novelId, src);
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists && !info.isDirectory && info.size > 0 ? info.uri : null;
  } catch { return null; }
}

export async function resolveIllustrationUri(novelId: string, src: string): Promise<string> {
  return await localIllustration(novelId, src) ?? getIllustrationUrl(novelId, src);
}

export async function cacheIllustrationOffline(novelId: string, src: string, generation = getOfflineGeneration(novelId)): Promise<string> {
  const path = getIllustrationLocalPath(novelId, src);
  return enqueueImage(path, async () => {
    checkGeneration(novelId, generation);
    const existing = await localIllustration(novelId, src);
    if (existing) return existing;
    if (src.startsWith('file://')) throw new Error('Local illustration is missing');
    const temporary = `${path}.tmp`;
    await ensureDir(`${novelDirectory(novelId)}illustrations/`);
    const task = FileSystem.createDownloadResumable(getIllustrationUrl(novelId, src), temporary);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          void task.cancelAsync().catch(() => undefined);
          reject(new Error('Illustration download timed out'));
        }, REQUEST_TIMEOUT_MS);
      });
      const result = await Promise.race([task.downloadAsync(), timeout]);
      if (!result || result.status < 200 || result.status >= 300) throw new Error('Illustration download failed');
      const info = await FileSystem.getInfoAsync(temporary);
      if (!info.exists || info.isDirectory || info.size === 0) throw new Error('Empty illustration');
      await enqueueFile(novelId, async () => {
        checkGeneration(novelId, generation);
        await FileSystem.moveAsync({ from: temporary, to: path });
        markFilesChanged(novelId);
      });
      return path;
    } finally {
      clearTimeout(timer);
      await task.cancelAsync().catch(() => undefined);
      await FileSystem.deleteAsync(temporary, { idempotent: true }).catch(() => undefined);
    }
  });
}

export async function getChapterOfflineStatus(novelId: string, chapterId: string): Promise<ChapterOfflineStatus> {
  const chapter = await loadChapterOffline(novelId, chapterId);
  if (!chapter) return 'missing';
  return getChapterContentStatus(chapter);
}

export async function getChapterContentStatus(chapter: Chapter): Promise<ChapterOfflineStatus> {
  for (const block of chapter.blocks) {
    if (block.type === 'illustration' && !await localIllustration(chapter.novelId, block.src)) return 'text-only';
  }
  return 'complete';
}

// ======================== Settings & Progress ========================
async function readSetting(key: string): Promise<string | null> {
  try { return await AsyncStorage.getItem(key); } catch { return null; }
}

export async function getSavedTheme(): Promise<ReaderTheme> {
  const value = await readSetting('yomiori_theme');
  return value === 'dark' || value === 'sepia' ? value : 'light';
}
export const saveTheme = (theme: ReaderTheme) => AsyncStorage.setItem('yomiori_theme', theme);

export async function getSavedFontSize(defaultSize = 17): Promise<number> {
  const value = await readSetting('yomiori_font_size');
  const number = value === null || value.trim() === '' ? defaultSize : Number(value);
  return Number.isFinite(number) ? Math.max(14, Math.min(26, number)) : defaultSize;
}
export const saveFontSize = (size: number) => AsyncStorage.setItem('yomiori_font_size', String(size));

export async function getSavedFontFamily(): Promise<ReaderFont> {
  const value = await readSetting('yomiori_font_family');
  return value === 'Kanit' || value === 'Prompt' || value === 'System' ? value : 'Sarabun';
}
export const saveFontFamily = (family: ReaderFont) => AsyncStorage.setItem('yomiori_font_family', family);

export async function getSavedLineHeight(): Promise<ReaderLineHeight> {
  const value = Number(await readSetting('yomiori_line_height'));
  return value === 1.55 || value === 2.15 ? value : 1.85;
}
export const saveLineHeight = (ratio: ReaderLineHeight) => AsyncStorage.setItem('yomiori_line_height', String(ratio));

export function saveReadingProgress(novelId: string, chapterId: string, percent: number): Promise<void> {
  if (!isSafeId(novelId) || !isSafeId(chapterId) || !Number.isFinite(percent)) return Promise.resolve();
  const progress: ReadingProgress = { novelId, chapterId, scrollPercent: Math.max(0, Math.min(100, percent)), updatedAt: Date.now() };
  return enqueueProgress(novelId, () => AsyncStorage.setItem(`yomiori_progress_${novelId}`, JSON.stringify(progress)));
}

export async function getReadingProgress(novelId: string): Promise<ReadingProgress | null> {
  return enqueueProgress(novelId, async () => {
    try {
      const raw = await AsyncStorage.getItem(`yomiori_progress_${novelId}`);
      const value: unknown = raw ? JSON.parse(raw) : null;
      if (!isRecord(value) || value.novelId !== novelId || !isSafeId(value.chapterId)
        || typeof value.scrollPercent !== 'number' || !Number.isFinite(value.scrollPercent)
        || typeof value.updatedAt !== 'number' || !Number.isFinite(value.updatedAt)) return null;
      return { novelId, chapterId: value.chapterId, scrollPercent: Math.max(0, Math.min(100, value.scrollPercent)), updatedAt: value.updatedAt };
    } catch { return null; }
  });
}

export async function readMetadata<T>(key: string, validate: (value: unknown) => value is T): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`yomiori_metadata_${key}`);
    const value: unknown = raw ? JSON.parse(raw) : null;
    return validate(value) ? value : null;
  } catch { return null; }
}

export async function saveMetadata(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(`yomiori_metadata_${key}`, JSON.stringify(value));
}

const KEY_COMMENTS_PREFIX = 'yomiori_user_comments_';
const KEY_LIKED_PREFIX = 'yomiori_liked_comments_';

export async function getUserComments(novelId: string, chapterId: string): Promise<CommentItem[]> {
  try {
    const key = `${KEY_COMMENTS_PREFIX}${novelId}_${chapterId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveUserComment(novelId: string, chapterId: string, comment: CommentItem): Promise<void> {
  const key = `${KEY_COMMENTS_PREFIX}${novelId}_${chapterId}`;
  await enqueueComments(key, async () => {
    const stored = await AsyncStorage.getItem(key);
    const existing: CommentItem[] = stored ? JSON.parse(stored) : [];
    await AsyncStorage.setItem(key, JSON.stringify([comment, ...existing]));
  });
}

export async function getLikedCommentIds(novelId: string, chapterId: string): Promise<string[]> {
  try {
    const key = `${KEY_LIKED_PREFIX}${novelId}_${chapterId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function toggleCommentLike(novelId: string, chapterId: string, commentId: string): Promise<boolean> {
  const key = `${KEY_LIKED_PREFIX}${novelId}_${chapterId}`;
  return enqueueComments(key, async () => {
    const stored = await AsyncStorage.getItem(key);
    const existing: string[] = stored ? JSON.parse(stored) : [];
    let isLiked = false;
    let updated: string[];
    if (existing.includes(commentId)) {
      updated = existing.filter(id => id !== commentId);
      isLiked = false;
    } else {
      updated = [...existing, commentId];
      isLiked = true;
    }
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return isLiked;
  });
}

