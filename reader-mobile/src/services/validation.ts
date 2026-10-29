import { Chapter, StoryBlock, Novel, Character, NovelManifest, IllustrationItem } from '../types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value);
}

function isStoryBlock(value: unknown): value is StoryBlock {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id) return false;
  switch (value.type) {
    case 'narration': return typeof value.text === 'string';
    case 'dialogue': return typeof value.text === 'string' && typeof value.speakerId === 'string' && typeof value.speakerName === 'string';
    case 'scene_break': return value.symbol === undefined || typeof value.symbol === 'string';
    case 'illustration': return typeof value.src === 'string' && value.src.length > 0
      && (value.caption === undefined || typeof value.caption === 'string')
      && (value.alt === undefined || typeof value.alt === 'string')
      && (value.aspectRatio === undefined || (typeof value.aspectRatio === 'number' && Number.isFinite(value.aspectRatio) && value.aspectRatio > 0));
    default: return false;
  }
}

export function isChapter(value: unknown, novelId?: string, chapterId?: string): value is Chapter {
  return isRecord(value) && isSafeId(value.id) && isSafeId(value.novelId)
    && (novelId === undefined || value.novelId === novelId)
    && (chapterId === undefined || value.id === chapterId)
    && typeof value.chapterNumber === 'number' && Number.isFinite(value.chapterNumber)
    && typeof value.title === 'string' && typeof value.novelTitle === 'string'
    && Array.isArray(value.blocks) && value.blocks.every(isStoryBlock)
    && new Set(value.blocks.map(block => block.id)).size === value.blocks.length;
}

export function isNovelList(value: unknown): value is Novel[] {
  return Array.isArray(value) && value.every(n => isRecord(n) && isSafeId(n.id)
    && ['title', 'author', 'coverUrl', 'synopsis'].every(key => typeof n[key] === 'string')
    && (n.translationSource === undefined || (isRecord(n.translationSource)
      && typeof n.translationSource.name === 'string' && n.translationSource.name.trim().length > 0
      && typeof n.translationSource.url === 'string' && /^https:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/.test(n.translationSource.url)))
    && Array.isArray(n.tags) && n.tags.every(tag => typeof tag === 'string')
    && typeof n.totalOriginalChapters === 'number');
}

export function isCharacterList(value: unknown): value is Character[] {
  return Array.isArray(value) && value.every(c => isRecord(c) && typeof c.id === 'string'
    && typeof c.name === 'string' && typeof c.role === 'string' && typeof c.color === 'string'
    && (c.avatarUrl === undefined || typeof c.avatarUrl === 'string')
    && (c.description === undefined || typeof c.description === 'string')
    && (c.aliases === undefined || (Array.isArray(c.aliases) && c.aliases.every(a => typeof a === 'string'))));
}

export function isManifest(value: unknown, novelId: string): value is NovelManifest {
  return isRecord(value) && value.novelId === novelId && Array.isArray(value.chapters)
    && value.chapters.every(c => isRecord(c) && isSafeId(c.id)
      && typeof c.chapterNumber === 'number' && Number.isFinite(c.chapterNumber) && typeof c.title === 'string')
    && new Set(value.chapters.map(c => c.id)).size === value.chapters.length;
}

export function isIllustrationList(value: unknown): value is IllustrationItem[] {
  return Array.isArray(value) && value.every(i => isRecord(i)
    && typeof i.id === 'string' && typeof i.filename === 'string' && typeof i.title === 'string'
    && ['color_spread', 'cover', 'insert', 'special'].includes(String(i.type)));
}
