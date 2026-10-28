export const REQUEST_TIMEOUT_MS = 10_000;

const pendingRequests = new Map<string, Promise<unknown>>();

/** Share only in-flight work; later refreshes must still fetch fresh data. */
export function requestJson(url: string): Promise<unknown> {
  const pending = pendingRequests.get(url);
  if (pending) return pending;
  const request = fetchJson(url).finally(() => {
    if (pendingRequests.get(url) === request) pendingRequests.delete(url);
  });
  pendingRequests.set(url, request);
  return request;
}

/** Covers both receiving headers and reading the body. Always releases the timer. */
async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('Request timed out'));
    }, REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([
      (async () => {
        // Native HTTP caches can ignore the web-only cache option.
        const freshUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
        const response = await fetch(freshUrl, { signal: controller.signal, cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })(),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}
