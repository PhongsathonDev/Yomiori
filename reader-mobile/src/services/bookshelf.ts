import AsyncStorage from '@react-native-async-storage/async-storage';
import { Novel, ReadingProgress } from '../types';
import { isSafeId } from './validation';
import { createKeyedQueue } from './queue';

export type ShelfStatus = 'active' | 'completed';
export type ShelfTab = ShelfStatus | 'all';
export type ShelfSort = 'recent' | 'title';
export type ShelfStatuses = Record<string, ShelfStatus>;

const enqueue = createKeyedQueue();
const statusKey = (id: string) => `yomiori_shelf_status_${id}`;
const sortKey = 'yomiori_shelf_sort';

// Keep personal organization separate from the CDN catalog, downloads and resume anchors.
// Reject I/O failures so the screen can retain its last successful state and offer retry.
export async function getShelfStatuses(ids: string[]): Promise<ShelfStatuses> {
  const safeIds = [...new Set(ids.filter(isSafeId))];
  if (!safeIds.length) return {};
  const values = new Map(await AsyncStorage.multiGet(safeIds.map(statusKey)));
  return Object.fromEntries(safeIds.map(id => [id, values.get(statusKey(id)) === 'completed' ? 'completed' : 'active']));
}

export function saveShelfStatus(id: string, status: ShelfStatus): Promise<void> {
  if (!isSafeId(id) || (status !== 'active' && status !== 'completed')) return Promise.reject(new Error('Invalid shelf status'));
  return enqueue(statusKey(id), () => AsyncStorage.setItem(statusKey(id), status));
}

export async function getShelfSort(): Promise<ShelfSort> {
  return await AsyncStorage.getItem(sortKey) === 'title' ? 'title' : 'recent';
}

export function saveShelfSort(sort: ShelfSort): Promise<void> {
  return enqueue(sortKey, () => AsyncStorage.setItem(sortKey, sort));
}

export function selectShelfNovels(
  novels: Novel[], statuses: ShelfStatuses, progress: Record<string, ReadingProgress | null>,
  tab: ShelfTab, query: string, tag: string, sort: ShelfSort,
): Novel[] {
  const needle = query.trim().normalize('NFC').toLocaleLowerCase();
  return novels.filter(novel =>
    (tab === 'all' || (statuses[novel.id] ?? 'active') === tab)
    && (tag === 'all' || novel.tags?.includes(tag))
    && (!needle || [novel.title, novel.originalTitle, novel.author].some(value => value?.normalize('NFC').toLocaleLowerCase().includes(needle))),
  ).sort((a, b) => {
    if (sort === 'recent') {
      const difference = (progress[b.id]?.updatedAt ?? 0) - (progress[a.id]?.updatedAt ?? 0);
      if (difference) return difference;
    }
    return a.title.localeCompare(b.title, 'th') || a.id.localeCompare(b.id);
  });
}

export function selectContinueNovel(novels: Novel[], statuses: ShelfStatuses, progress: Record<string, ReadingProgress | null>): Novel | undefined {
  return selectShelfNovels(novels, statuses, progress, 'active', '', 'all', 'recent')
    .find(novel => progress[novel.id] !== null && progress[novel.id] !== undefined);
}
