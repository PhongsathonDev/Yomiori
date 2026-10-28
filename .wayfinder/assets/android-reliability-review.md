# Reader Mobile reliability review — 28 October 2026

Scope selected by user: Android reading reliability and offline availability. Static source review; no native device observations or performance measurements are claimed. Existing local-first reads, staged writes/backups, generation invalidation and explicit update behavior are valuable foundations, already documented in `reader-mobile/VALIDATION.md`.

## Recommended order

1. Decide resume-position semantics before changing persistence. `ReaderScreen.tsx` computes progress from the entire ScrollView content height, which includes chapter navigation and `ChapterCommentsSection`. `readingProgress.ts:getResumeOffset` reconstructs a pixel position from that percentage. Comments load asynchronously and can expand; the denominator can change independently of story position. Restoration can run again before dragging, but is deliberately disabled once reading starts. Font/line-height changes after dragging do not anchor the visible story block. These are code-level reasons for position drift; the magnitude still needs a reproducible scenario. Cover delayed comments, font changes, image layout, reopen, and updated/deleted block IDs. Preserve compatibility with old percentage progress.

2. Measure repeated offline discovery before selecting an optimization. `storage.ts:scanSavedNovel` reads and validates chapter bodies and checks local illustration completeness. Its shared cache lasts only while a scan is in flight. `getSavedLibrary` visits each novel; `api.ts:fetchNovels` awaits that library. Bookshelf performs cached and refreshed catalog/extras passes. This suggests repeated I/O for larger libraries, not proof of current Android slowness. Collect operation counts and timings; retain validated-file recovery even if metadata reuse is added. Do not introduce a database or virtualization without evidence.

3. Complete the existing final-device gate after the chosen code changes. The previous map is closed for specification, while `ตรวจ APK สุดท้ายบน Android จริง` remains open. Required evidence includes upgrade preserving data, airplane-mode illustrated chapters, interrupted updates, lifecycle resume, low-end scrolling/memory, TalkBack, and image zoom. `ImageLightboxModal.tsx` also captures Dimensions at module load, so window-size changes need a deliberate reproduction. Native zoom functionality has not been established by this source audit.

## Smaller findings and deferred work

- `BookshelfScreen.tsx:353` renders a fixed `25 ตอน` for every novel; use a clearly defined actual available/original count. At line 217, splitting the title on `ผม` can truncate or empty a valid title. These are factual display defects, smaller than the selected reading/offline priorities.
- `ChapterCommentsSection.tsx:108–111` creates a comment as already liked with one like without recording its ID in liked storage. The first heart tap can therefore add a second like instead of unlike. `api.ts:180–194` overlays liked IDs only on top-level bundled/remote comments, not user comments or replies, so reopening can disagree with prior taps.
- Comments only receive a top-level object check in `api.ts`; persisted comments and liked IDs are JSON-parsed without shape validation in storage. Valid JSON with the wrong shape can fail array operations or rendering. Treat this as a future reliability follow-up; it is outside this map's core reading/offline decisions.

## Validation boundaries

This review does not establish native filesystem behavior, FPS, APK installation, Android startup timing, or successful zoom. Typecheck/lint results for the current checkout are reported with delivery. No runtime changes or new regression tests were made in this planning pass.
