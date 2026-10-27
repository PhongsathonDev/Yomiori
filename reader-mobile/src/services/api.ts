import { Chapter, Character, Novel, IllustrationItem, NovelManifest, CommentItem, ChapterListItem, ChapterDownloadResult, ChapterLoadResult } from '../types';
import {
  saveChapterOffline, loadChapterOffline, getOfflineGeneration, cacheIllustrationOffline,
  readMetadata, saveMetadata, getUserComments, getLikedCommentIds,
} from './storage';
import { requestJson } from './request';
import { isChapter, isNovelList, isCharacterList, isManifest, isIllustrationList, isSafeId, isRecord } from './validation';
import bundledNovels from '../data/novels.json';
import bundledKyudoCharacters from '../data/novels/kyudo-senpai/characters.json';
import bundledBoyishCharacters from '../data/novels/boyish-friend/characters.json';
import bundledBlackCatCharacters from '../data/novels/black-cat-hangout/characters.json';
import { blackCatChapters } from '../data/novels/black-cat-hangout/chapters';
import bundledKyudoComments from '../data/novels/kyudo-senpai/comments.json';
import bundledBoyishComments from '../data/novels/boyish-friend/comments.json';
import bundledIdolComments from '../data/novels/idol-neighbor/comments.json';
import bundledBlackCatComments from '../data/novels/black-cat-hangout/comments.json';

export const CDN_BASE_URL = 'https://phongsathondev.github.io/Yomiori/data';

async function metadata<T>(key: string, url: string, validate: (data: unknown) => data is T, preferCache = false): Promise<T | null> {
  const cached = await readMetadata(key, validate);
  if (preferCache && cached !== null) return cached;
  try {
    const value = await requestJson(url);
    if (!validate(value)) throw new Error('Invalid metadata');
    await saveMetadata(key, value).catch(() => undefined);
    return value;
  } catch { return cached; }
}

export async function fetchNovels(preferCache = false): Promise<Novel[]> {
  const remote = await metadata('novels', `${CDN_BASE_URL}/novels.json`, isNovelList, preferCache) ?? [];
  const ids = new Set(remote.map(n => n.id));
  return [...remote, ...(bundledNovels as Novel[]).filter(n => !ids.has(n.id))];
}

export async function fetchCharacters(novelId: string, preferCache = false): Promise<Character[]> {
  if (!isSafeId(novelId)) return [];
  const remote = await metadata(`characters_${novelId}`, `${CDN_BASE_URL}/novels/${novelId}/characters.json`, isCharacterList, preferCache);
  if (remote) return remote;
  if (novelId === 'kyudo-senpai') return bundledKyudoCharacters as Character[];
  if (novelId === 'boyish-friend') return bundledBoyishCharacters as Character[];
  if (novelId === 'black-cat-hangout') return bundledBlackCatCharacters as Character[];
  return [];
}

export async function fetchIllustrations(novelId: string): Promise<IllustrationItem[]> {
  if (!isSafeId(novelId)) return [];
  return await metadata(`illustrations_${novelId}`, `${CDN_BASE_URL}/novels/${novelId}/illustrations.json`, isIllustrationList) ?? [];
}

async function fetchChapter(novelId: string, chapterId: string): Promise<Chapter> {
  if (!isSafeId(novelId) || !isSafeId(chapterId)) throw new Error('Invalid chapter ID');
  try {
    const value = await requestJson(`${CDN_BASE_URL}/novels/${novelId}/chapters/${chapterId}.json`);
    if (!isChapter(value, novelId, chapterId)) throw new Error('Invalid chapter response');
    return value;
  } catch (error) {
    const bundled = getBundledChapter(novelId, chapterId);
    if (bundled && isChapter(bundled, novelId, chapterId)) return bundled;
    throw error;
  }
}

export function getBundledChapter(novelId: string, chapterId: string): Chapter | null {
  return novelId === 'black-cat-hangout'
    ? (blackCatChapters as Chapter[]).find(chapter => chapter.id === chapterId) ?? null : null;
}

async function cacheChapterImages(chapter: Chapter, generation: number): Promise<boolean> {
  let complete = true;
  const sources = new Set(chapter.blocks.filter(b => b.type === 'illustration').map(b => b.src));
  for (const src of sources) {
    if (generation !== getOfflineGeneration(chapter.novelId)) return false;
    try { await cacheIllustrationOffline(chapter.novelId, src, generation); } catch { complete = false; }
  }
  return complete;
}

