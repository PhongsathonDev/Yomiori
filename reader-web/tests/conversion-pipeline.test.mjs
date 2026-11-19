import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { hash, readJson, writeJson, parseSource, verifyContent, buildChapter } from '../scripts/conversion-core.mjs';
import { context, prepare, apply, audit, fingerprint, checkIndex, runCLI } from '../scripts/conversion-pipeline.mjs';
import { verifyChapter } from '../scripts/verify-conversion.mjs';
import { writeRelease, verifyRelease } from '../scripts/verify-release.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const roster = [{ id: 'alice', name: 'Alice', role: 'Character', color: '#123456' }];
const source = (body, number = 1) => `# Ch.${number} — Test\n\nCh.${number} — Test\n\nBy Translator\n\nPublished: 2026-01-01\n\nSource: https://example.com/${number}\n\n${body}\n`;
const metadata = number => ({ id: `ch-${String(number).padStart(2, '0').replace('.', '-')}`, novelId: 'test', novelTitle: 'Test novel', title: `Ch.${number} — Test`, chapterNumber: number });
const chapter = (blocks, number = 1) => ({ ...metadata(number), blocks });
const narration = (text, id = 'b1') => ({ id, type: 'narration', text });
function temp(t) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yomiori-pipeline-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir; }
function mapping(raw, dialogue = false) {
  return { sourceSha256: hash(raw), tokens: parseSource(raw).tokens.filter(t => t.type === 'text').map(t => ({ id: t.id, segments: [{ start: 0, end: t.text.length, type: dialogue ? 'dialogue' : 'narration', review: { confirmed: true, context: [t.id], reason: dialogue ? 'Explicit name in preceding context.' : 'Narrator reference in the surrounding context.' }, ...(dialogue ? { speakerId: 'alice' } : {}) }] })) };
}
function fixture(t, bodies = ['Alpha.\n\n“Hello.”', 'Next chapter.']) {
  const directory = temp(t);
  const novel = { id: 'test', title: 'Test novel', author: 'Author', synopsis: 'Test', coverUrl: '', tags: [], totalOriginalChapters: bodies.length };
  for (const app of ['reader-web', 'reader-mobile']) {
    writeJson(path.join(directory, app, 'src/data/novels.json'), [novel]);
    const data = path.join(directory, app, 'src/data/novels/test');
    writeJson(path.join(data, 'characters.json'), roster);
    fs.mkdirSync(path.join(data, 'chapters'), { recursive: true });
    fs.writeFileSync(path.join(data, 'chapters/index.ts'), "export const testChapters = [];\n");
  }
  fs.mkdirSync(path.join(directory, 'reader-web/public'), { recursive: true });
  const sources = bodies.map((body, i) => ({ chapterId: 100 + i, chapterNo: String(i + 1), chapterName: 'Test', file: `Ch_${i + 1}_Test.md`, images: [] }));
  writeJson(path.join(directory, 'novels_source/test/_source.json'), { projectName: novel.title, totalChapters: bodies.length, chapters: sources });
  for (const [i, body] of bodies.entries()) fs.writeFileSync(path.join(directory, 'novels_source/test', sources[i].file), source(body, i + 1));
  return { directory, ctx: () => context(directory, 'test'), sources };
}
function reviewAll(ctx) {
  prepare(ctx);
  for (const entry of ctx.sources) {
    writeMapping(ctx, entry);
    seedSourceReview(ctx, entry);
  }
}
const reviewPath = (ctx, id) => path.join(ctx.stateDir, 'source-reviews', `${id}.json`);
const receiptPath = (ctx, id) => path.join(ctx.stateDir, 'receipts', `${id}.json`);
function writeMapping(ctx, entry) {
  writeJson(path.join(ctx.stateDir, 'maps', `${entry.sourceId}.json`), mapping(fs.readFileSync(entry.sourcePath, 'utf8')));
}
function seedSourceReview(ctx, entry) {
  writeJson(reviewPath(ctx, entry.sourceId), { version: 1, sourceId: entry.sourceId, sourceSha256: entry.sourceSha256,
    reference: `https://example.com/${entry.chapterNo}`, reviewedBy: 'Fixture reviewer', note: 'Fixture body, notes and images match.' });
}
const recordReview = (ctx, entry, sha = entry.sourceSha256, note = 'Compared complete body, notes and images.') =>
  runCLI(['source-review', '--novel', ctx.novelId, '--source-id', entry.sourceId, '--source-sha', sha,
    '--reference', `https://example.invalid/${entry.chapterNo}`, '--reviewed-by', 'Test reviewer', '--reason', note], ctx.root);

