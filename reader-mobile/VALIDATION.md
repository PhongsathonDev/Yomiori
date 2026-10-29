# Reader Mobile validation runbook

This file owns current validation commands and device checks. Previous results and design iterations are preserved in [VALIDATION_HISTORY.md](VALIDATION_HISTORY.md); they do not certify the current commit. Record the commit, commands, observed results and any unverified checks when delivering work.

## Automated checks

Run from reader-mobile:

```sh
npm run typecheck
npm run lint
npm test
```

Typecheck and lint are required by [mobile instructions](AGENTS.md). Run behavioral tests relevant to the change; run the full suite for changes across reading, storage, downloads or progress.

For changes affecting platform bundling, also export the relevant platforms:

```sh
npx expo export --platform android --output-dir dist/android --max-workers 2
npx expo export --platform ios --output-dir dist/ios --max-workers 2
```

An export checks JavaScript/assets bundling. It does not compile an APK or prove native behavior. APK delivery instructions live in [MOBILE_GUIDE.md](../MOBILE_GUIDE.md); do not trigger an intermediate cloud build. The user requested an APK after the changes are ready.

## Behavior and evidence routes

| Changed area | Contract / evidence to consult |
| --- | --- |
| Reading, saved chapters, refresh, downloads, progress or controls | [Reader contract and acceptance matrix](../.wayfinder/assets/reader-contract/spec.md), corresponding tests in __tests__/ |
| Meaning of offline/bundled/downloaded/resume labels | [Product terms](../CONTEXT.md) |
| Library scan reuse/cost | [Reuse decision](../.wayfinder/assets/android-scan-cost/reuse-decision.md), [original benchmark](../.wayfinder/assets/android-scan-cost/report.md) |
| Earlier validation or visual decisions | [Historical results](VALIDATION_HISTORY.md), then the relevant dated entry and ticket |

Run npm run benchmark:scan from reader-mobile when changing library scan behavior. It uses in-memory fixtures and counts operations; npm test does not run this harness. Desktop times/counts are not Android startup or memory measurements.

## Required device checks before delivery

Use Android devices/development builds for the current Android delivery scope. Repeat applicable checks on iOS if iOS delivery is in scope. Automated tests, Metro exports and browser companions cannot establish native gestures, actual storage exhaustion, smoothness or OS lifecycle behavior.

1. Download an illustrated chapter and a chapter above the legacy fallback range. Close the app, enable airplane mode, reopen and verify bookshelf → detail → reader → image lightbox.
2. Interrupt an image download. Confirm text remains readable, partial status is visible and retry fills missing images after reconnecting.
3. Open kyudo-senpai/ch-69, scroll to the middle, background/return and close/reopen. Verify resume position, back, previous/next and the in-reader chapter picker. Also exercise interrupted text updates and confirm the old readable copy/progress survive failure.
4. Profile continuous scrolling through that chapter. Confirm ReaderStory does not commit solely due to progress updates; measure frame time and memory on the target device before making performance claims or changing virtualization.
5. Check a 320-point phone and a tablet in light/dark/sepia at font sizes 14 and 26, with all line-height options. Verify Thai wrapping, safe areas, settings, chapter picker and bottom controls.
6. Tap narration to hide/show controls; tap speakers and illustrations independently. Check reveal, image zoom/close and TalkBack/VoiceOver labels.
7. Install the final APK over the existing app without uninstalling or clearing data. Verify saved chapters, settings and progress remain available.

Record device/OS, app version/build, source commit, library size, network condition, steps, observed results and evidence in the relevant delivery ticket. Preserve the existing package/signing identity. Keep inaccessible or unperformed checks explicitly pending; current Android device work is tracked in [ตรวจ APK สุดท้ายบน Android จริง](../.wayfinder/issues/WF-0008.md).
