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

Whenever the user asks to add, convert, update, or import chapters into the reader, you **MUST complete ALL 6 steps below**. Missing chapter exports, manifest entries or CDN deployment can leave chapters unavailable on mobile. Source-only acquisition follows `novels_source/README.md` and does not itself publish reader chapters.

### Step 1: Parse and Convert Chapter to Structured JSON
- Read raw chapter directly from `novels_source/<novel-id>/` (for example, `Ch_01_<title>.md`). Keep all novel sources under `novels_source/`; do not create a separate staging folder or nested chapter-source folder.
- Convert into `reader-web/src/data/novels/<novel-id>/chapters/ch-XX.json`:
  - Follow `Chapter` and `StoryBlock` in `reader-web/src/types.ts` and `reader-mobile/src/types/index.ts`: include `novelId`, `novelTitle` and a unique `id` for every block.
  - Preserve text as `narration` or `dialogue`, scene separators as `scene_break`, and images in their original positions as `illustration` blocks.
  - Every `dialogue` block must have a valid `speakerId` and `speakerName`.
- Update `reader-web/src/data/novels/<novel-id>/chapters/index.ts` to import and export the new chapters.
- If new characters appear, add them to `reader-web/src/data/novels/<novel-id>/characters.json` with `id`, `name`, `role`, `color`, `aliases`, and `description`.

### Step 2: Quality & Fidelity Verification (Zero-Loss Rule)
- Verify 100% text fidelity between raw text and converted JSON. No paragraphs or dialogues may be omitted or summarized.
- Compare the story body paragraph by paragraph in order, excluding only source headers/metadata as defined in `novels_source/README.md`; check scene separators and illustrations separately. The length ratio from `reader-web/scripts/verify-conversion.mjs` is only a warning signal, not proof of fidelity. Its current pass range is 96–104% after normalization.
- Check that no dialogue has `unknown` speaker or invalid speaker ID.

### Step 3: Synchronize with Mobile App (`reader-mobile`)
Keep mobile data copies synchronized, and check the actual runtime lookup separately:
- Copy `ch-XX.json` to `reader-mobile/src/data/novels/<novel-id>/chapters/ch-XX.json`.
- Update `reader-mobile/src/data/novels/<novel-id>/chapters/index.ts` to export all chapters.
- Sync `characters.json` to `reader-mobile/src/data/novels/<novel-id>/characters.json`.
- `getBundledChapter` is defined in `reader-mobile/src/services/storage.ts`. It currently exposes Kyudo chapter 1 and the imported Black Cat chapter collection. Copying a JSON file or exporting it from an otherwise unused index does not make it runtime-bundled.
- Preserve the existing bundled scope unless the task explicitly changes it. For chapters intended to ship with the app, verify that the runtime lookup imports and exposes them; source synchronization alone is insufficient.
- `getAvailableChapterList` in `reader-mobile/src/services/api.ts` merges the CDN manifest, Black Cat bundled entries and validated saved chapters. Its legacy no-manifest fallback lists Kyudo 1–25 and Boyish 1–14; these are catalog entries, not evidence of bundled text. Do not increase fallback counts as a substitute for a manifest or invent entries for unconverted novels.
- Verify new chapters in the generated CDN manifest. Runtime bundle changes require a new app build to reach installed apps; publishing CDN data does not update an APK's bundled files.

### Step 4: Run Web Build & Manifest Generator
Run the production build in `reader-web`:
```bash
cd reader-web && npm run build
```
This triggers `scripts/postbuild.mjs`, which:
- Exports all JSON data to `dist/data/`.
- Automatically rebuilds `manifest.json` for each novel with updated `totalAvailable` and chapter index.

### Step 5: Commit, Push and Deliver CDN Changes
Commit only the files belonging to the task and push the current development branch, as required by the delivery preference below. Inspect `git status` and the current branch first; do not stage unrelated work.
```sh
git add -- <task-file-1> <task-file-2>
git commit -m "feat(<novel-id>): add Ch.XX-YY and sync mobile cdn"
git push origin HEAD
```
The mobile CDN is published by `.github/workflows/deploy.yml` on pushes to `main` or `master` (or a manual workflow dispatch). A development-branch push alone does not publish chapters to the production CDN. For normal chapter delivery on `main`, verify that the pushed commit is on that branch. If working on another branch, complete the authorized integration into a deployment branch before claiming production availability; otherwise report CDN deployment as pending. `git push origin main` from another branch pushes the local `main` ref, not necessarily the current work.

### Step 6: Verify Deployment Status
- Find the deployment run for the exact commit delivered to the deployment branch:
  ```sh
  gh run list --workflow deploy.yml --commit <deployed-commit-sha>
  gh run watch <run-id> --exit-status
  ```
- Require both a successful matching deployment and HTTP status 200 for the affected chapter JSON and novel manifest, for example `curl.exe -f -I https://phongsathondev.github.io/Yomiori/data/novels/<novel-id>/chapters/ch-XX.json` on Windows. The HTTP protocol version may vary. For modified chapters, compare the fetched JSON content with the expected data; an existing URL returning 200 does not prove the update is live.

---

## 📚 Key Reference Files
- Nekopost source acquisition standard (read before fetching or updating raw sources): `novels_source/README.md`
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