test('short sources can pass after review', async t => {
  const { ctx: getCtx } = fixture(t, ['A brief note.', '![Art](illustrations/a.png)', 'A long passage. '.repeat(25)]);
  const ctx = getCtx(), registryFile = path.join(ctx.sourceDir, '_source.json');
  const registry = readJson(registryFile);
  registry.chapters[1].images = [{ file: 'illustrations/a.png', source: 'https://example.com/a.png' }];
  writeJson(registryFile, registry);
  fs.mkdirSync(path.join(ctx.sourceDir, 'illustrations'));
  fs.writeFileSync(path.join(ctx.sourceDir, 'illustrations/a.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'));
  const warn = t.mock.method(console, 'warn', () => {});
  const log = t.mock.method(console, 'log', () => {});
  await runCLI(['prepare', '--novel', 'test'], ctx.root);
  assert.match(warn.mock.calls.map(call => call.arguments.join(' ')).join('\n'), /100.*Ch_1_Test\.md/);
  assert.match(warn.mock.calls.map(call => call.arguments.join(' ')).join('\n'), /101.*Ch_2_Test\.md/);
  assert.doesNotMatch(warn.mock.calls.map(call => call.arguments.join(' ')).join('\n'), /Ch_3_Test\.md/);
  assert.equal(JSON.parse(log.mock.calls[0].arguments[0]).entries.length, 3);
  const current = getCtx();
  for (const entry of current.sources.slice(0, 2)) {
    await recordReview(current, entry);
    writeMapping(current, entry);
    assert.equal(apply(current, entry.sourceId).entries.find(e => e.sourceId === entry.sourceId).status, 'verified');
  }
});

test('missing review blocks only its chapter', t => {
  const ctx = fixture(t, ['A long but possibly incomplete passage. '.repeat(20), 'A complete chapter.']).ctx();
  prepare(ctx);
  for (const entry of ctx.sources) writeMapping(ctx, entry);
  seedSourceReview(ctx, ctx.sources[1]);
  const plan = apply(ctx);
  assert.deepEqual(plan.entries.map(e => e.status), ['blocked', 'verified']);
  assert.match(plan.entries[0].reason, /source review/i);
  for (const file of [path.join(ctx.web, 'chapters/ch-01.json'), path.join(ctx.mobile, 'chapters/ch-01.json'), receiptPath(ctx, 'ch-01')]) assert.equal(fs.existsSync(file), false);
  assert.equal(audit(ctx.root, { novelId: 'test', complete: true }).pending, 1);
});

test('prepare blocks an empty source but still prepares its sibling', async t => {
  const { ctx: getCtx, directory } = fixture(t, ['', 'A complete chapter.']);
  const warn = t.mock.method(console, 'warn', () => {});
  t.mock.method(console, 'log', () => {});
  const plan = await runCLI(['prepare', '--novel', 'test'], directory);
  assert.deepEqual(plan.entries.map(e => e.status), ['blocked', 'pending']);
  assert.match(warn.mock.calls.map(call => call.arguments.join(' ')).join('\n'), /100.*Source body is empty/);
  const ctx = getCtx();
  assert.equal(fs.existsSync(path.join(ctx.stateDir, 'maps/100.json')), false);
  assert.ok(fs.existsSync(path.join(ctx.stateDir, 'maps/101.json')));
  writeMapping(ctx, ctx.sources[1]); seedSourceReview(ctx, ctx.sources[1]);
  assert.deepEqual((await runCLI(['apply', '--novel', 'test', '--source-id', '101'], directory)).entries.map(e => e.status), ['blocked', 'verified']);
});