/** A cache failure never discards successfully fetched reading content. */
export async function getChapterForReading(novelId: string, chapterId: string): Promise<ChapterLoadResult> {
  const generation = getOfflineGeneration(novelId);
  const offline = await loadChapterOffline(novelId, chapterId);
  if (offline) return { chapter: offline, cacheWarning: false };
  try {
    const chapter = await fetchChapter(novelId, chapterId);
    let cacheWarning = false;
    try { await saveChapterOffline(chapter, generation); } catch { cacheWarning = true; }
    if (!cacheWarning) void cacheChapterImages(chapter, generation).catch(() => undefined);
    return { chapter, cacheWarning };
  } catch { return { chapter: null, cacheWarning: false }; }
}

export async function getChapter(novelId: string, chapterId: string): Promise<Chapter | null> {
  return (await getChapterForReading(novelId, chapterId)).chapter;
}

/** Retry uses existing readable text and only requests missing illustration files. */
export async function downloadChapterOnDemand(novelId: string, chapterId: string): Promise<ChapterDownloadResult> {
  const generation = getOfflineGeneration(novelId);
  try {
    const existing = await loadChapterOffline(novelId, chapterId);
    const chapter = existing ?? await fetchChapter(novelId, chapterId);
    if (!existing) await saveChapterOffline(chapter, generation);
    const complete = await cacheChapterImages(chapter, generation);
    if (generation !== getOfflineGeneration(novelId)) return { status: 'failed' };
    return { status: complete ? 'complete' : 'text-only' };
  } catch { return { status: 'failed' }; }
}

export async function fetchNovelManifest(novelId: string, preferCache = false): Promise<NovelManifest | null> {
  if (!isSafeId(novelId)) return null;
  return metadata(`manifest_${novelId}`, `${CDN_BASE_URL}/novels/${novelId}/manifest.json`,
    (data): data is NovelManifest => isManifest(data, novelId), preferCache);
}

export async function getAvailableChapterList(novelId: string, preferCache = false): Promise<ChapterListItem[]> {
  if (!isSafeId(novelId)) return [];
  const manifest = await fetchNovelManifest(novelId, preferCache);
  const available = manifest?.chapters.map(c => ({ id: c.id, novelId, chapterNumber: c.chapterNumber, title: c.title })) ?? [];
  if (novelId === 'black-cat-hangout') {
    const ids = new Set(available.map(chapter => chapter.id));
    for (const bundled of blackCatChapters as Chapter[]) {
      if (!ids.has(bundled.id)) available.push({ id: bundled.id, novelId, chapterNumber: bundled.chapterNumber, title: bundled.title });
    }
  }
  if (available.length > 0) return available.sort((a, b) => a.chapterNumber - b.chapterNumber);
  // Offline default fallback
  if (novelId === 'black-cat-hangout') {
    const list = [
      {
        id: 'ch-00',
        novelId,
        chapterNumber: 0,
        title: 'Ch.0 — รูปประกอบ',
      },
    ];
    for (let i = 1; i <= 60; i++) {
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

  let count = 1;
  if (novelId === 'kyudo-senpai') count = 25;
  if (novelId === 'boyish-friend') count = 14;
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

export async function fetchChapterComments(novelId: string, chapterId: string): Promise<CommentItem[]> {
  let catalog: Record<string, { comments?: CommentItem[] }> = {};
  try {
    const data = await requestJson(`${CDN_BASE_URL}/novels/${novelId}/comments.json`);
    if (isRecord(data)) catalog = data as typeof catalog;
  } catch (err) {
    console.log('Using offline comments fallback:', err);
  }

  if (!catalog || Object.keys(catalog).length === 0) {
    if (novelId === 'kyudo-senpai') {
      catalog = bundledKyudoComments as typeof catalog;
    } else if (novelId === 'boyish-friend') {
      catalog = bundledBoyishComments as typeof catalog;
    } else if (novelId === 'idol-neighbor') {
      catalog = bundledIdolComments as typeof catalog;
    } else if (novelId === 'black-cat-hangout') {
      catalog = bundledBlackCatComments as typeof catalog;
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
