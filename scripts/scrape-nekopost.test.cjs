'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { execFileSync } = require('node:child_process');
const {
  parseArgs, chapterFileName, sanitizeFileName, decodeEntities, htmlToLines,
  renderChapter, imageTags, imageExtension, createHttp, scrape,
} = require('./scrape-nekopost.js');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');

function encrypt(data) {
  const salt = Buffer.from('12345678');
  let derived = Buffer.alloc(0);
  let previous = Buffer.alloc(0);
  while (derived.length < 48) {
    previous = crypto.createHash('md5').update(Buffer.concat([previous, Buffer.from('AeyTest'), salt])).digest();
    derived = Buffer.concat([derived, previous]);
  }
  const cipher = crypto.createCipheriv('aes-256-cbc', derived.subarray(0, 32), derived.subarray(32, 48));
  return Buffer.concat([Buffer.from('Salted__'), salt, cipher.update(JSON.stringify(data)), cipher.final()]).toString('base64');
}

function fixture(t) {
  const temp = path.join(os.tmpdir(), 'opencode');
  fs.mkdirSync(temp, { recursive: true });
  const sourceRoot = fs.mkdtempSync(path.join(temp, 'nekopost-test-'));
  t.after(() => fs.rmSync(sourceRoot, { recursive: true, force: true }));
  const chapters = ['0', '1', '84.5'].map((no, index) => ({
    ChapterNo: no, ChapterID: 100 + index, ChapterName: `ชื่อตอน (${no}) #พิเศษ`,
    ProviderName: 'ผู้แปล', PublishDate: { String: '2026-10-29T07:00:00Z' },
  }));
  const state = {
    project: { Project: { projectName: 'นิยายทดสอบ', authorName: 'ผู้แต่ง' }, ListChapter: chapters, ListCate: [{ CateName: 'Romance' }] },
    bodies: new Map(chapters.map((chapter) => [chapter.ChapterID, `<p>บทที่ ${chapter.ChapterNo} ไม่ใช่หัวซ้ำ</p><p>“ข้อความครบ &amp; ตรง”</p><img src='/images/${chapter.ChapterNo}.jpg'><p>หมายเหตุท้ายตอน</p>`])),
    requests: [], failedChapter: null, invalidImage: false,
  };
  const deps = {
    sourceRoot, now: () => '2026-10-29T08:00:00.000Z', wait: async () => {}, log: () => {},
    fetchImpl: async (url, init) => {
      state.requests.push({ url, init });
      if (url.endsWith('/api/project/detail2')) return Response.json({ projectInfo: state.project });
      if (url.endsWith('/handler/cinfo')) {
        const id = JSON.parse(init.body).c;
        if (id === state.failedChapter) return new Response('unavailable', { status: 503 });
        return new Response(encrypt({ novelContent: state.bodies.get(id) }));
      }
      if (url.includes('/images/')) return new Response(state.invalidImage ? '<html>Error</html>' : PNG);
      throw new Error(`Unexpected fixture URL: ${url}`);
    },
  };
  const options = { projectId: 12345, slug: 'test-novel', only: null, force: false };
  const root = path.join(sourceRoot, options.slug);
  const load = () => JSON.parse(fs.readFileSync(path.join(root, '_source.json'), 'utf8'));
  const run = (overrides = {}) => scrape({ ...options, ...overrides }, deps);
  return { state, root, load, run };
}

test('CLI accepts decimal chapters and rejects unsafe input without fetching', () => {
  assert.deepEqual(parseArgs(['12345', 'test-novel', '--only=0,1,84.5', '--force']), {
    projectId: 12345, slug: 'test-novel', only: ['0', '1', '84.5'], force: true,
  });
  for (const args of [
    ['12', '../escape'], ['12', 'Novel'], ['12x', 'novel'], ['12', 'novel', '--wat'],
    ['12', 'novel', '--only='], ['12', 'novel', '--only=1-3'],
    ['12', 'novel', '--only=1', '--only=2'], ['12', 'novel', 'extra'],
  ]) assert.throws(() => parseArgs(args));
});

