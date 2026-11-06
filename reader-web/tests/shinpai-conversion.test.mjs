import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const id = 'shinpai-kanojo';
const web = new URL('../', import.meta.url);
const mobile = new URL('../../reader-mobile/', import.meta.url);
const readJson = (base, path) => JSON.parse(readFileSync(new URL(path, base), 'utf8'));
const novel = (base) => readJson(base, 'src/data/novels.json').find(novel => novel.id === id);
const characters = (base) => readJson(base, `src/data/novels/${id}/characters.json`);
const sourceRegistry = readJson(new URL('../../', import.meta.url), `novels_source/${id}/_source.json`);
const mainCharacterIds = [
  'shinpai-aoto', 'shinpai-shizuno', 'shinpai-aina', 'shinpai-mikura',
  'shinpai-shirato', 'shinpai-naruse', 'shinpai-katsuma', 'shinpai-koshima',
  'shinpai-honda', 'shinpai-ishikamori', 'shinpai-hoshino', 'shinpai-akane',
];
const allCharacterIds = [
  'shinpai-aoto', 'shinpai-shizuno', 'shinpai-aina', 'shinpai-mikura',
  'shinpai-shirato', 'shinpai-naruse', 'shinpai-katsuma', 'shinpai-koshima',
  'shinpai-honda', 'shinpai-ishikamori', 'shinpai-hoshino', 'shinpai-yumi',
  'shinpai-akane', 'shinpai-teacher', 'shinpai-crowd',
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

test('Shinpai metadata and full character roster are synchronized', () => {
  assert.ok(novel(web));
  assert.deepEqual(novel(web), novel(mobile));
  assert.deepEqual(characters(web), characters(mobile));
  assert.equal(novel(web).synopsis, sourceRegistry.synopsis);
  assert.equal(novel(web).totalOriginalChapters, sourceRegistry.totalChapters);
  assert.equal(novel(web).translationSource.url, 'https://www.nekopost.net/novel/17236');
  assert.deepEqual(characters(web).map(c => c.id), allCharacterIds);
});

test('cover, banner and all roster portraits contain local artwork', () => {
  const { coverUrl, bannerUrl } = novel(web);
  const avatars = characters(web).map(c => c.avatarUrl).filter(Boolean);
  assert.equal(avatars.length, allCharacterIds.length);
  assert.equal(new Set([coverUrl, bannerUrl, ...avatars]).size, 2 + allCharacterIds.length);
  for (const asset of [bannerUrl, ...avatars]) {
    const bytes = readFileSync(new URL(`public/${asset}`, web));
    assert.ok(bytes.length > 1000);
    assert.deepEqual([...bytes.subarray(0, 3)], asset.endsWith('.png') ? [0x89, 0x50, 0x4e] : [0xff, 0xd8, 0xff]);
  }
  const cover = readFileSync(new URL(`public/${coverUrl}`, web));
  const original = readFileSync(new URL(`../../novels_source/${id}/illustrations/publisher_cover.jpg`, import.meta.url));
  assert.deepEqual(cover, original, 'Keep the official cover without edits');
  assert.deepEqual([...cover.subarray(0, 3)], [0xff, 0xd8, 0xff]);
});

test('all 69 source chapters are converted and synchronized across web and mobile', () => {
  assert.equal(sourceRegistry.chapters.length, 69);
  const chapters = data.getChaptersByNovelId(id);
  assert.equal(chapters.length, 69);
  assert.equal(new Set(chapters.map(c => c.id)).size, 69);
  assert.deepEqual(
    chapters.map(c => c.chapterNumber).sort((a, b) => a - b),
    sourceRegistry.chapters.map(c => Number(c.chapterNo)).sort((a, b) => a - b),
  );
  assert.ok(chapters.every(c => c.novelId === id && c.blocks.length > 0));
  const webFiles = readdirSync(new URL(`src/data/novels/${id}/chapters/`, web)).filter(f => f.endsWith('.json')).sort();
  const mobileFiles = readdirSync(new URL(`src/data/novels/${id}/chapters/`, mobile)).filter(f => f.endsWith('.json')).sort();
  assert.deepEqual(webFiles, mobileFiles);
  assert.equal(webFiles.length, 69);
  for (const file of webFiles) {
    assert.deepEqual(
      readJson(web, `src/data/novels/${id}/chapters/${file}`),
      readJson(mobile, `src/data/novels/${id}/chapters/${file}`),
      `${file} differs between web and mobile`,
    );
  }
});

test('novel detail shows converted chapters and only this novel roster', () => {
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
  assert.ok(!markup.includes('กำลังรอแปลงตอนเข้าสู่ระบบ'));
  assert.ok(markup.includes('Ch.1') || markup.includes('บทที่ 1') || markup.includes('เริ่มอ่านตอนที่ 1'));
  for (const characterId of mainCharacterIds) {
    const character = characters(web).find(c => c.id === characterId);
    assert.ok(character);
    assert.ok(markup.includes(character.name), `Missing main character: ${character.name}`);
  }
  for (const character of data.allCharacters.filter(c => !c.id.startsWith('shinpai-'))) {
    assert.ok(!markup.includes(character.name), `Unrelated character leaked: ${character.name}`);
  }
});
