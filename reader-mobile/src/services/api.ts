import { Chapter, Character, Novel, IllustrationItem, NovelManifest } from '../types';
import { saveChapterOffline, loadChapterOffline, isChapterDownloaded } from './storage';

// Bundled fallback data
import bundledNovels from '../data/novels.json';
import bundledKyudoCharacters from '../data/novels/kyudo-senpai/characters.json';
import bundledBoyishCharacters from '../data/novels/boyish-friend/characters.json';
import bundledBlackCatCharacters from '../data/novels/black-cat-hangout/characters.json';
import { blackCatChapters } from '../data/novels/black-cat-hangout/chapters';

// GitHub Pages Headless CDN Base URL
export const CDN_BASE_URL = 'https://phongsathondev.github.io/Yomiori/data';

export async function fetchNovels(): Promise<Novel[]> {
  let remoteNovels: Novel[] = [];
  try {
    const res = await fetch(`${CDN_BASE_URL}/novels.json?_t=${Date.now()}`);
    if (res.ok) {
      remoteNovels = (await res.json()) as Novel[];
    }
  } catch (err) {
    console.log('Using offline bundled novels data:', err);
  }

  // Merge remote novels with bundled novels so newly added novels appear immediately!
  const merged = [...remoteNovels];
  const existingIds = new Set(merged.map((n) => n.id));
  for (const b of (bundledNovels as Novel[])) {
    if (!existingIds.has(b.id)) {
      merged.push(b);
      existingIds.add(b.id);
    }
  }

  return merged.length > 0 ? merged : (bundledNovels as Novel[]);
}

export async function fetchCharacters(novelId: string): Promise<Character[]> {
  try {
    const res = await fetch(`${CDN_BASE_URL}/novels/${novelId}/characters.json?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      return data as Character[];
    }
  } catch (err) {
    console.log('Using offline bundled characters data:', err);
  }
  if (novelId === 'kyudo-senpai') {
    return bundledKyudoCharacters as Character[];
  }
  if (novelId === 'boyish-friend') {
    return bundledBoyishCharacters as Character[];
  }
  if (novelId === 'black-cat-hangout') {
    return bundledBlackCatCharacters as Character[];
  }
  return [];
}

export async function fetchIllustrations(novelId: string): Promise<IllustrationItem[]> {
  try {
    const res = await fetch(`${CDN_BASE_URL}/novels/${novelId}/illustrations.json?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      return data as IllustrationItem[];
    }
  } catch (err) {
    console.log('Using offline bundled illustrations data:', err);
  }
  return [];
}

export function getBundledChapter(novelId: string, chapterId: string): Chapter | null {
  if (novelId === 'black-cat-hangout') {
    return (blackCatChapters as Chapter[]).find((c) => c.id === chapterId) || null;
  }
  return null;
}

