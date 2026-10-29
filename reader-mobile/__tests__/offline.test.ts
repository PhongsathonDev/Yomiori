import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chapter, Novel } from '../src/types';
import {
  saveUserComment, getUserComments, toggleCommentLike, getLikedCommentIds,
  cacheIllustrationOffline, clearNovelOfflineStorage, getChapterFilePath, getChapterOfflineStatus,
  getIllustrationLocalPath, getNovelOfflineStats, getReadingProgress, getSavedFontFamily,
  getSavedFontSize, getSavedLineHeight, getSavedTheme, loadChapterOffline, getBundledChapter,
  resolveIllustrationUri, saveChapterOffline, deleteChapterOffline, saveReadingProgress, withOfflineJob, getSavedLibrary, getSavedNovel,
} from '../src/services/storage';
import { downloadChapterOnDemand, fetchCharacters, fetchNovels, getAvailableChapterList, getChapterForReading } from '../src/services/api';
import { requestJson } from '../src/services/request';
import blackCatConversion from '../src/data/novels/black-cat-hangout/conversion-status.json';
import bundledNovels from '../src/data/novels.json';
import { isNovelList } from '../src/services/validation';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/', EncodingType: { UTF8: 'utf8' },
  getInfoAsync: jest.fn(), makeDirectoryAsync: jest.fn(), readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(), copyAsync: jest.fn(), moveAsync: jest.fn(), deleteAsync: jest.fn(),
  readDirectoryAsync: jest.fn(), createDownloadResumable: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const fs = jest.mocked(FileSystem);
const files = new Map<string, string>();
const chapter: Chapter = {
  id: 'ch-99', novelId: 'test-novel', chapterNumber: 99, title: 'Chapter 99', novelTitle: 'Test novel',
  blocks: [{ id: 'b-1', type: 'narration', text: 'A reading passage.' }],
};
const illustrated: Chapter = { ...chapter, blocks: [{ id: 'b-1', type: 'illustration', src: '/illustrations/page.jpg' }] };
const response = (value: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => value }) as Response;
const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

beforeEach(async () => {
  jest.useRealTimers();
  jest.clearAllMocks();
  files.clear();
  await AsyncStorage.clear();
  global.fetch = fetchMock;
  fetchMock.mockReset().mockRejectedValue(new Error('Offline'));
  fs.getInfoAsync.mockImplementation(async path => files.has(path)
    ? { exists: true, isDirectory: false, uri: path, size: files.get(path)!.length, modificationTime: 0 }
    : [...files.keys()].some(key => key.startsWith(path.endsWith('/') ? path : `${path}/`))
      ? { exists: true, isDirectory: true, uri: path, size: 0, modificationTime: 0 }
      : { exists: false, isDirectory: false, uri: path });
  fs.makeDirectoryAsync.mockResolvedValue(undefined);
  fs.readAsStringAsync.mockImplementation(async path => {
    if (!files.has(path)) throw new Error('Missing file');
    return files.get(path)!;
  });
  fs.writeAsStringAsync.mockImplementation(async (path, data) => { files.set(path, data); });
  fs.copyAsync.mockImplementation(async ({ from, to }) => { files.set(to, files.get(from)!); });
  fs.moveAsync.mockImplementation(async ({ from, to }) => {
    if (!files.has(from)) throw new Error('Missing staged file');
    files.set(to, files.get(from)!); files.delete(from);
  });
  fs.deleteAsync.mockImplementation(async path => {
    for (const key of files.keys()) if (key === path || key.startsWith(path.endsWith('/') ? path : `${path}/`)) files.delete(key);
  });
  fs.readDirectoryAsync.mockImplementation(async path => {
    const prefix = path.endsWith('/') ? path : `${path}/`;
    return [...new Set([...files.keys()].filter(key => key.startsWith(prefix)).map(key => key.slice(prefix.length).split('/')[0]))];
  });
  fs.createDownloadResumable.mockImplementation((_url, path) => ({
    downloadAsync: jest.fn(async () => { files.set(path, 'image-data'); return { status: 200, uri: path }; }),
    cancelAsync: jest.fn().mockResolvedValue(undefined),
  }) as unknown as FileSystem.DownloadResumable);
  // Each test models a fresh library; invalidate session summaries as well.
  await clearNovelOfflineStorage('test-novel');
  await clearNovelOfflineStorage('kyudo-senpai');
  jest.clearAllMocks();
});

