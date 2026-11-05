#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSource, readJson, verifyContent } from './conversion-core.mjs';

export function verifyChapter(rawMdPath, jsonPath, options = {}) {
  try {
    const raw = fs.readFileSync(rawMdPath, 'utf8');
    const chapter = readJson(jsonPath);
    const rosterFile = path.resolve(path.dirname(jsonPath), '../characters.json');
    const characters = options.characters ?? (fs.existsSync(rosterFile) ? readJson(rosterFile) : undefined);
    const directory = path.dirname(path.resolve(jsonPath));
    let expected = {}, imagePaths = options.imagePaths;
    if (path.basename(directory) === 'chapters') {
      const novelId = path.basename(path.dirname(directory));
      const repository = path.resolve(directory, '../../../../../..');
      expected = { id: path.basename(jsonPath, '.json'), novelId };
      const receiptFile = path.join(repository, '.conversion', novelId, 'receipts', `${chapter.id}.json`);
      if (!imagePaths && fs.existsSync(receiptFile)) imagePaths = Object.fromEntries(readJson(receiptFile).assets.map(a => [a.source, path.basename(a.path)]));
    }
    const source = verifyContent(raw, chapter, { ...options, characters, imagePaths, expected: { ...expected, ...options.expected } });
    const rawChars = source.tokens.filter(t => t.type === 'text').reduce((n, t) => n + t.text.length, 0);
    return { success: true, chapterNumber: chapter.chapterNumber, title: chapter.title, blocksCount: chapter.blocks.length,
      narrationCount: chapter.blocks.filter(b => b.type === 'narration').length,
      dialogueCount: chapter.blocks.filter(b => b.type === 'dialogue').length,
      rawChars, jsonChars: rawChars, diffChars: 0, ratio: '100.00',
      scope: 'Exact text, paragraph boundaries, image/scene sequence, structure; speaker meaning requires contextual review.' };
  } catch (error) { return { success: false, error: error.message }; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 2) { console.error('Usage: verify-conversion.mjs <source.md> <chapter.json>'); process.exitCode = 1; }
  else { const result = verifyChapter(...args); console.log(JSON.stringify(result, null, 2)); if (!result.success) process.exitCode = 1; }
}
export { parseSource };
