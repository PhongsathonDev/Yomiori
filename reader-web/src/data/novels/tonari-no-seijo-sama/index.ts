import characters from './characters.json';
import { seijoChapters } from './chapters';
import type { Character } from '../../../types';

export const seijoCharacters = characters as Character[];
export { seijoChapters };
