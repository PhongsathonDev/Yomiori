# Reader reliability validation

Run from `reader-mobile`:

```sh
npm run typecheck
npm run lint
npm test
npx expo export --platform android --output-dir dist/android --max-workers 2
npx expo export --platform ios --output-dir dist/ios --max-workers 2
```

## Behavioral coverage

- Chapter shape/identity validation, corrupted JSON recovery, HTTP errors and ten-second timeouts including response-body stalls.
- Staged writes and recovery backups, failed writes/full storage, ordered writes, invalidation of in-flight caches on clear.
- Local illustrations, non-success HTTP responses, partial downloads, missing-image retries and overlapping offline jobs.
- Persisted remote catalog/manifest/characters and backward-compatible settings/progress.
- Progress throttling with fake timers, final flush, write failures and chapter isolation.
- Reader error/retry state, stale chapter requests, background flush and rendering work for the real 147-block `kyudo-senpai/ch-69` chapter.
- Download UI: honest batch summaries and mutually exclusive single/batch/delete actions.
- Saved-file discovery without catalog/manifest metadata, recovery above legacy fallback ranges, backup validation and overlapping scans/writes.
- App usability during font loading/failure, bookshelf usability during stalled catalog reads and local chapters during stalled online refresh.
- Direct table-of-contents access from the Reader header.
- Stable scroll-content spacing when Reader tools are hidden/revealed, dock navigation with progress flush, and persistent theme/font changes from the reading settings sheet.

## 28 October 2026 validation

Validated the existing Expo 58 / React Native 0.88 dependency upgrade together with the Reader refinement. `expo install --check`, TypeScript, Expo ESLint and all 55 Jest tests pass. Local Android Metro export also passes (2,975 modules); this checks the JavaScript/assets bundle, not native compilation. The layout detector reported no findings on the changed Reader layout files. Browser layout review is documented in `.wayfinder/assets/reader-layout/README.md`; it is not native visual verification. No cloud build or APK was created.

## Storage behavior

Existing progress/settings keys, simple illustration filenames and chapter JSON paths are preserved. A `.json.bak` recovery file is readable if a legacy iOS move is interrupted. Only validated text counts as readable; illustration completeness is tracked separately. Bundled `kyudo-senpai/ch-01` remains available after clearing downloaded files. Reclaimable byte totals include downloaded files, temporary files and recovery files, but exclude bundled assets and retained catalog metadata.

Validated chapter files are also used to recover catalog entries and chapter lists when metadata is missing or stale. Local reads do not initiate network requests on metadata cache misses. Concurrent scans share work, but completed writes invalidate reuse of earlier in-flight scans. No persisted index migration or file relocation is required. Chapter bodies are not retained in a whole-library memory cache.

The app renders while font assets load and uses system typefaces until ready. A font error leaves content usable. Only the seven used font files are imported. Bundled Black Cat chapters are immediately readable without trying the CDN first; explicit downloads still cache required illustrations. Recursive byte totals are deferred until the storage sheet is opened.

Text auto-caching does not wait for image downloads. Clearing a novel invalidates previous cache generations so an earlier request cannot restore accepted chapter/image files after the clear. The app retains the catalog metadata and reading progress.

## Required device checks before release

These require Android and iOS devices/development builds. Jest and Metro exports cannot verify native gesture behavior, filesystem behavior under actual storage exhaustion, smoothness, or OS lifecycle guarantees.

1. Download an illustrated chapter and a chapter above the bundled fallback range. Close the app, enable airplane mode, reopen it and verify bookshelf → detail → reader → image lightbox.
2. Interrupt an image download. Confirm text remains readable, the partial state is visible, and retry fills missing images after reconnecting.
3. Open `kyudo-senpai/ch-69`, scroll to the middle, leave the app and return. Close/reopen the app and verify the saved position. Test back, next chapter and immediate return as well.
4. In React Native DevTools Profiler, record continuous scrolling through that chapter. Confirm `ReaderStory` does not commit solely due to progress updates. Compare frame time and memory on a lower-end Android device before deciding on virtualization.
5. Check a 320-point phone and a tablet in light/dark/sepia at font sizes 14 and 26 with all line-height options. Verify Thai wrapping, typography modal safe area and bottom controls.
6. Tap narration to hide/show controls; tap a speaker and an illustration independently. Confirm those actions do not toggle controls. Check native zoom/close and TalkBack/VoiceOver labels.

Keep the current ScrollView/navigation architecture for this change. Follow-up release work includes Android image zoom verification, broader accessibility checks and native lifecycle/performance testing. Do not trigger an intermediate cloud build: the user requested an APK only after the changes are ready. No FPS or native React Profiler result is claimed from Jest rendering tests.

## Comment persistence follow-up — 28 October 2026

TypeScript, Expo lint and all 59 Jest tests pass. Added regression coverage for concurrent comment/like writes, storage read/write failure recovery, retaining a failed draft, and preventing the initial comment load from replacing a new comment. Mutations now propagate storage errors and serialize updates per storage key. The composer keeps the draft on failure and prevents repeated submission while saving; likes update only after persistence succeeds. Existing storage keys are preserved. Repaired missing transitive lockfile entries found during clean dependency installation. No APK/native validation was performed for this follow-up.

## Bundled offline availability follow-up — 28 October 2026

Bundled Black Cat chapters and Kyudo chapter 1 now share the same local lookup used by reading, offline status and chapter discovery. Saved chapter files still take precedence. Bundled text is not copied into downloaded storage when requesting missing illustrations. Chapter lists check whether bundled illustrations are present before reporting completeness. The offline management label describes availability without claiming bundled chapters were downloaded. TypeScript, lint and 60 Jest tests pass; native Android filesystem and performance checks remain pending.

## Concurrent refresh follow-up — 28 October 2026

Requests for the same URL share in-flight headers/body parsing and a ten-second deadline. Successful and failed requests release their entry, so later refreshes fetch new data and retries recover after HTTP failures or timeouts. Different URLs proceed independently. TypeScript, Expo lint and all 63 Jest tests pass, including stalled-body sharing, fresh subsequent reads, failed-request retries and unrelated requests during a stall. This reduces duplicate network work; it does not establish Android startup timing. No APK build was triggered.

## Wayfinder completion pass — 28 October 2026

TypeScript, Expo lint and all 66 Jest tests pass. Added explicit updates for locally readable chapters from the offline management sheet: validate new text before staged replacement, retain existing readable data on failed fetch/validation/write, preserve progress, retry missing images and serialize against download/delete UI jobs. Tests cover successful updates, invalid responses, storage failure, offline bundled preservation and UI job locking. Acceptance details and remaining visual/native gates are in `.wayfinder/assets/reader-contract/spec.md`. Expo 58 docs retrieval was attempted but returned HTTP 403; the implementation reuses existing API/UI patterns without introducing new native dependencies or APIs.

Local Android Metro export also passed (2,975 modules; output `/tmp/yomiori-wayfinder-android`). This verifies JavaScript/assets bundling, not APK/native compilation or device behavior.

Minimal Reader revision after user feedback: muted 18-point icons, single-row dock, 12-point single-line header and icon-only reveal. Tap targets remain 48 points and accessibility labels are preserved. Typecheck, lint and 66 tests pass. New visual/native acceptance is pending.
