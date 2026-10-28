# Reader Android: behavior and acceptance contract

Status: implementation and automated evidence recorded; visual acceptance and Android device evidence pending. This is a personal Android reader, with no account, public release or navigation redesign in scope. It preserves existing file paths, settings and reading progress. This document is the single detailed contract for WF-0004/5/7.

## Local library authority

Validated saved chapter files, including readable recovery backups, establish local availability even when the manifest/catalog is missing. Reject invalid chapter shapes and mismatched identities. Merge these summaries with cached/remote metadata and bundled chapter summaries, deduplicate IDs and sort by chapter number. Saved text overrides bundled text. Remote metadata must not hide a saved chapter above the old fallback range or a saved novel absent from the catalog.

Use validated file discovery rather than a new persisted index: an index introduces migration and another source of stale state. In-flight scans share work; completed writes invalidate reuse of older scans. Chapter bodies are released after each summary is produced. A completed scan is not a permanent cache. This deliberately preserves repairability at the cost of disk reads; actual cost with a large Android library is still unmeasured. Revisit indexing only after device measurements justify it.

`missing` means no validated local text; `text-only` means text is readable but an illustration is missing; `complete` means text and every required illustration are local. A chapter without illustrations can be complete. Bundled chapters count as locally readable but not reclaimable downloaded bytes. Clearing downloads preserves bundled content, progress, settings and catalog metadata.

## Entry and refresh flow

| Entry | Immediate/local work | Remote work and failure behavior |
| --- | --- | --- |
| App | Render navigation and bookshelf with bundled catalog while fonts load; system font on loading/error | Fonts never gate the app |
| Bookshelf | Merge local catalog and validated recovered novels; load progress and local extras | Refresh catalog independently; local books remain usable during a stall |
| Novel detail | Show known novel before chapter discovery finishes; show local chapter list/status | Refresh manifest/catalog afterward; remote failure falls back to local metadata; byte measurement only when storage sheet opens |
| Reader | Settings/progress plus saved or bundled text; local characters/list independent of text | Fetch chapter only if no readable local text exists; ten-second deadline includes body parsing; error offers retry/back |
| Comments/gallery | Secondary content | Must not gate reading content |

Simultaneous JSON requests for an identical URL share work; different URLs proceed independently. Completed, rejected and timed-out entries are removed, so later refreshes fetch again. Local-only metadata cache misses never initiate a network request. Failed text auto-cache leaves fetched content readable with a warning. Image caching does not hold up the first reading render.

### Revised chapters

Opening a saved chapter and pulling to refresh metadata preserve its text snapshot. To retrieve edited chapter text, use **จัดการข้อมูลออฟไลน์ → อัปเดตตอนที่มีในเครื่อง**. The action updates readable chapters only, validates identity/content before staged replacement, then caches missing illustrations. It excludes competing download/delete jobs. Network, response-validation or save failures retain the old readable text; a bundled fallback does not count as a successful remote update. Report complete/text-only/failed counts. Progress remains the existing percentage; text edits can change the corresponding paragraph. Cached images at the same URL are not forcibly replaced by this action.

## Reader direction awaiting user visual acceptance

Use overlay header/dock with stable content spacing, previous/contents/settings/next shortcuts, a chapter-position label and progress, theme controls grouped with font settings, and chapter continuation before comments. Keep current fonts, palettes, Thai text and Dialogue Cards. The [interactive layout companion](../reader-layout/preview.html) is a browser reconstruction, not a native screenshot. It cannot establish Thai wrapping, safe areas, image gestures or accessibility on Android. WF-0006 remains open until the user reviews and accepts or requests changes.

## Acceptance matrix

| Requirement | Workspace evidence | Final Android check |
| --- | --- | --- |
| Find saved chapters without metadata, beyond fallback ranges; ignore corrupt files and recover backups | offline.test.ts | Airplane-mode cold start; inspect recovered books and chapters |
| Saved/bundled text opens without waiting for network | offline, bookshelf, startup and download UI tests | Compare online, offline and slow-network cold starts on same device/library |
| Correct text-only/complete states and missing-image retry | offline and download UI tests | Interrupt illustrated download, reopen offline, reconnect and retry |
| Revised chapter retrieval preserves old text on failure and retains progress | explicit-update offline/UI tests | Update an illustrated chapter, interrupt once; verify old text and resume remain available |
| Progress flush on blur/background/exit and isolated chapter IDs | readingProgress and Reader tests | Read middle of ch-69, background/kill/reopen; previous/next/back/contents |
| Reader controls and saved typography/theme | Reader tests plus browser companion | Small screen/font 26, all themes, TalkBack, native font/safe-area layout |
| Existing library/settings/progress survive installation update | Storage keys/paths unchanged | Install final APK over existing app without clearing data |
| Smooth chapter rendering and bounded library scan cost | Automated tests do not establish these | Record startup/library size, profiler frame/memory evidence; no numeric performance claim yet |

## Final device record

For each check record device/Android version, app version/build, source commit, number of saved chapters, network condition, steps, observed result and evidence. Use `reader-mobile/VALIDATION.md` as the runbook. Do not uninstall or clear app data to make acceptance pass. No baseline or intermediate cloud build is required; create the final APK only after visual feedback and implementation are ready. Native checks remain unchecked until evidence exists.

## Closure gates

WF-0004: local authority decision and source evidence recorded. WF-0005: entry/refresh/update contract and automated evidence recorded. WF-0006: user visual acceptance required. WF-0007 and parent map: finalize only once WF-0006 is accepted and outstanding decisions have answers; keep Android validation obligations explicit rather than claiming a device result from Jest/Metro.
