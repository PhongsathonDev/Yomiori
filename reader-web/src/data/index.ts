import initialNovels from './novels.json';
import { kyudoChapters, kyudoCharacters as rawKyudoCharacters } from './novels/kyudo-senpai';
import { idolChapters, idolCharacters as rawIdolCharacters } from './novels/idol-neighbor';
import type { Novel, Chapter, Character } from '../types';
import { getAssetUrl } from '../utils/assets';

function normalizeNovel(n: any): Novel {
  return {
    ...n,
    coverUrl: getAssetUrl(n.coverUrl),
    bannerUrl: n.bannerUrl ? getAssetUrl(n.bannerUrl) : undefined,
  };
}

function normalizeCharacter(c: any): Character {
  return {
    ...c,
    avatarUrl: c.avatarUrl ? getAssetUrl(c.avatarUrl) : undefined,
  };
}

export const kyudoCharacters: Character[] = (rawKyudoCharacters as Character[]).map(normalizeCharacter);
export const idolCharacters: Character[] = (rawIdolCharacters as Character[]).map(normalizeCharacter);

export const allNovels: Novel[] = (initialNovels as Novel[]).map(normalizeNovel);

export const allCharacters: Character[] = [
  ...kyudoCharacters,
  ...idolCharacters,
];

export const allChapters: Chapter[] = [
  ...kyudoChapters,
  ...idolChapters,
];

export const getNovelById = (id: string): Novel | undefined => {
  return allNovels.find((n) => n.id === id);
};

export const getChaptersByNovelId = (novelId: string): Chapter[] => {
  return allChapters.filter((c) => c.novelId === novelId);
};

export const getCharactersByNovelId = (novelId: string): Character[] => {
  if (novelId === 'kyudo-senpai') return kyudoCharacters;
  if (novelId === 'idol-neighbor') return idolCharacters;
  return allCharacters;
};

export const getChapterById = (id: string): Chapter | undefined => {
  return allChapters.find((c) => c.id === id);
};
