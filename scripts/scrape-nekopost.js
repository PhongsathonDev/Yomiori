#!/usr/bin/env node
/**
 * Store Nekopost sources using novels_source/README.md.
 * node scripts/scrape-nekopost.js <projectId> <slug> [--only=1,2,3] [--force]
 * Existing chapters and image mappings are preserved unless explicitly refreshed.
 */
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'https://www.nekopost.net';
const UA = 'Yomiori-source-importer/1.0';
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function chapterNumber(value) {
  const text = String(value);
  if (!/^\d+(?:\.\d+)?$/.test(text) || !Number.isFinite(Number(text))) {
    throw new Error(`Invalid chapter number: ${text}`);
  }
  return text;
}

function parseArgs(args) {
  const positional = args.filter((arg) => !arg.startsWith('--'));
  const flags = args.filter((arg) => arg.startsWith('--'));
  if (positional.length !== 2 || !/^[1-9]\d*$/.test(positional[0])) {
    throw new Error('Usage: node scripts/scrape-nekopost.js <projectId> <slug> [--only=1,2,3] [--force]');
  }
  const [id, slug] = positional;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !Number.isSafeInteger(Number(id))) {
    throw new Error('Use a safe numeric projectId and a lowercase kebab-case slug.');
  }
  if (flags.some((flag) => flag !== '--force' && !flag.startsWith('--only=')) ||
      flags.filter((flag) => flag.startsWith('--only=')).length > 1) {
    throw new Error('Unknown or repeated option. Supported: --only=1,2,3 and --force');
  }
  const onlyFlag = flags.find((flag) => flag.startsWith('--only='));
  const only = onlyFlag === undefined ? null : onlyFlag.slice(7).split(',').map((n) => chapterNumber(n.trim()));
  return { projectId: Number(id), slug, only, force: flags.includes('--force') };
}

function deriveKey(pass, salt) {
  let derived = Buffer.alloc(0);
  let prev = Buffer.alloc(0);
  const passBytes = Buffer.concat([Buffer.from(pass, 'utf8'), salt]);
  while (derived.length < 48) {
    prev = crypto.createHash('md5').update(Buffer.concat([prev, passBytes])).digest();
    derived = Buffer.concat([derived, prev]);
  }
  return { key: derived.subarray(0, 32), iv: derived.subarray(32, 48) };
}

function decrypt(cipherB64) {
  const raw = Buffer.from(cipherB64.trim(), 'base64');
  if (raw.subarray(0, 8).toString('latin1') !== 'Salted__') throw new Error('Unexpected ciphertext header');
  const { key, iv } = deriveKey('AeyTest', raw.subarray(8, 16));
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(raw.subarray(16)), decipher.final()]).toString('utf8');
}

function decodeEntities(text) {
  const entities = { nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>', amp: '&', hellip: '…', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”' };
  // One pass: &amp;lt; must remain &lt;, not become <.
  return String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] !== '#') return own(entities, entity) ? entities[entity] : match;
    const value = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff)
      ? String.fromCodePoint(value) : match;
  });
}

function htmlToLines(html) {
  return decodeEntities(html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<hr\b[^>]*>/gi, '\n\n---\n\n')
    .replace(/<\/?(?:div|p|h[1-6]|li|blockquote|tr)\b[^>]*>/gi, '\n')
    .replace(/<\/(?:td|th)\s*>/gi, '\t')
    .replace(/<[^>]+>/g, ''))
    .replace(/\u00a0/g, ' ')
    .split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function sanitizeFileName(name, max = 90, maxBytes = 190) {
  const clean = String(name || '').replace(/[\u0000-\u001f]/g, ' ')
    .replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
  let out = '';
  for (const character of clean) {
    if (out.length + character.length > max || Buffer.byteLength(out + character, 'utf8') > maxBytes) break;
    out += character;
  }
  return out.replace(/[. ]+$/, '');
}

function chapterFileName(chapter) {
  const no = chapterNumber(chapter.ChapterNo).padStart(2, '0');
  const title = sanitizeFileName(chapter.ChapterName);
  if (!title) throw new Error(`Chapter ${no} has no usable title`);
  const file = `Ch_${no}_${title}.md`;
  if (Buffer.byteLength(file, 'utf8') > 200) throw new Error(`Filename exceeds 200 bytes: ${file}`);
  return file;
}

function imageTags(html) {
  return [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => {
    const src = match[0].match(/\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!src) throw new Error('Image without src; inspect the source before importing.');
    return { tag: match[0], source: decodeEntities(src[1] ?? src[2] ?? src[3]) };
  });
}

