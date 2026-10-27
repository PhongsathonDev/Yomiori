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

## Storage behavior

Existing progress/settings keys, simple illustration filenames and chapter JSON paths are preserved. A `.json.bak` recovery file is readable if a legacy iOS move is interrupted. Only validated text counts as readable; illustration completeness is tracked separately. Bundled `kyudo-senpai/ch-01` remains available after clearing downloaded files. Reclaimable byte totals include downloaded files, temporary files and recovery files, but exclude bundled assets and retained catalog metadata.

Text auto-caching does not wait for image downloads. Clearing a novel invalidates previous cache generations so an earlier request cannot restore accepted chapter/image files after the clear. The app retains the catalog metadata and reading progress.

## Required device checks before release

These require Android and iOS devices/development builds. Jest and Metro exports cannot verify native gesture behavior, filesystem behavior under actual storage exhaustion, smoothness, or OS lifecycle guarantees.

1. Download an illustrated chapter and a chapter above the bundled fallback range. Close the app, enable airplane mode, reopen it and verify bookshelf → detail → reader → image lightbox.
2. Interrupt an image download. Confirm text remains readable, the partial state is visible, and retry fills missing images after reconnecting.
3. Open `kyudo-senpai/ch-69`, scroll to the middle, leave the app and return. Close/reopen the app and verify the saved position. Test back, next chapter and immediate return as well.
4. In React Native DevTools Profiler, record continuous scrolling through that chapter. Confirm `ReaderStory` does not commit solely due to progress updates. Compare frame time and memory on a lower-end Android device before deciding on virtualization.
5. Check a 320-point phone and a tablet in light/dark/sepia at font sizes 14 and 26 with all line-height options. Verify Thai wrapping, typography modal safe area and bottom controls.
6. Tap narration to hide/show controls; tap a speaker and an illustration independently. Confirm those actions do not toggle controls. Check native zoom/close and TalkBack/VoiceOver labels.

Keep the current ScrollView/navigation architecture for this change. Follow-up release work includes font-loading failure handling, Android image zoom verification, broader accessibility checks and native lifecycle/performance testing. No FPS or native React Profiler result is claimed from Jest rendering tests.
