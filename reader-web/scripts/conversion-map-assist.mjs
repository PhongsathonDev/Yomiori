#!/usr/bin/env node
/**
 * Mapping assistance for the mandatory conversion pipeline.
 *
 * The pipeline requires one reviewed span classification per source text token.
 * This helper only materialises the mechanical parts: it proposes spans at quote
 * boundaries, renders an annotated cue sheet for a human/AI reviewer, and applies
 * speaker decisions that the reviewer supplies. It never invents prose and never
 * chooses a speaker.
 *
 * node scripts/conversion-map-assist.mjs seed   --novel <id> [--source-id <id>] [--force]
 * node scripts/conversion-map-assist.mjs cue    --novel <id> [--source-id <id>]
 * node scripts/conversion-map-assist.mjs assign --novel <id> --source-id <id> --file <json>
 * node scripts/conversion-map-assist.mjs status --novel <id>
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { context, repoRoot } from './conversion-pipeline.mjs';
import { invariant, parseSource, readJson, writeJson } from './conversion-core.mjs';

const QUOTE_PAIRS = [
  { open: '「', close: '」', nested: true },
  { open: '"', close: '"', nested: false },
  { open: '“', close: '”', nested: false },
];

const needsReview = text => /[“”"「」『』]/.test(text) || /^'|'$|^[^:\n]{1,80}:\s/.test(text);

// Quote boundaries are the only structural signal used here. Whether a quoted
// span is speech, thought, a title or a sound effect is the reviewer's decision.
function proposeSpans(text, carried) {
  const spans = [];
  const push = (start, end, type) => {
    if (end <= start) return;
    const last = spans[spans.length - 1];
    if (last && last.type === type && last.end === start) last.end = end;
    else spans.push({ start, end, type });
  };
  let active = carried?.open ? QUOTE_PAIRS.find(pair => pair.open === carried.open) : null;
  let depth = carried?.depth ?? 0;
  let start = 0;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (!active) {
      const pair = QUOTE_PAIRS.find(candidate => candidate.open === char);
      if (!pair) continue;
      push(start, index, 'narration');
      active = pair; depth = 1; start = index;
      continue;
    }
    if (active.nested && char === active.open) depth++;
    else if (char === active.close) {
      depth--;
      if (depth === 0) { push(start, index + 1, 'dialogue'); active = null; start = index + 1; }
    }
  }
  push(start, text.length, active ? 'dialogue' : 'narration');
  if (spans.length === 0) spans.push({ start: 0, end: text.length, type: 'narration' });
  return { spans, carried: active ? { open: active.open, depth } : null };
}

function seedSource(ctx, source, force) {
  const mapPath = path.join(ctx.stateDir, 'maps', `${source.sourceId}.json`);
  const existing = fs.existsSync(mapPath) ? readJson(mapPath) : null;
  const empty = !existing || existing.tokens.every(token => !token.segments?.length);
  if (existing && !empty && !force) return { skipped: true };
  const markdown = fs.readFileSync(source.sourcePath, 'utf8');
  const parsed = parseSource(markdown);
  const tokens = [];
  let carried = {};
  for (const token of parsed.tokens.filter(t => t.type === 'text')) {
    const { spans, carried: next } = proposeSpans(token.text, carried);
    carried = next;
    tokens.push({
      id: token.id,
      segments: spans.map(span => {
        const segment = { start: span.start, end: span.end, type: span.type };
        if (span.type === 'dialogue') segment.speakerId = '';
        return segment;
      }),
    });
  }
  writeJson(mapPath, { sourceSha256: source.sourceSha256, tokens });
  return { mapPath, tokenCount: tokens.length };
}

function cueText(ctx, source) {
  const markdown = fs.readFileSync(source.sourcePath, 'utf8');
  const parsed = parseSource(markdown);
  const mapping = readJson(path.join(ctx.stateDir, 'maps', `${source.sourceId}.json`));
  const textTokens = parsed.tokens.filter(t => t.type === 'text');
  const byId = new Map(mapping.tokens.map(entry => [entry.id, entry]));
  const lines = [`# ${source.sourceId} — Ch.${source.chapterNo} — ${parsed.title}`, '', `file: ${source.file}`, ''];
  for (const token of parsed.tokens) {
    if (token.type === 'illustration') { lines.push(`[${token.id}] (illustration ${token.src})`); continue; }
    if (token.type === 'scene_break') { lines.push(`[${token.id}] (scene break)`); continue; }
    const entry = byId.get(token.id);
    let cursor = 0;
    const pieces = [];
    for (const [i, segment] of entry.segments.entries()) {
      const chunk = token.text.slice(segment.start, segment.end);
      const marker = segment.type === 'dialogue'
        ? (segment.speakerId ? `D:${segment.speakerId}` : 'DIALOGUE?')
        : (needsReview(chunk) ? 'NARR-REVIEW?' : 'NARR');
      pieces.push(`⟨${i + 1} ${marker}⟩${chunk}`);
      cursor = segment.end;
    }
    invariant(cursor === token.text.length, `Bad seed span in ${source.sourceId}/${token.id}`);
    lines.push(`[${token.id}] ${pieces.join('')}`);
  }
  const index = textTokens.length;
  lines.push('', `# ${index} text tokens; every DIALOGUE? span needs a speaker, every NARR-REVIEW? span needs a reason.`);
  return lines.join('\n') + '\n';
}

function ledger(ctx, source) {
  const markdown = fs.readFileSync(source.sourcePath, 'utf8');
  const parsed = parseSource(markdown);
  const mapping = readJson(path.join(ctx.stateDir, 'maps', `${source.sourceId}.json`));
  const byId = new Map(parsed.tokens.map(token => [token.id, token]));
  const roster = new Map(ctx.characters.map(c => [c.id, c.name]));
  const lines = [`# ${source.sourceId} — Ch.${source.chapterNo} — ${parsed.title}`, `file: ${source.file}`, ''];
  for (const token of mapping.tokens) {
    const segments = [...token.segments].sort((a, b) => a.start - b.start);
    for (const [i, segment] of segments.entries()) {
      const key = segments.length === 1 ? token.id : `${token.id}#${i + 1}`;
      const text = byId.get(token.id).text.slice(segment.start, segment.end).replace(/\s+/g, ' ');
      if (segment.type === 'dialogue') {
        lines.push(`${key} | ${roster.get(segment.speakerId) ?? '??'} | ${text.length > 140 ? `${text.slice(0, 140)}…` : text}`);
      } else if (segment.review) {
        lines.push(`${key} | NARR | ${text.length > 100 ? `${text.slice(0, 100)}…` : text}`);
      }
    }
  }
  return lines.join('\n') + '\n';
}

function renderCues(ctx, source) {
  const file = path.join(ctx.stateDir, 'cues', `${source.sourceId}.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, cueText(ctx, source));
  return file;
}

function applyAssignments(ctx, source, assignments) {
  const mapPath = path.join(ctx.stateDir, 'maps', `${source.sourceId}.json`);
  const mapping = readJson(mapPath);
  invariant(mapping.sourceSha256 === source.sourceSha256, `Stale map for ${source.sourceId}`);
  const markdown = fs.readFileSync(source.sourcePath, 'utf8');
  const parsed = parseSource(markdown);
  const textTokens = parsed.tokens.filter(t => t.type === 'text');
  const byId = new Map(mapping.tokens.map(entry => [entry.id, entry]));
  const roster = new Map(ctx.characters.map(c => [c.id, c.name]));
  const tokenIds = textTokens.map(t => t.id);
  const used = new Set();
  const errors = [];
  for (const token of textTokens) {
    const entry = byId.get(token.id);
    const reshape = assignments[token.id]?.segments;
    if (Array.isArray(reshape)) {
      const rebuilt = [];
      let cursor = 0;
      for (const [i, spec] of reshape.entries()) {
        const key = `${token.id}#${i + 1}`;
        if (!Number.isInteger(spec.start) || spec.start !== cursor || !Number.isInteger(spec.end) || spec.end <= cursor || spec.end > token.text.length) {
          errors.push(`${key}: invalid reshaped span`); break;
        }
        if (!['narration', 'dialogue'].includes(spec.type)) { errors.push(`${key}: invalid reshaped type`); break; }
        const chunk = token.text.slice(spec.start, spec.end);
        const segment = { start: spec.start, end: spec.end, type: spec.type };
        if (spec.type === 'dialogue') {
          if (!roster.has(spec.speakerId)) { errors.push(`${key}: unknown speaker in reshaped span`); break; }
          segment.speakerId = spec.speakerId;
        }
        if (spec.type === 'dialogue' || needsReview(chunk)) {
          const contextIds = Array.isArray(spec.context) && spec.context.length ? spec.context : [token.id];
          for (const id of contextIds) if (!tokenIds.includes(id)) errors.push(`${key}: unknown context token ${id}`);
          segment.review = {
            confirmed: true,
            context: contextIds,
            reason: spec.reason?.trim() || `ตรวจบริบท ${contextIds.join(', ')} แล้ว จัดประเภทเป็น${spec.type === 'dialogue' ? `คำพูดของ${roster.get(spec.speakerId)}` : 'ข้อความบรรยาย'}`,
          };
        }
        rebuilt.push(segment);
        used.add(key);
        cursor = spec.end;
      }
      if (cursor !== token.text.length) errors.push(`${token.id}: reshaped spans do not cover the token`);
      entry.segments = rebuilt;
      continue;
    }
    const ordered = [...entry.segments].sort((a, b) => a.start - b.start);
    for (const [i, segment] of ordered.entries()) {
      const key = ordered.length === 1 ? token.id : `${token.id}#${i + 1}`;
      const decision = assignments[key] ?? (ordered.length === 1 ? assignments[`${token.id}#1`] : undefined);
      const chunk = token.text.slice(segment.start, segment.end);
      const explicit = typeof decision === 'string' ? { speakerId: decision } : decision;
      if (segment.type === 'dialogue') {
        if (explicit?.type === 'narration') {
          segment.type = 'narration';
        } else {
          const speakerId = explicit?.speakerId;
          if (!speakerId || !roster.has(speakerId)) { errors.push(`${key}: missing/unknown speaker for ${JSON.stringify(chunk)}`); continue; }
          segment.type = 'dialogue';
          segment.speakerId = speakerId;
        }
        used.add(key);
      } else if (needsReview(chunk)) {
        if (explicit?.type === 'dialogue') {
          if (!explicit.speakerId || !roster.has(explicit.speakerId)) { errors.push(`${key}: reclassified dialogue lacks a known speaker`); continue; }
          segment.type = 'dialogue';
          segment.speakerId = explicit.speakerId;
        } else if (explicit?.type === 'narration') {
          segment.type = 'narration';
        } else {
          errors.push(`${key}: quoted narration needs an explicit type decision (${JSON.stringify(chunk.slice(0, 40))})`);
          continue;
        }
        used.add(key);
      }
      delete segment.review;
      if (segment.type === 'dialogue' || needsReview(chunk)) {
        const contextIds = Array.isArray(explicit?.context) && explicit.context.length ? explicit.context : [token.id];
        for (const id of contextIds) if (!tokenIds.includes(id)) errors.push(`${key}: unknown context token ${id}`);
        const name = segment.type === 'dialogue' ? roster.get(segment.speakerId) : 'ข้อความบรรยาย';
        segment.review = {
          confirmed: true,
          context: contextIds,
          reason: explicit?.reason?.trim() || `ตรวจบริบท ${contextIds.join(', ')} แล้ว จัดประเภทเป็น${segment.type === 'dialogue' ? `คำพูดของ${name}` : 'ข้อความบรรยาย'}`,
        };
      }
      if (segment.type !== 'dialogue') delete segment.speakerId;
    }
    entry.segments = ordered;
  }
  for (const key of Object.keys(assignments)) {
    const base = key.split('#')[0];
    if (!tokenIds.includes(base)) { errors.push(`${key}: token does not exist`); continue; }
  }
  if (errors.length) throw new Error(`Assignments for ${source.sourceId} are incomplete:\n  ${errors.join('\n  ')}`);
  writeJson(mapPath, mapping);
  return used.size;
}

function status(ctx, onlySourceId) {
  const rows = (onlySourceId ? ctx.sources.filter(source => source.sourceId === onlySourceId) : ctx.sources).map(source => {
    const mapPath = path.join(ctx.stateDir, 'maps', `${source.sourceId}.json`);
    if (!fs.existsSync(mapPath)) return `${source.chapterNo}\t${source.sourceId}\tmissing-map`;
    const mapping = readJson(mapPath);
    if (mapping.tokens.every(token => !token.segments?.length)) return `${source.chapterNo}\t${source.sourceId}\tempty-map`;
    const parsed = parseSource(fs.readFileSync(source.sourcePath, 'utf8'));
    const byId = new Map(parsed.tokens.map(token => [token.id, token]));
    let dialogue = 0, unresolved = 0, reviewPending = 0;
    for (const token of mapping.tokens) for (const segment of token.segments) {
      if (segment.type === 'dialogue') { dialogue++; if (!segment.speakerId) unresolved++; }
      if (segment.type === 'narration' && !segment.review) {
        const chunk = byId.get(token.id).text.slice(segment.start, segment.end);
        if (needsReview(chunk)) reviewPending++;
      }
    }
    return `${source.chapterNo}\t${source.sourceId}\t${unresolved || reviewPending ? 'pending' : 'ready'}\tdialogue=${dialogue}\tunresolved=${unresolved}\treviewPending=${reviewPending}`;
  });
  console.log(rows.join('\n'));
}

function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2), allowPositionals: true,
    options: {
      novel: { type: 'string' }, 'source-id': { type: 'string' },
      file: { type: 'string' }, force: { type: 'boolean' }, all: { type: 'boolean' },
    },
  });
  invariant(positionals.length === 1 && ['seed', 'cue', 'ledger', 'assign', 'status'].includes(positionals[0]), 'Use conversion-map-assist <seed|cue|review|assign|status>');
  invariant(values.novel, '--novel is required');
  const ctx = context(repoRoot, values.novel);
  const command = positionals[0];
  const sources = values['source-id'] ? ctx.sources.filter(s => s.sourceId === values['source-id']) : ctx.sources;
  invariant(sources.length, 'No matching source');
  if (command === 'seed') {
    let seeded = 0, skipped = 0;
    for (const source of sources) {
      const result = seedSource(ctx, source, Boolean(values.force));
      if (result.skipped) skipped++; else seeded++;
    }
    console.log(`seeded ${seeded}, skipped ${skipped}`);
  } else if (command === 'cue') {
    for (const source of sources) console.log(renderCues(ctx, source));
  } else if (command === 'ledger') {
    for (const source of sources) {
      const file = path.join(ctx.stateDir, 'ledgers', `${source.sourceId}.md`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, ledger(ctx, source));
      console.log(file);
    }
  } else if (command === 'assign') {
    invariant(values['source-id'] && values.file, 'assign needs --source-id and --file');
    const assignments = readJson(path.resolve(values.file));
    const count = applyAssignments(ctx, ctx.sources.find(s => s.sourceId === values['source-id']), assignments);
    console.log(`applied ${count} reviewed segments to ${values['source-id']}`);
  } else {
    status(ctx, values['source-id']);
  }
}

try { main(); } catch (error) { console.error(`FAILED: ${error.message}`); process.exitCode = 1; }
