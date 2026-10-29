/**
 * Dependency-free integrity checks for the v2 prototype.
 *
 *   node prototype/web-v2/tools/check.mjs
 *
 * Verifies the generated data snapshot, referenced assets, local links and
 * fonts. Exits non-zero when something is missing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const problems = [];

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function mustExist(file, label) {
  if (!fs.existsSync(file)) problems.push(`missing ${label}: ${rel(file)}`);
}

const dataFile = path.join(root, 'js', 'data.js');
const source = fs.readFileSync(dataFile, 'utf8');
const json = source.slice(source.indexOf('=') + 1, source.lastIndexOf(';')).trim();
const data = JSON.parse(json);

if (!Array.isArray(data.novels) || data.novels.length === 0) {
  problems.push('data.js has no novels');
}

const novelIds = new Set();
const chapterIds = new Set();
const blockIds = new Set();
let chapters = 0;
let blocks = 0;
let illustrations = 0;

for (const novel of data.novels) {
  if (novelIds.has(novel.id)) problems.push(`duplicate novel id: ${novel.id}`);
  novelIds.add(novel.id);

  mustExist(path.join(root, novel.cover), `cover for ${novel.id}`);
  if (novel.banner) mustExist(path.join(root, novel.banner), `banner for ${novel.id}`);
  if (novel.chapters.length === 0) {
    console.log(`note: ${novel.id} has no converted chapters (expected empty state)`);
  }

  for (const chapter of novel.chapters) {
    chapters += 1;
    const key = `${novel.id}/${chapter.id}`;
    if (chapterIds.has(key)) problems.push(`duplicate chapter id: ${key}`);
    chapterIds.add(key);
    if (!chapter.title) problems.push(`empty chapter title: ${key}`);

    for (const block of chapter.blocks) {
      blocks += 1;
      const blockKey = `${key}/${block.id}`;
      if (blockIds.has(blockKey)) problems.push(`duplicate block id: ${blockKey}`);
      blockIds.add(blockKey);
      if (block.type === 'illustration') {
        illustrations += 1;
        mustExist(path.join(root, block.src), `illustration ${block.id} in ${key}`);
      }
      if (block.type === 'dialogue' && !block.speakerName) {
        problems.push(`dialogue without speaker name: ${blockKey}`);
      }
    }
  }

  for (const character of novel.characters) {
    if (character.avatar) mustExist(path.join(root, character.avatar), `avatar for ${character.id}`);
  }

  for (const illustration of novel.illustrations) {
    if (illustration.src) mustExist(path.join(root, illustration.src), `gallery image ${illustration.id}`);
  }
}

// Local links in the HTML shell.
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const href = match[1];
  if (/^(https?:|data:|#)/.test(href)) continue;
  mustExist(path.join(root, href), `asset referenced by index.html (${href})`);
}

// Font files referenced by fonts.css.
const fontsCss = fs.readFileSync(path.join(root, 'css', 'fonts.css'), 'utf8');
for (const match of fontsCss.matchAll(/url\((\.\.\/[^)]+)\)/g)) {
  mustExist(path.join(root, 'css', match[1]), `font file ${match[1]}`);
}
if (!/@font-face/.test(fontsCss)) problems.push('fonts.css has no @font-face rules');

// Generated marker should match the current source at least structurally.
if (!data.generatedFrom) problems.push('data.js has no generatedFrom marker');

console.log(
  `${data.novels.length} novels · ${chapters} chapters · ${blocks} blocks · ${illustrations} inline illustrations · ${data.novels.reduce(
    (sum, novel) => sum + novel.characters.length,
    0,
  )} characters`,
);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log('All generated data, assets, local links and fonts are present.');
}
