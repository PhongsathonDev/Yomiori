// Review-only fixtures. These source counts are NOT runtime availability/offline claims.
const books = [
  { id: 'kyudo-senpai', title: '(WN) รุ่นพี่สาวสวยจากชมรมยิงธนู ผมนอนในห้องของผมโดยที่ท้องของเธอเปิดโล่ง', cover: 'illust_05.webp', count: 73, tags: ['Romance', 'Comedy', 'School Life', 'Slice of Life', 'Wholesome & Fluffy'] },
  { id: 'idol-neighbor', title: '(WN) เพื่อนสมัยเด็กที่เป็นไอดอลชื่อดัง แอบย้ายมาอยู่ข้างห้องและขอมาทำการบ้านด้วยทุกวัน', cover: 'illust_06.webp', count: 1, tags: ['Romance', 'Comedy', 'Idol', 'School Life', 'Slice of Life'] },
  { id: 'boyish-friend', title: '[18+] เรื่องราวของการพรากเพื่อนสนิทสาวที่น่ารักอันดับสองในห้อง มาเป็นของตัวเองด้วยทริปทัศนศึกษาสองคืนสามวัน', cover: 'boyish_cover.webp', count: 14, tags: ['Mature 18+', 'Romance', 'Drama', 'School Life', 'Childhood Friend', 'Boyish Heroine'] },
  { id: 'black-cat-hangout', title: '(WN) พอเก็บแมวดำมาเลี้ยง บ้านผมก็กลายเป็นแหล่งรวมตัวของสองสาวสวยไปซะแล้ว', cover: 'blackcat_cover.jpg', count: 61, tags: ['Harem', 'Romance', 'School Life', 'Slice of Life', 'Wholesome & Fluffy'] },
];
const params = new URLSearchParams(location.search);
const variant = params.get('title') === 'clamp' ? 'clamp' : 'full';
const scenario = params.get('state') || 'new';
const fontScale = params.get('scale') === '1.3' ? 1.3 : 1;
const root = document.documentElement;
root.dataset.title = variant;
root.style.setProperty('--font-scale', fontScale);
let theme = ['light', 'sepia', 'dark'].includes(params.get('theme')) ? params.get('theme') : 'light';
let selectedTag = 'all';
const catalog = scenario === 'empty' ? [] : scenario === 'few' ? books.slice(0, 1) : books;
const hasHistory = scenario === 'resume';
const loading = scenario === 'loading';
const icon = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const bookIcon = icon('<path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>');

function setTheme() {
  root.dataset.theme = theme;
  const toggle = document.querySelector('.theme-toggle');
  const icons = {
    light: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>'),
    sepia: icon('<path d="M4 8h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm13 1h2a3 3 0 0 1 0 6h-2M7 3v2m4-2v2m4-2v2"/>'),
    dark: icon('<path d="M20 14A8.5 8.5 0 0 1 10 3a9 9 0 1 0 10 11Z"/>'),
  };
  toggle.innerHTML = icons[theme];
  toggle.setAttribute('aria-label', `เปลี่ยนธีม (ขณะนี้: ${theme === 'light' ? 'สว่าง' : theme === 'sepia' ? 'ซีเปีย' : 'OLED'})`);
}
document.querySelector('.theme-toggle').addEventListener('click', () => {
  theme = theme === 'light' ? 'sepia' : theme === 'sepia' ? 'dark' : 'light';
  setTheme();
});
setTheme();

function cover(book, missing = false) {
  if (missing) {
    const placeholder = document.createElement('span');
    placeholder.className = 'cover missing-cover';
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', 'ไม่มีภาพปกในเครื่อง');
    placeholder.innerHTML = `${bookIcon}<span>ไม่มีภาพปก<br>ในเครื่อง</span>`;
    return placeholder;
  }
  const image = document.createElement('img');
  image.className = 'cover';
  image.alt = ''; // The same button already has the full title as its accessible name.
  image.src = `../../../reader-web/public/illustrations/${book.cover}`;
  image.addEventListener('error', () => image.replaceWith(cover(book, true)), { once: true });
  return image;
}

