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
  for (const entry of ctx.sources) writeJson(path.join(ctx.stateDir, 'maps', `${entry.sourceId}.json`), mapping(fs.readFileSync(entry.sourcePath, 'utf8')));
}

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
  const plan = apply(ctx); assert.equal(plan.entries[0].status, 'verified'); assert.equal(plan.entries[1].status, 'blocked');
  const report = audit(f.directory, { novelId: 'test', complete: true }); assert.equal(report.pending, 1); assert.ok(report.errors.length);
  assert.equal(audit(f.directory).errors.length, 0, 'A partial novel may publish only its certified chapters');
});

test('the default whole-novel plan blocks publication until every scoped source is certified', t => {
  const f = fixture(t); const ctx = f.ctx(); prepare(ctx);
  const entry = ctx.sources[0]; writeJson(path.join(ctx.stateDir, 'maps/100.json'), mapping(fs.readFileSync(entry.sourcePath, 'utf8')));
  apply(ctx);
  assert.ok(audit(f.directory).errors.length, 'Default CI gate must enforce the declared whole-novel scope');
  const remaining = ctx.sources[1]; writeJson(path.join(ctx.stateDir, 'maps/101.json'), mapping(fs.readFileSync(remaining.sourcePath, 'utf8')));
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
