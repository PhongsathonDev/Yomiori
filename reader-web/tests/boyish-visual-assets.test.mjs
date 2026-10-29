import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const web = new URL('../', import.meta.url);
const mobile = new URL('../../reader-mobile/', import.meta.url);
const readJson = (base, path) => JSON.parse(readFileSync(new URL(path, base), 'utf8'));
const novel = (base) => readJson(base, 'src/data/novels.json').find(({ id }) => id === 'boyish-friend');
const characters = (base) => readJson(base, 'src/data/novels/boyish-friend/characters.json');

test('Boyish Friend visual metadata stays synchronized across web and mobile', () => {
  assert.deepEqual(novel(web), novel(mobile));
  assert.deepEqual(characters(web), characters(mobile));
});

test('Boyish Friend cover, banner and character portraits resolve to local JPEG assets', () => {
  const { coverUrl, bannerUrl } = novel(web);
  const chars = characters(web);
  const avatars = chars.flatMap(({ avatarUrl }) => avatarUrl ? [avatarUrl.replace(/^\//, '')] : []);
  
  assert.ok(avatars.length >= 3, 'Protagonist, Aya, and Tokita should have portraits');
  assert.equal(new Set([coverUrl, bannerUrl, ...avatars]).size, 2 + avatars.length);

  for (const asset of [coverUrl, bannerUrl, ...avatars]) {
    const bytes = readFileSync(new URL(`public/${asset.replace(/^\//, '')}`, web));
    assert.ok(bytes.length > 1000, `${asset} must contain artwork`);
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], `${asset} must be a JPEG`);
  }
});

test('Boyish Friend avatars never reuse the library cover or another character portrait', () => {
  const avatars = characters(web).flatMap(({ avatarUrl }) => avatarUrl ? [avatarUrl] : []);
  assert.equal(new Set(avatars).size, avatars.length);
  for (const avatar of avatars) {
    assert.ok(!avatar.includes('cover'), 'Character avatars should not reuse the full cover');
  }
});
