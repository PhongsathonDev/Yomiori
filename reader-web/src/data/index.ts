import initialNovels from './novels.json';
import { kyudoChapters, kyudoCharacters as rawKyudoCharacters } from './novels/kyudo-senpai';
import { boyishChapters, boyishCharacters as rawBoyishCharacters } from './novels/boyish-friend';
import { blackCatChapters, blackCatCharacters as rawBlackCatCharacters } from './novels/black-cat-hangout';
import { makeineChapters, makeineCharacters as rawMakeineCharacters } from './novels/makeine-too-many-losing-heroines';
import { nazekaChapters, nazekaCharacters as rawNazekaCharacters } from './novels/nazeka-natsukareta-rashii';
import { kokouChapters, kokouCharacters as rawKokouCharacters } from './novels/kokou-na-kanojo';
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
export const boyishCharacters: Character[] = (rawBoyishCharacters as Character[]).map(normalizeCharacter);
export const blackCatCharacters: Character[] = (rawBlackCatCharacters as Character[]).map(normalizeCharacter);
export const makeineCharacters: Character[] = (rawMakeineCharacters as Character[]).map(normalizeCharacter);
export const nazekaCharacters: Character[] = (rawNazekaCharacters as Character[]).map(normalizeCharacter);

export const kokouCharacters: Character[] = (rawKokouCharacters as Character[]).map(normalizeCharacter);

export const allNovels: Novel[] = (initialNovels as Novel[]).map(normalizeNovel);

export const allCharacters: Character[] = [
  ...kyudoCharacters,
  ...boyishCharacters,
  ...blackCatCharacters,
  ...makeineCharacters,
  ...nazekaCharacters,
  ...kokouCharacters,
];

export const allChapters: Chapter[] = [
  ...kyudoChapters,
  ...boyishChapters,
  ...blackCatChapters,
  ...makeineChapters,
  ...nazekaChapters,
  ...kokouChapters,
];

export const getNovelById = (id: string): Novel | undefined => {
  return allNovels.find((n) => n.id === id);
};

export const getChaptersByNovelId = (novelId: string): Chapter[] => {
  return allChapters.filter((c) => c.novelId === novelId);
};

export const getCharactersByNovelId = (novelId: string): Character[] => {
  if (novelId === 'kyudo-senpai') return kyudoCharacters;
  if (novelId === 'boyish-friend') return boyishCharacters;
  if (novelId === 'black-cat-hangout') return blackCatCharacters;
  if (novelId === 'makeine-too-many-losing-heroines') return makeineCharacters;
  if (novelId === 'nazeka-natsukareta-rashii') return nazekaCharacters;
  if (novelId === 'kokou-na-kanojo') return kokouCharacters;
  return allCharacters;
};

export const getChapterById = (id: string): Chapter | undefined => {
  return allChapters.find((c) => c.id === id);
};
