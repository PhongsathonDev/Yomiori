# Reader Android: behavior and acceptance contract

Status: WF-0004/5/7 specification decisions are finalized; the historical capsule direction was accepted on 28 October 2026. Current implementation notes below were reconciled with source on 29 October 2026, including later visual and scan-reuse changes. Android APK/device validation remains open in WF-0008. This is a personal Android reader, with no account, public release or navigation redesign in scope. It preserves existing file paths, settings and reading progress. This document records the detailed contract for WF-0004/5/7 together with links to subsequent decisions; historical acceptance does not establish acceptance or native validation of every later revision.

## Local library authority

Validated saved chapter files, including readable recovery backups, establish local availability even when the manifest/catalog is missing. Reject invalid chapter shapes and mismatched identities. Merge these summaries with cached/remote metadata and bundled chapter summaries, deduplicate IDs and sort by chapter number. Saved text overrides bundled text. Remote metadata must not hide a saved chapter above the old fallback range or a saved novel absent from the catalog.

Use validated file discovery rather than a new persisted index. The later [scan-reuse decision](../android-scan-cost/reuse-decision.md) retains completed chapter summaries within the current process, keyed by file revision/generation; concurrent scans also share work. App writes, updates, deletes and image saves invalidate summary reuse. I/O-error results are not retained, and a fresh process verifies files again. Chapter bodies are released after each summary is produced. External file changes during the same process may not appear in the list until restart, as accepted in that decision. The earlier full-rescan behavior is historical; desktop operation counts do not establish Android startup time or memory cost. Revisit persisted indexing only with further evidence and an explicit decision.

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

## Current Reader implementation and visual history

The user accepted the earlier `f5ecc21` capsule revision in [WF-0006](../../issues/WF-0006.md). Later work restored the shipped 1.0.0 source `a4f7ce93b5c085070e48cb2089bd8c9aee67f4fb`, then added the in-reader chapter picker and OLED dark surfaces. The [build identity record](../android-baseline/README.md) and dated follow-ups in [VALIDATION_HISTORY.md](../../../reader-mobile/VALIDATION_HISTORY.md) preserve that sequence. Do not restore `f5ecc21` over the current implementation merely because it appears in the earlier acceptance record.

Current code in [ReaderChrome.tsx](../../../reader-mobile/src/components/ReaderChrome.tsx) and [ReaderScreen.tsx](../../../reader-mobile/src/screens/ReaderScreen.tsx) uses a chapter-title header with back, chapter-picker and percentage controls; previous/next actions are below the story/comments. The bottom capsule has the font/size settings chip and direct light/sepia/dark selectors; it has no contents shortcut. It occupies 90% of the available width, capped at 480 points, with 32-point theme circles and expanded hit areas. Narration taps hide/show the controls, and an accessible reveal button is available while hidden. Dock controls are hidden from interaction/accessibility while settings or the chapter picker is open. Theme controls remain in the settings sheet. Keep the current fonts, Thai text, Dialogue Cards, saved preferences and OLED black palette unless the task changes them.

The [interactive layout companion](../reader-layout/preview.html) is a historical browser reconstruction, not the authority for the latest native layout or a native screenshot. It cannot establish Thai wrapping, safe areas, image gestures or accessibility on Android. WF-0006 stays closed for its recorded direction decision; later revisions and native validation retain their own acceptance requirements.

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

## Historical closure gates and outstanding device work

WF-0004 recorded the local authority decision and source evidence. WF-0005 recorded entry/refresh/update behavior and automated evidence. WF-0006 required user acceptance before WF-0007 and the parent map could finalize; that gate was satisfied as recorded below. These closed decisions do not close WF-0008 or certify subsequent revisions on a device. Keep current Android validation obligations explicit rather than claiming a device result from Jest/Metro.

### Final acceptance record

The user accepted the historical capsule revision (“โอเคละ”). WF-0001 and WF-0003–7 are closed for specification/design decisions. Final APK and Android evidence remain open in WF-0008; this acceptance is not device certification.