function renderChapter(chapter, html, images) {
  const title = `Ch.${chapter.ChapterNo} — ${chapter.ChapterName}`;
  const header = [`# ${title}`, '', title, ''];
  if (chapter.ProviderName) header.push(`By ${chapter.ProviderName}`, '');
  if (chapter.PublishDate?.String) header.push(`Published: ${chapter.PublishDate.String}`, '');
  header.push(`Source: ${chapter.url}`, '');
  const tags = imageTags(html);
  if (tags.length !== images.length) throw new Error('Image mapping does not match chapter content');
  let index = 0;
  const body = html.replace(/<img\b[^>]*>/gi, () => {
    const image = images[index++];
    return `\n\n![Illustration](${image.file})\n\n`;
  });
  const paragraphs = htmlToLines(body);
  // Do not guess whether the first paragraph is a duplicate title: it may be prose.
  if (!paragraphs.length) throw new Error(`Empty chapter body: ${chapter.ChapterNo}`);
  return [...header, paragraphs.join('\n\n')].join('\n') + '\n';
}

function atomicWrite(file, contents) {
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, contents);
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

function localFile(root, file, prefix = '') {
  if (typeof file !== 'string' || file.includes('\\') || path.posix.isAbsolute(file) ||
      file.split('/').some((part) => !part || part === '..' || part === '.') ||
      /[:\u0000-\u001f]/.test(file) || (prefix && !file.startsWith(prefix))) {
    throw new Error(`Unsafe source file path: ${file}`);
  }
  return path.join(root, ...file.split('/'));
}

function readExisting(root, projectId) {
  const file = path.join(root, '_source.json');
  if (!fs.existsSync(file)) return null;
  const source = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (source.source !== 'nekopost' || Number(source.projectId) !== projectId || !Array.isArray(source.chapters)) {
    throw new Error('Existing source belongs to another project or has an invalid chapter registry.');
  }
  const ids = new Set();
  const numbers = new Set();
  const files = new Set();
  for (const chapter of source.chapters) {
    const no = Number(chapterNumber(chapter.chapterNo));
    if (!chapter.chapterId || ids.has(String(chapter.chapterId)) || numbers.has(no) || files.has(chapter.file)) {
      throw new Error('Duplicate or invalid chapter in existing source registry.');
    }
    if (typeof chapter.file !== 'string' || chapter.file.includes('/')) throw new Error('Expected chapter filename only');
    localFile(root, chapter.file);
    if (!Array.isArray(chapter.images)) throw new Error('Existing chapter has no image registry');
    for (const image of chapter.images) localFile(root, image.file, 'illustrations/');
    ids.add(String(chapter.chapterId)); numbers.add(no); files.add(chapter.file);
  }
  return source;
}

function markdownLink(file) {
  return file.split('/').map((part) => encodeURIComponent(part).replace(/[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)).join('/');
}

function renderOverview(source, available) {
  const known = new Set(source.chapters.map((chapter) => String(chapter.chapterId)));
  const missing = available.filter((chapter) => !known.has(String(chapter.ChapterID))).map((chapter) => chapter.ChapterNo);
  return [
    `# ${source.projectName}`, '', '## ข้อมูลต้นฉบับ',
    `- **ชื่อเรื่องต้นฉบับ:** ${source.originalTitle || '-'}`,
    `- **ผู้แต่ง:** ${source.author || '-'}`,
    `- **ผู้วาดภาพประกอบ:** ${source.artist || '-'}`,
    `- **ผู้แปล (Nekopost):** ${[...new Set(source.chapters.map((chapter) => chapter.provider).filter(Boolean))].join(', ') || '-'}`,
    `- **แหล่งต้นฉบับ:** ${source.originalUrl || '-'}`,
    `- **หน้า Nekopost:** ${BASE}/novel/${source.projectId}`,
    `- **แนว:** ${source.categories.join(', ') || '-'}`,
    `- **สถานะ (ค่าต้นทาง):** ${source.status ?? '-'}`,
    `- **จำนวนรายการบนต้นทาง:** ${source.totalChapters}`,
    `- **จำนวนรายการที่เก็บแล้ว:** ${source.chapters.length} (รวมรายการเก่าที่เก็บรักษาไว้)`,
    `- **รายการต้นทางที่ยังไม่ได้เก็บ:** ${missing.length ? missing.join(', ') : 'ไม่มี'}`,
    `- **วันที่ดึงข้อมูล:** ${source.scrapedAt}`, '',
    '## เรื่องย่อ', source.synopsis || '-', '', '## สารบัญ',
    ...source.chapters.map((chapter) => `- **Ch.${chapter.chapterNo}:** ${chapter.chapterName} — [${chapter.file}](${markdownLink(chapter.file)})`), '',
  ].join('\n');
}

function mergeOverview(generated, existing) {
  const start = '<!-- nekopost:generated:start -->';
  const end = '<!-- nekopost:generated:end -->';
  const block = `${start}\n${generated}${end}`;
  const first = existing.indexOf(start);
  const last = existing.indexOf(end);
  if (first !== -1 || last !== -1) {
    if (first === -1 || last < first || existing.indexOf(start, first + start.length) !== -1 ||
        existing.indexOf(end, last + end.length) !== -1) {
      throw new Error('Invalid generated overview markers; repair them before importing.');
    }
    return existing.slice(0, first) + block + existing.slice(last + end.length);
  }
  // Legacy overviews may contain hand-written reference material. Keep it intact.
  return `${block}\n${existing.trim() ? `\n## บันทึกจาก overview เดิม\n\n${existing}` : ''}`;
}

function imageExtension(buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return '.jpg';
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return '.png';
  if (/^GIF8[79]a$/.test(buffer.subarray(0, 6).toString('ascii'))) return '.gif';
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return '.webp';
  if (buffer.subarray(4, 8).toString() === 'ftyp' && /avif|avis/.test(buffer.subarray(8, 32).toString())) return '.avif';
  throw new Error('Unsupported or invalid image data (possibly an HTML error page).');
}

function createHttp(fetchImpl, wait, projectId) {
  return async (url, init = {}) => {
    const target = new URL(url);
    if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) {
      throw new Error(`Unsupported source URL: ${url}`);
    }
    for (let attempt = 1; attempt <= 4; attempt++) {
      let response;
      try {
        response = await fetchImpl(url, {
          ...init, signal: AbortSignal.timeout(30000),
          headers: { 'User-Agent': UA, Referer: `${BASE}/novel/${projectId}`, ...init.headers },
        });
      } catch (error) {
        if (attempt === 4) throw error;
        await wait(1200 * attempt);
        continue;
      }
      if (response.ok) return response;
      if (response.status === 429) {
        throw new Error(`HTTP 429: stop importing; Retry-After: ${response.headers.get('retry-after') || 'not provided'}`);
      }
      if (attempt === 4 || (response.status !== 408 && response.status < 500)) {
        throw new Error(`HTTP ${response.status}: ${url}`);
      }
      await response.body?.cancel();
      await wait(1200 * attempt);
    }
  };
}

