/**
 * Build the v2 prototype data snapshot from the current reader-web sources.
 *
 * The prototype is read-only. This script copies novel metadata, chapters,
 * characters and referenced artwork into prototype/web-v2/assets, then writes
 * js/data.js. It never writes to reader-web or the production entry point.
 *
 * Run from the repository root:
 *   node prototype/web-v2/tools/build-data.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const prototypeDir = path.resolve(here, '..');
const repoRoot = path.resolve(prototypeDir, '..', '..');
const dataDir = path.join(repoRoot, 'reader-web', 'src', 'data');
const publicDir = path.join(repoRoot, 'reader-web', 'public');
const assetsDir = path.join(prototypeDir, 'assets');
const jsDir = path.join(prototypeDir, 'js');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const exists = (file) => fs.existsSync(file);
const ensure = (dir) => fs.mkdirSync(dir, { recursive: true });

function copyAsset(sourceFile, targetRelative) {
  if (!exists(sourceFile)) return null;
  const target = path.join(assetsDir, targetRelative);
  ensure(path.dirname(target));
  fs.copyFileSync(sourceFile, target);
  return `assets/${targetRelative.split(path.sep).join('/')}`;
}

function publicAsset(url) {
  if (!url) return null;
  const clean = url.replace(/^\.?\//, '');
  return path.join(publicDir, clean);
}

function novelArtPath(novelId, filename) {
  if (!filename) return null;
  const clean = filename.replace(/^\.?\//, '').replace(/^illustrations\//, '');
  const inData = path.join(dataDir, 'novels', novelId, 'illustrations', clean);
  if (exists(inData)) return inData;
  return path.join(publicDir, 'illustrations', clean);
}

function buildNovel(novel) {
  const novelDir = path.join(dataDir, 'novels', novel.id);
  const result = {
    ...novel,
    cover: copyAsset(publicAsset(novel.coverUrl), path.join('novels', novel.id, `cover${path.extname(novel.coverUrl || '')}`)),
    banner: copyAsset(publicAsset(novel.bannerUrl), path.join('novels', novel.id, `banner${path.extname(novel.bannerUrl || '')}`)),
    chapters: [],
    characters: [],
    illustrations: [],
  };

  const chaptersDir = path.join(novelDir, 'chapters');
  if (exists(chaptersDir)) {
    const chapters = fs
      .readdirSync(chaptersDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => readJson(path.join(chaptersDir, file)))
      .sort((a, b) => a.chapterNumber - b.chapterNumber);

    for (const chapter of chapters) {
      const blocks = chapter.blocks.map((block) => {
        if (block.type !== 'illustration') return block;
        const file = block.src.replace(/^\.?\//, '').replace(/^illustrations\//, '');
        const source = novelArtPath(novel.id, file);
        const copied = copyAsset(source, path.join('novels', novel.id, 'illustrations', file));
        return { ...block, src: copied || block.src };
      });
      result.chapters.push({
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        blocks,
      });
    }
  }

  const charactersFile = path.join(novelDir, 'characters.json');
  if (exists(charactersFile)) {
    result.characters = readJson(charactersFile).map((character) => {
      if (!character.avatarUrl) return character;
      const source = publicAsset(character.avatarUrl);
      const copied = copyAsset(source, path.join('novels', novel.id, 'characters', path.basename(character.avatarUrl)));
      return { ...character, avatar: copied };
    });
  }

  const illustrationsFile = path.join(novelDir, 'illustrations.json');
  if (exists(illustrationsFile)) {
    result.illustrations = readJson(illustrationsFile).map((illustration) => {
      const source = novelArtPath(novel.id, illustration.filename);
      const copied = copyAsset(source, path.join('novels', novel.id, 'gallery', illustration.filename));
      return { ...illustration, src: copied };
    });
  }

  return result;
}

function gitHead() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function main() {
  if (!exists(dataDir)) {
    throw new Error(`Reader data not found: ${dataDir}`);
  }

  fs.rmSync(assetsDir, { recursive: true, force: true });
  ensure(assetsDir);
  ensure(jsDir);

  const novels = readJson(path.join(dataDir, 'novels.json')).map(buildNovel);
  const logo = copyAsset(path.join(publicDir, 'yomiori-logo.png'), path.join('brand', 'yomiori-logo.png'));

  const payload = {
    generatedFrom: `reader-web@${gitHead()}`,
    generatedAt: new Date().toISOString(),
    logo,
    novels,
  };

  const chapterCount = novels.reduce((sum, novel) => sum + novel.chapters.length, 0);
  const blockCount = novels.reduce(
    (sum, novel) => sum + novel.chapters.reduce((inner, chapter) => inner + chapter.blocks.length, 0),
    0,
  );

  fs.writeFileSync(
    path.join(jsDir, 'data.js'),
    `/* Generated by tools/build-data.mjs. Do not edit. */\nwindow.YOMIORI_V2_DATA = ${JSON.stringify(payload)};\n`,
    'utf8',
  );

  const bytes = fs.statSync(path.join(jsDir, 'data.js')).size;
  console.log(
    `Wrote js/data.js · ${novels.length} novels · ${chapterCount} chapters · ${blockCount} blocks · ${(bytes / 1024 / 1024).toFixed(2)} MB`,
  );
}

main();
