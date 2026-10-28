# Reader layout companion

This is a browser reconstruction for reviewing the Reader's information hierarchy. It is **not a React Native render or an Android screenshot**. The app implementation lives in `reader-mobile/src/components/ReaderChrome.tsx`, `ReaderStory.tsx`, `TypographyModal.tsx` and `src/screens/ReaderScreen.tsx`.

Run `python .wayfinder/assets/reader-layout/generate-preview.py` from the repository root, then serve the repository over localhost and open `preview.html`. Installed font assets in `reader-mobile/node_modules` are required. The generator reads the real chapter, character data and theme palette without modifying them.

Query parameters: `theme=light|dark|sepia`, `size=14..26`, `sheet=1`. The tools toggle and theme/size controls are interactive. Chapter navigation and font/line-height choices are illustrative only. The sample uses the first 24 blocks and a fixed 50% indicator; it does not demonstrate real progress restoration or offline behavior.

Inspected in Chrome at 390×844/light/17, 320×720/dark/26, 320×720/sepia/settings and 768×1024/light/19. No horizontal page overflow was visible. The native implementation retains a two-line settings preview, native theme icons and measured safe-area spacing, which this companion only approximates. Native Thai wrapping, safe areas, gestures, accessibility scaling and performance remain device checks.

Direction implemented: fixed overlays that do not resize the reading viewport when hidden; chapter position plus previous/contents/settings/next shortcuts; themes grouped with typography; left-aligned chapter titles and paragraphs; chapter continuation before comments. Existing palette, Thai fonts and Dialogue Cards are retained. User visual feedback is still pending in WF-0006.

## Minimal revision after user feedback

The user found the first companion too large and prominent. The current generator and native Reader use a single row of muted 18-point icons without colored button panels or visible text labels, a single-line 12-point header, and an icon-only reveal button. Native tap targets remain 48 points. Initial content spacing follows the shorter controls. The earlier Chrome inspection above applies to the preceding layout; the new revision has not been visually accepted or checked on Android. TypeScript, lint and all 66 tests pass for this revision.

### 28 October 2026 — Screenshot-led floating pill

User prefers the older small floating capsule shown in Screenshot_20261028_094916_Yomiori.jpg. Revised the native dock to a centered capsule (max width 440), with font/size chip opening settings, a small contents shortcut and three direct theme selectors. Moved previous/next/hide to the header and restored a small header percentage. Tap targets remain 48 points. Dock controls are excluded while the settings sheet is open to avoid duplicate accessibility controls. Updated the browser companion; it remains an approximation, not a native screenshot. TypeScript, lint and 67 tests pass, including direct theme persistence and font-chip access. User visual acceptance of this revision is still pending.