test('stale source review never overwrites output', async t => {
  const f = fixture(t, ['Original chapter.']);
  const old = f.ctx(); reviewAll(old); apply(old);
  const files = [path.join(old.web, 'chapters/ch-01.json'), path.join(old.mobile, 'chapters/ch-01.json'), receiptPath(old, 'ch-01')];
  const before = files.map(file => fs.readFileSync(file));
  fs.appendFileSync(old.sources[0].sourcePath, '\nRecovered ending.\n');
  const current = f.ctx(), entry = current.sources[0];
  prepare(current); writeMapping(current, entry);
  await assert.rejects(recordReview(current, entry, old.sources[0].sourceSha256), /SHA|hash|changed/i);
  assert.equal(apply(current).entries[0].status, 'blocked');
  assert.deepEqual(files.map(file => fs.readFileSync(file)), before);
  await recordReview(current, entry);
  assert.equal(apply(current).entries[0].status, 'verified');
  assert.equal(readJson(files[0]).blocks.at(-1).text, 'Recovered ending.');
});

test('v2 audit requires the exact source review', t => {
  const ctx = fixture(t, ['Approved body.']).ctx();
  reviewAll(ctx); apply(ctx);
  const receipt = readJson(receiptPath(ctx, 'ch-01'));
  assert.equal(receipt.version, 2);
  assert.match(receipt.sourceReviewSha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(audit(ctx.root).errors, []);
  const file = reviewPath(ctx, '100'), review = readJson(file);
  fs.unlinkSync(file);
  assert.match(audit(ctx.root).errors.join('\n'), /source review/i);
  fs.writeFileSync(file, '{broken');
  assert.match(audit(ctx.root).errors.join('\n'), /source review/i);
  writeJson(file, { ...review, note: 'Different comparison.' });
  assert.match(audit(ctx.root).errors.join('\n'), /source review/i);
});

test('a fresh source cannot pass audit or apply with a v1 receipt from an old tool', t => {
  const ctx = fixture(t, ['New source.']).ctx();
  reviewAll(ctx); apply(ctx);
  const file = receiptPath(ctx, 'ch-01'), { sourceReviewSha256: _proof, ...receipt } = readJson(file);
  writeJson(file, { ...receipt, version: 1 });
  fs.unlinkSync(reviewPath(ctx, '100'));
  assert.match(audit(ctx.root).errors.join('\n'), /source review/i);
  assert.equal(apply(ctx).entries[0].status, 'blocked');
  seedSourceReview(ctx, ctx.sources[0]);
  assert.equal(apply(ctx).entries[0].status, 'verified');
  assert.equal(readJson(file).version, 2);
});

test('v1 compatibility is limited to the same source recorded before rollout', t => {
  const directory = temp(t), novelId = 'boyish-friend', chapterId = 'ch-11';
  const beforeRollout = '79a6ce7b707fa47bb28c03721d856ad5fc1818a3';
  function copy(file) {
    const dest = path.join(directory, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, execFileSync('git', ['show', `${beforeRollout}:${file}`], { cwd: root }));
  }
  for (const app of ['reader-web', 'reader-mobile']) {
    const catalog = `${app}/src/data/novels.json`;
    copy(catalog);
    const catalogPath = path.join(directory, catalog);
    writeJson(catalogPath, readJson(catalogPath).filter(n => n.id === novelId));
    const data = `${app}/src/data/novels/${novelId}`;
    copy(`${data}/characters.json`);
    copy(`${data}/chapters/${chapterId}.json`);
    fs.writeFileSync(path.join(directory, `${data}/chapters/index.ts`), "import c from './ch-11.json';\nexport const chapters = [c];\n");
  }
  copy('novels_source/boyish-friend/Ch_11.md');
  copy('.conversion/boyish-friend/receipts/ch-11.json');
  copy('.conversion/boyish-friend/maps/legacy-c2f80145f7666ef2.json');
  const ctx = context(directory, novelId), entry = ctx.sources[0], file = receiptPath(ctx, chapterId);
  prepare(ctx, { partial: true });
  assert.deepEqual(audit(ctx.root).errors, []);
  const mapFile = path.join(ctx.stateDir, 'maps', `${entry.sourceId}.json`), map = readJson(mapFile);
  const existingReview = map.tokens.flatMap(token => token.segments).find(span => span.review).review;
  existingReview.reason += ' Rechecked mapping.';
  writeJson(mapFile, map);
  assert.equal(apply(ctx).entries[0].status, 'verified');
  assert.equal(readJson(file).version, 1);
  fs.appendFileSync(entry.sourcePath, '\nNew text.\n');
  const updated = context(directory, novelId); prepare(updated, { partial: true }); writeMapping(updated, updated.sources[0]);
  const result = apply(updated).entries[0];
  assert.equal(result.status, 'blocked');
  assert.match(result.reason, /source review/i);
});

test('source parser preserves decimal identity, body headings, notes, emphasis and literal metadata lines', () => {
  const parsed = parseSource(source('By a river.\n\n# A heading in the story\n\n*An italic thought.*\n\nSource: a literal story line', '12.5'));
  assert.equal(parsed.chapterNumber, 12.5);
  assert.deepEqual(parsed.tokens.map(t => t.text), ['By a river.', '# A heading in the story', '*An italic thought.*', 'Source: a literal story line']);
});

for (const [name, blocks] of Object.entries({
  reordered: [narration('Bravo.'), narration('Alpha.', 'b2')],
  sameLengthReplacement: [narration('XXXXXXXXXXXX')],
  mergedParagraphs: [narration('Alpha.Bravo.')],
  omittedParagraph: [narration('Alpha.')],
  duplicatedParagraph: [narration('Alpha.'), narration('Alpha.', 'b2'), narration('Bravo.', 'b3')],
  changedPunctuation: [narration('Alpha!'), narration('Bravo.', 'b2')],
  duplicateId: [narration('Alpha.'), narration('Bravo.')],
  unknownSpeaker: [{ id: 'b1', type: 'dialogue', text: 'Alpha.', speakerId: 'unknown', speakerName: 'Unknown' }, narration('Bravo.', 'b2')],
  missingRosterSpeaker: [{ id: 'b1', type: 'dialogue', text: 'Alpha.', speakerId: 'ghost', speakerName: 'Ghost' }, narration('Bravo.', 'b2')],
})) test(`strict verification rejects ${name}`, () => {
  assert.throws(() => verifyContent(source('Alpha.\n\nBravo.'), chapter(blocks), { characters: roster }));
});

test('ordered split text spans preserve every character and paragraph boundary', () => {
  assert.doesNotThrow(() => verifyContent(source('One “two” three.\n\nNext.'), chapter([narration('One '), { id: 'b2', type: 'dialogue', text: '“two”', speakerId: 'alice', speakerName: 'Alice' }, narration(' three.', 'b3'), narration('Next.', 'b4')]), { characters: roster }));
});

test('first paragraph is checked; malformed JSON/missing files fail the public verifier', t => {
  const dir = temp(t), raw = path.join(dir, 'source.md'), out = path.join(dir, 'out.json');
  fs.writeFileSync(raw, source('First.\n\nSecond.'));
  writeJson(out, chapter([narration('Wrong.'), narration('Second.', 'b2')]));
  assert.equal(verifyChapter(raw, out).success, false);
  fs.writeFileSync(out, '{broken'); assert.equal(verifyChapter(raw, out).success, false);
  assert.equal(verifyChapter(raw, out + '.missing').success, false);
});

test('images and scene separators must retain exact position and identity', () => {
  const raw = source('Before.\n\n![Art](illustrations/a.png)\n\n---\n\nAfter.');
  const good = chapter([narration('Before.'), { id: 'b2', type: 'illustration', src: 'illustrations/a.png' }, { id: 'b3', type: 'scene_break', symbol: '---' }, narration('After.', 'b4')]);
  assert.doesNotThrow(() => verifyContent(raw, good));
  for (const mutate of [c => c.blocks.splice(1, 1), c => { c.blocks[1].src = 'wrong.png'; }, c => { c.blocks[2].symbol = '***'; }, c => c.blocks.reverse()]) {
    const bad = structuredClone(good); mutate(bad); assert.throws(() => verifyContent(raw, bad));
  }
});

test('AI maps cannot replace prose, guess an unreviewed speaker, leave gaps or use stale source hashes', () => {
  const raw = source('“Hello.”'), good = mapping(raw, true);
  assert.equal(buildChapter(raw, good, roster, metadata(1)).blocks[0].text, '“Hello.”');
  for (const mutate of [m => { m.sourceSha256 = 'stale'; }, m => { m.tokens[0].segments[0].text = 'replacement'; }, m => { m.tokens[0].segments[0].start = 1; }, m => { m.tokens[0].segments[0].end--; }, m => { delete m.tokens[0].segments[0].review; }, m => { m.tokens[0].segments[0].speakerId = 'ghost'; }]) {
    const bad = structuredClone(good); mutate(bad); assert.throws(() => buildChapter(raw, bad, roster, metadata(1)));
  }
});

test('decimal and duplicate chapter numbers retain stable distinct source IDs', t => {
  const f = fixture(t, ['A.', 'B.', 'C.']); const registryPath = path.join(f.directory, 'novels_source/test/_source.json');
  const registry = readJson(registryPath);
  registry.chapters[0].chapterNo = '12.5'; registry.chapters[1].chapterNo = '40'; registry.chapters[2].chapterNo = '40'; writeJson(registryPath, registry);
  for (const [i, entry] of registry.chapters.entries()) fs.writeFileSync(path.join(f.directory, 'novels_source/test', entry.file), source(['A.', 'B.', 'C.'][i], entry.chapterNo));
  const ctx = f.ctx(); reviewAll(ctx); const plan = apply(ctx);
  assert.deepEqual(plan.entries.map(e => e.outputId), ['ch-12-5', 'ch-40-s101', 'ch-40-s102']);
  assert.ok(plan.entries.every(e => e.status === 'verified'));
  assert.equal(audit(f.directory, { novelId: 'test', complete: true }).errors.length, 0);
});

test('whole-novel conversion synchronizes indexes/mobile, checkpoints and resumes without rewriting verified chapters', t => {
  const f = fixture(t); const ctx = f.ctx(); reviewAll(ctx);
  assert.ok(apply(ctx).entries.every(e => e.status === 'verified'));
  const file = path.join(ctx.web, 'chapters/ch-01.json'), before = fs.statSync(file).mtimeMs;
  assert.equal(audit(f.directory, { novelId: 'test', complete: true }).verified, 2);
  assert.ok(apply(f.ctx()).entries.every(e => e.status === 'verified'));
  assert.equal(fs.statSync(file).mtimeMs, before);
  assert.deepEqual(readJson(file), readJson(path.join(ctx.mobile, 'chapters/ch-01.json')));
});

test('a blocked chapter does not overwrite old files or erase another completed checkpoint', t => {
  const f = fixture(t); reviewAll(f.ctx()); apply(f.ctx());
  const ctx = f.ctx(), file = path.join(ctx.web, 'chapters/ch-01.json'), old = fs.readFileSync(file);
  const mapFile = path.join(ctx.stateDir, 'maps/100.json'), map = readJson(mapFile); map.sourceSha256 = 'stale'; writeJson(mapFile, map);
  const plan = apply(f.ctx()); assert.equal(plan.entries[0].status, 'blocked'); assert.equal(plan.entries[1].status, 'verified');
  assert.deepEqual(fs.readFileSync(file), old);
  assert.ok(audit(f.directory).errors.some(e => /Mapping changed/.test(e)));
});

test('unreviewed chapters stay pending and cannot be called a complete novel', t => {
  const f = fixture(t); const ctx = f.ctx(); prepare(ctx, { partial: true });
  const sourceEntry = ctx.sources[0]; writeJson(path.join(ctx.stateDir, 'maps/100.json'), mapping(fs.readFileSync(sourceEntry.sourcePath, 'utf8')));
  seedSourceReview(ctx, sourceEntry);
  const plan = apply(ctx); assert.equal(plan.entries[0].status, 'verified'); assert.equal(plan.entries[1].status, 'blocked');
  const report = audit(f.directory, { novelId: 'test', complete: true }); assert.equal(report.pending, 1); assert.ok(report.errors.length);
  assert.equal(audit(f.directory).errors.length, 0, 'A partial novel may publish only its certified chapters');
});

test('the default whole-novel plan blocks publication until every scoped source is certified', t => {
  const f = fixture(t); const ctx = f.ctx(); prepare(ctx);
  const entry = ctx.sources[0]; writeJson(path.join(ctx.stateDir, 'maps/100.json'), mapping(fs.readFileSync(entry.sourcePath, 'utf8')));
  seedSourceReview(ctx, entry);
  apply(ctx);
  assert.ok(audit(f.directory).errors.length, 'Default CI gate must enforce the declared whole-novel scope');
  const remaining = ctx.sources[1]; writeJson(path.join(ctx.stateDir, 'maps/101.json'), mapping(fs.readFileSync(remaining.sourcePath, 'utf8')));
  seedSourceReview(ctx, remaining);
  apply(ctx); assert.equal(audit(f.directory).errors.length, 0);
});

test('quoted text cannot evade contextual classification review by being labeled narration', () => {
  const raw = source('“Hello.”'), map = mapping(raw);
  delete map.tokens[0].segments[0].review;
  assert.throws(() => buildChapter(raw, map, roster, metadata(1)), /classification review/);
});

test('explicit exclusions need reasons, create no placeholder and do not claim full conversion', async t => {
  const f = fixture(t); const ctx = f.ctx(); prepare(ctx);
  await assert.rejects(runCLI(['exclude', '--novel', 'test', '--source-id', '101'], f.directory), /reason/);
  await runCLI(['exclude', '--novel', 'test', '--source-id', '101', '--reason', 'User-scoped exclusion of the announcement'], f.directory);
  const entry = ctx.sources[0]; writeJson(path.join(ctx.stateDir, 'maps/100.json'), mapping(fs.readFileSync(entry.sourcePath, 'utf8')));
  seedSourceReview(ctx, entry);
  apply(ctx); const report = audit(f.directory);
  assert.equal(report.errors.length, 0); assert.equal(report.verified, 1); assert.equal(report.excluded, 1);
  assert.equal(fs.existsSync(path.join(ctx.web, 'chapters/ch-02.json')), false);
  fs.appendFileSync(ctx.sources[1].sourcePath, '\nChanged announcement.\n');
  assert.ok(audit(f.directory).errors.length, 'Exclusion cannot survive a changed source');
});

test('changed inventories require a new plan and cannot silently skip newly acquired chapters', t => {
  const f = fixture(t); reviewAll(f.ctx()); apply(f.ctx());
  const file = path.join(f.directory, 'novels_source/test/_source.json'), registry = readJson(file);
  registry.chapters.push({ chapterId: 102, chapterNo: '3', file: 'Ch_3_Test.md', images: [] }); registry.totalChapters++;
  fs.writeFileSync(path.join(f.directory, 'novels_source/test/Ch_3_Test.md'), source('New source.', 3)); writeJson(file, registry);
  assert.throws(() => apply(f.ctx()), /inventory changed/); assert.ok(audit(f.directory).errors.length);
});

test('registry provenance/title edits invalidate receipts and cannot override source metadata', t => {
  const f = fixture(t); reviewAll(f.ctx()); apply(f.ctx());
  const file = path.join(f.directory, 'novels_source/test/_source.json'), registry = readJson(file);
  registry.chapters[0].chapterName = 'Different title'; writeJson(file, registry);
  assert.ok(audit(f.directory).errors.some(e => /registry entry changed/.test(e)));
  assert.equal(apply(f.ctx()).entries[0].status, 'blocked');
});

test('external and missing illustration files block a chapter before outputs are written', t => {
  for (const src of ['https://example.com/remote.jpg', 'illustrations/missing.jpg']) {
    const f = fixture(t, [`![Art](${src})`]); const ctx = f.ctx(); reviewAll(ctx);
    const plan = apply(ctx); assert.equal(plan.entries[0].status, 'blocked');
    assert.equal(fs.existsSync(path.join(ctx.web, 'chapters/ch-01.json')), false);
  }
});

test('source and metadata identity mismatches are rejected even with exact prose', () => {
  for (const [key, value] of [['id', 'wrong'], ['novelId', 'another-novel'], ['novelTitle', 'Wrong title'], ['chapterNumber', 2]]) {
    const c = chapter([narration('Hello.')]); c[key] = value;
    assert.throws(() => verifyContent(source('Hello.'), c, { expected: metadata(1) }));
  }
  const wrong = chapter([narration('Hello.')], 2);
  assert.throws(() => verifyContent(source('Hello.', 1), wrong, { expected: metadata(2) }), /source heading/);
});

for (const target of ['web output', 'mobile output', 'source', 'roster', 'index', 'receipt']) test(`publication gate rejects changed ${target}`, t => {
  const f = fixture(t); reviewAll(f.ctx()); apply(f.ctx()); const ctx = f.ctx();
  if (target === 'web output' || target === 'mobile output') {
    const file = path.join(target.startsWith('web') ? ctx.web : ctx.mobile, 'chapters/ch-01.json'); const c = readJson(file); c.blocks[0].text = 'Changed.'; writeJson(file, c);
  } else if (target === 'source') fs.appendFileSync(ctx.sources[0].sourcePath, '\nNew paragraph.\n');
  else if (target === 'roster') { const chars = structuredClone(roster); chars[0].name = 'Renamed'; for (const dir of [ctx.web, ctx.mobile]) writeJson(path.join(dir, 'characters.json'), chars); }
  else if (target === 'index') fs.writeFileSync(path.join(ctx.web, 'chapters/index.ts'), 'export const testChapters = [];');
  else fs.unlinkSync(path.join(ctx.stateDir, 'receipts/ch-01.json'));
  assert.ok(audit(f.directory).errors.length);
});

test('frozen legacy entries are explicitly unverified and changed chapters cannot inherit their exception', t => {
  const f = fixture(t); reviewAll(f.ctx()); apply(f.ctx()); const ctx = f.ctx();
  const chapters = Object.fromEntries(['ch-01.json', 'ch-02.json'].map(file => [`test/${file}`, fingerprint(ctx, file)]));
  writeJson(path.join(f.directory, 'reader-web/scripts/conversion-legacy-baseline.json'), { chapters });
  const planFile = path.join(ctx.stateDir, 'plan.json'); const plan = readJson(planFile); plan.scope = 'partial'; writeJson(planFile, plan);
  fs.rmSync(path.join(ctx.stateDir, 'receipts'), { recursive: true });
  assert.equal(audit(f.directory).legacyUnverified, 2);
  assert.ok(audit(f.directory, { novelId: 'test', complete: true }).errors.length, 'A legacy fingerprint is not whole-novel certification');
  const file = path.join(ctx.web, 'chapters/ch-01.json'), c = readJson(file); c.blocks[0].text = 'Changed.'; writeJson(file, c);
  assert.ok(audit(f.directory).errors.length);
});

test('CI refuses to extend the baseline after its first migration', t => {
  const f = fixture(t); const baseline = path.join(f.directory, 'reader-web/scripts/conversion-legacy-baseline.json'); writeJson(baseline, { chapters: {} });
  const git = args => execFileSync('git', args, { cwd: f.directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git(['init']); git(['add', '.']); git(['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'fixture']);
  const ref = git(['rev-parse', 'HEAD']).trim(); writeJson(baseline, { chapters: { bypass: {} } });
  assert.throws(() => audit(f.directory, { baselineRef: ref }), /baseline is frozen/);
});

test('new receipt images must exist, match source bytes and remain local', t => {
  const f = fixture(t, ['Before.\n\n![Art](illustrations/a.png)\n\n---\n\nAfter.']);
  const rawDir = path.join(f.directory, 'novels_source/test'); fs.mkdirSync(path.join(rawDir, 'illustrations'));
  fs.writeFileSync(path.join(rawDir, 'illustrations/a.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'));
  const registry = readJson(path.join(rawDir, '_source.json')); registry.chapters[0].images = [{ file: 'illustrations/a.png', source: 'https://example.com/a.png' }]; writeJson(path.join(rawDir, '_source.json'), registry);
  const ctx = f.ctx(); reviewAll(ctx); assert.equal(apply(ctx).entries[0].status, 'verified'); assert.equal(audit(f.directory).errors.length, 0);
  const converted = readJson(path.join(ctx.web, 'chapters/ch-01.json'));
  assert.equal(verifyChapter(ctx.sources[0].sourcePath, path.join(ctx.web, 'chapters/ch-01.json')).success, true, 'Pair verifier must resolve certified image filenames');
  assert.equal(converted.blocks[1].src, '100-a.png', 'Use the chapter-image runtime resolver, not the avatar/public resolver');
  const webDir = path.join(f.directory, 'reader-web'); fs.mkdirSync(path.join(webDir, 'dist'));
  fs.writeFileSync(path.join(webDir, 'dist/index.html'), '<html><head></head></html>');
  const built = spawnSync(process.execPath, [path.join(root, 'reader-web/scripts/postbuild.mjs')], { cwd: webDir, encoding: 'utf8' });
  assert.equal(built.status, 0, built.stderr);
  assert.deepEqual(fs.readFileSync(path.join(webDir, 'dist/data/novels/test/illustrations', converted.blocks[1].src)), fs.readFileSync(path.join(rawDir, 'illustrations/a.png')));
  fs.writeFileSync(path.join(ctx.web, 'illustrations/100-a.png'), 'corrupt'); assert.ok(audit(f.directory).errors.length);
});

test('index checker rejects exported imports that are not in the actual file list', t => {
  const dir = temp(t); fs.writeFileSync(path.join(dir, 'index.ts'), "import c from './ch-01.json';\nexport const chapters = [];\n");
  assert.throws(() => checkIndex(dir, ['ch-01.json']), /imports\/exports differ/);
});

test('postbuild fails on corrupt chapter JSON instead of inventing a manifest entry', t => {
  const f = fixture(t); const data = path.join(f.directory, 'reader-web');
  fs.mkdirSync(path.join(data, 'dist')); fs.writeFileSync(path.join(data, 'dist/index.html'), '<html><head></head></html>');
  fs.writeFileSync(path.join(data, 'src/data/novels/test/chapters/ch-01.json'), '{invalid');
  const result = spawnSync(process.execPath, [path.join(root, 'reader-web/scripts/postbuild.mjs')], { cwd: data, encoding: 'utf8' });
  assert.notEqual(result.status, 0); assert.equal(fs.existsSync(path.join(data, 'dist/data/novels/test/manifest.json')), false);
});

test('CDN verification waits for the exact commit then checks every file hash', async t => {
  const dist = temp(t); writeJson(path.join(dist, 'data/novels.json'), [{ id: 'test' }]); const release = writeRelease(dist, 'abc123');
  let releaseRequests = 0;
  const result = await verifyRelease(dist, 'https://example.com/Yomiori/', { attempts: 2, wait: async () => {}, fetchImpl: async url => {
    if (url.pathname.endsWith('/release.json')) return Response.json(++releaseRequests === 1 ? { ...release, commit: 'old' } : release);
    return new Response(fs.readFileSync(path.join(dist, url.pathname.replace('/Yomiori/', ''))));
  } });
  assert.equal(releaseRequests, 2); assert.equal(result.checkedFiles, release.files.length);
});

test('HTTP 200 alone cannot pass CDN verification with old content or an old release', async t => {
  const dist = temp(t); writeJson(path.join(dist, 'data/novels.json'), []); const release = writeRelease(dist, 'new');
  await assert.rejects(verifyRelease(dist, 'https://example.com/', { attempts: 1, fetchImpl: async url => url.pathname.endsWith('release.json') ? Response.json(release) : new Response('old') }), /checksum/);
  await assert.rejects(verifyRelease(dist, 'https://example.com/', { attempts: 1, fetchImpl: async () => Response.json({ ...release, commit: 'old' }) }), /different commit/);
});
