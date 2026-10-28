import { saveReadingProgress } from './storage';
import { ReadingAnchor } from '../types';

/** Owns immutable chapter IDs so cleanup can never save into the next chapter. */
export function createProgressWriter(
  novelId: string,
  chapterId: string,
  onError: () => void,
  save = saveReadingProgress,
) {
  let pending: { percent: number; anchor?: ReadingAnchor } | undefined;
  let lastAttempt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let revision = 0;

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    if (pending === undefined) return;
    const value = pending;
    const attemptRevision = revision;
    pending = undefined;
    lastAttempt = Date.now();
    const writing = value.anchor ? save(novelId, chapterId, value.percent, value.anchor) : save(novelId, chapterId, value.percent);
    void writing.catch(() => {
      if (!disposed) {
        if (revision === attemptRevision) pending ??= value;
        onError();
      }
    });
  };

  return {
    update(percent: number, anchor?: ReadingAnchor) {
      if (disposed || !Number.isFinite(percent)) return;
      revision++;
      pending = { percent: Math.max(0, Math.min(100, percent)), anchor };
      if (timer === undefined) timer = setTimeout(flush, Math.max(0, 1000 - (Date.now() - lastAttempt)));
    },
    flush,
    dispose() {
      flush();
      disposed = true;
    },
  };
}

export interface BlockLayout { id: string; index: number; y: number; height: number }

export function anchorAtOffset(layouts: BlockLayout[], offset: number): ReadingAnchor | undefined {
  const block = layouts.find(item => item.height > 0 && offset >= item.y && offset < item.y + item.height);
  return block ? { blockId: block.id, blockIndex: block.index, fraction: (offset - block.y) / block.height } : undefined;
}

export function offsetForAnchor(anchor: ReadingAnchor, layouts: BlockLayout[]): number | undefined {
  const valid = layouts.filter(item => item.height > 0);
  const block = valid.find(item => item.id === anchor.blockId)
    ?? valid.reduce<BlockLayout | undefined>((nearest, item) => !nearest || Math.abs(item.index - anchor.blockIndex) < Math.abs(nearest.index - anchor.blockIndex) ? item : nearest, undefined);
  return block ? block.y + block.height * anchor.fraction : undefined;
}

export function getResumeOffset(percent: number, contentHeight: number, viewportHeight: number): number {
  return Math.max(0, contentHeight - viewportHeight) * Math.max(0, Math.min(100, percent)) / 100;
}
