/* ==========================================================================
   UI Lab — shared data, preferences and prose rendering.
   The three mockups own their layout and interactions; this file only keeps
   their content and theme controls consistent enough to compare.
   ========================================================================== */
(function () {
  'use strict';

  const data = window.LAB_DATA;
  const root = document.documentElement;
  const variant = root.dataset.variant || 'A';
  const storageKey = `ui_lab_${variant}_prefs`;

  const FONTS = {
    serif: { label: 'นวนิยาย (Serif)', stack: "'Noto Serif Thai', serif" },
    looped: { label: 'อ่านสบาย (Looped)', stack: "'IBM Plex Sans Thai Looped', sans-serif" },
    plex: { label: 'เรียบ (Plex)', stack: "'IBM Plex Sans Thai', sans-serif" },
  };

  const THEMES = [
    { id: 'light', name: 'กระดาษวาชิ', hint: 'Muji Light' },
    { id: 'dark', name: 'ซูมิเข้ม', hint: 'Dark Sumi' },
    { id: 'sepia', name: 'ฮิโนกิอุ่น', hint: 'Warm Hinoki' },
  ];

  const DIALOGUES = [
    { id: 'avatar', name: 'รูปและชื่อ', hint: 'เห็นหน้าตัวละคร' },
    { id: 'badge', name: 'ชื่ออย่างเดียว', hint: 'ประหยัดพื้นที่' },
    { id: 'plain', name: 'ไร้เครื่องหมาย', hint: 'เน้นเนื้อความ' },
  ];

  const defaults = Object.assign(
    { theme: 'light', font: 'serif', size: 18, leading: 1.9, dialogue: 'avatar' },
    JSON.parse(root.dataset.defaults || '{}'),
  );

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return {
        theme: THEMES.some((item) => item.id === saved.theme) ? saved.theme : defaults.theme,
        font: FONTS[saved.font] ? saved.font : defaults.font,
        size: Number(saved.size) >= 15 && Number(saved.size) <= 26 ? Number(saved.size) : defaults.size,
        leading:
          Number(saved.leading) >= 1.6 && Number(saved.leading) <= 2.2 ? Number(saved.leading) : defaults.leading,
        dialogue: DIALOGUES.some((item) => item.id === saved.dialogue) ? saved.dialogue : defaults.dialogue,
      };
    } catch {
      return { ...defaults };
    }
  }

  const prefs = load();

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(prefs));
    } catch {
      /* The mockup remains usable without storage. */
    }
  }

  function apply() {
    root.dataset.theme = prefs.theme;
    root.dataset.dialogue = prefs.dialogue;
    root.style.setProperty('--reader-size', `${prefs.size}px`);
    root.style.setProperty('--reader-leading', String(prefs.leading));
    root.style.setProperty('--reader-font', FONTS[prefs.font].stack);
  }

  function announce() {
    document.dispatchEvent(new CustomEvent('lab:prefs', { detail: { ...prefs } }));
  }

  function set(patch) {
    Object.assign(prefs, patch);
    save();
    apply();
    announce();
  }

  function cycleTheme() {
    const order = ['light', 'sepia', 'dark'];
    const index = order.indexOf(prefs.theme);
    set({ theme: order[(index + 1) % order.length] });
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function novelById(id) {
    return data.novels.find((novel) => novel.id === id) || data.novels[0];
  }

  function firstReadingChapter(novel) {
    return novel.chapters.find((chapter) => chapter.blocks.length > 0) || novel.chapters[0];
  }

  function prepareChapter(novel, id) {
    const chapter = novel.chapters.find((item) => item.id === id);
    if (!chapter) return firstReadingChapter(novel);
    if (chapter.blocks.length > 0) return chapter;
    const fallback = firstReadingChapter(novel);
    return { ...chapter, blocks: fallback.blocks, sample: true };
  }

  function characterFor(novel, speakerId) {
    return novel.characters.find((character) => character.id === speakerId);
  }

  function blockHTML(block, novel) {
    if (block.type === 'scene_break') {
      return `<div class="lab-scene" role="separator"><span>${esc(block.symbol || '◆')}</span></div>`;
    }

    if (block.type === 'illustration') {
      return `<figure class="lab-illus">
        <img src="${esc(block.src)}" alt="${esc(block.caption || 'ภาพประกอบ')}" loading="lazy" />
        ${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ''}
      </figure>`;
    }

    if (block.type === 'dialogue') {
      const character = characterFor(novel, block.speakerId);
      const color = character ? character.color : '#a8452f';
      const name = character ? character.name : block.speakerName;
      const role = character ? character.role : '';
      return `<div class="lab-speech" style="--char:${esc(color)}">
        <div class="lab-who">
          ${character && character.avatar ? `<img class="lab-avatar" src="${esc(character.avatar)}" alt="" loading="lazy" />` : ''}
          <span>${esc(name)}</span>
          ${role ? `<span class="lab-role">${esc(role)}</span>` : ''}
        </div>
        <p class="lab-line">${esc(block.text)}</p>
      </div>`;
    }

    return `<p class="lab-narr">${esc(block.text)}</p>`;
  }

  function mountChapter(container, novel, chapter) {
    const prepared = chapter.blocks ? chapter : prepareChapter(novel, chapter.id);
    container.innerHTML = prepared.blocks.map((block) => blockHTML(block, novel)).join('');
    return prepared;
  }

  function showScreen(name) {
    document.querySelectorAll('[data-screen]').forEach((screen) => {
      if (screen === document.body) return;
      screen.hidden = screen.dataset.screen !== name;
    });
    document.body.dataset.labScreen = name;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function themeName() {
    return (THEMES.find((item) => item.id === prefs.theme) || THEMES[0]).name;
  }

  function chapterNumber(chapter) {
    return String(chapter.number).padStart(2, '0');
  }

  // Theme buttons are visually different in each mockup, so only the shared
  // click behavior lives here.
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-lab-theme]')) {
      cycleTheme();
    }
  });

  apply();

  window.Lab = {
    data,
    novels: data.novels,
    prefs,
    set,
    apply,
    cycleTheme,
    themeName,
    fonts: FONTS,
    themes: THEMES,
    dialogues: DIALOGUES,
    esc,
    novelById,
    firstReadingChapter,
    prepareChapter,
    chapterNumber,
    blockHTML,
    mountChapter,
    showScreen,
    storageKey,
  };
})();
