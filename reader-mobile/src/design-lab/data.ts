import novelsData from '../data/novels.json';
import type { Novel } from '../types';

export interface PreviewBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  synopsis: string;
  tags: string[];
  totalChapters: number;
  progress: number;
  currentChapter: number;
  currentChapterTitle: string;
  status: 'reading' | 'new' | 'done';
}

interface PreviewMeta {
  progress: number;
  currentChapter: number;
  currentChapterTitle: string;
  status: PreviewBook['status'];
}

const META: Record<string, PreviewMeta> = {
  'black-cat-hangout': {
    progress: 0.42,
    currentChapter: 12,
    currentChapterTitle: 'คุณโคคาเงะผู้ขี้วิตก',
    status: 'reading',
  },
  'makeine-too-many-losing-heroines': {
    progress: 0.18,
    currentChapter: 27,
    currentChapterTitle: 'งานเลี้ยงของชมรมวรรณกรรม',
    status: 'reading',
  },
  'kyudo-senpai': {
    progress: 0.64,
    currentChapter: 46,
    currentChapterTitle: 'ห้องของเราในคืนฝนตก',
    status: 'reading',
  },
  'nazeka-natsukareta-rashii': {
    progress: 1,
    currentChapter: 141,
    currentChapterTitle: 'บทส่งท้าย',
    status: 'done',
  },
  'kokou-na-kanojo': {
    progress: 0,
    currentChapter: 0,
    currentChapterTitle: '',
    status: 'new',
  },
  'shinpai-kanojo': {
    progress: 0.08,
    currentChapter: 5,
    currentChapterTitle: 'คำสารภาพที่ไม่ได้ตั้งใจ',
    status: 'reading',
  },
};

const PICKS = [
  'black-cat-hangout',
  'makeine-too-many-losing-heroines',
  'kyudo-senpai',
  'nazeka-natsukareta-rashii',
  'kokou-na-kanojo',
  'shinpai-kanojo',
];

const catalog = novelsData as Novel[];

export const PREVIEW_BOOKS: PreviewBook[] = PICKS.map(id => catalog.find(novel => novel.id === id))
  .filter((novel): novel is Novel => !!novel)
  .map(novel => {
    const meta = META[novel.id] ?? {
      progress: 0,
      currentChapter: 0,
      currentChapterTitle: '',
      status: 'new' as const,
    };
    return {
      id: novel.id,
      title: novel.title,
      author: novel.author,
      coverUrl: novel.coverUrl,
      synopsis: novel.synopsis,
      tags: novel.tags ?? [],
      totalChapters: novel.totalOriginalChapters,
      ...meta,
    };
  });

export const CONTINUE_BOOK = PREVIEW_BOOKS[0];
export const READING_COUNT = PREVIEW_BOOKS.filter(book => book.status === 'reading').length;
export const DONE_COUNT = PREVIEW_BOOKS.filter(book => book.status === 'done').length;
export const FRESH_BOOKS = PREVIEW_BOOKS.filter(book => book.status === 'reading').slice(1, 4);

export const PREVIEW_TAGS = [
  'ทั้งหมด',
  'Romance',
  'School Life',
  'Comedy',
  'Slice of Life',
];

export const PREVIEW_CHAPTERS = [
  { number: 0, title: 'บทนำ', state: 'read' as const },
  { number: 1, title: 'วันที่ทุกอย่างเริ่มต้น', state: 'read' as const },
  { number: 2, title: 'เสียงเคาะประตูยามเช้า', state: 'read' as const },
  { number: 3, title: 'เรื่องที่ยังไม่ได้เล่า', state: 'read' as const },
  { number: 4, title: 'ระยะห่างที่เล็กลง', state: 'current' as const },
  { number: 5, title: 'คำตอบที่รอคอย', state: 'unread' as const },
  { number: 6, title: 'ฝนที่ตกในคืนนั้น', state: 'unread' as const },
  { number: 7, title: 'จุดเริ่มต้นอีกครั้ง', state: 'unread' as const },
];

export const READER_SAMPLE = {
  chapterNumber: 1,
  chapterTitle: 'วันที่ทุกอย่างเริ่มต้น',
  progress: 38,
  paragraphs: [
    'แสงเช้าตรู่สาดผ่านม่านบาง ๆ ลงบนโต๊ะหนังสือที่ยังเปิดค้างไว้ กลิ่นกระดาษและกาแฟอ่อน ๆ ลอยอยู่ในห้องเล็ก ๆ แห่งนี้',
    'เธอหยุดอ่านตรงบรรทัดสุดท้ายของหน้าเดิม แล้วเงยหน้าขึ้นมองนาฬิกาบนผนัง',
    'วันนี้เป็นวันที่ทุกอย่างจะเปลี่ยนไป',
    'เสียงฝีเท้าดังขึ้นหน้าประตู ก่อนที่มือเรียวจะเคาะเบา ๆ สองครั้ง',
  ],
  dialogue: {
    speaker: 'เธอ',
    role: 'ตัวละครหลัก',
    text: '“เข้าได้ไหม? ฉันมีเรื่องอยากเล่าให้ฟัง”',
  },
  after: [
    'ประตูเปิดออกช้า ๆ เผยให้เห็นรอยยิ้มที่คุ้นเคย และความเงียบที่เคยมีก็ค่อย ๆ หายไป',
    'บางทีเรื่องราวใหม่อาจไม่ได้เริ่มจากเหตุการณ์ครั้งใหญ่ แค่บทสนทนาเล็ก ๆ ในเช้าวันหนึ่ง',
  ],
};
