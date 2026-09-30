import type { Novel, Character, Chapter } from '../types';

export const isDevEnvironment = import.meta.env.DEV;

export interface DevStatus {
  status: string;
  mode: string;
  canEdit: boolean;
  dataDir?: string;
}

export async function checkDevStatus(): Promise<DevStatus | null> {
  if (!isDevEnvironment) return null;
  try {
    const res = await fetch('/api/status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveNovel(novel: Novel): Promise<boolean> {
  if (!isDevEnvironment) return false;
  try {
    const res = await fetch('/api/save-novel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novel }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save novel:', err);
    return false;
  }
}

export async function uploadCharacterImage(
  novelId: string,
  characterId: string,
  base64Data: string
): Promise<string | null> {
  if (!isDevEnvironment) return null;
  try {
    const res = await fetch('/api/upload-character-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novelId, characterId, base64Data }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.avatarUrl || null;
  } catch (err) {
    console.error('Failed to upload character image:', err);
    return null;
  }
}

export async function saveCharacters(novelId: string, characters: Character[]): Promise<boolean> {
  if (!isDevEnvironment) return false;
  try {
    const res = await fetch('/api/save-characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novelId, characters }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save characters:', err);
    return false;
  }
}

export async function saveChapterBlock(
  novelId: string,
  chapterId: string,
  blockId: string,
  updates: { text?: string; speakerId?: string; speakerName?: string; tone?: string }
): Promise<boolean> {
  if (!isDevEnvironment) return false;
  try {
    const res = await fetch('/api/save-chapter-block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        novelId,
        chapterId,
        blockId,
        ...updates,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save chapter block:', err);
    return false;
  }
}

export async function saveFullChapter(novelId: string, chapter: Chapter): Promise<boolean> {
  if (!isDevEnvironment) return false;
  try {
    const res = await fetch('/api/save-chapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novelId, chapter }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save chapter:', err);
    return false;
  }
}
