import fs from 'node:fs';
import path from 'node:path';
import { parseSource, hash, jsonHash } from '/data/data/com.termux/files/home/Yomiori/reader-web/scripts/conversion-core.mjs';

const root = '/data/data/com.termux/files/home/Yomiori';
const conv = path.join(root, '.conversion/netori-mahoutsukai-no-bouken');
const roster = JSON.parse(fs.readFileSync(path.join(root, 'reader-web/src/data/novels/netori-mahoutsukai-no-bouken/characters.json'), 'utf8'));
const rosterIds = new Set(roster.map(c => c.id));
const plan = JSON.parse(fs.readFileSync(path.join(conv, 'plan.json'), 'utf8'));
const entries = new Map(plan.entries.map(e => [e.sourceId, e]));

const ids = ['187287', '187424', '187426', '187583', '187584', '187862'];
const out = {};
for (const id of ids) {
  const problems = [];
  const map = JSON.parse(fs.readFileSync(path.join(conv, 'maps', `${id}.json`), 'utf8'));
  const e = entries.get(id);
  if (!e) { problems.push('no plan entry'); continue; }
  const rel = e.file;
  const md = fs.readFileSync(path.join(root, 'novels_source/netori-mahoutsukai-no-bouken', rel), 'utf8');
  const parsed = parseSource(md);
  if (map.sourceSha256 !== hash(md)) problems.push(`sourceSha256 mismatch: map=${map.sourceSha256} actual=${hash(md)}`);
  const textTokens = parsed.tokens.filter(t => t.type === 'text');
  const mapById = new Map(map.tokens.map(t => [t.id, t]));
  if (map.tokens.length !== textTokens.length) problems.push(`token count ${map.tokens.length} vs ${textTokens.length}`);
  if (mapById.size !== map.tokens.length) problems.push('duplicate map token ids');
  const dialogue = [];
  for (const tok of textTokens) {
    const entry = mapById.get(tok.id);
    if (!entry) { problems.push(`missing token ${tok.id}`); continue; }
    let cursor = 0;
    if (!Array.isArray(entry.segments) || !entry.segments.length) { problems.push(`no segments ${tok.id}`); continue; }
    for (const sp of entry.segments) {
      if (!Number.isInteger(sp.start) || !Number.isInteger(sp.end) || sp.start !== cursor || sp.end <= cursor || sp.end > tok.text.length) {
        problems.push(`bad span ${tok.id} ${JSON.stringify(sp)} len=${tok.text.length}`);
      }
      if (!['narration', 'dialogue'].includes(sp.type)) problems.push(`bad type ${tok.id}`);
      if (Object.hasOwn(sp, 'text')) problems.push(`text field in ${tok.id}`);
      const segText = tok.text.slice(sp.start, sp.end);
      if (sp.type === 'dialogue' || sp.review || /[“”"「」『』]/.test(segText) || /^'|'$|^[^:\n]{1,80}:\s/.test(segText)) {
        const r = sp.review;
        if (!(r && r.confirmed === true && typeof r.reason === 'string' && r.reason.trim() && Array.isArray(r.context) && r.context.length && r.context.every(c => parsed.tokens.some(t => t.id === c)))) {
          problems.push(`missing review ${tok.id}`);
        } else {
          const badctx = r.context.filter(c => !parsed.tokens.some(t => t.id === c));
          if (badctx.length) problems.push(`bad ctx ${tok.id}: ${badctx}`);
        }
      }
      if (sp.type === 'dialogue') {
        if (!rosterIds.has(sp.speakerId)) problems.push(`speaker not in roster ${tok.id}: ${sp.speakerId}`);
        dialogue.push({ tokenId: tok.id, speaker: sp.speakerId, text: segText, len: segText.length });
      } else if (sp.review) {
        dialogue.push({ tokenId: tok.id, speaker: 'NARRATION(review)', text: segText });
      }
      cursor = sp.end;
    }
    if (cursor !== tok.text.length) problems.push(`uncovered end ${tok.id} ${cursor}/${tok.text.length}`);
  }
  // extra mapped ids
  for (const t of map.tokens) if (!parsed.tokens.some(x => x.id === t.id)) problems.push(`unrecognized map token ${t.id}`);
  out[id] = { chapterNo: e.chapterNo, file: rel, hash: jsonHash(map), problems, dialogue };
}
fs.writeFileSync(path.join(conv, 'reports/.b33-inspect.json'), JSON.stringify(out, null, 2));
for (const id of ids) {
  const o = out[id];
  console.log(`--- ${id} ch.${o.chapterNo} hash=${o.hash}`);
  console.log('problems:', o.problems.length ? o.problems : 'none');
  for (const d of o.dialogue ?? []) console.log(`  ${d.tokenId} [${d.speaker}] ${d.text}`);
}