function feedback(message) {
  document.querySelector('.tap-feedback').textContent = `จำลองเท่านั้น — ${message}`;
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}
function renderHistory() {
  const slot = document.querySelector('#continue-slot');
  if (loading) {
    slot.append(element('p', 'screen-state', 'กำลังโหลดประวัติการอ่าน'));
    return;
  }
  if (!hasHistory) return; // No fallback book, chapter, percentage or fake progress.
  const book = books[0];
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'continue';
  button.setAttribute('aria-label', `อ่านต่อ ${book.title} ตอนที่ 12 กลับย่อหน้าล่าสุด (ประวัติจำลอง)`);
  const info = element('span', 'continue-info', '');
  info.append(element('span', 'continue-label', 'อ่านต่อ'));
  info.append(element('span', 'continue-title', book.title));
  info.append(element('span', 'meta', 'ตอนที่ 12 · กลับตำแหน่งล่าสุด'));
  button.append(cover(book), info, element('span', 'continue-arrow', '›'));
  button.addEventListener('click', () => feedback('ไปหน้าอ่าน ตอนที่ 12 และย่อหน้าที่บันทึกไว้ ไม่ใช่หน้ารายละเอียด (ไม่ได้ทดสอบการคืนตำแหน่งจริง)'));
  slot.append(button);
}
function renderFilters() {
  const nav = document.querySelector('.filters');
  nav.replaceChildren();
  const tags = ['all', ...new Set(catalog.flatMap(book => book.tags))];
  for (const tag of tags) {
    const button = element('button', 'filter', tag === 'all' ? `ทั้งหมด (${catalog.length})` : tag);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(selectedTag === tag));
    button.addEventListener('click', () => {
      selectedTag = tag;
      renderFilters();
      renderBooks();
    });
    nav.append(button);
  }
}
function screenState(message, action, onClick) {
  const state = element('div', 'screen-state', '');
  state.append(element('p', '', message));
  if (action) {
    const button = element('button', 'text-action', action);
    button.type = 'button';
    button.addEventListener('click', onClick);
    state.append(button);
  }
  return state;
}
function renderBooks() {
  const shelf = document.querySelector('.shelf');
  shelf.replaceChildren();
  document.querySelector('.tap-feedback').textContent = '';
  const filtered = selectedTag === 'all' ? catalog : catalog.filter(book => book.tags.includes(selectedTag));
  if (filtered.length === 0) {
    shelf.append(screenState(catalog.length === 0 ? 'ยังไม่มีนิยายในชั้นหนังสือ' : 'ไม่มีนิยายในหมวดนี้', catalog.length === 0 ? 'ลองอีกครั้ง' : 'ดูทั้งหมด', () => {
      if (catalog.length === 0) return feedback('ลองโหลดชั้นหนังสืออีกครั้ง (ไม่เรียกเครือข่าย)');
      selectedTag = 'all'; renderFilters(); renderBooks();
    }));
    return;
  }
  for (const book of filtered) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'book';
    button.dataset.book = book.id;
    button.setAttribute('aria-label', `ดูรายละเอียด ${book.title}`);
    const info = element('span', 'book-info', '');
    info.append(element('span', 'book-title', book.title));
    info.append(element('span', 'meta', loading ? 'กำลังโหลดจำนวนตอน' : `${book.count} ตอน`));
    info.append(element('span', 'reading-state', loading ? 'กำลังโหลดประวัติ' : hasHistory && book.id === books[0].id ? 'อ่านถึงตอนที่ 12' : 'ยังไม่เริ่มอ่าน'));
    // Deliberately separate text-only availability from complete text+image downloads.
    const offline = scenario === 'offline'
      ? book.id === books[0].id ? 'ข้อความออฟไลน์ 1 ตอน · ภาพยังไม่ครบ' : 'ยังไม่พบตอนพร้อมอ่านออฟไลน์'
      : 'กำลังตรวจข้อมูลออฟไลน์';
    info.append(element('span', 'offline-state', offline));
    button.append(cover(book, scenario === 'missing' && book.id === books[0].id), info);
    button.addEventListener('click', () => feedback(`ไปหน้ารายละเอียด: ${book.title} — เรื่องย่อ ตัวละคร และสารบัญอยู่ที่นั่น`));
    shelf.append(button);
  }
}
if (scenario === 'error') {
  document.querySelector('#notice').append(screenState('รีเฟรชข้อมูลบางส่วนไม่ได้ · คงรายการที่มีอยู่', 'ลองอีกครั้ง', () => feedback('ลองรีเฟรชอีกครั้ง โดยไม่ลบรายการเดิม (ไม่เรียกเครือข่าย)')));
}
renderHistory();
renderFilters();
renderBooks();
const shell = document.querySelector('main');
new ResizeObserver(([entry]) => {
  // Width available after padding/insets, not orientation or device model.
  const columns = Math.max(1, Math.min(3, Math.floor((entry.contentRect.width + 20) / (330 * fontScale + 20))));
  document.querySelector('.shelf').style.setProperty('--columns', columns);
  root.dataset.columns = String(columns);
}).observe(shell);
