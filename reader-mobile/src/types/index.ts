export interface Character {
  id: string;
  name: string;
  role: string;
  color: string;
  avatarUrl?: string;
  aliases?: string[];
  description?: string;
}

export type BlockType = 'narration' | 'dialogue' | 'scene_break' | 'illustration';

export interface NarrationBlock {
  id: string;
  type: 'narration';
  text: string;
}

export interface DialogueBlock {
  id: string;
  type: 'dialogue';
  speakerId: string;
  speakerName: string;
  text: string;
  emotion?: 'neutral' | 'happy' | 'shy' | 'surprised' | 'tired' | 'playful';
}

export interface SceneBreakBlock {
  id: string;
  type: 'scene_break';
  symbol?: string;
}

export interface IllustrationBlock {
  id: string;
  type: 'illustration';
  src: string;
  caption?: string;
  alt?: string;
  aspectRatio?: number;
}

export type StoryBlock = NarrationBlock | DialogueBlock | SceneBreakBlock | IllustrationBlock;

export interface IllustrationItem {
  id: string;
  filename: string;
  title: string;
  caption?: string;
  type: 'color_spread' | 'cover' | 'insert' | 'special';
}

export interface NovelManifest {
  novelId: string;
  totalAvailable: number;
  chapters: ChapterListItem[];
  illustrations?: IllustrationItem[];
  characters?: Character[];
  updatedAt: string;
}

export interface Chapter {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  novelTitle: string;
  blocks: StoryBlock[];
}

export interface ChapterListItem {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  isDownloaded?: boolean;
}

export interface Novel {
  id: string;
  title: string;
  originalTitle?: string;
  author: string;
  artist?: string;
  translator?: string;
  coverUrl: string;
  bannerUrl?: string;
  synopsis: string;
  tags: string[];
  totalOriginalChapters: number;
}

export type ReaderTheme = 'dark' | 'light' | 'sepia';

export interface ReadingProgress {
  novelId: string;
  chapterId: string;
  scrollPercent: number;
  updatedAt: number;
}

export interface CommentItem {
  id: string;
  username: string;
  avatarColor: string;
  badge?: string;
  text: string;
  likes: number;
  timeAgo: string;
  isUser?: boolean;
  userLiked?: boolean;
  isPinned?: boolean;
  replies?: CommentItem[];
}

export interface ChapterCommentsData {
  chapterId: string;
  comments: CommentItem[];
}

export type RootStackParamList = {
  Bookshelf: undefined;
  NovelDetail: { novelId: string };
  Reader: { novelId: string; chapterId: string };
};