async function scrape(options, dependencies = {}) {
  // Validate programmatic callers as strictly as CLI callers.
  const validated = parseArgs([String(options.projectId), options.slug,
    ...(options.only === null || options.only === undefined ? [] : [`--only=${options.only.join(',')}`]),
    ...(options.force ? ['--force'] : [])]);
  const { projectId, slug, only, force } = validated;
  const wait = dependencies.wait || sleep;
  const log = dependencies.log || console.log;
  const now = dependencies.now || (() => new Date().toISOString());
  const root = path.join(dependencies.sourceRoot || path.resolve(__dirname, '../novels_source'), slug);
  const previous = readExisting(root, projectId);
  // Missing old files must not be silently carried into the next snapshot.
  for (const chapter of previous?.chapters || []) {
    if (!fs.existsSync(localFile(root, chapter.file))) throw new Error(`Missing registered chapter: ${chapter.file}`);
    for (const image of chapter.images) {
      if (!fs.existsSync(localFile(root, image.file, 'illustrations/'))) throw new Error(`Missing registered image: ${image.file}`);
    }
  }
  const http = createHttp(dependencies.fetchImpl || fetch, wait, projectId);
  const post = async (url, body, type) => (await http(url, {
    method: 'POST', headers: { 'Content-Type': type, Origin: BASE, Accept: '*/*' }, body: JSON.stringify(body),
  })).text();
  log(`Fetching project ${projectId}…`);
  const project = JSON.parse(await post(`${BASE}/api/project/detail2`, { pid: projectId }, 'application/json')).projectInfo;
  if (!project?.Project?.projectName || !Array.isArray(project.ListChapter)) throw new Error('Invalid project response');
  const available = project.ListChapter.slice().sort((a, b) => Number(a.ChapterNo) - Number(b.ChapterNo));
  const ids = new Set();
  const numbers = new Set();
  for (const chapter of available) {
    const no = Number(chapterNumber(chapter.ChapterNo));
    if (!chapter.ChapterID || ids.has(String(chapter.ChapterID)) || numbers.has(no)) throw new Error('Duplicate or invalid chapter in project response');
    chapterFileName(chapter);
    ids.add(String(chapter.ChapterID)); numbers.add(no);
  }
  if (only?.some((no) => !numbers.has(Number(no)))) throw new Error('Requested chapter is not present in the project.');
  const records = new Map((previous?.chapters || []).map((chapter) => [String(chapter.chapterId), chapter]));
  // A replaced/renumbered source item requires a deliberate migration, not duplicate files.
  for (const chapter of available) {
    const old = records.get(String(chapter.ChapterID));
    if ((old && Number(old.chapterNo) !== Number(chapter.ChapterNo)) ||
        [...records.values()].some((record) => Number(record.chapterNo) === Number(chapter.ChapterNo) && String(record.chapterId) !== String(chapter.ChapterID))) {
      throw new Error(`Chapter identity changed at ${chapter.ChapterNo}; inspect the registry before importing.`);
    }
  }
  const overviews = fs.existsSync(root) ? fs.readdirSync(root).filter((file) => /^00_.*\.md$/.test(file)) : [];
  if (overviews.length > 1) throw new Error('Multiple overview files; choose the canonical overview before importing.');
  const overviewFile = overviews[0] || `00_${sanitizeFileName(project.Project.projectName, 80, 194)}.md`;
  const overviewPath = path.join(root, overviewFile);
  let overview = fs.existsSync(overviewPath) ? fs.readFileSync(overviewPath, 'utf8') : '';
  // Validate markers before any chapter is changed.
  mergeOverview('', overview);
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(path.join(root, 'illustrations'), { recursive: true });
  const info = project.Project;
  const source = {
    ...previous, source: 'nekopost', projectId, projectName: info.projectName,
    originalTitle: info.aliasName || null, originalUrl: info.website || null,
    author: info.authorName || null, artist: info.artistName || null, status: info.status ?? null,
    categories: (project.ListCate || []).map((category) => category.CateName), synopsis: info.info || '',
    scrapedAt: now(), totalChapters: available.length, chapters: [],
  };
  const save = () => {
    source.chapters = [...records.values()].sort((a, b) => Number(a.chapterNo) - Number(b.chapterNo));
    // Each chapter is checkpointed: a later HTTP failure cannot erase earlier progress.
    atomicWrite(path.join(root, '_source.json'), JSON.stringify(source, null, 2) + '\n');
    overview = mergeOverview(renderOverview(source, available), overview);
    atomicWrite(overviewPath, overview);
  };
  for (const chapter of available) {
    if (only && !only.some((no) => Number(no) === Number(chapter.ChapterNo))) continue;
    const id = String(chapter.ChapterID);
    const old = records.get(id);
    if (old && !force) { log(`  skip Ch.${chapter.ChapterNo} (registered; metadata/images preserved)`); continue; }
    const file = old?.file || chapterFileName(chapter);
    const target = localFile(root, file);
    if (!old && fs.existsSync(target)) throw new Error(`Unregistered chapter file exists; refusing to overwrite: ${file}`);
    const url = `${BASE}/novel/${projectId}/${chapter.ChapterNo}`;
    const data = JSON.parse(decrypt(await post(`${BASE}/handler/cinfo`, { p: projectId, c: chapter.ChapterID }, 'text/plain;charset=UTF-8')));
    const html = data.novelContent || (data.pageItem || []).map((page) => page.content || page.html || '').join('\n');
    if (typeof html !== 'string' || !html.trim()) throw new Error(`Empty chapter response: ${chapter.ChapterNo}`);
    // Fail before writing files if the content cannot be rendered.
    const tags = imageTags(html);
    renderChapter({ ...chapter, url }, html, tags.map((_, i) => ({ file: `illustrations/check${i}.jpg` })));
    const images = [];
    for (const [index, image] of tags.entries()) {
      const imageUrl = new URL(image.source, url).href;
      const response = await http(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const extension = imageExtension(buffer);
      const no = chapterNumber(chapter.ChapterNo).padStart(2, '0');
      const name = Number(no) === 0 ? `illust_${String(index + 1).padStart(2, '0')}` : `ch${no}_img${index + 1}`;
      const imageFile = `illustrations/${name}${extension}`;
      atomicWrite(localFile(root, imageFile, 'illustrations/'), buffer);
      images.push({ source: imageUrl, file: imageFile });
    }
    atomicWrite(target, renderChapter({ ...chapter, url }, html, images));
    records.set(id, {
      ...old, chapterNo: String(chapter.ChapterNo), chapterId: chapter.ChapterID, chapterName: chapter.ChapterName,
      provider: chapter.ProviderName || null, publishedAt: chapter.PublishDate?.String || null,
      url, file, images,
    });
    save();
    log(`  saved Ch.${chapter.ChapterNo} (${images.length} images)`);
    await wait(300);
  }
  save();
  log(`Saved ${source.chapters.length} registered chapters; source lists ${source.totalChapters}. Text fidelity still requires review.`);
  return source;
}

module.exports = {
  parseArgs, chapterNumber, sanitizeFileName, chapterFileName, decodeEntities, htmlToLines,
  imageTags, renderChapter, readExisting, renderOverview, imageExtension, createHttp, scrape,
  markdownLink,
};

if (require.main === module) {
  Promise.resolve().then(() => scrape(parseArgs(process.argv.slice(2)))).catch((error) => {
    console.error(`FAILED: ${error.message}`);
    process.exitCode = 1;
  });
}
