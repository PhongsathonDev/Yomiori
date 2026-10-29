import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { verifyChapter } from './verify-conversion.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const novelId = 'black-cat-hangout';
const web = path.join(root, 'reader-web/src/data/novels', novelId);
const mobile = path.join(root, 'reader-mobile/src/data/novels', novelId);
const sourceDir = path.join(root, 'novels_source', novelId);
const readJson = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
const source = readJson(path.join(sourceDir, '_source.json'));
const status = readJson(path.join(web, 'conversion-status.json'));
const characters = new Map(readJson(path.join(web, 'characters.json')).map(character => [character.id, character]));
const chapterFile = number => `ch-${String(number).padStart(2, '0')}.json`;

test('every remaining source chapter is either converted or explicitly skipped, never both', () => {
  assert.equal(status.novelId, novelId);
  const reviewed = source.chapters.map(chapter => Number(chapter.chapterNo))
    .filter(number => number >= status.reviewedRange.from && number <= status.reviewedRange.to);
  const classified = [...status.convertedChapters, ...status.skippedChapters.map(chapter => chapter.chapterNumber)];
  assert.equal(new Set(classified).size, classified.length);
  assert.deepEqual(classified.sort((a, b) => a - b), reviewed);
  assert.ok(status.skippedChapters.every(chapter => chapter.reason.trim().length > 0));
});

for (const number of status.convertedChapters) {
  test(`Ch.${number}: exact text fidelity, valid speakers and identical mobile copy`, () => {
    const metadata = source.chapters.find(chapter => Number(chapter.chapterNo) === number);
    const rawPath = path.join(sourceDir, metadata.file);
    const raw = fs.readFileSync(rawPath, 'utf8');
    // Strip only metadata, retaining all prose, punctuation and quoted text.
    const paragraphs = raw.split(/\r?\n/)
      .filter(line => !/^(#\s|By\s|Published:\s|Source:\s|Ch\.\d+\s)/.test(line.trim()))
      .join('\n').split(/\n{2,}/).map(paragraph => paragraph.trim()).filter(Boolean);
    const filename = chapterFile(number);
    const webPath = path.join(web, 'chapters', filename);
    const chapter = readJson(webPath);

    assert.equal(chapter.id, filename.replace('.json', ''));
    assert.equal(chapter.novelId, novelId);
    assert.equal(chapter.chapterNumber, number);
    assert.equal(chapter.title, raw.split(/\r?\n/).find(line => line.startsWith('# ')).slice(2));
    assert.equal(chapter.novelTitle, source.projectName);
    assert.deepEqual(chapter.blocks.map(block => block.text), paragraphs);
    assert.equal(new Set(chapter.blocks.map(block => block.id)).size, chapter.blocks.length);
    for (const block of chapter.blocks) {
      assert.ok(['narration', 'dialogue'].includes(block.type));
      if (block.type === 'dialogue') {
        assert.notEqual(block.speakerId, 'unknown');
        assert.ok(characters.has(block.speakerId));
        assert.equal(block.speakerName, characters.get(block.speakerId).name);
      }
    }
    assert.equal(verifyChapter(rawPath, webPath).ratio, '100.00');
    assert.equal(fs.readFileSync(path.join(mobile, 'chapters', filename), 'utf8'), fs.readFileSync(webPath, 'utf8'));
  });
}

test('quoted descriptions remain narration and named conversation lines have the correct speakers', () => {
  assert.equal(readJson(path.join(web, 'chapters/ch-61.json')).blocks[33].type, 'narration');
  const labels = { ฮินะ: 'hina', ทาคุมิ: 'takumi', มิซึกิ: 'mizuki' };
  for (const number of [86, 87]) {
    const chapter = readJson(path.join(web, 'chapters', chapterFile(number)));
    for (const block of chapter.blocks) {
      const label = /^(ฮินะ|ทาคุมิ|มิซึกิ)\s*:\s*“/.exec(block.text)?.[1];
      if (label) {
        assert.equal(block.type, 'dialogue');
        assert.equal(block.speakerId, labels[label]);
      } else {
        assert.equal(block.type, 'narration');
      }
    }
  }
});

test('skipped chapters have no placeholder JSON and both indexes export only real chapters', () => {
  const expected = [...Array.from({ length: 61 }, (_, number) => number), ...status.convertedChapters].map(chapterFile);
  for (const directory of [web, mobile]) {
    const files = fs.readdirSync(path.join(directory, 'chapters')).filter(filename => /^ch-\d+\.json$/.test(filename)).sort();
    assert.deepEqual(files, expected);
    const index = fs.readFileSync(path.join(directory, 'chapters/index.ts'), 'utf8');
    const imports = [...index.matchAll(/import (ch\d+) from '\.\/(ch-\d+\.json)';/g)];
    assert.deepEqual(imports.map(match => match[2]), expected);
    assert.deepEqual([...index.matchAll(/^  (ch\d+) as Chapter,/gm)].map(match => match[1]), imports.map(match => match[1]));
    for (const skipped of status.skippedChapters) {
      assert.equal(fs.existsSync(path.join(directory, 'chapters', chapterFile(skipped.chapterNumber))), false);
    }
  }
  assert.deepEqual(readJson(path.join(mobile, 'characters.json')), [...characters.values()]);
  assert.deepEqual(readJson(path.join(mobile, 'conversion-status.json')), status);
});
