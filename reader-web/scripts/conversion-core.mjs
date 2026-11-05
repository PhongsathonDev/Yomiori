import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
export const fileHash = file => fs.existsSync(file) ? hash(fs.readFileSync(file)) : null;
export const jsonHash = value => hash(JSON.stringify(value));
export const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value);
export function invariant(ok, message) { if (!ok) throw new Error(message); }
export function inside(root, relative) {
  invariant(typeof relative === 'string' && relative.length > 0 && !relative.includes('\\'), 'Invalid relative path');
  const result = path.resolve(root, relative);
  invariant(result.startsWith(path.resolve(root) + path.sep), `Path escapes its directory: ${relative}`);
  if (fs.existsSync(result)) {
    invariant(fs.realpathSync(result).startsWith(fs.realpathSync(root) + path.sep), `Symlink escapes its directory: ${relative}`);
  }
  return result;
}
export function atomicWrite(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  try { fs.writeFileSync(temp, contents); fs.renameSync(temp, file); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
export const writeJson = (file, value) => atomicWrite(file, JSON.stringify(value, null, 2) + '\n');

// Only consume a leading, recognized metadata preamble. Never strip headings,
// Source:/By: lines or punctuation from the actual story body.
export function parseSource(markdown) {
  const lines = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
  const heading = lines[0]?.match(/^#\s+(Ch[._](\d+(?:\.\d+)?)(?:\s|_|[—–-]).*)$/i);
  invariant(heading, 'Source must start with a numbered chapter heading');
  let i = 1;
  let duplicateSeen = false;
  const preamble = new Set();
  const metadata = {};
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (!duplicateSeen && line === heading[1]) { duplicateSeen = true; i++; continue; }
    const key = /^(By\s|Published:\s|Source:\s|AI-POWERED\b)/.exec(line)?.[1];
    if (key && !preamble.has(key)) {
      preamble.add(key); i++;
      if (key.startsWith('By')) metadata.provider = line.replace(/^By\s+/, '');
      if (key.startsWith('Published:')) metadata.publishedAt = line.replace(/^Published:\s+/, '');
      if (key.startsWith('Source:')) metadata.url = line.replace(/^Source:\s+/, '');
      if (key.startsWith('Source:')) break;
      continue;
    }
    break;
  }
  const body = lines.slice(i).join('\n').trim();
  invariant(body.length > 0, 'Source body is empty');
  const tokens = [];
  body.split(/\n[\t ]*\n+/).forEach((paragraph, p) => {
    const text = paragraph.trim();
    if (!text) return;
    const add = (type, value) => tokens.push({ id: `p${p + 1}-${tokens.filter(t => t.paragraph === p + 1).length + 1}`, paragraph: p + 1, type, ...value });
    if (/^(?:[-—–_*◆❖•]\s*){3,}$/.test(text)) { add('scene_break', { symbol: text }); return; }
    const images = [...text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
    let cursor = 0;
    for (const match of images) {
      if (match.index > cursor) add('text', { text: text.slice(cursor, match.index) });
      add('illustration', { alt: match[1], src: decodeURIComponent(match[2]) });
      cursor = match.index + match[0].length;
    }
    if (cursor < text.length) add('text', { text: text.slice(cursor) });
  });
  return { chapterNumber: Number(heading[2]), title: heading[1], metadata, tokens };
}

export function validateRoster(characters) {
  invariant(Array.isArray(characters), 'Character roster must be an array');
  const ids = new Set();
  for (const c of characters) {
    invariant(safeId(c.id) && c.id !== 'unknown' && !ids.has(c.id), 'Invalid/duplicate character ID');
    ids.add(c.id);
    for (const key of ['name', 'role', 'color']) invariant(typeof c[key] === 'string' && c[key].trim(), `Character ${c.id} lacks ${key}`);
    if (c.aliases !== undefined) invariant(Array.isArray(c.aliases) && c.aliases.every(a => typeof a === 'string'), 'Invalid aliases');
  }
}

export function validateStructure(chapter, characters) {
  invariant(chapter && typeof chapter === 'object', 'Chapter must be an object');
  invariant(safeId(chapter.id) && safeId(chapter.novelId), 'Invalid chapter/novel ID');
  invariant(Number.isFinite(chapter.chapterNumber) && chapter.chapterNumber >= 0, 'Invalid chapter number');
  for (const key of ['title', 'novelTitle']) invariant(typeof chapter[key] === 'string' && chapter[key].trim(), `Missing ${key}`);
  invariant(Array.isArray(chapter.blocks) && chapter.blocks.length > 0, 'Chapter has no blocks');
  const ids = new Set();
  const roster = characters && new Map(characters.map(c => [c.id, c.name]));
  for (const b of chapter.blocks) {
    invariant(b && typeof b.id === 'string' && b.id.trim() && !ids.has(b.id), 'Missing/duplicate block ID');
    ids.add(b.id);
    invariant(['narration', 'dialogue', 'scene_break', 'illustration'].includes(b.type), `Invalid block type: ${b.type}`);
    if (b.type === 'narration' || b.type === 'dialogue') invariant(typeof b.text === 'string' && b.text.length, `Empty text in ${b.id}`);
    if (b.type === 'dialogue') {
      invariant(safeId(b.speakerId) && b.speakerId !== 'unknown' && typeof b.speakerName === 'string' && b.speakerName.trim(), `Unresolved speaker in ${b.id}`);
      if (roster) invariant(roster.get(b.speakerId) === b.speakerName, `Speaker ID/name not in roster: ${b.id}`);
      if (b.emotion !== undefined) invariant(['neutral', 'happy', 'shy', 'surprised', 'tired', 'playful'].includes(b.emotion), 'Invalid emotion');
    }
    if (b.type === 'scene_break' && b.symbol !== undefined) invariant(typeof b.symbol === 'string', 'Invalid scene break');
    if (b.type === 'illustration') {
      invariant(typeof b.src === 'string' && b.src.length, 'Missing illustration path');
      for (const key of ['alt', 'caption']) if (b[key] !== undefined) invariant(typeof b[key] === 'string', `Invalid illustration ${key}`);
      if (b.aspectRatio !== undefined) invariant(Number.isFinite(b.aspectRatio) && b.aspectRatio > 0, 'Invalid illustration aspect ratio');
    }
  }
}

export function verifyContent(markdown, chapter, options = {}) {
  const source = parseSource(markdown);
  invariant(!chapter?.blocks?.some(b => b.type === 'dialogue') || options.characters, 'A character roster is required to verify dialogue');
  validateStructure(chapter, options.characters);
  invariant(chapter.chapterNumber === source.chapterNumber && chapter.title === source.title, 'Chapter number/title does not match the source heading');
  const expected = options.expected ?? {};
  for (const [key, value] of Object.entries(expected)) invariant(chapter[key] === value, `Chapter ${key} does not match source/catalog`);
  let tokenIndex = 0, offset = 0;
  for (const block of chapter.blocks) {
    const token = source.tokens[tokenIndex];
    invariant(token, 'Extra block after the end of the source');
    if (token.type === 'text') {
      invariant(['narration', 'dialogue'].includes(block.type), `Wrong block type at ${token.id}`);
      invariant(token.text.slice(offset, offset + block.text.length) === block.text, `Text/order/paragraph mismatch at ${token.id}:${offset}`);
      offset += block.text.length;
      if (offset === token.text.length) { tokenIndex++; offset = 0; }
    } else {
      invariant(block.type === token.type, `Image/scene order mismatch at ${token.id}`);
      if (token.type === 'illustration') invariant(block.src === (options.imagePaths?.[token.src] ?? token.src), `Illustration mismatch at ${token.id}`);
      else invariant(block.symbol === token.symbol, `Scene separator mismatch at ${token.id}`);
      tokenIndex++;
    }
  }
  invariant(tokenIndex === source.tokens.length && offset === 0, 'Source ends with missing text, image or scene separator');
  return source;
}

// AI supplies spans/classifications only. The prose always comes from the source.
export function buildChapter(markdown, mapping, characters, metadata, imagePaths = {}) {
  invariant(mapping.sourceSha256 === hash(markdown), 'Stale mapping: source hash changed');
  validateRoster(characters);
  const roster = new Map(characters.map(c => [c.id, c]));
  const parsed = parseSource(markdown);
  const textTokens = parsed.tokens.filter(t => t.type === 'text');
  invariant(Array.isArray(mapping.tokens) && mapping.tokens.length === textTokens.length, 'Every text token needs exactly one mapping');
  const tokens = new Map(mapping.tokens.map(t => [t.id, t]));
  invariant(tokens.size === mapping.tokens.length && textTokens.every(t => tokens.has(t.id)), 'Missing/duplicate/unrecognized mapped token');
  const blocks = [];
  for (const token of parsed.tokens) {
    if (token.type !== 'text') {
      blocks.push(token.type === 'illustration' ? { id: `b${blocks.length + 1}`, type: 'illustration', src: imagePaths[token.src] ?? token.src, alt: token.alt }
        : { id: `b${blocks.length + 1}`, type: 'scene_break', symbol: token.symbol });
      continue;
    }
    const entry = tokens.get(token.id);
    invariant(Array.isArray(entry.segments) && entry.segments.length, `Unreviewed token: ${token.id}`);
    let cursor = 0;
    for (const span of entry.segments) {
      invariant(Number.isInteger(span.start) && Number.isInteger(span.end) && span.start === cursor && span.end > cursor && span.end <= token.text.length, `Gap/overlap/invalid span in ${token.id}`);
      invariant(['narration', 'dialogue'].includes(span.type), 'AI may classify only text spans');
      invariant(!Object.hasOwn(span, 'text'), 'AI must not supply replacement prose');
      const block = { id: `b${blocks.length + 1}`, type: span.type, text: token.text.slice(span.start, span.end) };
      // Do not split a UTF-16 surrogate pair.
      invariant(!/[\uD800-\uDBFF]$/.test(block.text) && !/^[\uDC00-\uDFFF]/.test(block.text), 'Span splits a Unicode character');
      if (span.type === 'dialogue' || span.review || /[“”"「」『』]/.test(block.text) || /^'|'$|^[^:\n]{1,80}:\s/.test(block.text)) {
        const review = span.review;
        invariant(review?.confirmed === true && typeof review.reason === 'string' && review.reason.trim() && Array.isArray(review.context) && review.context.length && review.context.every(id => parsed.tokens.some(t => t.id === id)), `Missing contextual dialogue/classification review in ${token.id}`);
      }
      if (span.type === 'dialogue') {
        const c = roster.get(span.speakerId);
        invariant(c && span.speakerId !== 'unknown', `Unresolved speaker in ${token.id}`);
        block.speakerId = c.id; block.speakerName = c.name;
      }
      blocks.push(block); cursor = span.end;
    }
    invariant(cursor === token.text.length, `Uncovered end of ${token.id}`);
  }
  const chapter = { ...metadata, blocks };
  verifyContent(markdown, chapter, { characters, expected: metadata, imagePaths });
  return chapter;
}
