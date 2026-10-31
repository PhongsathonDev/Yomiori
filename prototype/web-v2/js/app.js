/* ==========================================================================
   Yomiori v2 prototype — read-only mockup, vanilla JS.
   No production code or novel data is modified by this app.
   ========================================================================== */
(function () {
  'use strict';

  const DATA = window.YOMIORI_V2_DATA;
  const NOVELS = DATA.novels;
  const app = document.getElementById('app');
  const overlayRoot = document.getElementById('overlay-root');

  const PREFS_KEY = 'yomiori_v2_prefs';
  const PROGRESS_KEY = 'yomiori_v2_progress';

  const FONTS = {
    serif: { stack: "'Noto Serif Thai', 'Noto Serif', serif", label: 'นวนิยาย (Serif)' },
    looped: { stack: "'IBM Plex Sans Thai Looped', sans-serif", label: 'อ่านสบาย (Looped)' },
    plex: { stack: "'IBM Plex Sans Thai', sans-serif", label: 'เรียบ (Plex)' },
  };

  const THEMES = [
    { id: 'light', name: 'กระดาษวาชิ', hint: 'Muji Light · กระดาษไม่ฟอกสี', colors: ['#f4efe4', '#24211c', '#a8452f'] },
    { id: 'dark', name: 'ซูมิเข้ม', hint: 'Dark Sumi · ถ่านและหินชนวน', colors: ['#141311', '#eae3d5', '#d97960'] },
    { id: 'sepia', name: 'ฮิโนกิอุ่น', hint: 'Warm Hinoki · ซีดาร์และชาอุ่น', colors: ['#ede2cf', '#2a2117', '#8c5426'] },
  ];

  const DIALOGUES = [
    { id: 'avatar', name: 'ทาบสีและรูปตัวละคร', hint: 'เห็นสีประจำตัวและรูปย่อ' },
    { id: 'badge', name: 'แถบสีอย่างเดียว', hint: 'ไม่ใช้รูป ประหยัดพื้นที่' },
    { id: 'plain', name: 'ไร้กรอบ', hint: 'ชื่อผู้พูดบาง ๆ เน้นเนื้อหา' },
  ];

  const defaultPrefs = { theme: 'light', font: 'serif', size: 18, leading: 1.9, dialogue: 'avatar' };

  const state = {
    prefs: loadPrefs(),
    shelfTag: 'all',
    tocSort: 'asc',
    overlay: null,
  };

  let readerScrollHandler = null;

  /* -----------------------------------------------------------------------
     Utilities
     ----------------------------------------------------------------------- */

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Private mode: the preview still works for this page view. */
    }
  }

  function loadPrefs() {
    const saved = readJson(PREFS_KEY, {});
    return {
      theme: THEMES.some((t) => t.id === saved.theme) ? saved.theme : defaultPrefs.theme,
      font: FONTS[saved.font] ? saved.font : defaultPrefs.font,
      size: Number(saved.size) >= 15 && Number(saved.size) <= 26 ? Number(saved.size) : defaultPrefs.size,
      leading: Number(saved.leading) >= 1.6 && Number(saved.leading) <= 2.2 ? Number(saved.leading) : defaultPrefs.leading,
      dialogue: DIALOGUES.some((d) => d.id === saved.dialogue) ? saved.dialogue : defaultPrefs.dialogue,
    };
  }

  function savePrefs() {
    writeJson(PREFS_KEY, state.prefs);
  }

  function progress() {
    return readJson(PROGRESS_KEY, {});
  }

  function progressFor(novelId) {
    const record = progress()[novelId];
    return record && record.chapterId ? record : null;
  }

  function setProgress(novelId, chapterId, percent) {
    const all = progress();
    all[novelId] = { chapterId, percent: Math.max(0, Math.min(100, Math.round(percent))) };
    writeJson(PROGRESS_KEY, all);
  }

  function applyPrefs() {
    const root = document.documentElement;
    root.dataset.theme = state.prefs.theme;
    root.dataset.dialogue = state.prefs.dialogue;
    root.style.setProperty('--reader-size', `${state.prefs.size}px`);
    root.style.setProperty('--reader-leading', String(state.prefs.leading));
    root.style.setProperty('--reader-font', FONTS[state.prefs.font].stack);
  }

  function novelById(id) {
    return NOVELS.find((novel) => novel.id === id) || null;
  }

  function cleanChapterTitle(title) {
    return String(title || '').replace(/^Ch\.\s*\d+\s*[—–-]\s*/i, '');
  }

  function chapterLabel(chapter) {
    return String(chapter.chapterNumber).padStart(2, '0');
  }

  function firstStoryChapter(novel) {
    return novel.chapters.find((chapter) => chapter.chapterNumber > 0) || novel.chapters[0] || null;
  }

  function readingChapterFor(novel) {
    const record = progressFor(novel.id);
    const saved = record && novel.chapters.find((chapter) => chapter.id === record.chapterId);
    return saved || firstStoryChapter(novel);
  }

  function themeIcon(id) {
    if (id === 'dark') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>';
    }
    if (id === 'sepia') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M9 14h6"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/></svg>';
  }

  const icons = {
    settings:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.54h.08A1.7 1.7 0 0 0 10.1 3V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.5 9v.08A1.7 1.7 0 0 0 21 10.1h.09a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>',
    search:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
    back:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg>',
    list:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.5M4 12h.5M4 18h.5"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  };

  /* -----------------------------------------------------------------------
     Shared view pieces
     ----------------------------------------------------------------------- */

  function brand() {
    return `<a class="brand" href="#/" aria-label="Yomiori 読織 · กลับชั้นวาง">
      <img src="${esc(DATA.logo)}" alt="" />
      <span class="brand-name">Yomiori <span class="brand-jp">読織</span></span>
    </a>`;
  }

  function themeButton() {
    const theme = state.prefs.theme;
    return `<button class="icon-btn" type="button" data-action="cycle-theme" aria-label="สลับธีมสี ตอนนี้คือ ${esc(
      THEMES.find((t) => t.id === theme).name,
    )}" title="สลับธีมสี">${themeIcon(theme)}</button>`;
  }

  function settingsButton() {
    return `<button class="icon-btn" type="button" data-action="open-settings" aria-label="ตั้งค่าการอ่าน" title="ตั้งค่าการอ่าน">${icons.settings}</button>`;
  }

  function scopeFooter(extra) {
    return `<footer class="site-foot">
      <span>${extra ? `${extra} · ` : ''}ต้นแบบ v2 อ่านอย่างเดียว · ใช้สำเนาข้อมูลนิยายจริงและยังไม่เชื่อมระบบจริง</span>
      <span><a href="https://phongsathondev.github.io/Yomiori/" target="_blank" rel="noopener noreferrer">เปิดเว็บปัจจุบันเพื่อเทียบ</a></span>
    </footer>`;
  }

  function shelfPage() {
    const tags = Array.from(new Set(NOVELS.flatMap((novel) => novel.tags))).sort((a, b) => a.localeCompare(b));
    const filters = ['all', ...tags];
    const filtered = state.shelfTag === 'all' ? NOVELS : NOVELS.filter((novel) => novel.tags.includes(state.shelfTag));

    const lastNovelId = Object.keys(progress()).find((id) => progressFor(id)) || null;
    const featuredNovel = (lastNovelId && novelById(lastNovelId)) || novelById('kyudo-senpai') || NOVELS[0];
    const featuredChapter = readingChapterFor(featuredNovel);
    const featuredRecord = progressFor(featuredNovel.id);
    const isResume = Boolean(featuredRecord);
    const percent = featuredRecord ? featuredRecord.percent : 0;

    const hero = featuredChapter
      ? `<section class="hero" aria-labelledby="hero-title">
          <div class="wrap">
            <div class="hero-inner">
              <div class="hero-book">
                <img class="hero-cover" src="${esc(featuredNovel.cover)}" alt="ปก ${esc(featuredNovel.title)}" />
              </div>
              <div class="hero-copy">
                <p class="hero-kicker">${isResume ? 'อ่านค้างไว้' : 'เริ่มอ่านเรื่องนี้'}</p>
                <h1 class="hero-title" id="hero-title">${esc(cleanChapterTitle(featuredChapter.title))}</h1>
                <p class="hero-novel">${esc(featuredNovel.title)}</p>
                <div class="hero-meta">
                  <span>ตอนที่ ${featuredChapter.chapterNumber} จาก ${featuredNovel.chapters.length}</span>
                  ${isResume ? `<span>อ่านไปแล้ว ${percent}%</span>` : ''}
                </div>
                ${
                  isResume
                    ? `<div class="hero-progress" role="img" aria-label="ความคืบหน้า ${percent}%">
                        <span class="progress-track"><span class="progress-fill" style="width:${percent}%"></span></span>
                        <span class="progress-label">${percent}%</span>
                      </div>`
                    : ''
                }
                <div class="hero-actions">
                  <a class="btn btn-primary" href="#/novel/${esc(featuredNovel.id)}/read/${esc(featuredChapter.id)}">${isResume ? 'อ่านต่อทันที' : 'เปิดตอนแรก'}</a>
                  <a class="btn-quiet" href="#/novel/${esc(featuredNovel.id)}">ดูรายละเอียดเรื่อง</a>
                </div>
              </div>
            </div>
          </div>
        </section>`
      : '';

    const bookCards = filtered
      .map((novel) => {
        const record = progressFor(novel.id);
        const saved = record && novel.chapters.find((chapter) => chapter.id === record.chapterId);
        const flag = novel.chapters.length === 0 ? 'รอแปลง' : saved ? `อ่านถึงตอนที่ ${saved.chapterNumber}` : 'พร้อมอ่าน';
        const status = novel.chapters.length === 0
          ? 'ยังไม่มีตอนที่แปลงเข้าสู่ระบบ'
          : saved
            ? `อ่านไปแล้ว ${record.percent}%`
            : `ทั้งหมด ${novel.chapters.length} ตอน`;

        return `<a class="book" href="#/novel/${esc(novel.id)}">
          <div class="book-cover-wrap">
            <div class="book-cover">
              <img src="${esc(novel.cover)}" alt="ปก ${esc(novel.title)}" loading="lazy" />
              <span class="book-flag">${esc(flag)}</span>
            </div>
          </div>
          <h3 class="book-title">${esc(novel.title)}</h3>
          <p class="book-author">${esc(novel.author)}</p>
          <p class="book-status">${esc(status)}</p>
        </a>`;
      })
      .join('');

    return `<div class="shelf-page">
      <header class="site-head">
        <div class="wrap head-inner">
          ${brand()}
          <div class="head-actions">
            <span class="text-tag" title="ต้นแบบแยกจากเว็บใช้งานจริง">ตัวอย่าง v2</span>
            ${themeButton()}
            ${settingsButton()}
          </div>
        </div>
      </header>
      <main id="main">
        ${hero}
        <div class="wrap">
          <div class="shelf-head">
            <div>
              <h2>ชั้นวางของฉัน</h2>
              <p class="shelf-count">${NOVELS.length} เรื่อง · ${NOVELS.reduce((sum, novel) => sum + novel.chapters.length, 0)} ตอนพร้อมอ่าน</p>
            </div>
          </div>
          <div class="filters" role="group" aria-label="กรองตามหมวด">
            ${filters
              .map((tag) => {
                const label = tag === 'all' ? `ทั้งหมด (${NOVELS.length})` : tag;
                return `<button class="filter" type="button" data-action="filter-tag" data-tag="${esc(tag)}" aria-pressed="${state.shelfTag === tag}">${esc(label)}</button>`;
              })
              .join('')}
          </div>
          <div class="shelf-grid">
            ${bookCards || `<p class="empty-shelf">ไม่พบเรื่องในหมวดนี้ ลองเลือกหมวดอื่น</p>`}
          </div>
          ${scopeFooter('ต้นแบบหน้าชั้นวาง')}
        </div>
      </main>
    </div>`;
  }

  function detailPage(novelId) {
    const novel = novelById(novelId);
    if (!novel) {
      return notFoundPage();
    }

    const record = progressFor(novel.id);
    const reading = readingChapterFor(novel);
    const isResume = Boolean(record && reading);
    const chapters = novel.chapters;
    const galleryChapter = chapters.find((chapter) => chapter.chapterNumber === 0) || null;
    const cast = novel.characters.slice(0, 6);
    const gallery = novel.illustrations.slice(0, 4);

    return `<div class="detail-page">
      <header class="site-head">
        <div class="wrap head-inner">
          ${brand()}
          <div class="head-actions">
            <span class="text-tag">ตัวอย่าง v2</span>
            ${themeButton()}
            ${settingsButton()}
          </div>
        </div>
      </header>
      <main id="main" class="wrap">
        <a class="backlink" href="#/">${icons.back}<span>กลับชั้นวาง</span></a>
        <article class="spread">
          <div class="spread-cover">
            <img src="${esc(novel.cover)}" alt="ปก ${esc(novel.title)}" />
          </div>
          <div class="meta-block">
            <div class="tags">${novel.tags.map((tag) => `<span>${esc(tag)}</span>`).join('')}</div>
            <h1 class="meta-title">${esc(novel.title)}</h1>
            ${novel.originalTitle ? `<p class="meta-original">${esc(novel.originalTitle)}</p>` : ''}
            <p class="meta-byline">โดย ${esc(novel.author)}${novel.artist ? ` · ภาพประกอบ ${esc(novel.artist)}` : ''}</p>
            <div class="meta-actions">
              ${
                chapters.length
                  ? `<a class="btn btn-primary" href="#/novel/${esc(novel.id)}/read/${esc(reading.id)}">${isResume ? `อ่านต่อตอนที่ ${reading.chapterNumber}` : 'เริ่มตอนแรก'}</a>
                     <button class="btn btn-ghost" type="button" data-action="scroll-contents">ดูสารบัญ ${chapters.length} ตอน</button>`
                  : `<span class="btn btn-ghost" aria-disabled="true">ยังไม่มีตอนพร้อมอ่าน</span>`
              }
            </div>
          </div>
        </article>

        <section class="detail-info" aria-labelledby="synopsis-title">
          <div class="detail-synopsis">
            <h2 id="synopsis-title">เรื่องย่อ</h2>
            <p class="synopsis">${esc(novel.synopsis)}</p>
          </div>
          <div class="detail-facts">
            <h2>ข้อมูลหนังสือ</h2>
            <dl class="colophon">
              <div class="colophon-row"><dt>ผู้แต่ง</dt><dd>${esc(novel.author)}</dd></div>
              ${novel.artist ? `<div class="colophon-row"><dt>ภาพประกอบ</dt><dd>${esc(novel.artist)}</dd></div>` : ''}
              ${novel.translator ? `<div class="colophon-row"><dt>ผู้แปล</dt><dd>${esc(novel.translator)}</dd></div>` : ''}
              ${
                novel.translationSource
                  ? `<div class="colophon-row"><dt>แหล่งแปลไทย</dt><dd><a href="${esc(novel.translationSource.url)}" target="_blank" rel="noopener noreferrer">${esc(novel.translationSource.name)}</a></dd></div>`
                  : ''
              }
              <div class="colophon-row"><dt>ตอนในระบบ</dt><dd>${chapters.length} ตอน จากต้นฉบับ ${novel.totalOriginalChapters} ตอน</dd></div>
            </dl>
          </div>
        </section>

        ${
          cast.length
            ? `<section class="cast-block" aria-labelledby="cast-title">
                <div class="block-head">
                  <h2 id="cast-title">ตัวละครในเรื่อง</h2>
                  <span class="block-note">${cast.length} คนแรกจากสมุดรายชื่อ</span>
                </div>
                <div class="cast-row">
                  ${cast
                    .map(
                      (character) => `<figure class="cast" style="--char:${esc(character.color || '#8a6a47')}">
                        ${
                          character.avatar
                            ? `<img src="${esc(character.avatar)}" alt="${esc(character.name)}" loading="lazy" />`
                            : `<span class="cast-initial" aria-hidden="true">${esc(character.name.charAt(0))}</span>`
                        }
                        <figcaption>
                          <div class="cast-name">${esc(character.name)}</div>
                          <div class="cast-role">${esc(character.role)}</div>
                        </figcaption>
                      </figure>`,
                    )
                    .join('')}
                </div>
              </section>`
            : ''
        }

        ${
          gallery.length && galleryChapter
            ? `<section class="cast-block" aria-labelledby="gallery-title">
                <div class="block-head">
                  <h2 id="gallery-title">ภาพจากเรื่อง</h2>
                  <span class="block-note">${novel.illustrations.length} ภาพ · เปิดดูเต็มในตอนที่ 0</span>
                </div>
                <div class="shelf-grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:22px;margin-top:20px">
                  ${gallery
                    .map(
                      (illustration) => `<a class="book" href="#/novel/${esc(novel.id)}/read/${esc(galleryChapter.id)}">
                        <div class="book-cover-wrap"><div class="book-cover"><img src="${esc(illustration.src)}" alt="${esc(illustration.title)}" loading="lazy" /></div></div>
                        <p class="book-author">${esc(illustration.title)}</p>
                      </a>`,
                    )
                    .join('')}
                </div>
              </section>`
            : ''
        }

        <section class="contents-block" id="contents" aria-labelledby="contents-title">
          <div class="block-head">
            <h2 id="contents-title">สารบัญ <span class="block-note" id="toc-count">${chapters.length} ตอน</span></h2>
            <div class="toc-tools">
              <label class="search-field">
                <span class="sr-only">ค้นหาตอน</span>
                ${icons.search}
                <input type="search" placeholder="ค้นหาตอน" data-role="chapter-search" autocomplete="off" />
              </label>
              <button class="sort-btn" type="button" data-action="toggle-sort" aria-label="สลับลำดับตอน">${state.tocSort === 'asc' ? 'ตอนแรกสุดก่อน' : 'ตอนล่าสุดก่อน'}</button>
            </div>
          </div>
          <div class="toc-list" id="toc-list">${renderTocRows(novel, '', state.tocSort)}</div>
          <p class="detail-footnote">ต้นแบบรวมทุกตอนที่แปลงแล้ว อ่านได้จริง แต่ยังไม่รวมคอมเมนต์ โหมดแก้ไข และการบันทึกความคืบหน้าข้ามอุปกรณ์</p>
        </section>
        ${scopeFooter('ต้นแบบหน้ารายละเอียดเรื่อง')}
      </main>
    </div>`;
  }

  function renderTocRows(novel, query, sort) {
    const needle = query.trim().toLowerCase();
    const record = progressFor(novel.id);
    const chapters = [...novel.chapters].sort((a, b) =>
      sort === 'asc' ? a.chapterNumber - b.chapterNumber : b.chapterNumber - a.chapterNumber,
    );
    const filtered = chapters.filter((chapter) => {
      const title = cleanChapterTitle(chapter.title).toLowerCase();
      return !needle || title.includes(needle) || String(chapter.chapterNumber).includes(needle);
    });

    if (!filtered.length) {
      return `<p class="contents-empty">ไม่พบตอนที่ตรงกับ “${esc(query)}”</p>`;
    }

    return filtered
      .map((chapter) => {
        const isCurrent = record && record.chapterId === chapter.id;
        return `<a class="chapter-row"${isCurrent ? ' aria-current="page"' : ''} href="#/novel/${esc(novel.id)}/read/${esc(chapter.id)}">
          <span class="chapter-no">${chapterLabel(chapter)}</span>
          <span>
            <span class="chapter-title">${esc(cleanChapterTitle(chapter.title))}</span>
            ${isCurrent ? '<span class="chapter-flag">อ่านล่าสุด</span>' : ''}
          </span>
        </a>`;
      })
      .join('');
  }

  function readerPage(novelId, chapterId) {
    const novel = novelById(novelId);
    if (!novel) return notFoundPage();

    const chapter = novel.chapters.find((item) => item.id === chapterId) || novel.chapters[0];
    if (!chapter) {
      return `<div class="detail-page">
        <header class="site-head"><div class="wrap head-inner">${brand()}<div class="head-actions">${themeButton()}${settingsButton()}</div></div></header>
        <main id="main" class="wrap">
          <a class="backlink" href="#/novel/${esc(novel.id)}">${icons.back}<span>กลับหน้าเรื่อง</span></a>
          <p class="empty-shelf" style="border-top:0">เรื่องนี้ยังไม่มีตอนที่แปลงเข้าสู่ระบบ</p>
        </main>
      </div>`;
    }

    const index = novel.chapters.findIndex((item) => item.id === chapter.id);
    const prev = index > 0 ? novel.chapters[index - 1] : null;
    const next = index >= 0 && index < novel.chapters.length - 1 ? novel.chapters[index + 1] : null;
    const record = progressFor(novel.id);
    const initialPercent = record && record.chapterId === chapter.id ? record.percent : 0;

    setProgress(novel.id, chapter.id, initialPercent);
    document.title = `ตอนที่ ${chapter.chapterNumber}: ${cleanChapterTitle(chapter.title)} · ${novel.title} · Yomiori v2`;

    const body = chapter.blocks.map((block) => renderBlock(block, novel)).join('');
    const japaneseNo = chapter.chapterNumber === 0 ? '序' : `第${chapter.chapterNumber}話`;

    return `<div class="reader-page">
      <div class="reading-progress" role="progressbar" aria-label="ความคืบหน้าการอ่าน" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${initialPercent}"><span style="width:${initialPercent}%"></span></div>
      <header class="reader-head">
        <div class="wrap reader-head-inner">
          <div class="reader-left">
            ${brand()}
            <a class="icon-btn" href="#/novel/${esc(novel.id)}" aria-label="กลับหน้าเรื่อง" title="กลับหน้าเรื่อง">${icons.back}</a>
          </div>
          <div class="chapter-mid">
            <span>ตอนที่ ${chapter.chapterNumber}</span>
            <span class="sep" aria-hidden="true"></span>
            <span>${novel.chapters.length} ตอน</span>
          </div>
          <div class="reader-right">
            <button class="icon-btn has-label" type="button" data-action="open-toc">${icons.list}<span>สารบัญ</span></button>
            ${themeButton()}
            ${settingsButton()}
          </div>
        </div>
      </header>
      <main id="main" class="reading">
        <header class="opener">
          <div class="opener-no">
            <span class="jp" aria-hidden="true">${japaneseNo}</span>
            <span class="th">ตอนที่ ${chapter.chapterNumber}</span>
          </div>
          <h1>${esc(cleanChapterTitle(chapter.title))}</h1>
          <p class="opener-novel">${esc(novel.title)}</p>
        </header>
        <article class="prose" data-novel="${esc(novel.id)}" data-chapter="${esc(chapter.id)}">
          ${body}
        </article>
        <section class="chapter-end" aria-label="ท้ายตอน">
          <p class="end-label">จบตอนที่ ${chapter.chapterNumber}</p>
          ${
            next
              ? `<a class="next-chapter" href="#/novel/${esc(novel.id)}/read/${esc(next.id)}">
                  <span class="next-copy">
                    <span class="next-kicker">ตอนถัดไป</span>
                    <span class="next-title">${esc(cleanChapterTitle(next.title))}</span>
                  </span>
                  <span class="next-no">${chapterLabel(next)}</span>
                </a>`
              : `<p class="next-chapter"><span class="next-copy"><span class="next-kicker">จบเล่มที่พร้อมอ่าน</span><span class="next-title">ยังไม่มีตอนถัดไปในระบบ</span></span></p>`
          }
          <div class="reader-links">
            ${prev ? `<a href="#/novel/${esc(novel.id)}/read/${esc(prev.id)}">← ตอนก่อนหน้า: ${esc(cleanChapterTitle(prev.title))}</a>` : '<span></span>'}
            <a href="#/novel/${esc(novel.id)}">กลับสารบัญเรื่อง</a>
          </div>
        </section>
        <p class="reader-scope">ต้นแบบ v2 · เนื้อหาตอนนี้คัดจากข้อมูลนิยายจริงในเว็บปัจจุบัน · ยังไม่รวมคอมเมนต์ โหมดแก้ไข และการซิงก์ความคืบหน้าข้ามอุปกรณ์</p>
      </main>
    </div>`;
  }

  function renderBlock(block, novel) {
    if (block.type === 'scene_break') {
      return `<div class="scene-break" role="separator"><span>${esc(block.symbol || '◆')}</span></div>`;
    }

    if (block.type === 'illustration') {
      return `<figure class="illustration">
        <div class="illustration-frame"><img src="${esc(block.src)}" alt="${esc(block.caption || 'ภาพประกอบ')}" loading="lazy" /></div>
        ${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ''}
      </figure>`;
    }

    if (block.type === 'dialogue') {
      const character = novel.characters.find((item) => item.id === block.speakerId);
      const color = character ? character.color : '#a8452f';
      const name = character ? character.name : block.speakerName;
      const role = character ? character.role : '';
      const avatar = character && character.avatar ? character.avatar : '';
      return `<div class="speech" style="--char:${esc(color)}">
        <div class="speech-who">
          ${avatar ? `<img src="${esc(avatar)}" alt="" loading="lazy" />` : '<span class="dot" aria-hidden="true"></span>'}
          <span>${esc(name)}</span>
          ${role ? `<span class="speech-role">${esc(role)}</span>` : ''}
        </div>
        <p class="speech-text">${esc(block.text)}</p>
      </div>`;
    }

    return `<p class="narration">${esc(block.text)}</p>`;
  }

  function notFoundPage() {
    return `<div class="shelf-page">
      <header class="site-head"><div class="wrap head-inner">${brand()}<div class="head-actions">${themeButton()}${settingsButton()}</div></div></header>
      <main id="main" class="wrap">
        <p class="empty-shelf" style="border-top:0">ไม่พบหน้านี้ในต้นแบบ <a href="#/">กลับไปที่ชั้นวาง</a></p>
      </main>
    </div>`;
  }

  /* -----------------------------------------------------------------------
     Settings sheet
     ----------------------------------------------------------------------- */

  const PREVIEW_TEXT =
    'นักเรียนหญิงสูงโปร่งคนหนึ่งยืนรอสัญญาณไฟจราจรอยู่บนทางไปโรงเรียน มองแค่นั้นก็ยังถือเป็นภาพชินตาที่เห็นได้ทั่วไป';
  const PREVIEW_SPEECH = '“เรื่องจริงเหรอเนี่ยที่สะพายคันธนูมาโรงเรียนตอนเช้า...!”';

  function settingsSheet() {
    const prefs = state.prefs;
    return `<div class="overlay" data-overlay="settings">
      <aside class="sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header class="sheet-head">
          <div>
            <h2 id="settings-title">ตั้งค่าการอ่าน</h2>
            <p>มีผลทันทีกับทุกหน้าในต้นแบบ</p>
          </div>
          <button class="icon-btn" type="button" data-action="close-overlay" data-autofocus aria-label="ปิดการตั้งค่า">${icons.close}</button>
        </header>
        <div class="sheet-body">
          <div class="setting-group">
            <span class="setting-label">ธีมสี</span>
            <div class="option-list" role="group" aria-label="ธีมสี">
              ${THEMES.map(
                (theme) => `<button class="option-row" type="button" aria-pressed="${prefs.theme === theme.id}" data-choice="theme" data-value="${theme.id}">
                  <span class="swatches" aria-hidden="true">${theme.colors.map((color) => `<span class="swatch" style="background:${color}"></span>`).join('')}</span>
                  <span class="option-copy"><span class="option-name">${esc(theme.name)}</span><span class="option-hint">${esc(theme.hint)}</span></span>
                  <span class="option-check" aria-hidden="true"></span>
                </button>`,
              ).join('')}
            </div>
          </div>

          <div class="setting-group">
            <span class="setting-label">ตัวอักษรเนื้อเรื่อง</span>
            <div class="option-list" role="group" aria-label="ตัวอักษรเนื้อเรื่อง">
              ${Object.entries(FONTS)
                .map(
                  ([id, font]) => `<button class="option-row" type="button" aria-pressed="${prefs.font === id}" data-choice="font" data-value="${id}">
                    <span class="option-copy">
                      <span class="option-name">${esc(font.label)}</span>
                      <span class="option-sample" style="font-family:${font.stack}">อีกนิดก็ถึงบ้านแล้ว</span>
                    </span>
                    <span class="option-check" aria-hidden="true"></span>
                  </button>`,
                )
                .join('')}
            </div>
          </div>

          <div class="setting-group">
            <div class="range-head">
              <span class="setting-label" style="margin:0">ขนาดตัวอักษร</span>
              <span class="range-value" data-range-value="size">${prefs.size}px</span>
            </div>
            <input type="range" min="15" max="26" step="1" value="${prefs.size}" data-range="size" aria-label="ขนาดตัวอักษร" />
          </div>

          <div class="setting-group">
            <div class="range-head">
              <span class="setting-label" style="margin:0">ระยะบรรทัด</span>
              <span class="range-value" data-range-value="leading">${prefs.leading}x</span>
            </div>
            <input type="range" min="1.6" max="2.2" step="0.1" value="${prefs.leading}" data-range="leading" aria-label="ระยะบรรทัด" />
          </div>

          <div class="setting-group">
            <span class="setting-label">รูปแบบบทสนทนา</span>
            <div class="option-list" role="group" aria-label="รูปแบบบทสนทนา">
              ${DIALOGUES.map(
                (dialogue) => `<button class="option-row" type="button" aria-pressed="${prefs.dialogue === dialogue.id}" data-choice="dialogue" data-value="${dialogue.id}">
                  <span class="option-copy"><span class="option-name">${esc(dialogue.name)}</span><span class="option-hint">${esc(dialogue.hint)}</span></span>
                  <span class="option-check" aria-hidden="true"></span>
                </button>`,
              ).join('')}
            </div>
          </div>

          <div class="settings-preview" aria-label="ตัวอย่างการอ่าน">
            <p class="preview-label">ตัวอย่าง</p>
            <p class="preview-text">${PREVIEW_TEXT}</p>
            <div class="speech" style="--char:#7c658a;margin:12px 0 0">
              <div class="speech-who"><span class="dot" aria-hidden="true"></span><span>นักเรียนหญิง B</span><span class="speech-role">นักเรียนที่เดินผ่าน</span></div>
              <p class="speech-text">${PREVIEW_SPEECH}</p>
            </div>
          </div>
        </div>
        <p class="settings-foot">บันทึกไว้ในเบราว์เซอร์นี้เท่านั้น · ต้นแบบไม่ส่งข้อมูลออกไป</p>
      </aside>
    </div>`;
  }

  /* -----------------------------------------------------------------------
     Reader table of contents
     ----------------------------------------------------------------------- */

  function tocOverlay(novel, chapterId) {
    return `<div class="overlay overlay-center" data-overlay="toc">
      <section class="index-sheet" role="dialog" aria-modal="true" aria-labelledby="index-title">
        <header class="index-head">
          <div>
            <h2 id="index-title">สารบัญ</h2>
            <p>${esc(novel.title)}</p>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="text-tag">${novel.chapters.length} ตอน</span>
            <button class="icon-btn" type="button" data-action="close-overlay" data-autofocus aria-label="ปิดสารบัญ">${icons.close}</button>
          </div>
        </header>
        <div class="index-body">
          <div class="index-tools">
            <label class="search-field">
              <span class="sr-only">ค้นหาตอน</span>
              ${icons.search}
              <input type="search" placeholder="ค้นหาตอนในเรื่องนี้" data-role="index-search" autocomplete="off" />
            </label>
            <span class="block-note">กด Esc เพื่อปิด</span>
          </div>
          <div class="index-grid" id="index-grid">${renderTocRows(novel, '', 'asc')}</div>
          <p class="index-note">ต้นแบบ v2 · รายการตอนตรงกับข้อมูลที่แปลงแล้วในเว็บปัจจุบัน</p>
        </div>
      </section>
    </div>`;
  }

  /* -----------------------------------------------------------------------
     Overlay lifecycle
     ----------------------------------------------------------------------- */

  function openOverlay(type, payload, trigger) {
    closeOverlay(false);
    const novelId = payload && payload.novelId;
    const chapterId = payload && payload.chapterId;
    const novel = novelId ? novelById(novelId) : null;

    state.overlay = { type, trigger: trigger || document.activeElement, novelId, chapterId };
    overlayRoot.innerHTML = type === 'settings' ? settingsSheet() : tocOverlay(novel, chapterId);
    document.body.style.overflow = 'hidden';
    app.inert = true;

    const target = overlayRoot.querySelector('[data-autofocus]');
    if (target) target.focus();
  }

  function closeOverlay(restoreFocus = true) {
    const current = state.overlay;
    if (!current) return;
    overlayRoot.innerHTML = '';
    document.body.style.overflow = '';
    app.inert = false;
    state.overlay = null;
    if (restoreFocus && current.trigger && document.contains(current.trigger)) {
      current.trigger.focus();
    }
  }

  function refreshChoice(group, value) {
    overlayRoot.querySelectorAll(`[data-choice="${group}"]`).forEach((row) => {
      row.setAttribute('aria-pressed', String(row.dataset.value === value));
    });
  }

  /* -----------------------------------------------------------------------
     Rendering and routing
     ----------------------------------------------------------------------- */

  function parseRoute() {
    const raw = location.hash.replace(/^#\/?/, '');
    const parts = raw.split('/').filter(Boolean);
    if (parts[0] === 'novel' && parts[1]) {
      if (parts[2] === 'read' && parts[3]) {
        return { name: 'reader', novelId: parts[1], chapterId: parts[3] };
      }
      return { name: 'detail', novelId: parts[1] };
    }
    return { name: 'shelf' };
  }

  function renderApp() {
    if (readerScrollHandler) {
      window.removeEventListener('scroll', readerScrollHandler);
      readerScrollHandler = null;
    }

    const route = parseRoute();
    if (route.name === 'reader') {
      const novel = novelById(route.novelId);
      const chapter = novel && (novel.chapters.find((item) => item.id === route.chapterId) || novel.chapters[0]);
      app.innerHTML = readerPage(route.novelId, route.chapterId);
      if (novel && chapter) {
        document.title = `ตอนที่ ${chapter.chapterNumber}: ${cleanChapterTitle(chapter.title)} · ${novel.title} · Yomiori v2`;
        bindReaderProgress(novel.id, chapter.id);
      }
      return;
    }

    if (route.name === 'detail') {
      app.innerHTML = detailPage(route.novelId);
      const novel = novelById(route.novelId);
      document.title = novel ? `${novel.title} · Yomiori v2` : 'ไม่พบเรื่อง · Yomiori v2';
      return;
    }

    app.innerHTML = shelfPage();
    document.title = 'Yomiori v2 · ตัวอย่างหน้าตาเว็บ';
  }

  function bindReaderProgress(novelId, chapterId) {
    const bar = document.querySelector('.reading-progress span');
    const tracker = document.querySelector('.reading-progress');
    if (!bar || !tracker) return;

    let lastSaved = -1;
    let initial = true;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const percent = max > 0 ? Math.min(100, Math.max(0, (doc.scrollTop / max) * 100)) : 0;
      bar.style.width = `${percent}%`;
      tracker.setAttribute('aria-valuenow', String(Math.round(percent)));
      if (initial) {
        initial = false;
        return;
      }
      if (Math.abs(percent - lastSaved) >= 1) {
        lastSaved = percent;
        setProgress(novelId, chapterId, percent);
      }
    };

    readerScrollHandler = update;
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* -----------------------------------------------------------------------
     Events
     ----------------------------------------------------------------------- */

  document.addEventListener('click', (event) => {
    const skipLink = event.target.closest('a[href="#main"]');
    if (skipLink) {
      event.preventDefault();
      const main = document.getElementById('main');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus();
        main.scrollIntoView({ block: 'start' });
      }
      return;
    }

    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action;

      if (action === 'cycle-theme') {
        const order = ['light', 'sepia', 'dark'];
        const index = order.indexOf(state.prefs.theme);
        state.prefs.theme = order[(index + 1) % order.length];
        savePrefs();
        applyPrefs();
        document.querySelectorAll('[data-action="cycle-theme"]').forEach((button) => {
          button.innerHTML = themeIcon(state.prefs.theme);
          button.setAttribute(
            'aria-label',
            `สลับธีมสี ตอนนี้คือ ${THEMES.find((theme) => theme.id === state.prefs.theme).name}`,
          );
        });
        if (state.overlay && state.overlay.type === 'settings') refreshChoice('theme', state.prefs.theme);
        return;
      }

      if (action === 'open-settings') {
        openOverlay('settings', null, actionEl);
        return;
      }

      if (action === 'close-overlay') {
        closeOverlay();
        return;
      }

      if (action === 'open-toc') {
        const route = parseRoute();
        if (route.name === 'reader') {
          openOverlay('toc', { novelId: route.novelId, chapterId: route.chapterId }, actionEl);
        }
        return;
      }

      if (action === 'scroll-contents') {
        const contents = document.getElementById('contents');
        if (contents) contents.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (action === 'toggle-sort') {
        state.tocSort = state.tocSort === 'asc' ? 'desc' : 'asc';
        actionEl.textContent = state.tocSort === 'asc' ? 'ตอนแรกสุดก่อน' : 'ตอนล่าสุดก่อน';
        const route = parseRoute();
        const novel = route.name === 'detail' ? novelById(route.novelId) : null;
        const list = document.getElementById('toc-list');
        if (novel && list) {
          const query = document.querySelector('[data-role="chapter-search"]');
          list.innerHTML = renderTocRows(novel, query ? query.value : '', state.tocSort);
        }
        return;
      }

      if (action === 'filter-tag') {
        state.shelfTag = actionEl.dataset.tag;
        renderApp();
        return;
      }
    }

    const choice = event.target.closest('[data-choice]');
    if (choice) {
      const group = choice.dataset.choice;
      const value = choice.dataset.value;
      if (group === 'theme') {
        state.prefs.theme = value;
      } else if (group === 'font') {
        state.prefs.font = value;
      } else if (group === 'dialogue') {
        state.prefs.dialogue = value;
      }
      savePrefs();
      applyPrefs();
      refreshChoice(group, value);
      if (group === 'font') {
        const preview = overlayRoot.querySelector('.settings-preview');
        if (preview) preview.style.fontFamily = FONTS[value].stack;
      }
      return;
    }

    if (event.target.classList.contains('overlay')) {
      closeOverlay();
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;

    if (target.matches('[data-range="size"]')) {
      state.prefs.size = Number(target.value);
      savePrefs();
      applyPrefs();
      const label = overlayRoot.querySelector('[data-range-value="size"]');
      if (label) label.textContent = `${state.prefs.size}px`;
      return;
    }

    if (target.matches('[data-range="leading"]')) {
      state.prefs.leading = Number(target.value);
      savePrefs();
      applyPrefs();
      const label = overlayRoot.querySelector('[data-range-value="leading"]');
      if (label) label.textContent = `${state.prefs.leading.toFixed(1)}x`;
      return;
    }

    if (target.matches('[data-role="chapter-search"]')) {
      const route = parseRoute();
      const novel = route.name === 'detail' ? novelById(route.novelId) : null;
      const list = document.getElementById('toc-list');
      if (novel && list) {
        list.innerHTML = renderTocRows(novel, target.value, state.tocSort);
        const count = document.getElementById('toc-count');
        if (count) count.textContent = `${novel.chapters.length} ตอน`;
      }
      return;
    }

    if (target.matches('[data-role="index-search"]')) {
      const route = parseRoute();
      const novel = route.name === 'reader' ? novelById(route.novelId) : null;
      const grid = document.getElementById('index-grid');
      if (novel && grid) {
        grid.innerHTML = renderTocRows(novel, target.value, 'asc');
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!state.overlay) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeOverlay();
      return;
    }

    if (event.key !== 'Tab') return;
    const container = overlayRoot.querySelector('[role="dialog"]');
    if (!container) return;
    const focusable = Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null);

    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('hashchange', () => {
    closeOverlay(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderApp();
  });

  applyPrefs();
  renderApp();
})();
