/** A rejected operation must not prevent later operations for the same key. */
export function createKeyedQueue() {
  const pending = new Map<string, Promise<unknown>>();
  return function enqueue<T>(key: string, work: () => Promise<T>): Promise<T> {
    const result = (pending.get(key) ?? Promise.resolve()).catch(() => undefined).then(work);
    pending.set(key, result);
    void result.finally(() => {
      if (pending.get(key) === result) pending.delete(key);
    }).catch(() => undefined);
    return result;
  };
}
