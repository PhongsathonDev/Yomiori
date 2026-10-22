#!/usr/bin/env node
/**
 * Scrape a Nekopost novel into novels_source/<slug>/.
 *
 * Usage:
 *   node scripts/scrape-nekopost.js <projectId> <slug> [--only=1,2,3] [--force]
 *
 * Example:
 *   node scripts/scrape-nekopost.js 17903 black-cat-hangout
 *
 * Output:
 *   novels_source/<slug>/raw_chapters/Ch_XX_<title>.md
 *   novels_source/<slug>/illustrations/*          (images embedded in chapters)
 *   novels_source/<slug>/_source.json             (metadata + chapter map)
 *   novels_source/<slug>/00_<title>.md            (overview + table of contents)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE = 'https://www.nekopost.net';
const AES_PASSPHRASE = 'AeyTest';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
const pid = Number(args[0]);
const slug = args[1];
if (!pid || !slug) {
  console.error('Usage: node scripts/scrape-nekopost.js <projectId> <slug> [--only=1,2] [--force]');
  process.exit(1);
}
const only = (flags.find((f) => f.startsWith('--only=')) || '').replace('--only=', '');
const onlySet = only ? new Set(only.split(',').map((s) => Number(s.trim()))) : null;
const force = flags.includes('--force');

const root = path.resolve(__dirname, '..', 'novels_source', slug);
const rawDir = path.join(root, 'raw_chapters');
const imgDir = path.join(root, 'illustrations');
fs.mkdirSync(rawDir, { recursive: true });
fs.mkdirSync(imgDir, { recursive: true });

/* ---------------------------------- crypto --------------------------------- */

function deriveKey(pass, salt) {
  let derived = Buffer.alloc(0);
  let prev = Buffer.alloc(0);
  const passBytes = Buffer.concat([Buffer.from(pass, 'utf8'), salt]);
  while (derived.length < 48) {
    prev = crypto.createHash('md5').update(Buffer.concat([prev, passBytes])).digest();
    derived = Buffer.concat([derived, prev]);
  }
  return { key: derived.slice(0, 32), iv: derived.slice(32, 48) };
}

function decrypt(cipherB64, pass = AES_PASSPHRASE) {
  const raw = Buffer.from(cipherB64.trim(), 'base64');
  if (raw.subarray(0, 8).toString('latin1') !== 'Salted__') {
    throw new Error('Unexpected ciphertext header');
  }
  const salt = raw.subarray(8, 16);
  const { key, iv } = deriveKey(pass, salt);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(raw.subarray(16)), decipher.final()]).toString('utf8');
}

/* ----------------------------------- http ---------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(url, body, contentType = 'text/plain;charset=UTF-8', attempt = 1) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Accept: '*/*',
        Origin: BASE,
        Referer: `${BASE}/novel/${pid}`,
        'User-Agent': UA,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
    return text;
  } catch (err) {
    if (attempt >= 4) throw err;
    await sleep(1200 * attempt);
    return request(url, body, contentType, attempt + 1);
  }
}

async function getProject() {
  const text = await request(`${BASE}/api/project/detail2`, { pid }, 'application/json');
  return JSON.parse(text).projectInfo;
}

async function getChapter(chapterId) {
  const text = await request(`${BASE}/handler/cinfo`, { p: pid, c: chapterId });
  return JSON.parse(decrypt(text));
}

/* ---------------------------------- parsing -------------------------------- */

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function htmlToLines(html) {
  let out = html;
  // Structural line breaks first.
  out = out.replace(/<br\s*\/?>/gi, '\n');
  out = out.replace(/<\/(div|p|h[1-6]|li|blockquote)>/gi, '\n');
  out = out.replace(/<(div|p|h[1-6]|li|blockquote)[^>]*>/gi, '\n');
  // Anything else is inline formatting; strip the tags.
  out = out.replace(/<[^>]+>/g, '');
  out = decodeEntities(out);
  out = out.replace(/\u00a0/g, ' ');
  return out
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+$/g, '').trim())
    .filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== ''));
}