/**
 * Fetch chapter:
 * 1. Checks if stored in offline FileSystem first (Instant & Offline-first)
 * 2. If not offline, fetches from GitHub Pages CDN
 * 3. Falls back to bundled data if CDN is missing/offline (e.g. newly added chapters)
 * 4. Saves to offline FileSystem so subsequent reads are instant and offline-ready!
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

  // 3. Fallback to bundled chapters
  const bundled = getBundledChapter(novelId, chapterId);
  if (bundled) {
    await saveChapterOffline(bundled).catch(() => {});
    return bundled;
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
    if (res.ok) {
      const chapter = (await res.json()) as Chapter;
      await saveChapterOffline(chapter);
      return true;
    }
  } catch (err) {
    console.error(`Download error for ${chapterId}:`, err);
  }

  // Fallback to bundled chapter
  const bundled = getBundledChapter(novelId, chapterId);
  if (bundled) {
    await saveChapterOffline(bundled);
    return true;
  }

  return false;
}

// NovelManifest is imported from ../types

export async function fetchNovelManifest(novelId: string): Promise<NovelManifest | null> {
  try {
    const res = await fetch(`${CDN_BASE_URL}/novels/${novelId}/manifest.json?_t=${Date.now()}`);
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
  let list: Array<{ id: string; novelId: string; chapterNumber: number; title: string }> = [];

  const manifest = await fetchNovelManifest(novelId);
  if (manifest && manifest.chapters && manifest.chapters.length > 0) {
    list = manifest.chapters.map((c) => ({
      id: c.id,
      novelId,
      chapterNumber: c.chapterNumber,
      title: c.title,
    }));
  }

  // Merge bundled chapters so new chapters (such as Ch.26-30) appear immediately even if CDN manifest hasn't updated
  if (novelId === 'black-cat-hangout') {
    const existingIds = new Set(list.map((c) => c.id));
    for (const b of (blackCatChapters as Chapter[])) {
      if (!existingIds.has(b.id)) {
        list.push({
          id: b.id,
          novelId,
          chapterNumber: b.chapterNumber,
          title: b.title,
        });
        existingIds.add(b.id);
      }
    }
  }

  // Offline default fallback if list is empty
  if (list.length === 0) {
    if (novelId === 'black-cat-hangout') {
      const fbList = [
        {
          id: 'ch-00',
          novelId,
          chapterNumber: 0,
          title: 'Ch.0 — รูปประกอบ',
        },
      ];
      for (let i = 1; i <= 50; i++) {
        const numStr = String(i).padStart(2, '0');
        fbList.push({
          id: `ch-${numStr}`,
          novelId,
          chapterNumber: i,
          title: `ตอนที่ ${i}`,
        });
      }
      return fbList;
    }

    let count = 1;
    if (novelId === 'kyudo-senpai') count = 25;
    if (novelId === 'boyish-friend') count = 14;
    for (let i = 1; i <= count; i++) {
      const numStr = String(i).padStart(2, '0');
      list.push({
        id: `ch-${numStr}`,
        novelId,
        chapterNumber: i,
        title: `ตอนที่ ${i}`,
      });
    }
  }

  return list.sort((a, b) => a.chapterNumber - b.chapterNumber);
}

// Fallback bundled comments
import bundledKyudoComments from '../data/novels/kyudo-senpai/comments.json';
import bundledBoyishComments from '../data/novels/boyish-friend/comments.json';
import bundledIdolComments from '../data/novels/idol-neighbor/comments.json';
import bundledBlackCatComments from '../data/novels/black-cat-hangout/comments.json';
import { getUserComments, getLikedCommentIds } from './storage';
import { CommentItem } from '../types';

export async function fetchChapterComments(novelId: string, chapterId: string): Promise<CommentItem[]> {
  let catalog: Record<string, { comments?: CommentItem[] }> = {};
  try {
    const res = await fetch(`${CDN_BASE_URL}/novels/${novelId}/comments.json`, { cache: 'no-cache' });
    if (res.ok) {
      catalog = await res.json();
    }
  } catch (err) {
    console.log('Using offline comments fallback:', err);
  }

  if (!catalog || Object.keys(catalog).length === 0) {
    if (novelId === 'kyudo-senpai') {
      catalog = bundledKyudoComments as any;
    } else if (novelId === 'boyish-friend') {
      catalog = bundledBoyishComments as any;
    } else if (novelId === 'idol-neighbor') {
      catalog = bundledIdolComments as any;
    } else if (novelId === 'black-cat-hangout') {
      catalog = bundledBlackCatComments as any;
    }
  }

  const simulated = (catalog[chapterId]?.comments || []) as CommentItem[];
  const likedIds = await getLikedCommentIds(novelId, chapterId);
  const userComments = await getUserComments(novelId, chapterId);

  // Map likes and liked state
  const resolvedSimulated = simulated.map((c) => {
    const isLiked = likedIds.includes(c.id);
    return {
      ...c,
      userLiked: isLiked,
      likes: isLiked ? c.likes + 1 : c.likes,
    };
  });

  return [...userComments, ...resolvedSimulated];
}