afterEach(() => { jest.useRealTimers(); });

describe('validated chapter storage', () => {
  test.each(['{broken', JSON.stringify({ ...chapter, novelId: 'wrong' }), JSON.stringify({ ...chapter, blocks: [{}] })])('ignores damaged or mismatched cache: %s', async raw => {
    files.set(getChapterFilePath(chapter.novelId, chapter.id), raw);
    expect(await loadChapterOffline(chapter.novelId, chapter.id)).toBeNull();
    fetchMock.mockResolvedValue(response(chapter));
    expect((await getChapterForReading(chapter.novelId, chapter.id)).chapter).toEqual(chapter);
  });

  test('rejects mismatched network IDs before writing', async () => {
    fetchMock.mockResolvedValue(response({ ...chapter, id: 'another' }));
    expect(await getChapterForReading(chapter.novelId, chapter.id)).toEqual({ chapter: null, cacheWarning: false });
    expect(fs.writeAsStringAsync).not.toHaveBeenCalled();
  });

  test('404 becomes a load failure', async () => {
    fetchMock.mockResolvedValue(response({}, 404));
    expect((await getChapterForReading(chapter.novelId, chapter.id)).chapter).toBeNull();
  });

  test('disk full still returns fetched content with a cache warning', async () => {
    fs.writeAsStringAsync.mockRejectedValueOnce(new Error('Disk full'));
    fetchMock.mockResolvedValue(response(chapter));
    expect(await getChapterForReading(chapter.novelId, chapter.id)).toEqual({ chapter, cacheWarning: true });
    expect(files.has(getChapterFilePath(chapter.novelId, chapter.id))).toBe(false);
  });

  test('failed staged write preserves existing readable data and cleans temporary file', async () => {
    await saveChapterOffline(chapter);
    // Mirror the destructive destination removal in legacy iOS moveAsync.
    fs.moveAsync.mockImplementationOnce(async ({ to }) => { files.delete(to); throw new Error('Cannot promote'); });
    await expect(saveChapterOffline({ ...chapter, title: 'New title' })).rejects.toThrow('Cannot promote');
    expect((await loadChapterOffline(chapter.novelId, chapter.id))?.title).toBe(chapter.title);
    expect([...files.keys()].some(path => path.endsWith('.tmp'))).toBe(false);
  });

  test('serializes competing writes and recovers after rejection', async () => {
    fs.writeAsStringAsync.mockRejectedValueOnce(new Error('Disk busy'));
    const first = saveChapterOffline(chapter);
    const second = saveChapterOffline({ ...chapter, title: 'Latest title' });
    await expect(first).rejects.toThrow();
    await second;
    expect((await loadChapterOffline(chapter.novelId, chapter.id))?.title).toBe('Latest title');
  });

  test('clearing invalidates an in-flight request and preserves bundled reading data', async () => {
    let resolve!: (value: Response) => void;
    fetchMock.mockReturnValue(new Promise(done => { resolve = done; }));
    const reading = getChapterForReading(chapter.novelId, chapter.id);
    // Let the offline check finish before clearing.
    while (!fetchMock.mock.calls.length) await Promise.resolve();
    await clearNovelOfflineStorage(chapter.novelId);
    resolve(response(chapter));
    expect((await reading).cacheWarning).toBe(true);
    expect(files.size).toBe(0);
    await clearNovelOfflineStorage('kyudo-senpai');
    expect(await loadChapterOffline('kyudo-senpai', 'ch-01')).not.toBeNull();
    expect(await getNovelOfflineStats('kyudo-senpai')).toEqual({ count: 0, totalBytes: 0 });
  });

  test('counts removable files separately from bundled availability', async () => {
    await saveChapterOffline(chapter);
    expect((await getNovelOfflineStats(chapter.novelId)).count).toBe(1);
    expect((await getNovelOfflineStats(chapter.novelId)).totalBytes).toBeGreaterThan(0);
    files.set(getChapterFilePath(chapter.novelId, 'broken'), '{bad');
    expect((await getNovelOfflineStats(chapter.novelId)).count).toBe(1);
  });
});

