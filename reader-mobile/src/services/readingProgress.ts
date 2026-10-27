import { saveReadingProgress } from './storage';

/** Owns immutable chapter IDs so cleanup can never save into the next chapter. */
export function createProgressWriter(
  novelId: string,
  chapterId: string,
  onError: () => void,
  save = saveReadingProgress,
) {
  let pending: number | undefined;
  let lastAttempt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let revision = 0;

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    if (pending === undefined) return;
    const percent = pending;
    const attemptRevision = revision;
    pending = undefined;
    lastAttempt = Date.now();
    void save(novelId, chapterId, percent).catch(() => {
      if (!disposed) {
        if (revision === attemptRevision) pending ??= percent;
        onError();
      }
    });
  };

  return {
    update(percent: number) {
      if (disposed || !Number.isFinite(percent)) return;
      revision++;
      pending = Math.max(0, Math.min(100, percent));
      if (timer === undefined) timer = setTimeout(flush, Math.max(0, 1000 - (Date.now() - lastAttempt)));
    },
    flush,
    dispose() {
      flush();
      disposed = true;
    },
  };
}

export function getResumeOffset(percent: number, contentHeight: number, viewportHeight: number): number {
  return Math.max(0, contentHeight - viewportHeight) * Math.max(0, Math.min(100, percent)) / 100;
}
