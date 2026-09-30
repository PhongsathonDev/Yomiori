export interface Character {
  id: string;
  name: string;
  role: string;
  color: string;
  avatarUrl?: string;
  aliases?: string[];
  description?: string;
}

export type BlockType = 'narration' | 'dialogue' | 'scene_break';

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

export type StoryBlock = NarrationBlock | DialogueBlock | SceneBreakBlock;

export interface Chapter {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  novelTitle: string;
  blocks: StoryBlock[];
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

export type ViewMode = 'library' | 'reader';
export type ReaderTheme = 'dark' | 'light' | 'sepia';
export type ReaderFontFamily = 'prompt' | 'sarabun' | 'sans';
export type AvatarStyle = 
  | 'vn_card' 
  | 'washi_paper' 
  | 'chat_bubble' 
  | 'minimal_quote'
  | 'avatar_with_badge' 
  | 'badge_only';

