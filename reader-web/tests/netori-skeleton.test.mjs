import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const id = 'netori-mahoutsukai-no-bouken';
const web = new URL('../', import.meta.url);
const mobile = new URL('../../reader-mobile/', import.meta.url);
const readJson = (base, path) => JSON.parse(readFileSync(new URL(path, base), 'utf8'));
const novel = (base) => readJson(base, 'src/data/novels.json').find(novel => novel.id === id);
const characters = (base) => readJson(base, `src/data/novels/${id}/characters.json`);
const mainIds = [
  'netori-shinji', 'netori-alvin', 'netori-miris', 'netori-renka',
  'netori-charlotte', 'netori-agane', 'netori-ferry',
];
let vite;
let data;
let LibraryView;

before(async () => {
  vite = await createServer({
    root: fileURLToPath(web),
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
  });
  data = await vite.ssrLoadModule('/src/data/index.ts');
  ({ LibraryView } = await vite.ssrLoadModule('/src/components/LibraryView.tsx'));
});

after(async () => { await vite?.close(); });

test('Netori metadata and character roster are synchronized', () => {
  assert.ok(novel(web));
  assert.deepEqual(novel(web), novel(mobile));
  assert.deepEqual(characters(web), characters(mobile));
  const source = readJson(new URL('../../', import.meta.url), `novels_source/${id}/_source.json`);
  assert.equal(novel(web).synopsis, source.synopsis);
  assert.equal(novel(web).totalOriginalChapters, source.totalChapters);
  assert.equal(novel(web).translationSource.url, 'https://www.nekopost.net/novel/15549');
  const roster = characters(web);
  assert.equal(new Set(roster.map(c => c.id)).size, roster.length);
  assert.equal(new Set(roster.map(c => c.name)).size, roster.length);
  for (const characterId of mainIds) assert.ok(roster.some(c => c.id === characterId));
  assert.deepEqual(roster.filter(c => c.avatarUrl).map(c => c.id), mainIds);
});

test('cover, banner and main-character portraits contain real local artwork', () => {
  const { coverUrl, bannerUrl } = novel(web);
  const avatars = characters(web).filter(c => c.avatarUrl).map(c => c.avatarUrl);
  assert.equal(new Set([coverUrl, bannerUrl, ...avatars]).size, 9);
  for (const asset of [bannerUrl, ...avatars]) {
    const bytes = readFileSync(new URL(`public/${asset}`, web));
    assert.ok(bytes.length > 1000);
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff]);
  }
  const cover = readFileSync(new URL(`public/${coverUrl}`, web));
  const original = readFileSync(new URL(`../../novels_source/${id}/illustrations/illust_02.jpg`, import.meta.url));
  assert.deepEqual(cover, original, 'Keep the official cover without edits');
  assert.deepEqual([...cover.subarray(0, 3)], [0xff, 0xd8, 0xff]);
});

test('converted chapters are synchronized between web and mobile', () => {
  const files = base => readdirSync(new URL(`src/data/novels/${id}/chapters/`, base))
    .filter(file => file.endsWith('.json')).sort();
  const webFiles = files(web);
  assert.deepEqual(webFiles, files(mobile));
  assert.equal(webFiles.length, 222);
  const chapters = data.getChaptersByNovelId(id);
  assert.equal(chapters.length, 222);
  assert.equal(new Set(chapters.map(c => c.id)).size, 222);
  assert.equal(new Set(chapters.map(c => c.chapterNumber)).size, 222);
  assert.equal(chapters[0].chapterNumber, 0);
  assert.equal(chapters.at(-1).chapterNumber, 213.5);
});

test('novel detail opens the first converted chapter and shows the roster', () => {
  const noop = () => {};
  const markup = renderToStaticMarkup(React.createElement(LibraryView, {
    novels: data.allNovels,
    currentNovel: data.getNovelById(id),
    chapters: data.allChapters,
    characters: data.allCharacters,
    lastReadChapterId: 'ch-01',
    theme: 'light', mode: 'detail', canEdit: false,
    onSelectNovel: noop, onSelectChapter: noop, onToggleTheme: noop,
    onOpenSettings: noop, onOpenRoster: noop,
  }));
  assert.ok(markup.includes('เริ่มอ่านตอนที่ 1'));
  assert.ok(!markup.includes('กำลังรอแปลงตอนเข้าสู่ระบบ'));
  const displayed = characters(web).filter(c => mainIds.includes(c.id));
  for (const character of displayed) assert.ok(markup.includes(character.name));
  const rosterNames = new Set(displayed.map(c => c.name));
  for (const character of data.allCharacters.filter(c => !c.id.startsWith('netori-'))) {
    if (character.avatarUrl) {
      assert.ok(!markup.includes(character.avatarUrl), `Unrelated character leaked: ${character.name}`);
    } else if (!rosterNames.has(character.name)) {
      assert.ok(!markup.includes(character.name), `Unrelated character leaked: ${character.name}`);
    }
  }
});
