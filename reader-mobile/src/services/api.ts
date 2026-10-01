import { Chapter, Character, Novel, IllustrationItem, NovelManifest } from '../types';
import { saveChapterOffline, loadChapterOffline, isChapterDownloaded } from './storage';

// Bundled fallback data
import bundledNovels from '../data/novels.json';
import bundledCharacters from '../data/novels/kyudo-senpai/characters.json';

// GitHub Pages Headless CDN Base URL
export const CDN_BASE_URL = 'https://phongsathondev.github.io/Yomiori/data';

export async function fetchNovels(): Promise<Novel[]> {
  try {
    const res = await fetch(`${CDN_BASE_URL}/novels.json`, { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      return data as Novel[];
    }
  } catch (err) {
    console.log('Using offline bundled novels data:', err);
  }
  return bundledNovels as Novel[];
}

export async function fetchCharacters(novelId: string): Promise<Character[]> {
  try {
    const res = await fetch(`${CDN_BASE_URL}/novels/${novelId}/characters.json`, { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      return data as Character[];
    }
  } catch (err) {
    console.log('Using offline bundled characters data:', err);
  }
  if (novelId === 'kyudo-senpai') {
    return bundledCharacters as Character[];
  }
  return [];
}

export async function fetchIllustrations(novelId: string): Promise<IllustrationItem[]> {
  try {
    const res = await fetch(`${CDN_BASE_URL}/novels/${novelId}/illustrations.json`, { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      return data as IllustrationItem[];
    }
  } catch (err) {
    console.log('Using offline bundled illustrations data:', err);
  }
  return [];
}

/**
 * Fetch chapter:
 * 1. Checks if stored in offline FileSystem first (Instant & Offline-first)
 * 2. If not offline, fetches from GitHub Pages CDN
 * 3. Saves to offline FileSystem so subsequent reads are instant and offline-ready!
 */
export async function getChapter(novelId: string, chapterId: string): Promise<Chapter | null> {
  // 1. Try offline storage first
  const offline = await loadChapterOffline(novelId, chapterId);
  if (offline) {
    return offline;
  }

  // 2. Fetch from CDN
  try {
    const url = `${CDN_BASE_URL}/novels/${novelId}/chapters/${chapterId}.json`;
    const res = await fetch(url);
    if (res.ok) {
      const chapter = (await res.json()) as Chapter;
      // Auto-cache so it's offline for next time
      await saveChapterOffline(chapter);
      return chapter;
    }
  } catch (err) {
    console.warn(`Failed to fetch ${chapterId} from CDN:`, err);
  }

  return null;
}

/**
 * Explicit On-Demand download action triggered by user clicking the Download button
 */
export async function downloadChapterOnDemand(novelId: string, chapterId: string): Promise<boolean> {
  try {
    const url = `${CDN_BASE_URL}/novels/${novelId}/chapters/${chapterId}.json`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const chapter = (await res.json()) as Chapter;
    await saveChapterOffline(chapter);
    return true;
  } catch (err) {
    console.error(`Download error for ${chapterId}:`, err);
    return false;
  }
}

// NovelManifest is imported from ../types

export async function fetchNovelManifest(novelId: string): Promise<NovelManifest | null> {
  try {
    const res = await fetch(`${CDN_BASE_URL}/novels/${novelId}/manifest.json`, { cache: 'no-cache' });
    if (res.ok) {
      return (await res.json()) as NovelManifest;
    }
  } catch (err) {
    console.log('Manifest fetch offline fallback:', err);
  }
  return null;
}

/**
 * Generates or fetches the chapter list dynamically from manifest.json
 */
export async function getAvailableChapterList(
  novelId: string
): Promise<Array<{ id: string; novelId: string; chapterNumber: number; title: string }>> {
  const manifest = await fetchNovelManifest(novelId);
  if (manifest && manifest.chapters && manifest.chapters.length > 0) {
    return manifest.chapters.map((c) => ({
      id: c.id,
      novelId,
      chapterNumber: c.chapterNumber,
      title: c.title,
    }));
  }

  // Offline default fallback
  const count = novelId === 'kyudo-senpai' ? 25 : 1;
  const list = [];
  for (let i = 1; i <= count; i++) {
    const numStr = String(i).padStart(2, '0');
    list.push({
      id: `ch-${numStr}`,
      novelId,
      chapterNumber: i,
      title: `ตอนที่ ${i}`,
    });
  }
  return list;
}
