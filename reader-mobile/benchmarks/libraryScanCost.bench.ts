/**
 * Offline library-scan cost benchmark — Wayfinder WF-0011 evidence harness.
 *
 * Measures how much filesystem work one Bookshelf/NovelDetail entry performs on a
 * synthetic saved library, before choosing between "reuse a completed scan" and a
 * "summary index" (WF-0012). It intentionally does not assert product behaviour;
 * the only assertions guard fixture sanity so bad counts cannot pass as evidence.
 *
 * What is measured
 * - Operation counts from the real `services/storage.ts` and `services/api.ts` code:
 *   directory listings, chapter file stats/reads/parses, illustration stats,
 *   AsyncStorage metadata reads and network attempts.
 * - Wall-clock time is a DESKTOP REFERENCE ONLY. It is not Android startup time and
 *   must not be quoted as device evidence.
 *
 * Fixture
 * - Four synthetic novels per library, matching the shape of the real catalog
 *   (a few long novels rather than many tiny ones).
 * - Chapters use Thai-generated blocks so the JSON byte size lands near the bundled
 *   chapter median. Illustration count and metadata are fixed; see the printed JSON.
 * - Fixtures live in memory only. No repository or user file is modified.
 * - `mixed` mode adds a broken primary file with a valid `.bak`, stale `.bak`, an
 *   orphan recovered `.bak`, an identity-mismatched JSON and a stray `.tmp`.
 *
 * Entry drivers mirror the current screen sequence:
 * - BookshelfScreen.loadData (catalog + two `loadExtras` passes, the first not awaited).
 * - NovelDetailScreen.loadData (cached pass, then refreshed pass).
 *
 * Run: npm run benchmark:scan
 */
import type { Chapter, Novel, StoryBlock } from '../src/types';
import bundledNovels from '../src/data/novels.json';
import { writeFileSync } from 'node:fs';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  EncodingType: { UTF8: 'utf8' },
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  copyAsync: jest.fn(),
  moveAsync: jest.fn(),
  deleteAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  createDownloadResumable: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

type StorageModule = typeof import('../src/services/storage');
type ApiModule = typeof import('../src/services/api');
type ValidationModule = typeof import('../src/services/validation');

type FsMock = {
  documentDirectory: string;
  EncodingType: { UTF8: string };
  getInfoAsync: jest.Mock;
  makeDirectoryAsync: jest.Mock;
  readAsStringAsync: jest.Mock;
  writeAsStringAsync: jest.Mock;
  copyAsync: jest.Mock;
  moveAsync: jest.Mock;
  deleteAsync: jest.Mock;
  readDirectoryAsync: jest.Mock;
  createDownloadResumable: jest.Mock;
};

interface StorageMock {
  clear(): Promise<unknown>;
  getItem(key: string): Promise<string | null>;
  multiSet(pairs: [string, string][]): Promise<unknown>;
}

type Mode = 'clean' | 'mixed';

interface ScenarioSpec {
  key: string;
  mode: Mode;
  novels: number;
  chaptersPerNovel: number;
}

interface FixtureNovel {
  id: string;
  title: string;
  chapters: number;
}

interface Fixture {
  files: Map<string, string>;
  dirs: Map<string, Set<string>>;
  novels: FixtureNovel[];
  mode: Mode;
  libraryChapters: number;
  illustratedChapters: number;
  missingIllustrationFiles: number;
  brokenPrimaries: number;
  recoveryBackups: number;
  staleBackups: number;
  orphanRecoveries: number;
  invalidIdentityFiles: number;
  strayTempFiles: number;
  chapterBytes: number;
  averageChapterBytes: number;
}

interface Measurement {
  scenario: string;
  entry: string;
  wallMs: number;
  ops: Record<string, number>;
}

const NOVELS_DIR = 'file:///docs/novels/';
const CHAPTER_PATH = /\/ch-[^/]+\.json(?:\.bak)?$/;
const ILLUSTRATIONS_IN_PATH = '/illustrations/';

let activeOps: Record<string, number> | null = null;
const measurements: Measurement[] = [];
const fixtures = new Map<string, Fixture>();
let scenarioKey = '';

