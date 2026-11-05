import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { hash, readJson, fileHash, jsonHash, safeId, inside, invariant, writeJson, atomicWrite, parseSource, validateRoster, validateStructure, buildChapter } from './conversion-core.mjs';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// One-time migration snapshot, not a baseline-regeneration command. Updating this
// pin is an explicit migration/code-review change, never an AI conversion step.
export const legacyBaselineSha256 = '00c1308c4c148c4fed1c4cd6971d66e75bc39ce3d41a799e99f6f9a9dea1df4a';
const chapterFiles = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.startsWith('ch-') && f.endsWith('.json')).sort() : [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function context(root, novelId) {
  invariant(safeId(novelId), 'A safe --novel ID is required');
  const web = path.join(root, 'reader-web/src/data/novels', novelId);
  const mobile = path.join(root, 'reader-mobile/src/data/novels', novelId);
  const novel = readJson(path.join(root, 'reader-web/src/data/novels.json')).find(n => n.id === novelId);
  invariant(novel, `Novel is not in the web catalog: ${novelId}`);
  const mobileNovel = readJson(path.join(root, 'reader-mobile/src/data/novels.json')).find(n => n.id === novelId);
  invariant(same(novel, mobileNovel), `Web/mobile catalog mismatch: ${novelId}`);
  const characters = readJson(path.join(web, 'characters.json'));
  validateRoster(characters);
  invariant(same(characters, readJson(path.join(mobile, 'characters.json'))), `Web/mobile roster mismatch: ${novelId}`);
  const sourceDir = path.join(root, 'novels_source', novelId);
  const registryPath = path.join(sourceDir, '_source.json');
  const registry = fs.existsSync(registryPath) ? readJson(registryPath) : null;
  if (registry?.source === 'nekopost' && registry.projectId && novel.translationSource?.url) {
    invariant(new URL(novel.translationSource.url).pathname.replace(/\/$/, '') === `/novel/${registry.projectId}`, 'Source project does not match catalog provenance');
  }
  const rawFiles = fs.existsSync(sourceDir) ? fs.readdirSync(sourceDir).filter(f => /^Ch[._]\d+(?:\.\d+)?.*\.md$/i.test(f)) : [];
  const entries = registry ? registry.chapters : rawFiles.map(file => ({
    file, chapterId: `legacy-${hash(file).slice(0, 16)}`, chapterNo: /^Ch[._](\d+(?:\.\d+)?)/i.exec(file)[1], images: [],
  }));
  invariant(Array.isArray(entries), 'Source registry has no chapter list');
  invariant(!registry || same(entries.map(e => e.file).sort(), [...rawFiles].sort()), `Registry/files differ: ${novelId}`);
  const ids = new Set(), files = new Set();
  const sources = entries.map(entry => {
    const sourceId = String(entry.chapterId);
    invariant(safeId(sourceId) && !ids.has(sourceId), 'Invalid/duplicate source chapter ID'); ids.add(sourceId);
    invariant(/^\d+(?:\.\d+)?$/.test(String(entry.chapterNo)), 'Invalid source chapter number');
    invariant(path.basename(entry.file) === entry.file && !files.has(entry.file), 'Invalid/duplicate source filename'); files.add(entry.file);
    const sourcePath = inside(sourceDir, entry.file);
    invariant(fs.existsSync(sourcePath), `Missing source: ${entry.file}`);
    return { ...entry, sourceId, sourcePath, sourceSha256: fileHash(sourcePath) };
  }).sort((a, b) => Number(a.chapterNo) - Number(b.chapterNo) || a.sourceId.localeCompare(b.sourceId));
  for (const source of sources) {
    const duplicate = sources.filter(s => Number(s.chapterNo) === Number(source.chapterNo)).length > 1;
    source.outputId = `ch-${String(source.chapterNo).padStart(2, '0').replace('.', '-')}${duplicate ? `-s${source.sourceId}` : ''}`;
  }
  invariant(new Set(sources.map(s => s.outputId)).size === sources.length, 'Output filename collision');
  return { root, novelId, novel, web, mobile, sourceDir, registry, characters, sources, stateDir: path.join(root, '.conversion', novelId) };
}

function sourceForChapter(ctx, chapter, receipt) {
  const matches = receipt ? ctx.sources.filter(s => s.sourceId === receipt.sourceId)
    : ctx.sources.filter(s => Number(s.chapterNo) === chapter.chapterNumber);
  invariant(matches.length === 1, `Missing/ambiguous source identity: ${ctx.novelId}/${chapter.id}`);
  return matches[0];
}

export function fingerprint(ctx, filename) {
  const chapter = readJson(path.join(ctx.web, 'chapters', filename));
  const source = sourceForChapter(ctx, chapter);
  return {
    web: fileHash(path.join(ctx.web, 'chapters', filename)),
    mobile: fileHash(path.join(ctx.mobile, 'chapters', filename)),
    sourceFile: source.file, source: source.sourceSha256,
    registryEntry: ctx.registry ? jsonHash(ctx.registry.chapters.find(e => String(e.chapterId) === source.sourceId)) : null,
    roster: jsonHash(ctx.characters), novelTitle: ctx.novel.title,
  };
}

export function imageAssets(ctx, source) {
  const parsed = parseSource(fs.readFileSync(source.sourcePath, 'utf8'));
  if (ctx.registry) invariant(same(parsed.tokens.filter(t => t.type === 'illustration').map(t => t.src), (source.images ?? []).map(i => decodeURIComponent(i.file))), 'Source image order/count does not match registry');
  const paths = {}, assets = [];
  for (const token of parsed.tokens.filter(t => t.type === 'illustration')) {
    invariant(!/^https?:/i.test(token.src), `External illustration is not available offline: ${token.id}`);
    const file = inside(ctx.sourceDir, token.src);
    invariant(fs.existsSync(file) && fs.statSync(file).isFile(), `Missing source image: ${token.src}`);
    const registered = source.images?.find(i => decodeURIComponent(i.file) === token.src);
    invariant(!ctx.registry || registered, `Image missing from source registry: ${token.src}`);
    const bytes = fs.readFileSync(file);
    invariant(bytes.length > 8 && (/^\xff\xd8\xff/.test(bytes.toString('latin1')) || bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || /^GIF8/.test(bytes.toString('ascii')) || (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') || bytes.toString('ascii', 4, 12).includes('ftypavi')), `Unrecognized image data: ${token.src}`);
    // Both readers resolve chapter image names under data/novels/<id>/illustrations/.
    // Prefix by stable source ID to avoid collisions between chapters.
    const filename = `${source.sourceId}-${path.basename(file)}`;
    const relative = `data/novels/${ctx.novelId}/illustrations/${filename}`;
    paths[token.src] = filename;
    assets.push({ source: token.src, path: relative, sha256: hash(bytes), file });
  }
  return { paths, assets };
}

export function checkIndex(directory, expectedFiles, allowAbsent = false) {
  if (!fs.existsSync(path.join(directory, 'index.ts'))) { invariant(allowAbsent && expectedFiles.length === 0, `Missing chapter index: ${directory}`); return; }
  const text = fs.readFileSync(path.join(directory, 'index.ts'), 'utf8');
  const imports = [...text.matchAll(/import\s+(\w+)\s+from\s+['"]\.\/([^'"]+\.json)['"]/g)];
  invariant(same(imports.map(m => m[2]).sort(), [...expectedFiles].sort()), `Index/file list mismatch: ${directory}`);
  const array = /export const \w+(?:\s*:\s*Chapter\[\])?\s*=\s*\[([\s\S]*?)\];/.exec(text);
  invariant(array, `Chapter index must export an explicit array: ${directory}`);
  const values = array[1].split(',').map(s => s.trim()).filter(Boolean).map(s => {
    invariant(/^\w+(?:\s+as\s+(?:unknown\s+as\s+)?Chapter)?$/.test(s), 'Unsupported chapter index entry');
    return s.split(/\s/)[0];
  });
  invariant(same([...values].sort(), imports.map(m => m[1]).sort()), `Index imports/exports differ: ${directory}`);
}

function writeIndex(ctx, app) {
  const directory = path.join(ctx[app], 'chapters');
  const files = chapterFiles(directory).sort((a, b) => {
    const aa = readJson(path.join(directory, a)), bb = readJson(path.join(directory, b));
    return aa.chapterNumber - bb.chapterNumber || aa.id.localeCompare(bb.id);
  });
  const name = ctx.novelId.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + 'Chapters';
  const text = files.map((f, i) => `import chapter${i} from './${f}';`).join('\n') +
    "\nimport type { Chapter } from '../../../../types';\n\n" +
    `export const ${name}: Chapter[] = [\n` + files.map((_, i) => `  chapter${i} as Chapter,`).join('\n') + '\n];\n';
  // Preserve the public export name already consumed by each novel module.
  const existing = fs.existsSync(path.join(directory, 'index.ts')) ? fs.readFileSync(path.join(directory, 'index.ts'), 'utf8') : '';
  const exportName = /export const (\w+)/.exec(existing)?.[1] ?? name;
  atomicWrite(path.join(directory, 'index.ts'), text.replace(`export const ${name}:`, `export const ${exportName}:`));
}

const receiptPath = (ctx, id) => path.join(ctx.stateDir, 'receipts', `${id}.json`);
const mapPath = (ctx, id) => path.join(ctx.stateDir, 'maps', `${id}.json`);
const entryHash = (ctx, source) => jsonHash(ctx.registry?.chapters.find(e => String(e.chapterId) === source.sourceId) ?? { file: source.file, chapterNo: source.chapterNo });
function metadata(ctx, source) {
  const parsed = parseSource(fs.readFileSync(source.sourcePath, 'utf8'));
  if (ctx.registry) {
    invariant(parsed.title === `Ch.${source.chapterNo} — ${source.chapterName}`, 'Source heading does not match registry title/number');
    for (const key of ['provider', 'publishedAt', 'url']) if (Object.hasOwn(source, key)) invariant((parsed.metadata[key] ?? null) === (source[key] ?? null), `Source ${key} does not match registry`);
  }
  return { id: source.outputId, novelId: ctx.novelId, chapterNumber: Number(source.chapterNo), title: parsed.title, novelTitle: ctx.novel.title };
}

export function prepare(ctx, { partial = false } = {}) {
  const file = path.join(ctx.stateDir, 'plan.json');
  const previous = fs.existsSync(file) ? readJson(file) : { entries: [] };
  invariant(!previous.novelId || previous.novelId === ctx.novelId, 'Wrong plan novel ID');
  const entries = ctx.sources.map(source => {
    const old = previous.entries.find(e => e.sourceId === source.sourceId);
    // An exclusion cannot silently survive a changed source.
    const excluded = old?.status === 'excluded' && old.sourceSha256 === source.sourceSha256;
    return { sourceId: source.sourceId, file: source.file, chapterNo: String(source.chapterNo), outputId: source.outputId,
      sourceSha256: source.sourceSha256, status: excluded ? 'excluded' : 'pending', ...(excluded ? { reason: old.reason } : {}) };
  });
  const plan = { version: 1, scope: partial ? 'partial' : 'whole-novel', novelId: ctx.novelId, sourceCount: ctx.sources.length, upstreamCount: ctx.registry?.totalChapters ?? ctx.sources.length, entries };
  writeJson(file, plan);
  for (const source of ctx.sources) {
    if (fs.existsSync(mapPath(ctx, source.sourceId))) continue;
    const tokens = parseSource(fs.readFileSync(source.sourcePath, 'utf8')).tokens.filter(t => t.type === 'text');
    writeJson(mapPath(ctx, source.sourceId), { sourceSha256: source.sourceSha256, tokens: tokens.map(t => ({ id: t.id, segments: [] })) });
  }
  return plan;
}

function validatePlan(ctx, plan) {
  invariant(plan.version === 1 && plan.novelId === ctx.novelId && ['whole-novel', 'partial'].includes(plan.scope), 'Invalid conversion plan');
  invariant(same(plan.entries.map(e => [e.sourceId, e.sourceSha256, e.outputId]), ctx.sources.map(s => [s.sourceId, s.sourceSha256, s.outputId])), 'Source inventory changed; run prepare again');
  invariant(plan.entries.every(e => ['pending', 'blocked', 'verified', 'excluded'].includes(e.status) && (e.status !== 'excluded' || e.reason?.trim())), 'Invalid plan status/exclusion reason');
}

export function checkCertified(ctx, filename, receipt) {
  invariant(receipt?.version === 1, `Missing conversion receipt: ${ctx.novelId}/${filename}`);
  const chapter = readJson(path.join(ctx.web, 'chapters', filename));
  const source = sourceForChapter(ctx, chapter, receipt);
  invariant(source.outputId === chapter.id && filename === `${chapter.id}.json`, 'Source identity/output ID differs');
  invariant(receipt.sourceSha256 === source.sourceSha256 && receipt.rosterSha256 === jsonHash(ctx.characters), 'Source or character roster changed; review mapping again');
  invariant(receipt.sourceEntrySha256 === entryHash(ctx, source), 'Source registry entry changed; review provenance again');
  const mapping = readJson(mapPath(ctx, source.sourceId));
  invariant(receipt.mappingSha256 === jsonHash(mapping), 'Mapping changed without conversion');
  const { paths, assets } = imageAssets(ctx, source);
  const rebuilt = buildChapter(fs.readFileSync(source.sourcePath, 'utf8'), mapping, ctx.characters, metadata(ctx, source), paths);
  invariant(same(chapter, rebuilt) && receipt.chapterSha256 === jsonHash(chapter), 'Output differs from reviewed source/mapping');
  invariant(same(chapter, readJson(path.join(ctx.mobile, 'chapters', filename))), 'Mobile chapter is missing or differs');
  invariant(same(receipt.assets, assets.map(({ source: s, path: p, sha256 }) => ({ source: s, path: p, sha256 }))), 'Source image fingerprint changed');
  for (const asset of assets) invariant(fileHash(inside(path.join(ctx.root, 'reader-web/src'), asset.path)) === asset.sha256, `Exported illustration differs/missing: ${asset.path}`);
  return source;
}

export function apply(ctx, selectedSourceId) {
  const planFile = path.join(ctx.stateDir, 'plan.json');
  const plan = fs.existsSync(planFile) ? readJson(planFile) : prepare(ctx);
  validatePlan(ctx, plan);
  if (selectedSourceId) invariant(ctx.sources.some(s => s.sourceId === selectedSourceId), 'Unknown source ID');
  for (const entry of plan.entries.filter(e => !selectedSourceId || e.sourceId === selectedSourceId)) {
    const source = ctx.sources.find(s => s.sourceId === entry.sourceId);
    if (entry.status === 'excluded') continue;
    try {
      const oldReceipt = receiptPath(ctx, source.outputId);
      if (fs.existsSync(oldReceipt)) {
        try { checkCertified(ctx, `${source.outputId}.json`, readJson(oldReceipt)); entry.status = 'verified'; delete entry.reason; continue; }
        catch { /* Rebuild from the current reviewed mapping, never from stale prose. */ }
      }
      const mapping = readJson(mapPath(ctx, source.sourceId));
      const { paths, assets } = imageAssets(ctx, source);
      const chapter = buildChapter(fs.readFileSync(source.sourcePath, 'utf8'), mapping, ctx.characters, metadata(ctx, source), paths);
      // Fully validate before the first mutation. Receipt is the final commit marker;
      // interrupted writes cannot pass the publication gate. Re-running repairs them.
      for (const asset of assets) atomicWrite(inside(path.join(ctx.root, 'reader-web/src'), asset.path), fs.readFileSync(asset.file));
      for (const app of ['web', 'mobile']) writeJson(path.join(ctx[app], 'chapters', `${source.outputId}.json`), chapter);
      writeIndex(ctx, 'web'); writeIndex(ctx, 'mobile');
      writeJson(oldReceipt, { version: 1, sourceId: source.sourceId, sourceSha256: source.sourceSha256,
        sourceEntrySha256: entryHash(ctx, source),
        rosterSha256: jsonHash(ctx.characters), mappingSha256: jsonHash(mapping), chapterSha256: jsonHash(chapter),
        assets: assets.map(({ source: s, path: p, sha256 }) => ({ source: s, path: p, sha256 })) });
      checkCertified(ctx, `${source.outputId}.json`, readJson(oldReceipt));
      entry.status = 'verified'; delete entry.reason;
    } catch (error) { entry.status = 'blocked'; entry.reason = error.message; }
    writeJson(planFile, plan);
  }
  writeJson(planFile, plan);
  return plan;
}

export function audit(root, { novelId, complete = false, baseline = true, baselineRef = root === repoRoot ? process.env.CONVERSION_BASE_REF : undefined } = {}) {
  const legacyFile = path.join(root, 'reader-web/scripts/conversion-legacy-baseline.json');
  if (root === repoRoot && baseline) invariant(fileHash(legacyFile) === legacyBaselineSha256, 'Frozen legacy baseline checksum differs; do not regenerate exceptions');
  if (baselineRef && !/^0+$/.test(baselineRef)) {
    invariant(/^[a-f0-9]{40}$/.test(baselineRef), 'Invalid baseline base commit');
    const relative = 'reader-web/scripts/conversion-legacy-baseline.json';
    const tracked = execFileSync('git', ['ls-tree', baselineRef, '--', relative], { cwd: root, encoding: 'utf8' });
    if (tracked.trim()) {
      const frozen = execFileSync('git', ['show', `${baselineRef}:${relative}`], { cwd: root });
      invariant(hash(frozen) === fileHash(legacyFile), 'Legacy baseline is frozen: do not add exceptions or regenerate it to bypass conversion checks');
    }
  }
  const legacy = baseline && fs.existsSync(legacyFile) ? readJson(legacyFile).chapters : {};
  const novels = readJson(path.join(root, 'reader-web/src/data/novels.json'));
  const result = { verified: 0, legacyUnverified: 0, pending: 0, excluded: 0, errors: [] };
  invariant(!novelId || novels.some(n => n.id === novelId), 'Unknown novel');
  for (const novel of novels.filter(n => !novelId || n.id === novelId)) {
    try {
      const ctx = context(root, novel.id), files = chapterFiles(path.join(ctx.web, 'chapters'));
      const planFile = path.join(ctx.stateDir, 'plan.json');
      const plan = fs.existsSync(planFile) ? readJson(planFile) : null;
      if (plan) validatePlan(ctx, plan);
      const requireComplete = complete || plan?.scope === 'whole-novel';
      const mobileFiles = chapterFiles(path.join(ctx.mobile, 'chapters'));
      checkIndex(path.join(ctx.web, 'chapters'), files);
      checkIndex(path.join(ctx.mobile, 'chapters'), mobileFiles, mobileFiles.length === 0);
      const covered = new Set();
      for (const filename of files) {
        try {
          const chapter = readJson(path.join(ctx.web, 'chapters', filename));
          validateStructure(chapter);
          invariant(chapter.novelId === ctx.novelId && filename === `${chapter.id}.json`, 'Chapter identity/filename mismatch');
          const snapshot = legacy[`${novel.id}/${filename}`];
          if (!requireComplete && snapshot && same(fingerprint(ctx, filename), snapshot)) {
            covered.add(sourceForChapter(ctx, chapter).sourceId); result.legacyUnverified++; continue;
          }
          const source = checkCertified(ctx, filename, fs.existsSync(receiptPath(ctx, chapter.id)) ? readJson(receiptPath(ctx, chapter.id)) : null);
          invariant(!covered.has(source.sourceId), 'Source appears in multiple output chapters');
          covered.add(source.sourceId); result.verified++;
        } catch (error) { result.errors.push(`${novel.id}/${filename}: ${error.message}`); }
      }
      invariant(mobileFiles.every(f => files.includes(f)), `Mobile contains extra unpublished chapters: ${novel.id}`);
      for (const source of ctx.sources.filter(s => !covered.has(s.sourceId))) {
        const excluded = plan?.entries.find(e => e.sourceId === source.sourceId && e.sourceSha256 === source.sourceSha256 && e.status === 'excluded' && e.reason?.trim());
        if (excluded) { result.excluded++; invariant(!files.includes(`${source.outputId}.json`), 'Excluded chapter has an output file'); }
        else { result.pending++; if (requireComplete) result.errors.push(`${novel.id}: source ${source.sourceId} has not passed conversion`); }
      }
      if (requireComplete) invariant(ctx.sources.length === (ctx.registry?.totalChapters ?? ctx.novel.totalOriginalChapters), 'Not all upstream source entries are stored');
    } catch (error) { result.errors.push(`${novel.id}: ${error.message}`); }
  }
  return result;
}

export async function runCLI(args = process.argv.slice(2), root = repoRoot) {
  const { positionals, values } = parseArgs({ args, allowPositionals: true, options: { novel: { type: 'string' }, 'source-id': { type: 'string' }, complete: { type: 'boolean' }, partial: { type: 'boolean' }, reason: { type: 'string' } } });
  const command = positionals[0];
  invariant(positionals.length === 1 && ['prepare', 'inspect', 'apply', 'status', 'audit', 'exclude'].includes(command), 'Use conversion <prepare|inspect|apply|status|audit|exclude> --novel <id> [--source-id <id>] [--complete]');
  if (command === 'audit') {
    invariant(!values.complete || values.novel, '--complete requires --novel');
    const report = audit(root, { novelId: values.novel, complete: values.complete });
    console.log(JSON.stringify(report, null, 2));
    invariant(report.errors.length === 0, 'Conversion publication gate failed'); return report;
  }
  const ctx = context(root, values.novel);
  if (command === 'prepare') { const plan = prepare(ctx, { partial: values.partial }); console.log(JSON.stringify(plan, null, 2)); return plan; }
  if (command === 'inspect') {
    const source = ctx.sources.find(s => s.sourceId === values['source-id']); invariant(source, 'inspect requires a known --source-id');
    const markdown = fs.readFileSync(source.sourcePath, 'utf8');
    const output = { sourceId: source.sourceId, sourceSha256: source.sourceSha256, ...parseSource(markdown) };
    console.log(JSON.stringify(output, null, 2)); return output;
  }
  if (command === 'exclude') {
    invariant(values.reason?.trim() && values['source-id'], 'exclude requires --source-id and --reason');
    const planFile = path.join(ctx.stateDir, 'plan.json'), plan = readJson(planFile);
    validatePlan(ctx, plan);
    const entry = plan.entries.find(e => e.sourceId === values['source-id']); invariant(entry, 'Unknown source ID');
    invariant(!fs.existsSync(path.join(ctx.web, 'chapters', `${entry.outputId}.json`)), 'Cannot exclude an already published chapter');
    entry.status = 'excluded'; entry.reason = values.reason; writeJson(planFile, plan); return plan;
  }
  if (command === 'apply') {
    const plan = apply(ctx, values['source-id']);
    console.log(JSON.stringify(plan, null, 2));
    invariant(!plan.entries.some(e => e.status === 'blocked'), 'Some chapters are blocked; existing verified checkpoints are preserved'); return plan;
  }
  const report = audit(root, { novelId: ctx.novelId });
  console.log(`Total raw chapters found: ${ctx.sources.length}\nVerified: ${report.verified}\nLegacy (unverified): ${report.legacyUnverified}\nPending: ${report.pending}\nExcluded: ${report.excluded}`);
  for (const error of report.errors) console.error(error);
  invariant(report.errors.length === 0, 'Chapter status has errors'); return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCLI().catch(error => { console.error(error.message); process.exitCode = 1; });
}
