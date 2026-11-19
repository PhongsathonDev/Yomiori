# Netori Portrait Re-crop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the framing of the seven existing Netori character portraits in both square and circular views.

**Architecture:** Replace only the seven existing JPEG derivatives and document their exact source rectangles. Web and mobile continue to use their existing avatar paths and renderers.

**Tech Stack:** Python with Pillow for image preparation and validation; the existing Node reader tests for asset and roster checks.

**Spec:** [Netori portrait re-crop](../specs/2026-11-19-netori-portrait-recrop-design.md)

## Global Constraints

Keep all seven existing paths, the 512×512 JPEG format and the original color or monochrome treatment. Do not regenerate the art, edit the source illustrations, change the cover or banner, or touch the novel text or reader UI.

## Review Focus

- Charlotte’s face must not hug the right edge in the circle; review the before-and-after at avatar size.
- Keep the manga panel out of Shinji’s portrait where possible without cropping the face; review at full resolution.
- Circle corners can clip hair even when a square looks good; compare all seven at 52 px and 144 px.
- A square crop extending beyond the source silently introduces padding; assert bounds before exporting.
- Replacing a JPEG under the wrong name gives the wrong character the portrait; compare source and output labels and run the roster test.

### Task 1: Replace and verify the seven portrait assets

**Files:**
- Modify: `reader-web/public/illustrations/char_netori_{agane,alvin,charlotte,ferry,miris,renka,shinji}.jpg`
- Modify: `novels_source/netori-mahoutsukai-no-bouken/visual-assets.md`
- Run unchanged: `reader-web/tests/netori-skeleton.test.mjs`

**Interfaces:** Use the existing source filename per portrait from `visual-assets.md`; publish at the same avatar paths listed in the roster.

- [ ] Make a labeled baseline sheet from all seven existing JPEGs, with square and round views at 52 px and 144 px. Confirm the existing off-center Charlotte crop and panel clutter in Shinji's image.
- [ ] Inspect the four full source illustrations and choose a square rectangle around each face. Assert `0 <= left < right <= width`, `0 <= top < bottom <= height`, and `right - left == bottom - top` for each Pillow crop. Export to a temporary directory as RGB JPEGs at 512×512 using Lanczos and quality 88.
- [ ] Make an equivalent candidate sheet. Match each portrait to the documented source character and check face position, hair, chin and neighboring artwork. Compare Shinji at 512 px as well. Adjust any failed frame before replacing its JPEG.
- [ ] Replace the seven files at their current paths. Record the exact `(left, top, right, bottom)` rectangles in `visual-assets.md`, noting any source-limited framing. Decode all seven files with Pillow and assert JPEG format and `(512, 512)` dimensions.
- [ ] Run `node --test tests/netori-skeleton.test.mjs` from `reader-web`; expect four passing tests, including roster parity, assets and cover integrity. Run `git diff --check` and confirm the changed paths are limited to the seven JPEGs and task documentation.
- [ ] Commit only the portrait assets and their task documentation; push the current branch following `AGENTS.md`.