function inc(kind: string, amount = 1): void {
  if (!activeOps) return;
  activeOps[kind] = (activeOps[kind] ?? 0) + amount;
}

const byteLength = (value: string) => Buffer.byteLength(value, 'utf8');
const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());
const asDirectory = (path: string) => (path.endsWith('/') ? path : `${path}/`);
const isChapterPath = (path: string) => path.startsWith(NOVELS_DIR) && CHAPTER_PATH.test(path);
const isIllustrationPath = (path: string) => path.startsWith(NOVELS_DIR) && path.includes(ILLUSTRATIONS_IN_PATH);

async function measure<T>(entry: string, run: () => Promise<T>): Promise<T> {
  const ops: Record<string, number> = {};
  activeOps = ops;
  const started = now();
  try {
    return await run();
  } finally {
    const wallMs = now() - started;
    activeOps = null;
    measurements.push({ scenario: scenarioKey, entry, wallMs: Math.round(wallMs * 10) / 10, ops });
  }
}

// ======================== Fixture construction ========================

const NARRATION = [
  'แสงแดดยามบ่ายส่องผ่านม่านผ้าบาง ๆ ลงบนพื้นไม้จนเกิดเป็นแถบสีทองยาวที่ทอดผ่านกองหนังสือกับแก้วน้ำที่ยังเหลือน้ำครึ่งแก้วบนโต๊ะทำงานตัวเก่า',
  'เสียงฝนตกกระทบหลังคาสังกะสีดังเป็นจังหวะสม่ำเสมอ ปนกับเสียงล้อรถที่วิ่งผ่านถนนหน้าบ้านเป็นครั้งคราว ทำให้บรรยากาศในห้องเงียบสงบยิ่งขึ้น',
  'เธอวางแก้วชาลงอย่างช้า ๆ แล้วเงยหน้าขึ้นมองนาฬิกาแขวนผนัง เข็มนาฬิกาเดินเลยเวลาที่นัดไว้มาสิบห้านาทีแล้ว แต่ก็ยังไม่มีใครมาเคาะประตู',
  'สมุดโน้ตเล่มหนาถูกเปิดออกที่หน้าล่าสุด ตัวอักษรที่เขียนด้วยลายมือหวัด ๆ เต็มไปด้วยรายละเอียดของงานที่ต้องทำภายในสัปดาห์นี้',
  'ลมเย็นพัดเข้ามาทางหน้าต่างที่เปิดแง้มไว้ กลิ่นหญ้าที่เพิ่งตัดใหม่ลอยเข้ามาแตะจมูก ทำให้ความเหนื่อยล้าจากการอ่านหนังสือทั้งวันค่อย ๆ จางลง',
  'เขาวางปากกาลงบนโต๊ะแล้วเอนหลังพิงกับพนักเก้าอี้ สายตามองเพดานที่ทาด้วยสีขาวนวล ก่อนจะหลับตาลงเพื่อพักสมองสักครู่หนึ่ง',
];

function chapterId(number: number): string {
  return `ch-${String(number).padStart(3, '0')}`;
}

function makeChapter(novel: FixtureNovel, number: number, illustrated: boolean): Chapter {
  const blocks: StoryBlock[] = [];
  for (let index = 0; index < 48; index += 1) {
    const text = NARRATION[(index + number) % NARRATION.length];
    if (index > 0 && index % 9 === 0) {
      blocks.push({
        id: `b-${index}`, type: 'dialogue', speakerId: 'pho', speakerName: 'โพธิ์', text: `“${text}”`,
      });
    } else {
      blocks.push({ id: `b-${index}`, type: 'narration', text });
    }
  }
  if (illustrated) {
    blocks.push({
      id: 'b-illustration', type: 'illustration', src: `/illustrations/${novel.id}-${number}.jpg`,
      caption: 'ภาพประกอบตอน',
    });
  }
  return {
    id: chapterId(number),
    novelId: novel.id,
    chapterNumber: number,
    title: `ตอนที่ ${number}`,
    novelTitle: novel.title,
    blocks,
  };
}