test('filenames retain decimal numbers and full titles remain separate', () => {
  const title = 'ชื่อเรื่องยาวมาก'.repeat(30);
  const file = chapterFileName({ ChapterNo: '84.5', ChapterName: title });
  assert.match(file, /^Ch_84\.5_/);
  assert.ok(Buffer.byteLength(file, 'utf8') <= 200);
  assert.equal(sanitizeFileName(' a/b: c? . '), 'a_b_ c_');
  assert.equal(sanitizeFileName('a'.repeat(89) + '😀'), 'a'.repeat(89));
  assert.match(chapterFileName({ ChapterNo: '100', ChapterName: 'ตอน' }), /^Ch_100_/);
});

test('entities decode once and invalid codepoints do not lose text', () => {
  assert.equal(decodeEntities('&amp;lt; &hellip; &#x1f600; &#34; &unknown; &#99999999;'),
    '&lt; … 😀 " &unknown; &#99999999;');
});

test('HTML preserves first paragraph, scene breaks, notes and decoded angle brackets', () => {
  const html = '<p>บทที่ 1 เป็นเนื้อเรื่อง</p><p>&lt;คำ&gt;<br>“พูด”</p><hr><p>หมายเหตุ</p>';
  assert.deepEqual(htmlToLines(html), ['บทที่ 1 เป็นเนื้อเรื่อง', '<คำ>', '“พูด”', '---', 'หมายเหตุ']);
  const md = renderChapter({ ChapterNo: '1', ChapterName: 'ตอน', url: 'https://www.nekopost.net/novel/12345/1' }, html, []);
  assert.ok(md.includes('บทที่ 1 เป็นเนื้อเรื่อง'));
  assert.ok(md.endsWith('หมายเหตุ\n'));
  assert.ok(!md.includes('By undefined'));
  assert.throws(() => renderChapter({ ChapterNo: '1' }, '<p></p>', []), /Empty chapter/);
});

test('image attributes handle single/double/unquoted src but not data-src as src', () => {
  assert.deepEqual(imageTags('<IMG src="a&amp;b"><img src=two><img data-src="wrong" src=\'right\'>').map((image) => image.source), ['a&b', 'two', 'right']);
  assert.throws(() => imageTags('<img data-src="only-lazy">'), /without src/);
});

test('image content, not a misleading URL extension, determines output format', () => {
  assert.equal(imageExtension(PNG), '.png');
  assert.throws(() => imageExtension(Buffer.from('<html>error</html>')), /invalid image/);
});

test('fresh import stores all source items, local images, credits and valid TOC links', async (t) => {
  const { run, state, root, load } = fixture(t);
  const source = await run();
  assert.equal(source.totalChapters, 3);
  assert.deepEqual(source.chapters.map((chapter) => chapter.chapterNo), ['0', '1', '84.5']);
  assert.equal(load().scrapedAt, '2026-10-29T08:00:00.000Z');
  for (const chapter of source.chapters) {
    const md = fs.readFileSync(path.join(root, chapter.file), 'utf8');
    assert.ok(md.includes(`Source: ${chapter.url}`));
    assert.ok(md.includes('By ผู้แปล'));
    assert.ok(md.includes('“ข้อความครบ & ตรง”'));
    assert.ok(md.includes('หมายเหตุท้ายตอน'));
    const image = md.match(/!\[Illustration\]\(([^)]+)\)/)[1];
    assert.ok(fs.existsSync(path.resolve(root, image)));
    assert.match(chapter.images[0].file, /\.png$/);
    assert.match(chapter.images[0].source, /^https:\/\/www\.nekopost\.net\/images\//);
  }
  const overview = fs.readFileSync(path.join(root, '00_นิยายทดสอบ.md'), 'utf8');
  for (const link of overview.matchAll(/\]\(([^)]+)\)/g)) {
    assert.ok(fs.existsSync(path.join(root, decodeURIComponent(link[1]))));
  }
  assert.ok(overview.includes('%28'));
  assert.ok(overview.includes('%23'));
  assert.equal(state.requests.filter((request) => request.url.endsWith('/handler/cinfo')).length, 3);
  assert.deepEqual(fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name), ['illustrations']);
});