function sanitizeFileName(name, max = 90) {
  let s = String(name || '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length > max) s = s.slice(0, max).trim();
  return s.replace(/[. ]+$/, '');
}

/* ---------------------------------- output --------------------------------- */

function chapterFileName(chapter) {
  const no = String(chapter.ChapterNo).padStart(2, '0');
  const title = sanitizeFileName(chapter.ChapterName);
  return `Ch_${no}_${title}.md`;
}

async function downloadImage(src, destBase) {
  const res = await fetch(src, {
    headers: { Referer: `${BASE}/`, 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  let ext = path.extname(new URL(src).pathname) || '.jpg';
  if (!/^\.[a-z0-9]{2,5}$/i.test(ext)) ext = '.jpg';
  const dest = path.join(imgDir, destBase + ext);
  fs.writeFileSync(dest, buf);
  return `illustrations/${destBase}${ext}`;
}

function renderChapter(chapter, novelContent, chapterNo) {
  const header = [`# Ch.${chapter.ChapterNo} — ${chapter.ChapterName}`, ''];
  header.push(`Ch.${chapter.ChapterNo} — ${chapter.ChapterName}`, '');
  if (chapter.ProviderName) header.push(`By ${chapter.ProviderName}`, '');
  if (chapter.PublishDate?.String) header.push(`Published: ${chapter.PublishDate.String}`, '');
  header.push(`Source: ${BASE}/novel/${pid}/${chapter.ChapterNo}`, '');

  const withImages = novelContent.replace(
    /<img[^>]*src="([^"]+)"[^>]*>/gi,
    (_, src) => `\n\n![Illustration](${decodeEntities(src)})\n\n`,
  );

  const paragraphs = htmlToLines(withImages).filter((line) => line !== '');
  // Drop the in-content heading ("บทที่ N ...") that duplicates the page title.
  if (paragraphs.length && /^บทที่\s/.test(paragraphs[0]) && paragraphs[0].length < 200) paragraphs.shift();

  return [...header, paragraphs.join('\n\n')].join('\n') + '\n';
}

/* ----------------------------------- main ---------------------------------- */

(async () => {
  console.log(`Fetching project ${pid}…`);
  const project = await getProject();
  const info = project.Project;
  const chapters = project.ListChapter.slice().sort((a, b) => Number(a.ChapterNo) - Number(b.ChapterNo));
  console.log(`${info.projectName}\n${chapters.length} chapters`);

  const map = [];
  for (const chapter of chapters) {
    const no = Number(chapter.ChapterNo);
    if (onlySet && !onlySet.has(no)) continue;

    const fileName = chapterFileName(chapter);
    const filePath = path.join(rawDir, fileName);
    const record = {
      chapterNo: chapter.ChapterNo,
      chapterId: chapter.ChapterID,
      chapterName: chapter.ChapterName,
      provider: chapter.ProviderName,
      publishedAt: chapter.PublishDate?.String || null,
      url: `${BASE}/novel/${pid}/${chapter.ChapterNo}`,
      file: fileName,
      images: [],
    };
    map.push(record);

    if (!force && fs.existsSync(filePath)) {
      console.log(`  skip  Ch.${chapter.ChapterNo} (exists)`);
      continue;
    }

    process.stdout.write(`  fetch Ch.${chapter.ChapterNo} … `);
    const data = await getChapter(chapter.ChapterID);
    const html = data.novelContent || (data.pageItem || []).map((p) => p.content || p.html || '').join('\n');

    // Replace remote images with local files where possible.
    const imgSrcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => decodeEntities(m[1]));
    let rewritten = html;
    for (let i = 0; i < imgSrcs.length; i += 1) {
      const src = imgSrcs[i];
      const base = no === 0 ? `illust_${String(i + 1).padStart(2, '0')}` : `ch${String(no).padStart(2, '0')}_img${i + 1}`;
      try {
        const local = await downloadImage(src, base);
        record.images.push({ source: src, file: local });
        rewritten = rewritten.replace(src, local);
      } catch (err) {
        console.warn(`\n    image failed (${src}): ${err.message}`);
      }
    }

    const md = renderChapter(chapter, rewritten, no);
    fs.writeFileSync(filePath, md, 'utf8');
    console.log(`${md.length} chars${record.images.length ? `, ${record.images.length} img` : ''}`);
    await sleep(300);
  }

  const source = {
    source: 'nekopost',
    projectId: pid,
    projectName: info.projectName,
    originalTitle: info.aliasName || null,
    originalUrl: info.website || null,
    author: info.authorName || null,
    artist: info.artistName || null,
    status: info.status,
    categories: (project.ListCate || []).map((c) => c.CateName),
    synopsis: info.info || '',
    scrapedAt: new Date().toISOString(),
    totalChapters: chapters.length,
    chapters: map,
  };
  fs.writeFileSync(path.join(root, '_source.json'), JSON.stringify(source, null, 2) + '\n', 'utf8');

  const toc = map
    .map((c) => `- **Ch.${c.chapterNo}:** ${c.chapterName} — [${c.file}](${encodeURI('raw_chapters/' + c.file)})`)
    .join('\n');
  const overview = [
    `# ${info.projectName}`,
    '',
    '## ข้อมูลต้นฉบับ',
    `- **ชื่อเรื่องต้นฉบับ (JP):** ${info.aliasName || '-'}`,
    `- **ผู้แต่ง:** ${info.authorName || '-'}`,
    `- **ผู้วาดภาพประกอบ:** ${info.artistName || '-'}`,
    `- **ผู้แปล (Nekopost):** ${[...new Set(map.map((c) => c.provider).filter(Boolean))].join(', ') || '-'}`,
    `- **แหล่งต้นฉบับ:** ${info.website || '-'}`,
    `- **หน้า Nekopost:** ${BASE}/novel/${pid}`,
    `- **แนว:** ${(project.ListCate || []).map((c) => c.CateName).join(', ') || '-'}`,
    `- **จำนวนตอนที่ดึงมา:** ${map.length} ตอน`,
    `- **วันที่ดึงข้อมูล:** ${new Date().toISOString()}`,
    '',
    '## เรื่องย่อ',
    info.info || '-',
    '',
    '## สารบัญ',
    toc,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(root, `00_${sanitizeFileName(info.projectName, 80)}.md`), overview, 'utf8');

  console.log(`\nDone → ${root}`);
})().catch((err) => {
  console.error('\nFAILED:', err);
  process.exit(1);
});