function buildDirectoryIndex(files: Map<string, string>): Map<string, Set<string>> {
  const dirs = new Map<string, Set<string>>();
  for (const path of files.keys()) {
    const parts = path.split('/');
    for (let index = 1; index < parts.length; index += 1) {
      const child = parts[index];
      if (!child) continue;
      const dir = `${parts.slice(0, index).join('/')}/`;
      const set = dirs.get(dir) ?? new Set<string>();
      set.add(child);
      dirs.set(dir, set);
    }
  }
  return dirs;
}

function buildFixture(spec: ScenarioSpec): Fixture {
  const files = new Map<string, string>();
  const novels: FixtureNovel[] = Array.from({ length: spec.novels }, (_, index) => ({
    id: `lib-${String(index + 1).padStart(2, '0')}`,
    title: `เรื่องทดสอบเล่มที่ ${index + 1}`,
    chapters: spec.chaptersPerNovel,
  }));
  const fixture: Fixture = {
    files, dirs: new Map(), novels, mode: spec.mode,
    libraryChapters: spec.novels * spec.chaptersPerNovel,
    illustratedChapters: 0, missingIllustrationFiles: 0,
    brokenPrimaries: 0, recoveryBackups: 0, staleBackups: 0,
    orphanRecoveries: 0, invalidIdentityFiles: 0, strayTempFiles: 0,
    chapterBytes: 0, averageChapterBytes: 0,
  };

  for (const [novelIndex, novel] of novels.entries()) {
    for (let number = 1; number <= novel.chapters; number += 1) {
      const illustrated = number % 5 === 0;
      const chapter = makeChapter(novel, number, illustrated);
      const json = JSON.stringify(chapter);
      fixture.chapterBytes += byteLength(json);
      if (illustrated) fixture.illustratedChapters += 1;
      const path = `${NOVELS_DIR}${novel.id}/${chapter.id}.json`;
      // Damage is spaced across the whole library so the 100- and 1,000-chapter
      // fixtures keep the same proportion (~2% broken, ~2.7% stale backups).
      const libraryIndex = novelIndex * spec.chaptersPerNovel + number;
      const damagedPrimary = spec.mode === 'mixed' && libraryIndex % 50 === 0;
      const orphanRecovery = spec.mode === 'mixed' && number === 7;
      const staleBackup = spec.mode === 'mixed' && libraryIndex % 37 === 0 && !damagedPrimary;
      if (damagedPrimary) {
        files.set(path, `{ "id": "${chapter.id}", ไฟล์นี้เสียกลางคัน; }`);
        files.set(`${path}.bak`, json);
        fixture.brokenPrimaries += 1;
        fixture.recoveryBackups += 1;
      } else if (!orphanRecovery) {
        files.set(path, json);
        if (staleBackup) {
          // A leftover backup from an interrupted update; the primary is valid and wins.
          files.set(`${path}.bak`, JSON.stringify({ ...chapter, title: `${chapter.title} (ฉบับก่อนแก้)` }));
          fixture.staleBackups += 1;
        }
      }
      if (orphanRecovery) {
        // Interrupted promotion left only the recovery file.
        files.set(`${path}.bak`, json);
        fixture.orphanRecoveries += 1;
      }
      if (illustrated) {
        const missing = spec.mode === 'mixed' && number % 20 === 0;
        if (missing) {
          fixture.missingIllustrationFiles += 1;
        } else {
          files.set(`${NOVELS_DIR}${novel.id}/illustrations/${novel.id}-${number}.jpg`, 'ภาพประกอบจำลอง');
        }
      }
    }
    if (spec.mode === 'mixed') {
      const foreign = { ...makeChapter(novel, 9999, false), novelId: 'other-novel' };
      files.set(`${NOVELS_DIR}${novel.id}/ch-9999.json`, JSON.stringify(foreign));
      files.set(`${NOVELS_DIR}${novel.id}/ch-8888.json.tmp`, JSON.stringify(makeChapter(novel, 8888, false)));
      fixture.invalidIdentityFiles += 1;
      fixture.strayTempFiles += 1;
    }
  }

  fixture.dirs = buildDirectoryIndex(files);
  fixture.averageChapterBytes = Math.round(fixture.chapterBytes / fixture.libraryChapters);
  return fixture;
}

