'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const { markdownLink } = require('./scrape-nekopost.js');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'novels_source');
const novels = fs.readdirSync(sourceRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
const chapterFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /^Ch[._]\d+.*\.md$/i.test(entry.name)).map((entry) => entry.name);
// This legacy source already referenced a missing file before the path-only move.
// Do not fabricate an image or edit source prose to make the migration appear complete.
const legacyMissingImages = new Set(['kyudo-senpai/Ch.00_รูปนิยาย_ภาพประกอบ.md -> illustrations/illust_09.jpg']);

test('source chapters live directly in each novel folder; no shared staging or nested chapter folder', () => {
  assert.deepEqual(fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^(raw_chapters|raw_staging)$/.test(entry.name)), []);
  for (const novel of novels) {
    const directory = path.join(sourceRoot, novel);
    assert.ok(!fs.existsSync(path.join(directory, 'raw_chapters')), `${novel} must not have a nested source folder`);
    assert.ok(chapterFiles(directory).length > 0, `${novel} has no direct chapter files`);
  }
});

test('registered chapters, overview links and local image paths use the flat source layout', (t) => {
  for (const novel of novels) {
    const directory = path.join(sourceRoot, novel);
    const registry = path.join(directory, '_source.json');
    if (fs.existsSync(registry)) {
      const source = JSON.parse(fs.readFileSync(registry, 'utf8'));
      const chapters = chapterFiles(directory);
      assert.deepEqual([...source.chapters.map((chapter) => chapter.file)].sort(), [...chapters].sort());
      const overviewFile = fs.readdirSync(directory).find((file) => /^00_.*\.md$/.test(file));
      const overview = fs.readFileSync(path.join(directory, overviewFile), 'utf8');
      for (const chapter of source.chapters) {
        assert.equal(path.basename(chapter.file), chapter.file);
        assert.ok(fs.existsSync(path.join(directory, chapter.file)));
        assert.ok(overview.includes(`](${markdownLink(chapter.file)})`), `Missing direct TOC link: ${novel}/${chapter.file}`);
        for (const image of chapter.images) assert.ok(fs.existsSync(path.join(directory, image.file)));
      }
    }
    for (const file of chapterFiles(directory)) {
      const markdown = fs.readFileSync(path.join(directory, file), 'utf8');
      for (const match of markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
        if (/^https?:\/\//i.test(match[1])) continue;
        assert.ok(match[1].startsWith('illustrations/'), `Image must be relative to the novel folder: ${novel}/${file}`);
        if (!fs.existsSync(path.resolve(directory, decodeURIComponent(match[1])))) {
          const missing = `${novel}/${file} -> ${match[1]}`;
          assert.ok(legacyMissingImages.has(missing), `New broken local image: ${missing}`);
          t.diagnostic(`Pre-existing missing image (not changed by migration): ${missing}`);
        }
      }
    }
  }
});

test('chapter pipeline status discovers only direct chapter files, not overview or conversion notes', () => {
  const script = path.join(root, 'reader-web/scripts/import-chapters.mjs');
  for (const novel of novels) {
    const output = execFileSync(process.execPath, [script, '--status', novel], { cwd: root, encoding: 'utf8' });
    const count = output.match(/Total raw chapters found:\s+(\d+)/)?.[1];
    assert.equal(Number(count), chapterFiles(path.join(sourceRoot, novel)).length, novel);
  }
});
