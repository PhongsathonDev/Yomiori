import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReadChapterIds, markChapterRead } from '../src/services/chapterReadHistory';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const defaults = {
  getItem: jest.mocked(AsyncStorage.getItem).getMockImplementation()!,
  setItem: jest.mocked(AsyncStorage.setItem).getMockImplementation()!,
};
beforeEach(async () => {
  jest.restoreAllMocks();
  jest.mocked(AsyncStorage.getItem).mockImplementation(defaults.getItem);
  jest.mocked(AsyncStorage.setItem).mockImplementation(defaults.setItem);
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
afterEach(() => jest.restoreAllMocks());

test('serializes concurrent completion writes without losing chapters or crossing novels', async () => {
  await Promise.all([markChapterRead('a', 'ch-2'), markChapterRead('a', 'ch-5'), markChapterRead('b', 'ch-2')]);
  expect(await getReadChapterIds('a')).toEqual(['ch-2', 'ch-5']);
  expect(await getReadChapterIds('b')).toEqual(['ch-2']);
  jest.mocked(AsyncStorage.setItem).mockClear();
  await markChapterRead('a', 'ch-2');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

test('write failures preserve prior completions and allow retry', async () => {
  await markChapterRead('a', 'ch-1');
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));
  await expect(markChapterRead('a', 'ch-2')).rejects.toThrow('full');
  expect(await getReadChapterIds('a')).toEqual(['ch-1']);
  expect(await markChapterRead('a', 'ch-2')).toEqual(['ch-1', 'ch-2']);
});

test('read failure cannot overwrite an existing history as empty', async () => {
  await markChapterRead('a', 'ch-1');
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));
  await expect(markChapterRead('a', 'ch-2')).rejects.toThrow('disk');
  expect(await getReadChapterIds('a')).toEqual(['ch-1']);
});

test('old resume progress and whole-novel completion do not imply per-chapter completion', async () => {
  await AsyncStorage.multiSet([
    ['yomiori_progress_a', JSON.stringify({ novelId: 'a', chapterId: 'ch-99', scrollPercent: 100 })],
    ['yomiori_shelf_status_a', 'completed'], ['yomiori_theme', 'dark'],
  ]);
  expect(await getReadChapterIds('a')).toEqual([]);
  await markChapterRead('a', 'ch-99');
  expect(await getReadChapterIds('a')).toEqual(['ch-99']);
  expect(await AsyncStorage.getItem('yomiori_shelf_status_a')).toBe('completed');
  expect(await AsyncStorage.getItem('yomiori_theme')).toBe('dark');
  expect(JSON.parse((await AsyncStorage.getItem('yomiori_progress_a'))!).chapterId).toBe('ch-99');
});

test('invalid stored data is tolerated and unsafe IDs never address storage', async () => {
  await AsyncStorage.setItem('yomiori_read_chapters_a', '{broken');
  expect(await getReadChapterIds('a')).toEqual([]);
  await AsyncStorage.setItem('yomiori_read_chapters_a', JSON.stringify(['ch-1', 'ch-1', '../bad', 4, null]));
  expect(await getReadChapterIds('a')).toEqual(['ch-1']);
  await expect(markChapterRead('../bad', 'ch-1')).rejects.toThrow();
  expect(await getReadChapterIds('../bad')).toEqual([]);
});