test('incremental --only merges previous chapters, images and preserves existing filenames', async (t) => {
  const { run, root, load } = fixture(t);
  await run({ only: ['0'] });
  const original = load().chapters[0];
  await run({ only: ['84.5'] });
  const updated = load();
  assert.equal(updated.totalChapters, 3);
  assert.equal(updated.chapters.length, 2);
  assert.deepEqual(updated.chapters[0], original);
  const overview = fs.readFileSync(path.join(root, '00_นิยายทดสอบ.md'), 'utf8');
  assert.ok(overview.includes('**รายการต้นทางที่ยังไม่ได้เก็บ:** 1'));
});

test('repeated import skips downloads without erasing image mapping or edited body', async (t) => {
  const { run, state, root, load } = fixture(t);
  await run();
  const before = load().chapters;
  const file = path.join(root, before[1].file);
  fs.appendFileSync(file, '\nข้อความแก้ด้วยมือ\n');
  state.requests.length = 0;
  await run();
  assert.deepEqual(load().chapters, before);
  assert.ok(fs.readFileSync(file, 'utf8').includes('ข้อความแก้ด้วยมือ'));
  assert.equal(state.requests.length, 1);
});

test('changed titles do not produce duplicate files; force refreshes content but retains path', async (t) => {
  const { run, state, root, load } = fixture(t);
  await run({ only: ['1'] });
  const original = load().chapters[0];
  state.project.ListChapter[1].ChapterName = 'ชื่อใหม่';
  await run({ only: ['1'] });
  assert.deepEqual(load().chapters[0], original);
  await run({ only: ['1'], force: true });
  assert.equal(load().chapters[0].file, original.file);
  assert.equal(load().chapters[0].chapterName, 'ชื่อใหม่');
  assert.equal(fs.readdirSync(root).filter((file) => /^Ch[._]/.test(file)).length, 1);
  assert.ok(fs.readFileSync(path.join(root, original.file), 'utf8').includes('ชื่อใหม่'));
});

test('failed later chapter leaves earlier progress registered and resumable', async (t) => {
  const { run, state, load } = fixture(t);
  state.failedChapter = 101;
  await assert.rejects(run(), /HTTP 503/);
  assert.deepEqual(load().chapters.map((chapter) => chapter.chapterNo), ['0']);
  state.failedChapter = null;
  await run();
  assert.equal(load().chapters.length, 3);
});

test('failed image or empty body is not registered as a successful chapter', async (t) => {
  const { run, state, root } = fixture(t);
  state.invalidImage = true;
  await assert.rejects(run({ only: ['1'] }), /invalid image/);
  assert.ok(!fs.existsSync(path.join(root, '_source.json')));
  state.invalidImage = false;
  state.bodies.set(101, '<p> </p>');
  await assert.rejects(run({ only: ['1'] }), /Empty chapter/);
  assert.equal(fs.readdirSync(root).filter((file) => /^Ch[._]/.test(file)).length, 0);
});

test('unknown requested chapter and project mismatch fail without rewriting sources', async (t) => {
  const { run, root, state } = fixture(t);
  await assert.rejects(run({ only: ['2'] }), /not present/);
  assert.ok(!fs.existsSync(root));
  await run({ only: ['0'] });
  const file = path.join(root, '_source.json');
  const original = fs.readFileSync(file, 'utf8');
  state.requests.length = 0;
  await assert.rejects(run({ projectId: 999 }), /another project/);
  assert.equal(fs.readFileSync(file, 'utf8'), original);
  assert.equal(state.requests.length, 0);
});

test('refuses unregistered files even with --force', async (t) => {
  const { run, state, root } = fixture(t);
  fs.mkdirSync(root, { recursive: true });
  const file = path.join(root, chapterFileName(state.project.ListChapter[1]));
  fs.writeFileSync(file, 'user work');
  await assert.rejects(run({ only: ['1'], force: true }), /Unregistered chapter/);
  assert.equal(fs.readFileSync(file, 'utf8'), 'user work');
});

