import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const id = 'nazeka-natsukareta-rashii';
const web = new URL('../', import.meta.url);
const mobile = new URL('../../reader-mobile/', import.meta.url);
const readJson = (base, path) => JSON.parse(readFileSync(new URL(path, base), 'utf8'));
const novel = (base) => readJson(base, 'src/data/novels.json').find(novel => novel.id === id);
const characters = (base) => readJson(base, `src/data/novels/${id}/characters.json`);
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

test('Nazeka skeleton metadata and main-character roster are synchronized', () => {
  assert.ok(novel(web));
  assert.deepEqual(novel(web), novel(mobile));
  assert.deepEqual(characters(web), characters(mobile));
  const source = readJson(new URL('../../', import.meta.url), `novels_source/${id}/_source.json`);
  assert.equal(novel(web).synopsis, source.synopsis);
  assert.equal(novel(web).totalOriginalChapters, source.totalChapters);
  assert.equal(novel(web).translationSource.url, 'https://www.nekopost.net/novel/14982');
  assert.deepEqual(characters(web).map(c => c.id), ['nazeka-eita', 'nazeka-yuzu', 'nazeka-mei']);
});

test('cover, banner and individual portraits contain real local artwork', () => {
  const { coverUrl, bannerUrl } = novel(web);
  const avatars = characters(web).map(c => c.avatarUrl);
  assert.equal(new Set([coverUrl, bannerUrl, ...avatars]).size, 5);
  for (const asset of [bannerUrl, ...avatars]) {
    const bytes = readFileSync(new URL(`public/${asset}`, web));
    assert.ok(bytes.length > 1000);
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff]);
  }
  const cover = readFileSync(new URL(`public/${coverUrl}`, web));
  const original = readFileSync(new URL(`../../novels_source/${id}/illustrations/nazeka_official_cover.webp`, import.meta.url));
  assert.deepEqual(cover, original, 'Keep the official cover without edits');
  assert.equal(cover.subarray(0, 4).toString(), 'RIFF');
  assert.equal(cover.subarray(8, 12).toString(), 'WEBP');
});

test('registered skeleton has its own normalized portraits and no invented chapters', () => {
  const roster = data.getCharactersByNovelId(id);
  assert.equal(roster.length, 3);
  assert.ok(roster.every(c => c.avatarUrl.endsWith(`illustrations/char_${c.id.replace('nazeka-', 'nazeka_')}.jpg`)));
  const ids = roster.map(c => c.id);
  for (const characterId of ids) {
    assert.equal(data.allCharacters.filter(c => c.id === characterId).length, 1);
  }
  assert.deepEqual(data.getChaptersByNovelId(id), []);
  for (const base of [web, mobile]) {
    assert.deepEqual(readdirSync(new URL(`src/data/novels/${id}/chapters/`, base)), ['index.ts']);
  }
});

test('novel detail shows only this roster and the existing waiting-for-conversion state', () => {
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
  assert.ok(markup.includes('กำลังรอแปลงตอนเข้าสู่ระบบ'));
  assert.ok(!markup.includes('เริ่มอ่านตอนที่ 1'));
  for (const character of characters(web)) assert.ok(markup.includes(character.name));
  for (const character of data.allCharacters.filter(c => !c.id.startsWith('nazeka-'))) {
    assert.ok(!markup.includes(character.name), `Unrelated character leaked: ${character.name}`);
  }
});
