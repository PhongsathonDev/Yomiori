/**
 * Chapter records carry a "Ch.12 — " prefix while rows and the reader already
 * show the chapter number separately. Strip the prefix for display so the same
 * number isn't shown twice.
 */
export function chapterDisplayTitle(title: string): string {
  const withoutPrefix = title
    .replace(/^\s*(?:Ch(?:apter)?\.?)\s*\d+(?:\.\d+)?\s*[—–:-]\s*/i, '')
    .trim();
  return withoutPrefix || title;
}
