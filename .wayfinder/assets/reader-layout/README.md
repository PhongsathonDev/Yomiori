# Reader layout companion

This is a browser reconstruction for reviewing the Reader's information hierarchy. It is **not a React Native render or an Android screenshot**. The app implementation lives in `reader-mobile/src/components/ReaderChrome.tsx`, `ReaderStory.tsx`, `TypographyModal.tsx` and `src/screens/ReaderScreen.tsx`.

Run `python .wayfinder/assets/reader-layout/generate-preview.py` from the repository root, then serve the repository over localhost and open `preview.html`. Installed font assets in `reader-mobile/node_modules` are required. The generator reads the real chapter, character data and theme palette without modifying them.

Query parameters: `theme=light|dark|sepia`, `size=14..26`, `sheet=1`. The tools toggle and theme/size controls are interactive. Chapter navigation and font/line-height choices are illustrative only. The sample uses the first 24 blocks and a fixed 50% indicator; it does not demonstrate real progress restoration or offline behavior.

Inspected in Chrome at 390×844/light/17, 320×720/dark/26, 320×720/sepia/settings and 768×1024/light/19. No horizontal page overflow was visible. The native implementation retains a two-line settings preview, native theme icons and measured safe-area spacing, which this companion only approximates. Native Thai wrapping, safe areas, gestures, accessibility scaling and performance remain device checks.

Direction implemented: fixed overlays that do not resize the reading viewport when hidden; chapter position plus previous/contents/settings/next shortcuts; themes grouped with typography; left-aligned chapter titles and paragraphs; chapter continuation before comments. Existing palette, Thai fonts and Dialogue Cards are retained. User visual feedback is still pending in WF-0006.
