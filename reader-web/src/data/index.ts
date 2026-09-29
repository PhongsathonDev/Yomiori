import initialNovels from './novels.json';
import { kyudoChapters, kyudoCharacters } from './novels/kyudo-senpai';
import { idolChapters, idolCharacters } from './novels/idol-neighbor';
import type { Novel, Chapter, Character } from '../types';

export const allNovels: Novel[] = initialNovels as Novel[];

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
