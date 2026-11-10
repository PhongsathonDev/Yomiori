import AsyncStorage from '@react-native-async-storage/async-storage';
import { getShelfStatuses, saveShelfStatus, getShelfSort, saveShelfSort, selectShelfNovels, selectContinueNovel } from '../src/services/bookshelf';
import { Novel, ReadingProgress } from '../src/types';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const storageDefaults = { multiGet: jest.mocked(AsyncStorage.multiGet).getMockImplementation()!, setItem: jest.mocked(AsyncStorage.setItem).getMockImplementation()! };
const makeNovel = (id: string, title = id): Novel => ({ id, title, originalTitle: `Original ${id}`, author: `Author ${id}`, coverUrl: '', tags: ['รัก'], synopsis: '', totalOriginalChapters: 1 });
const makeProgress = (id: string, updatedAt: number): ReadingProgress => ({ novelId: id, chapterId: 'ch-01', scrollPercent: 100, updatedAt });

beforeEach(async () => { jest.restoreAllMocks();
  jest.mocked(AsyncStorage.multiGet).mockImplementation(storageDefaults.multiGet);
  jest.mocked(AsyncStorage.setItem).mockImplementation(storageDefaults.setItem);
  await AsyncStorage.clear(); });

test('status round trips independently per book and preserves existing user data', async () => {
  await AsyncStorage.multiSet([['yomiori_progress_a', '{"anchor":"unchanged"}'], ['yomiori_theme', 'dark'], ['yomiori_metadata_novels', 'catalog']]);
  expect(await getShelfStatuses(['a', 'b'])).toEqual({ a: 'active', b: 'active' });
  await Promise.all([saveShelfStatus('a', 'completed'), saveShelfStatus('b', 'completed')]);
  expect(await getShelfStatuses(['a', 'b'])).toEqual({ a: 'completed', b: 'completed' });
  await saveShelfStatus('a', 'active');
  expect(await getShelfStatuses(['a', 'b'])).toEqual({ a: 'active', b: 'completed' });
  expect(await AsyncStorage.getItem('yomiori_progress_a')).toBe('{"anchor":"unchanged"}');
  expect(await AsyncStorage.getItem('yomiori_theme')).toBe('dark');
  expect(await AsyncStorage.getItem('yomiori_metadata_novels')).toBe('catalog');
});

test('invalid stored values default safely and unsafe IDs cannot be written', async () => {
  await AsyncStorage.setItem('yomiori_shelf_status_a', 'garbage');
  await AsyncStorage.setItem('yomiori_shelf_sort', 'garbage');
  expect(await getShelfStatuses(['a', '../invalid'])).toEqual({ a: 'active' });
  expect(await getShelfSort()).toBe('recent');
  await expect(saveShelfStatus('../invalid', 'completed')).rejects.toThrow();
  await saveShelfSort('title');
  expect(await getShelfSort()).toBe('title');
});

test('I/O failures propagate, preserve saved state, and allow retry', async () => {
  await saveShelfStatus('a', 'completed');
  jest.spyOn(AsyncStorage, 'multiGet').mockRejectedValueOnce(new Error('disk'));
  await expect(getShelfStatuses(['a'])).rejects.toThrow('disk');
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk'));
  await expect(saveShelfStatus('a', 'active')).rejects.toThrow('disk');
  expect(await getShelfStatuses(['a'])).toEqual({ a: 'completed' });
  await saveShelfStatus('a', 'active');
  expect(await getShelfStatuses(['a'])).toEqual({ a: 'active' });
});

test('search, tags, tabs and sorting compose across 100 books without changing the catalog', () => {
  const novels = Array.from({ length: 100 }, (_, i) => makeNovel(`book-${i}`, `เรื่อง ${String(i).padStart(3, '0')}`));
  const original = novels.map(novel => novel.id);
  const statuses = { 'book-50': 'completed' as const };
  const progress = { 'book-10': makeProgress('book-10', 10), 'book-20': makeProgress('book-20', 20), 'book-50': makeProgress('book-50', 50) };
  const active = selectShelfNovels(novels, statuses, progress, 'active', '', 'all', 'recent');
  expect(active).toHaveLength(99);
  expect(active.slice(0, 3).map(novel => novel.id)).toEqual(['book-20', 'book-10', 'book-0']);
  expect(selectShelfNovels(novels, statuses, progress, 'completed', ' AUTHOR BOOK-50 ', 'รัก', 'title')).toEqual([novels[50]]);
  expect(selectShelfNovels(novels, statuses, progress, 'all', 'original book-20', 'รัก', 'title')).toEqual([novels[20]]);
  expect(selectShelfNovels(novels, statuses, progress, 'all', 'เรื่อง 020', 'อื่น', 'title')).toEqual([]);
  expect(selectShelfNovels(novels, statuses, progress, 'all', '', 'all', 'title')[0].id).toBe('book-0');
  expect(novels.map(novel => novel.id)).toEqual(original);
});

test('continue needs history, excludes completed/missing books and does not auto-complete at 100%', () => {
  const novels = [makeNovel('a'), makeNovel('b')];
  expect(selectContinueNovel(novels, {}, {})).toBeUndefined();
  const progress = { a: makeProgress('a', 1), b: makeProgress('b', 2), missing: makeProgress('missing', 3) };
  expect(selectContinueNovel(novels, { b: 'completed' }, progress)?.id).toBe('a');
  expect(selectContinueNovel(novels, { a: 'completed', b: 'completed' }, progress)).toBeUndefined();
  expect(selectShelfNovels(novels.map(n => ({ ...n, totalOriginalChapters: 100 })), { b: 'completed' }, progress, 'completed', '', 'all', 'recent')[0].id).toBe('b');
});
