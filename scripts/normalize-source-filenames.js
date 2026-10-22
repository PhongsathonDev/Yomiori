#!/usr/bin/env node
/**
 * Normalize generated source filenames for cross-platform checkout.
 *
 * Linux limits a filename component to 255 bytes (ext4 NAME_MAX), while the
 * scraper historically limited titles by character count. Thai characters are
 * 3 bytes each in UTF-8, so a 90-character title can exceed the limit and make
 * `git checkout` fail on GitHub Actions.
 *
 * Usage:
 *   node scripts/normalize-source-filenames.js novels_source/black-cat-hangout
 */

const fs = require('fs');
const path = require('path');

const MAX_NAME_BYTES = 200;

function truncateUtf8(str, maxBytes) {
  let out = '';
  for (const ch of str) {
    if (Buffer.byteLength(out + ch, 'utf8') > maxBytes) break;
    out += ch;
  }
  return out;
}

function sanitizeFileName(name, max = 90, maxBytes = 190) {
  let s = String(name || '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length > max) s = s.slice(0, max);
  s = truncateUtf8(s, maxBytes);
  return s.replace(/[. ]+$/, '');
}

function chapterFileName(chapter) {
  const no = String(chapter.chapterNo).padStart(2, '0');
  return `Ch_${no}_${sanitizeFileName(chapter.chapterName, 90, 190)}.md`;
}

const target = process.argv[2];
if (!target) {
  console.error('Usage: node scripts/normalize-source-filenames.js <novel-source-dir>');
  process.exit(1);
}

const root = path.resolve(target);
const sourcePath = path.join(root, '_source.json');
if (!fs.existsSync(sourcePath)) {
  console.error(`Not found: ${sourcePath}`);
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const rawDir = path.join(root, 'raw_chapters');
const renames = [];

for (const chapter of source.chapters || []) {
  if (!chapter.file) continue;
  const next = chapterFileName(chapter);
  if (next === chapter.file) continue;

  const from = path.join(rawDir, chapter.file);
  const to = path.join(rawDir, next);
  if (!fs.existsSync(from)) {
    console.warn(`skip (missing): ${chapter.file}`);
    continue;
  }
  if (fs.existsSync(to)) {
    throw new Error(`Refusing to overwrite existing file: ${next}`);
  }
  fs.renameSync(from, to);
  renames.push({ oldFile: chapter.file, newFile: next });
  chapter.file = next;
}

fs.writeFileSync(sourcePath, JSON.stringify(source, null, 2) + '\n', 'utf8');

// Rename and refresh the generated overview / table of contents.
const overviews = fs
  .readdirSync(root)
  .filter((f) => /^00_.*\.md$/.test(f) && !fs.statSync(path.join(root, f)).isDirectory());

for (const oldOverview of overviews) {
  const newOverview = `00_${sanitizeFileName(source.projectName, 80, 194)}.md`;
  if (oldOverview !== newOverview) {
    const to = path.join(root, newOverview);
    if (fs.existsSync(to)) throw new Error(`Refusing to overwrite existing file: ${newOverview}`);
    fs.renameSync(path.join(root, oldOverview), to);
  }

  const overviewPath = path.join(root, newOverview);
  const content = fs.readFileSync(overviewPath, 'utf8');
  const marker = '## สารบัญ';
  const markerIndex = content.indexOf(marker);
  if (markerIndex === -1) {
    console.warn(`No TOC marker in ${newOverview}; left unchanged.`);
    continue;
  }

  const toc = (source.chapters || [])
    .map((c) => `- **Ch.${c.chapterNo}:** ${c.chapterName} — [${c.file}](${encodeURI('raw_chapters/' + c.file)})`)
    .join('\n');
  fs.writeFileSync(overviewPath, content.slice(0, markerIndex) + marker + '\n' + toc + '\n', 'utf8');
}

// Final guard: no component may approach NAME_MAX.
let tooLong = 0;
for (const dir of [root, rawDir]) {
  for (const name of fs.readdirSync(dir)) {
    const bytes = Buffer.byteLength(name, 'utf8');
    if (bytes > MAX_NAME_BYTES) {
      tooLong++;
      console.error(`too long (${bytes} bytes): ${path.join(dir, name)}`);
    }
  }
}

console.log(`Renamed ${renames.length} chapter file(s).`);
for (const r of renames) console.log(`  ${r.oldFile}\n→ ${r.newFile}`);

if (tooLong > 0) process.exit(1);
console.log('Filename check passed.');
