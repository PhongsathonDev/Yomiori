# Yomiori AI Assistant Guidelines & Protocols

This file is automatically loaded by Antigravity and AI coding assistants working in this repository. Follow these instructions strictly.

---

## 🎯 Architecture Overview

Yomiori is a cross-platform novel reading platform consisting of:
1. **`reader-web`**: React + TypeScript + Vite web reader hosted on GitHub Pages (`https://phongsathondev.github.io/Yomiori/`).
2. **`reader-mobile`**: React Native + Expo standalone mobile reader.
3. **Headless CDN**: GitHub Pages serves novel JSON chapters, character metadata, and illustrations under `/data/...` (e.g. `https://phongsathondev.github.io/Yomiori/data/novels/<novel-id>/`).

---

## 🚨 MANDATORY PROTOCOL: Adding or Modifying Novel Chapters

Whenever the user asks to add, convert, update, or import new chapters for any novel, you **MUST complete ALL 6 steps below**. Skipping any step will break the mobile app (resulting in 404 Chapter Not Found or missing chapters in the list).

### Step 1: Parse and Convert Chapter to Structured JSON
- Read raw chapter from `novels_source/<novel-id>/raw_chapters/`.
- Convert into `reader-web/src/data/novels/<novel-id>/chapters/ch-XX.json`:
  - `blocks`: Split between `narration` and `dialogue`.
  - Every `dialogue` block must have a valid `speakerId` and `speakerName`.
- Update `reader-web/src/data/novels/<novel-id>/chapters/index.ts` to import and export the new chapters.
- If new characters appear, add them to `reader-web/src/data/novels/<novel-id>/characters.json` with `id`, `name`, `role`, `color`, `aliases`, and `description`.

### Step 2: Quality & Fidelity Verification (Zero-Loss Rule)
- Verify 100% text fidelity between raw text and converted JSON. No paragraphs or dialogues may be omitted or summarized.
- Check that no dialogue has `unknown` speaker or invalid speaker ID.

### Step 3: Synchronize with Mobile App (`reader-mobile`)
The mobile app contains offline bundled copies and manifests:
- Copy `ch-XX.json` to `reader-mobile/src/data/novels/<novel-id>/chapters/ch-XX.json`.
- Update `reader-mobile/src/data/novels/<novel-id>/chapters/index.ts` to export all chapters.
- Sync `characters.json` to `reader-mobile/src/data/novels/<novel-id>/characters.json`.
- In `reader-mobile/src/services/api.ts`:
  - Ensure `getAvailableChapterList` includes the novel in the bundled merge logic.
  - Ensure `getBundledChapter` supports the novel.
  - Ensure offline fallback count covers the new chapters.

### Step 4: Run Web Build & Manifest Generator
Run the production build in `reader-web`:
```bash
cd reader-web && npm run build
```
This triggers `scripts/postbuild.mjs`, which:
- Exports all JSON data to `dist/data/`.
- Automatically rebuilds `manifest.json` for each novel with updated `totalAvailable` and chapter index.

### Step 5: Git Commit & Push to `origin main`
**CRITICAL**: The mobile app fetches chapters and manifests directly from the GitHub Pages CDN (`https://phongsathondev.github.io/Yomiori/data/...`). If changes are not pushed to GitHub, GitHub Actions will not deploy them, and mobile users will encounter 404 errors!
```bash
git add .
git commit -m "feat(<novel-id>): add Ch.XX-YY and sync mobile cdn"
git push origin main
```

### Step 6: Verify Deployment Status
- Check GitHub Actions:
  ```bash
  gh run list -L 1
  ```
- Verify that the workflow succeeds (`✓`) and verify via `curl -sI https://phongsathondev.github.io/Yomiori/data/novels/<novel-id>/chapters/ch-XX.json` returning `HTTP/2 200`.

---

## 📚 Key Reference Files
- Detailed conversion examples: `AI_CONVERSION_GUIDE.md`
- Mobile app build & run instructions: `MOBILE_GUIDE.md`
- System blueprint: `SYSTEM_BLUEPRINT.md`

## Task grouping and dashboard protocol

When creating, editing, claiming, closing, or regrouping tasks, first read `.wayfinder/README.md` (including **Grouping and coordination**). The canonical tracker is `.wayfinder/issues/`, not `tasks.html`.

- Every new decision/task belongs to an existing map through `parent`, or a new map if its destination differs. Do not leave new tasks ungrouped without a documented reason.
- Put actual prerequisites in `## Blocked by`; put coordinated work in reciprocal `## Work with` links. A reference in prose is not a dependency. Do not invent dependencies or close tickets merely to organize the board.
- Group requests do not override Wayfinder's one-decision-ticket-per-session rule, HITL approval, or claims. Read the group's map and start only unblocked, unclaimed work.
- After any tracker/model change, run `node scripts/update-task-dashboard.mjs`, then `node --test scripts/wayfinder-model.test.cjs` and `node scripts/update-task-dashboard.mjs --check`. Commit the generated `tasks.html` with the tracker changes so direct `file:///` viewing has a current offline snapshot.
- Keep `tasks.html` standalone; its model/snapshot blocks are generated, not hand-edited. Edit `scripts/wayfinder-model.cjs` for shared relationship logic. Preserve GitHub refresh pinned to a single commit and offline fallback.

## Development delivery preference

The user requested on 28 October 2026 that every completed development change be committed and pushed to GitHub immediately. After completing the relevant checks, commit the finished work and push it to the current development branch without asking for confirmation again. Report any push failure explicitly.
