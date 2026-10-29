import characters from './characters.json';
import { makeineChapters } from './chapters';
import type { Character } from '../../../types';

export const makeineCharacters = characters as Character[];
export { makeineChapters };