test('rejects broken or unsafe old registries before accessing network', async (t) => {
  const { run, state, root, load } = fixture(t);
  await run({ only: ['0'] });
  const source = load();
  state.requests.length = 0;
  source.chapters[0].file = '../escape.md';
  fs.writeFileSync(path.join(root, '_source.json'), JSON.stringify(source));
  await assert.rejects(run(), /filename only/);
  assert.equal(state.requests.length, 0);
});

test('missing registered images stop import instead of silently discarding mapping', async (t) => {
  const { run, root, load } = fixture(t);
  await run({ only: ['0'] });
  fs.unlinkSync(path.join(root, load().chapters[0].images[0].file));
  await assert.rejects(run(), /Missing registered image/);
  assert.equal(load().chapters[0].images.length, 1);
});

test('source identity changes require review rather than duplicate chapter numbers', async (t) => {
  const { run, state, load } = fixture(t);
  await run({ only: ['0'] });
  state.project.ListChapter[0].ChapterID = 999;
  await assert.rejects(run(), /identity changed/);
  assert.equal(load().chapters[0].chapterId, 100);
});

test('overview updates preserve legacy reference material and notes outside generated markers', async (t) => {
  const { run, root } = fixture(t);
  fs.mkdirSync(root, { recursive: true });
  const file = path.join(root, '00_ข้อมูลเดิม.md');
  const legacy = '# ข้อมูลที่เขียนด้วยมือ\n\n## ภาพอ้างอิง\nห้ามลบข้อมูลนี้\n';
  fs.writeFileSync(file, legacy);
  await run({ only: ['0'] });
  fs.appendFileSync(file, '\n## บันทึกเพิ่ม\nตรวจแล้วบางส่วน\n');
  await run({ only: ['1'] });
  const updated = fs.readFileSync(file, 'utf8');
  assert.ok(updated.includes(legacy));
  assert.ok(updated.endsWith('ตรวจแล้วบางส่วน\n'));
  assert.equal(updated.split('<!-- nekopost:generated:start -->').length, 2);
  assert.ok(updated.includes('**จำนวนรายการที่เก็บแล้ว:** 2'));
  assert.equal(fs.readdirSync(root).filter((name) => name.startsWith('00_')).length, 1);
});

test('filename normalization preserves generated markers and notes, then scraper can resume', async (t) => {
  const { run, root } = fixture(t);
  await run({ only: ['0'] });
  const overview = path.join(root, '00_นิยายทดสอบ.md');
  fs.appendFileSync(overview, '\n## บันทึก\nเนื้อหาที่ต้องรักษา\n');
  execFileSync(process.execPath, [path.join(__dirname, 'normalize-source-filenames.js'), root]);
  const normalized = fs.readFileSync(overview, 'utf8');
  assert.ok(normalized.includes('<!-- nekopost:generated:end -->'));
  assert.ok(normalized.endsWith('เนื้อหาที่ต้องรักษา\n'));
  assert.ok(normalized.includes('%23'));
  await run({ only: ['1'] });
  assert.ok(fs.readFileSync(overview, 'utf8').endsWith('เนื้อหาที่ต้องรักษา\n'));
});

test('items removed from source are retained locally, not silently deleted', async (t) => {
  const { run, state, load } = fixture(t);
  await run();
  state.project.ListChapter.pop();
  await run();
  assert.equal(load().chapters.length, 3);
  assert.equal(load().totalChapters, 2);
});

test('HTTP 429/403 stop immediately, while transient server errors retry within bounds', async () => {
  for (const status of [429, 403]) {
    let count = 0;
    const http = createHttp(async () => { count++; return new Response('blocked', { status, headers: { 'retry-after': '60' } }); }, async () => assert.fail('should not wait/retry'), 12345);
    await assert.rejects(http('https://www.nekopost.net/test'), status === 429 ? /Retry-After: 60/ : /HTTP 403/);
    assert.equal(count, 1);
  }
  const delays = [];
  let count = 0;
  const http = createHttp(async () => new Response('', { status: ++count < 3 ? 503 : 200 }), async (ms) => delays.push(ms), 12345);
  assert.equal((await http('https://www.nekopost.net/test')).status, 200);
  assert.deepEqual(delays, [1200, 2400]);
  await assert.rejects(http('file:///private'), /Unsupported source URL/);
});