// ======================== Mock environment ========================

function installFileSystem(fs: FsMock, fixture: Fixture): void {
  const { files, dirs } = fixture;
  fs.getInfoAsync.mockImplementation(async (path: string) => {
    inc(isIllustrationPath(path) ? 'statIllustration' : isChapterPath(path) ? 'statChapter' : 'statOther');
    if (files.has(path)) {
      return {
        exists: true, isDirectory: false, uri: path,
        size: byteLength(files.get(path) as string), modificationTime: 0,
      };
    }
    if (dirs.has(asDirectory(path))) return { exists: true, isDirectory: true, uri: path, size: 0, modificationTime: 0 };
    return { exists: false, isDirectory: false, uri: path };
  });
  fs.readAsStringAsync.mockImplementation(async (path: string) => {
    const chapter = isChapterPath(path);
    inc(chapter ? 'readChapter' : 'readOther');
    const value = files.get(path);
    if (value === undefined) throw new Error(`Missing file ${path}`);
    inc(chapter ? 'bytesChapter' : 'bytesOther', byteLength(value));
    return value;
  });
  fs.readDirectoryAsync.mockImplementation(async (path: string) => {
    inc('listDirectory');
    const names = dirs.get(asDirectory(path));
    // `expo-file-system` rejects for a missing directory; callers handle that path.
    if (!names) throw new Error(`Missing directory ${path}`);
    return [...names].sort();
  });
  fs.makeDirectoryAsync.mockResolvedValue(undefined);
  fs.writeAsStringAsync.mockResolvedValue(undefined);
  fs.copyAsync.mockResolvedValue(undefined);
  fs.moveAsync.mockResolvedValue(undefined);
  fs.deleteAsync.mockResolvedValue(undefined);
  fs.createDownloadResumable.mockReturnValue({
    downloadAsync: jest.fn(), cancelAsync: jest.fn(async () => undefined),
  });
}

async function seedMetadata(store: StorageMock, fixture: Fixture): Promise<void> {
  const pairs: [string, string][] = [
    ['yomiori_theme', 'dark'],
    ['yomiori_font_size', '17'],
    ['yomiori_metadata_novels', JSON.stringify(bundledNovels)],
  ];
  for (const novel of fixture.novels) {
    pairs.push([`yomiori_metadata_manifest_${novel.id}`, JSON.stringify({
      novelId: novel.id,
      totalAvailable: novel.chapters,
      updatedAt: '2026-10-28T00:00:00.000Z',
      chapters: Array.from({ length: novel.chapters }, (_, index) => ({
        id: chapterId(index + 1), novelId: novel.id, chapterNumber: index + 1, title: `ตอนที่ ${index + 1}`,
      })),
    })]);
    pairs.push([`yomiori_progress_${novel.id}`, JSON.stringify({
      novelId: novel.id, chapterId: chapterId(Math.min(3, novel.chapters)),
      scrollPercent: 42, updatedAt: 1793000000000,
    })]);
  }
  await store.multiSet(pairs);
}

async function prepareEnvironment(fixture: Fixture): Promise<{
  storage: StorageModule; api: ApiModule; validation: ValidationModule;
}> {
  jest.resetModules();
  const fs = jest.requireMock('expo-file-system/legacy') as FsMock;
  installFileSystem(fs, fixture);
  const storeModule = jest.requireMock('@react-native-async-storage/async-storage') as { default?: StorageMock } & StorageMock;
  const store = storeModule.default ?? storeModule;
  await store.clear();
  const originalGetItem = store.getItem.bind(store);
  store.getItem = async (key: string) => {
    inc('metaRead');
    return originalGetItem(key);
  };
  await seedMetadata(store, fixture);
  const storage = jest.requireActual<StorageModule>('../src/services/storage');
  const api = jest.requireActual<ApiModule>('../src/services/api');
  const validation = jest.requireActual<ValidationModule>('../src/services/validation');
  // Airplane mode: every network attempt fails immediately so timings are not
  // dominated by a timeout. Local reads must still work.
  global.fetch = jest.fn(async () => {
    inc('networkRequest');
    throw new Error('offline (benchmark)');
  }) as unknown as typeof fetch;
  return { storage, api, validation };
}

