import AsyncStorage from '@react-native-async-storage/async-storage';
import { createKeyedQueue } from './queue';
import { isSafeId } from './validation';

const enqueue = createKeyedQueue();
const historyKey = (novelId: string) => `yomiori_read_chapters_${novelId}`;

async function readIds(novelId: string): Promise<string[]> {
  // Propagate I/O failures: an unreadable history must not be overwritten as empty.
  const raw = await AsyncStorage.getItem(historyKey(novelId));
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? [...new Set(value.filter(isSafeId))] : [];
  } catch { return []; }
}

export function getReadChapterIds(novelId: string): Promise<string[]> {
  if (!isSafeId(novelId)) return Promise.resolve([]);
  return enqueue(novelId, () => readIds(novelId));
}

/** Completion is monotonic and independent of resume position and offline files. */
export function markChapterRead(novelId: string, chapterId: string): Promise<string[]> {
  if (!isSafeId(novelId) || !isSafeId(chapterId)) return Promise.reject(new Error('Invalid chapter identity'));
  return enqueue(novelId, async () => {
    const ids = await readIds(novelId);
    if (ids.includes(chapterId)) return ids;
    const updated = [...ids, chapterId];
    await AsyncStorage.setItem(historyKey(novelId), JSON.stringify(updated));
    return updated;
  });
}