describe('illustrations and explicit downloads', () => {
  test('opens text before a pending illustration download finishes', async () => {
    fs.createDownloadResumable.mockReturnValue({ downloadAsync: () => Promise.resolve({ status: 503 }), cancelAsync: async () => undefined } as unknown as FileSystem.DownloadResumable);
    fetchMock.mockResolvedValue(response(illustrated));
    expect((await getChapterForReading(chapter.novelId, chapter.id)).chapter).toEqual(illustrated);
    // Wait for background caching to release its file lock.
    await saveChapterOffline(illustrated);
  });

  test('rejects a non-2xx image without leaving an accepted cache file', async () => {
    fs.createDownloadResumable.mockReturnValue({ downloadAsync: async () => ({ status: 404 }), cancelAsync: async () => undefined } as unknown as FileSystem.DownloadResumable);
    await expect(cacheIllustrationOffline(chapter.novelId, 'missing.jpg')).rejects.toThrow();
    expect([...files.keys()].some(path => path.includes('missing.jpg'))).toBe(false);
  });

  test('reports partial download, retries missing images and resolves local URI', async () => {
    await saveChapterOffline(illustrated);
    fs.createDownloadResumable.mockImplementationOnce((_url, path) => ({
      downloadAsync: async () => { files.set(path, 'error body'); return { status: 500 }; }, cancelAsync: async () => undefined,
    }) as unknown as FileSystem.DownloadResumable);
    expect(await downloadChapterOnDemand(chapter.novelId, chapter.id)).toEqual({ status: 'text-only' });
    expect(await getChapterOfflineStatus(chapter.novelId, chapter.id)).toBe('text-only');
    expect(await downloadChapterOnDemand(chapter.novelId, chapter.id)).toEqual({ status: 'complete' });
    const local = getIllustrationLocalPath(chapter.novelId, '/illustrations/page.jpg');
    expect(await resolveIllustrationUri(chapter.novelId, '/illustrations/page.jpg')).toBe(local);
    expect(await resolveIllustrationUri(chapter.novelId, `https://phongsathondev.github.io/Yomiori/data/novels/${chapter.novelId}/illustrations/page.jpg`)).toBe(local);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('download fails when text cannot be stored', async () => {
    fetchMock.mockResolvedValue(response(chapter));
    fs.writeAsStringAsync.mockRejectedValueOnce(new Error('Disk full'));
    expect(await downloadChapterOnDemand(chapter.novelId, chapter.id)).toEqual({ status: 'failed' });
  });

  test('rejects overlapping jobs until the original job completes', async () => {
    let release!: () => void;
    const first = withOfflineJob(chapter.novelId, () => new Promise<void>(done => { release = done; }));
    await expect(withOfflineJob(chapter.novelId, async () => undefined)).rejects.toThrow();
    release(); await first;
    await expect(withOfflineJob(chapter.novelId, async () => 42)).resolves.toBe(42);
  });

  test('cancels a stalled image download after ten seconds', async () => {
    jest.useFakeTimers();
    const cancelAsync = jest.fn().mockResolvedValue(undefined);
    fs.createDownloadResumable.mockReturnValue({ downloadAsync: () => new Promise(() => undefined), cancelAsync } as unknown as FileSystem.DownloadResumable);
    const download = cacheIllustrationOffline(chapter.novelId, 'slow.jpg');
    const rejection = expect(download).rejects.toThrow('timed out');
    await jest.advanceTimersByTimeAsync(10_000);
    await rejection;
    expect(cancelAsync).toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('metadata, settings and progress compatibility', () => {
  test('all bundled Thai translation sources match the web catalog and their novel projects', async () => {
    expect(bundledNovels).toEqual(require('../../reader-web/src/data/novels.json'));
    expect(isNovelList(bundledNovels)).toBe(true);
    const novels = await fetchNovels(true);
    for (const [id, project] of [['kyudo-senpai', '17934'], ['boyish-friend', '15877'], ['black-cat-hangout', '17903']]) {
      expect(novels.find(novel => novel.id === id)?.translationSource).toEqual({
        name: 'Nekopost', url: `https://www.nekopost.net/novel/${project}`,
      });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('old cached catalogs gain bundled sources without losing their other metadata or requiring a network', async () => {
    const { translationSource: _source, ...oldNovel } = bundledNovels[0];
    await AsyncStorage.setItem('yomiori_metadata_novels', JSON.stringify([{ ...oldNovel, title: 'Cached title' }]));
    const novels = await fetchNovels(true);
    expect(novels.find(novel => novel.id === oldNovel.id)).toMatchObject({
      title: 'Cached title', translationSource: bundledNovels[0].translationSource,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('fresh source metadata takes precedence over bundled credits', async () => {
    const novel = { ...bundledNovels[0], translationSource: { name: 'Updated source', url: 'https://example.com/novel' } };
    fetchMock.mockResolvedValue(response([novel]));
    expect(await fetchNovels()).toContainEqual(novel);
  });

  test.each([null, {}, { name: 'Nekopost', url: 'javascript:alert(1)' }, { name: '', url: 'https://example.com' }])(
    'rejects invalid translation source metadata: %j', translationSource => {
      expect(isNovelList([{ ...bundledNovels[0], translationSource }])).toBe(false);
    },
  );

  test('lists the complete real Black Cat bundle offline without filling intentionally skipped numbers', async () => {
    const list = await getAvailableChapterList('black-cat-hangout', true);
    expect(list.map(item => item.chapterNumber)).toEqual([
      ...Array.from({ length: 61 }, (_, number) => number), ...blackCatConversion.convertedChapters,
    ]);
    expect(new Set(list.map(item => item.id)).size).toBe(list.length);
    for (const skipped of blackCatConversion.skippedChapters as { chapterNumber: number }[]) {
      expect(getBundledChapter('black-cat-hangout', `ch-${skipped.chapterNumber}`)).toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('an older Black Cat manifest still merges all actual bundled chapters without duplicates', async () => {
    fetchMock.mockResolvedValue(response({ novelId: 'black-cat-hangout', chapters: [
      { id: 'ch-61', chapterNumber: 61, title: 'Earlier manifest title' },
    ] }));
    const list = await getAvailableChapterList('black-cat-hangout');
    expect(list).toHaveLength(61 + blackCatConversion.convertedChapters.length);
    expect(list.filter(item => item.id === 'ch-61')).toHaveLength(1);
    expect(list.at(-1)).toMatchObject({ id: 'ch-87', offlineStatus: 'complete' });
    for (const skipped of blackCatConversion.skippedChapters as { chapterNumber: number }[]) {
      expect(list.some(item => item.chapterNumber === skipped.chapterNumber)).toBe(false);
    }
  });

  test.each(blackCatConversion.convertedChapters)('opens new bundled Black Cat Ch.%i without network or disk writes', async number => {
    const result = await getChapterForReading('black-cat-hangout', `ch-${number}`);
    expect(result.cacheWarning).toBe(false);
    expect(result.chapter).toMatchObject({ id: `ch-${number}`, novelId: 'black-cat-hangout', chapterNumber: number });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fs.writeAsStringAsync).not.toHaveBeenCalled();
  });

  test('recovers a saved Kyudo chapter beyond the old fallback range without a manifest', async () => {
    const saved = { ...chapter, novelId: 'kyudo-senpai', chapterNumber: 99 };
    await saveChapterOffline(saved);
    const list = await getAvailableChapterList(saved.novelId, true);
    expect(list.find(item => item.id === saved.id)).toMatchObject({ title: saved.title, offlineStatus: 'complete' });
    expect(list.some(item => item.id === 'ch-01')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('a remote manifest cannot hide saved chapters it no longer contains', async () => {
    await saveChapterOffline(chapter);
    fetchMock.mockResolvedValue(response({ novelId: chapter.novelId, chapters: [] }));
    expect((await getAvailableChapterList(chapter.novelId)).map(item => item.id)).toContain(chapter.id);
  });

  test('recovers a remote-only book and partial illustrations even after catalog loss', async () => {
    await saveChapterOffline(illustrated);
    expect((await getSavedLibrary())[0]).toMatchObject({ id: chapter.novelId, title: chapter.novelTitle,
      chapters: [{ id: chapter.id, offlineStatus: 'text-only' }] });
    expect(await fetchNovels(true)).toContainEqual(expect.objectContaining({ id: chapter.novelId, title: chapter.novelTitle }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('file discovery validates backups, skips damaged and temporary files, and deduplicates IDs', async () => {
    const path = getChapterFilePath(chapter.novelId, chapter.id);
    files.set(path, '{broken'); files.set(`${path}.bak`, JSON.stringify(chapter));
    files.set(getChapterFilePath(chapter.novelId, 'ch-10'), JSON.stringify({ ...chapter, id: 'wrong' }));
    files.set(`${getChapterFilePath(chapter.novelId, 'ch-11')}.tmp`, JSON.stringify({ ...chapter, id: 'ch-11' }));
    const saved = await getSavedNovel(chapter.novelId);
    expect(saved?.chapters.map(item => item.id)).toEqual([chapter.id]);
  });

  test('local catalog, chapter list and characters never wait for a stalled network', async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));
    await Promise.all([fetchNovels(true), getAvailableChapterList('kyudo-senpai', true), fetchCharacters('kyudo-senpai', true)]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('a newly saved chapter is discoverable even when an earlier scan is still pending', async () => {
    let finishOldScan!: (names: string[]) => void;
    fs.readDirectoryAsync.mockReturnValueOnce(new Promise(done => { finishOldScan = done; }));
    const oldScan = getSavedNovel(chapter.novelId);
    await saveChapterOffline(chapter);
    expect((await getSavedNovel(chapter.novelId))?.chapters[0].id).toBe(chapter.id);
    finishOldScan([]);
    await oldScan;
  });

  test('reuses a scan until a chapter changes, then rescans', async () => {
    await saveChapterOffline(chapter);
    await getSavedNovel(chapter.novelId);
    fs.readAsStringAsync.mockClear();
    await getSavedNovel(chapter.novelId);
    expect(fs.readAsStringAsync).not.toHaveBeenCalled();
    await saveChapterOffline({ ...chapter, title: 'Updated' });
    fs.readAsStringAsync.mockClear();
    expect((await getSavedNovel(chapter.novelId))?.chapters[0].title).toBe('Updated');
    expect(fs.readAsStringAsync).toHaveBeenCalled();
  });

  test('retries a partial scan after a temporary chapter read failure', async () => {
    const second = { ...chapter, id: 'ch-100', chapterNumber: 100 };
    await saveChapterOffline(chapter);
    await saveChapterOffline(second);
    const read = fs.readAsStringAsync.getMockImplementation()!;
    let failed = false;
    fs.readAsStringAsync.mockImplementation(async (path, options) => {
      if (path === getChapterFilePath(second.novelId, second.id) && !failed) {
        failed = true;
        throw new Error('temporary I/O failure');
      }
      return read(path, options);
    });
    expect((await getSavedNovel(chapter.novelId))?.chapters.map(item => item.id)).toEqual([chapter.id]);
    expect((await getSavedNovel(chapter.novelId))?.chapters.map(item => item.id)).toEqual([chapter.id, second.id]);
  });

  test('retries an illustration stat failure instead of caching text-only', async () => {
    await saveChapterOffline(illustrated);
    const path = getIllustrationLocalPath(chapter.novelId, '/illustrations/page.jpg');
    files.set(path, 'image-data');
    const stat = fs.getInfoAsync.getMockImplementation()!;
    let failed = false;
    fs.getInfoAsync.mockImplementation(async (uri, options) => {
      if (uri === path && !failed) { failed = true; throw new Error('temporary I/O failure'); }
      return stat(uri, options);
    });
    expect((await getSavedNovel(chapter.novelId))?.chapters[0].offlineStatus).toBe('text-only');
    expect((await getSavedNovel(chapter.novelId))?.chapters[0].offlineStatus).toBe('complete');
  });

  test('shares concurrent scans and invalidates after deleting a chapter', async () => {
    await saveChapterOffline(chapter);
    const [first, second] = await Promise.all([getSavedNovel(chapter.novelId), getSavedNovel(chapter.novelId)]);
    expect(first).toEqual(second);
    expect(fs.readDirectoryAsync).toHaveBeenCalledTimes(1);
    await deleteChapterOffline(chapter.novelId, chapter.id);
    expect(await getSavedNovel(chapter.novelId)).toBeNull();
  });

  test('retries primary after a temporary failure even when backup was readable', async () => {
    const path = getChapterFilePath(chapter.novelId, chapter.id);
    files.set(path, JSON.stringify(chapter));
    files.set(`${path}.bak`, JSON.stringify({ ...chapter, title: 'Backup' }));
    const read = fs.readAsStringAsync.getMockImplementation()!;
    let failed = false;
    fs.readAsStringAsync.mockImplementation(async (uri, options) => {
      if (uri === path && !failed) { failed = true; throw new Error('temporary I/O failure'); }
      return read(uri, options);
    });
    expect((await getSavedNovel(chapter.novelId))?.chapters[0].title).toBe('Backup');
    expect((await getSavedNovel(chapter.novelId))?.chapters[0].title).toBe(chapter.title);
  });

  test('reading progress keeps a valid anchor and ignores a malformed anchor', async () => {
    const anchor = { blockId: 'b-1', blockIndex: 0, fraction: 0.4 };
    await saveReadingProgress(chapter.novelId, chapter.id, 42, anchor);
    expect(await getReadingProgress(chapter.novelId)).toMatchObject({ scrollPercent: 42, anchor });
    await AsyncStorage.setItem(`yomiori_progress_${chapter.novelId}`, JSON.stringify({
      novelId: chapter.novelId, chapterId: chapter.id, scrollPercent: 42, updatedAt: 1,
      anchor: { ...anchor, fraction: 5 },
    }));
    expect(await getReadingProgress(chapter.novelId)).toEqual({ novelId: chapter.novelId, chapterId: chapter.id, scrollPercent: 42, updatedAt: 1 });
  });

  test('discard a scan that finishes after the chapter is replaced', async () => {
    await saveChapterOffline(chapter);
    let finishScan!: (names: string[]) => void;
    fs.readDirectoryAsync.mockReturnValueOnce(new Promise(resolve => { finishScan = resolve; }));
    const scan = getSavedNovel(chapter.novelId);
    await saveChapterOffline({ ...chapter, title: 'Replaced' });
    finishScan([`${chapter.id}.json`]);
    expect((await scan)?.chapters[0].title).toBe('Replaced');
  });

  test('invalidates the summary after illustration download and library clear', async () => {
    await saveChapterOffline(illustrated);
    expect((await getSavedNovel(chapter.novelId))?.chapters[0].offlineStatus).toBe('text-only');
    await cacheIllustrationOffline(chapter.novelId, '/illustrations/page.jpg');
    expect((await getSavedNovel(chapter.novelId))?.chapters[0].offlineStatus).toBe('complete');
    await clearNovelOfflineStorage(chapter.novelId);
    expect(await getSavedNovel(chapter.novelId)).toBeNull();
  });

  test('bundled reading and explicit download do not request a stalled CDN first', async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));
    expect((await getChapterForReading('black-cat-hangout', 'ch-60')).chapter?.id).toBe('ch-60');
    expect((await downloadChapterOnDemand('black-cat-hangout', 'ch-60')).status).toBe('complete');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('bundled chapters report real offline availability without copying bundled text', async () => {
    const list = await getAvailableChapterList('black-cat-hangout', true);
    expect(list.find(item => item.id === 'ch-60')?.offlineStatus).toBe('complete');
    expect(list.find(item => item.id === 'ch-00')?.offlineStatus).toBe('text-only');
    expect(await getChapterOfflineStatus('black-cat-hangout', 'ch-60')).toBe('complete');
    expect(await downloadChapterOnDemand('black-cat-hangout', 'ch-60')).toEqual({ status: 'complete' });
    expect(files.has(getChapterFilePath('black-cat-hangout', 'ch-60'))).toBe(false);
    for (let index = 1; index <= 9; index++) {
      files.set(getIllustrationLocalPath('black-cat-hangout', `illust_${String(index).padStart(2, '0')}.jpg`), 'image');
    }
    const updated = await getAvailableChapterList('black-cat-hangout', true);
    expect(updated.find(item => item.id === 'ch-00')?.offlineStatus).toBe('complete');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('retains upstream bundled chapter 60 when the CDN is offline', async () => {
    const result = await getChapterForReading('black-cat-hangout', 'ch-60');
    expect(result.chapter?.id).toBe('ch-60');
    expect(result.cacheWarning).toBe(false);
    expect(await downloadChapterOnDemand('black-cat-hangout', 'ch-60')).not.toEqual({ status: 'failed' });
  });

  test('merges new bundled chapters into an older remote manifest', async () => {
    fetchMock.mockResolvedValue(response({ novelId: 'black-cat-hangout', chapters: [{ id: 'ch-01', chapterNumber: 1, title: 'Remote title' }] }));
    const chapters = await getAvailableChapterList('black-cat-hangout');
    expect(chapters.find(item => item.id === 'ch-01')?.title).toBe('Remote title');
    expect(chapters.some(item => item.id === 'ch-60')).toBe(true);
    expect(new Set(chapters.map(item => item.id)).size).toBe(chapters.length);
  });

  test('cached novel, character and manifest survive a later offline session', async () => {
    const novel: Novel = { id: 'remote-only', title: 'Remote', author: 'Author', coverUrl: 'cover.jpg', synopsis: 'Story', tags: [], totalOriginalChapters: 99 };
    fetchMock.mockImplementation(async url => response(String(url).split('?')[0].endsWith('novels.json') ? [novel]
      : String(url).split('?')[0].endsWith('characters.json') ? [{ id: 'hero', name: 'Hero', role: 'Lead', color: '#123456' }]
        : { novelId: novel.id, chapters: [{ id: 'ch-99', chapterNumber: 99, title: 'Chapter 99' }] }));
    await fetchNovels(); await fetchCharacters(novel.id); await getAvailableChapterList(novel.id);
    fetchMock.mockRejectedValue(new Error('Airplane mode'));
    expect(await fetchNovels()).toContainEqual(novel);
    expect((await fetchCharacters(novel.id))[0].name).toBe('Hero');
    expect((await getAvailableChapterList(novel.id))[0].id).toBe('ch-99');
  });

  test('sanitizes invalid saved typography and theme', async () => {
    await AsyncStorage.multiSet([['yomiori_theme', 'invalid'], ['yomiori_font_family', 'invalid'], ['yomiori_font_size', 'NaN'], ['yomiori_line_height', 'Infinity']]);
    expect(await getSavedTheme()).toBe('light'); expect(await getSavedFontFamily()).toBe('Sarabun');
    expect(await getSavedFontSize()).toBe(17); expect(await getSavedLineHeight()).toBe(1.85);
    await AsyncStorage.setItem('yomiori_font_size', '90'); expect(await getSavedFontSize()).toBe(26);
  });

  test('reads legacy progress while clamping bounds and rejecting malformed values', async () => {
    await saveReadingProgress(chapter.novelId, chapter.id, 140);
    expect((await getReadingProgress(chapter.novelId))?.scrollPercent).toBe(100);
    await AsyncStorage.setItem(`yomiori_progress_${chapter.novelId}`, '{bad');
    expect(await getReadingProgress(chapter.novelId)).toBeNull();
  });

  test('serializes progress writes so a slower old write cannot overwrite the latest', async () => {
    await Promise.all([saveReadingProgress(chapter.novelId, 'ch-01', 50), saveReadingProgress(chapter.novelId, 'ch-02', 2)]);
    expect((await getReadingProgress(chapter.novelId))?.chapterId).toBe('ch-02');
  });
});

describe('request timeout', () => {
  test('shares concurrent reads through body parsing and fetches again on the next refresh', async () => {
    let finish!: (value: unknown) => void;
    fetchMock.mockResolvedValue({ ok: true, json: () => new Promise(done => { finish = done; }) } as Response);
    const first = requestJson('https://example.com/shared.json');
    await Promise.resolve();
    const second = requestJson('https://example.com/shared.json');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    finish({ version: 1 });
    expect(await first).toEqual({ version: 1 });
    expect(await second).toEqual({ version: 1 });
    fetchMock.mockResolvedValue(response({ version: 2 }));
    expect(await requestJson('https://example.com/shared.json')).toEqual({ version: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('a failed shared request releases its slot so retry can recover', async () => {
    fetchMock.mockResolvedValue(response(null, 503));
    const results = await Promise.allSettled([
      requestJson('https://example.com/retry.json'), requestJson('https://example.com/retry.json'),
    ]);
    expect(results.map(result => result.status)).toEqual(['rejected', 'rejected']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValue(response({ recovered: true }));
    expect(await requestJson('https://example.com/retry.json')).toEqual({ recovered: true });
  });

  test('unrelated requests proceed while a shared request is stalled and timed-out work can retry', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(async url => String(url).includes('slow.json')
      ? new Promise(() => undefined) : response({ fast: true }));
    const first = requestJson('https://example.com/slow.json');
    const second = requestJson('https://example.com/slow.json');
    const failed = Promise.allSettled([first, second]);
    expect(await requestJson('https://example.com/fast.json')).toEqual({ fast: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(10_000);
    expect((await failed).map(result => result.status)).toEqual(['rejected', 'rejected']);
    fetchMock.mockResolvedValue(response({ recovered: true }));
    expect(await requestJson('https://example.com/slow.json')).toEqual({ recovered: true });
    expect(jest.getTimerCount()).toBe(0);
  });

  test('bypasses native HTTP caches with a timestamp query', async () => {
    fetchMock.mockResolvedValue(response({ ok: true }));
    await requestJson('https://example.com/manifest.json');
    expect(fetchMock.mock.calls[0][0]).toMatch(/manifest\.json\?_t=\d+$/);
  });
  test('aborts a stalled fetch and clears its timer', async () => {
    jest.useFakeTimers();
    fetchMock.mockReturnValue(new Promise(() => undefined));
    const request = requestJson('https://example.com/chapter.json');
    const rejection = expect(request).rejects.toThrow('timed out');
    await jest.advanceTimersByTimeAsync(10_000); await rejection;
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('also times out a stalled JSON response body', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValue({ ok: true, json: () => new Promise(() => undefined) } as Response);
    const request = requestJson('https://example.com/chapter.json');
    const rejection = expect(request).rejects.toThrow('timed out');
    await jest.advanceTimersByTimeAsync(10_000); await rejection;
    expect(jest.getTimerCount()).toBe(0);
  });
});


test('concurrent comment and like writes retain every update', async () => {
  const comment = { id: 'a', username: 'Reader', avatarColor: '#fff', text: 'Hello', likes: 0, timeAgo: 'now' };
  await Promise.all([
    saveUserComment('novel', 'ch-01', comment),
    saveUserComment('novel', 'ch-01', { ...comment, id: 'b' }),
  ]);
  expect((await getUserComments('novel', 'ch-01')).map(item => item.id)).toEqual(['b', 'a']);
  await Promise.all([toggleCommentLike('novel', 'ch-01', 'a'), toggleCommentLike('novel', 'ch-01', 'b')]);
  expect(await getLikedCommentIds('novel', 'ch-01')).toEqual(['a', 'b']);
});

test('failed comment writes and reads reject and allow a later retry', async () => {
  const comment = { id: 'a', username: 'Reader', avatarColor: '#fff', text: 'Hello', likes: 0, timeAgo: 'now' };
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('Full'));
  await expect(saveUserComment('novel', 'ch-01', comment)).rejects.toThrow('Full');
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('Read failed'));
  await expect(saveUserComment('novel', 'ch-01', comment)).rejects.toThrow('Read failed');
  await saveUserComment('novel', 'ch-01', comment);
  expect(await getUserComments('novel', 'ch-01')).toEqual([comment]);
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('Full'));
  await expect(toggleCommentLike('novel', 'ch-01', 'a')).rejects.toThrow('Full');
  expect(await toggleCommentLike('novel', 'ch-01', 'a')).toBe(true);
});


test('explicit update replaces validated text while preserving reading progress', async () => {
  await saveChapterOffline(chapter);
  await saveReadingProgress(chapter.novelId, chapter.id, 45);
  const updated = { ...chapter, title: 'Revised chapter' };
  fetchMock.mockResolvedValue(response(updated));
  expect(await downloadChapterOnDemand(chapter.novelId, chapter.id, true)).toEqual({ status: 'complete' });
  expect((await loadChapterOffline(chapter.novelId, chapter.id))?.title).toBe('Revised chapter');
  expect((await getReadingProgress(chapter.novelId))?.scrollPercent).toBe(45);
});

test('failed updates preserve readable text and do not claim a bundled fallback was updated', async () => {
  await saveChapterOffline(chapter);
  fetchMock.mockResolvedValue(response({ ...chapter, novelId: 'wrong' }));
  expect(await downloadChapterOnDemand(chapter.novelId, chapter.id, true)).toEqual({ status: 'failed' });
  expect(await loadChapterOffline(chapter.novelId, chapter.id)).toEqual(chapter);
  fetchMock.mockResolvedValue(response({ ...chapter, title: 'New title' }));
  fs.writeAsStringAsync.mockRejectedValueOnce(new Error('Full'));
  expect(await downloadChapterOnDemand(chapter.novelId, chapter.id, true)).toEqual({ status: 'failed' });
  expect(await loadChapterOffline(chapter.novelId, chapter.id)).toEqual(chapter);
  fetchMock.mockRejectedValue(new Error('Offline'));
  expect(await downloadChapterOnDemand('black-cat-hangout', 'ch-60', true)).toEqual({ status: 'failed' });
  expect((await loadChapterOffline('black-cat-hangout', 'ch-60'))?.id).toBe('ch-60');
});