// ======================== Entry drivers ========================

/**
 * Mirrors `BookshelfScreen.loadData`: cached catalog, extras for the bundled list,
 * then a refreshed catalog and extras again. The first extras pass is not awaited,
 * exactly like `void loadExtras(initialNovels)`.
 */
async function enterBookshelf(api: ApiModule, storage: StorageModule): Promise<void> {
  const [theme, cached] = await Promise.all([storage.getSavedTheme(), api.fetchNovels(true)]);
  void theme;
  const initialNovels = cached ?? (bundledNovels as Novel[]);
  const loadExtras = async (novelList: Novel[]) => {
    await Promise.all(novelList.map(async novel => {
      const progress = await storage.getReadingProgress(novel.id);
      void progress;
      const [, chapters] = await Promise.all([
        api.fetchCharacters(novel.id, true), api.getAvailableChapterList(novel.id, true),
      ]);
      const statuses = await Promise.all(chapters.map(chapter => chapter.offlineStatus !== undefined
        ? Promise.resolve(chapter.offlineStatus !== 'missing')
        : storage.isChapterDownloaded(novel.id, chapter.id)));
      void statuses;
    }));
  };
  const firstExtras = loadExtras(initialNovels);
  const freshNovels = await api.fetchNovels();
  await firstExtras;
  await loadExtras(freshNovels);
}

/**
 * Mirrors `NovelDetailScreen.loadData`: a cached pass and then a refreshed pass,
 * each fetching the catalog and the novel's chapter list. Illustration/character
 * requests are secondary and are included only for completeness.
 */
async function enterNovelDetail(
  storage: StorageModule, api: ApiModule, validation: ValidationModule, novelId: string,
): Promise<void> {
  const [, catalog] = await Promise.all([
    storage.getSavedTheme(), storage.readMetadata('novels', validation.isNovelList),
  ]);
  void catalog;
  const [, , chapterList] = await Promise.all([
    storage.getSavedTheme(), api.fetchNovels(true), api.getAvailableChapterList(novelId, true),
  ]);
  await Promise.all(chapterList.map(async chapter => [chapter.id,
    chapter.offlineStatus ?? await storage.getChapterOfflineStatus(novelId, chapter.id)] as const));

  const [, , refreshed] = await Promise.all([
    storage.getSavedTheme(), api.fetchNovels(false), api.getAvailableChapterList(novelId, false),
  ]);
  await Promise.all(refreshed.map(async chapter => [chapter.id,
    chapter.offlineStatus ?? await storage.getChapterOfflineStatus(novelId, chapter.id)] as const));

  await Promise.all([api.fetchIllustrations(novelId), api.fetchCharacters(novelId, true)]);
}

// ======================== Scenarios and reporting ========================

const SCENARIOS: ScenarioSpec[] = [
  { key: 'library-100-clean', mode: 'clean', novels: 4, chaptersPerNovel: 25 },
  { key: 'library-100-mixed', mode: 'mixed', novels: 4, chaptersPerNovel: 25 },
  { key: 'library-1000-clean', mode: 'clean', novels: 4, chaptersPerNovel: 250 },
  { key: 'library-1000-mixed', mode: 'mixed', novels: 4, chaptersPerNovel: 250 },
];

const nativeJsonParse = JSON.parse;

beforeAll(() => {
  // Count every JSON.parse while a measurement window is open. This captures the
  // chapter-body parses performed by `loadSavedChapter` (storage.ts:58).
  JSON.parse = ((text: string, reviver?: (key: string, value: unknown) => unknown) => {
    inc('jsonParse');
    return nativeJsonParse(text, reviver);
  }) as typeof JSON.parse;
});

afterAll(() => {
  JSON.parse = nativeJsonParse;
  const report = {
    generatedAt: new Date().toISOString(),
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    sourceCommit: process.env.SCAN_BENCH_SOURCE ?? null,
    fixtureNotes: [
      'Four synthetic novels per library with generated Thai chapters.',
      'Illustrated every fifth chapter, one illustration block each.',
      'mixed adds broken primary + valid .bak, stale .bak, orphan recovered .bak, foreign-id JSON and .tmp.',
      'Airplane-mode network: fetch rejects immediately; metadata caches pre-seeded.',
    ],
    fixtures: [...fixtures.entries()].map(([key, fixture]) => ({
      scenario: key,
      mode: fixture.mode,
      novels: fixture.novels.length,
      chaptersPerNovel: fixture.novels[0]?.chapters ?? 0,
      libraryChapters: fixture.libraryChapters,
      illustratedChapters: fixture.illustratedChapters,
      missingIllustrationFiles: fixture.missingIllustrationFiles,
      brokenPrimaries: fixture.brokenPrimaries,
      recoveryBackups: fixture.recoveryBackups,
      staleBackups: fixture.staleBackups,
      orphanRecoveries: fixture.orphanRecoveries,
      invalidIdentityFiles: fixture.invalidIdentityFiles,
      strayTempFiles: fixture.strayTempFiles,
      chapterBytes: fixture.chapterBytes,
      averageChapterBytes: fixture.averageChapterBytes,
    })),
    measurements,
  };
  console.log('@@SCAN_BENCH_JSON_BEGIN@@');
  console.log(JSON.stringify(report, null, 2));
  console.log('@@SCAN_BENCH_JSON_END@@');
  if (process.env.SCAN_BENCH_OUT) {
    // Optional machine-readable evidence file; stdout remains the default.
    writeFileSync(process.env.SCAN_BENCH_OUT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
});

describe('offline library scan cost', () => {
  SCENARIOS.forEach(spec => {
    test(spec.key, async () => {
      scenarioKey = spec.key;
      const fixture = buildFixture(spec);
      fixtures.set(spec.key, fixture);
      const { storage, api, validation } = await prepareEnvironment(fixture);
      const targetNovelId = fixture.novels[0].id;

      // Direct storage passes show whether a completed scan is reused at all.
      const firstLibraryPass = await measure('storage.getSavedLibrary (pass 1)', () => storage.getSavedLibrary());
      await measure('storage.getSavedLibrary (pass 2)', () => storage.getSavedLibrary());
      await measure('storage.getSavedNovel (pass 1)', () => storage.getSavedNovel(targetNovelId));
      await measure('storage.getSavedNovel (pass 2)', () => storage.getSavedNovel(targetNovelId));

      // Fixture sanity: every expected chapter must be recovered (including damaged
      // primaries and orphan backups) before its counts can be used as evidence.
      expect(firstLibraryPass).toHaveLength(fixture.novels.length);
      expect(firstLibraryPass?.reduce((sum, novel) => sum + novel.chapters.length, 0)).toBe(fixture.libraryChapters);
      const recovered = firstLibraryPass?.flatMap(novel => novel.chapters) ?? [];
      expect(recovered.filter(chapter => chapter.offlineStatus === 'text-only')).toHaveLength(fixture.missingIllustrationFiles);
      expect(recovered.every(chapter => chapter.offlineStatus !== undefined)).toBe(true);
      if (fixture.mode === 'mixed') {
        // The orphan `.bak` must be recovered; the total-count check above already
        // fails if a broken primary with a valid backup were dropped instead.
        expect(recovered.some(chapter => chapter.id === 'ch-007')).toBe(true);
      }

      // Screen-level entry cost.
      await measure('bookshelf entry (first)', () => enterBookshelf(api, storage));
      await measure('bookshelf entry (repeat)', () => enterBookshelf(api, storage));
      await measure('novel detail entry (first)', () => enterNovelDetail(storage, api, validation, targetNovelId));
      await measure('novel detail entry (repeat)', () => enterNovelDetail(storage, api, validation, targetNovelId));
    });
  });
});
