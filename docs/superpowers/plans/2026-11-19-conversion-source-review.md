# Conversion Source Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent new or changed raw chapters from being published without a recorded comparison to their upstream source.

**Architecture:** Keep the existing conversion pipeline, adding hash-bound source-review records and a per-chapter `apply` gate. `prepare` surfaces suspicious inputs and the publication audit verifies the evidence linked by new receipts without contacting the upstream host.

**Tech Stack:** Node.js ESM, built-in `node:test`, existing conversion core and CLI.

**Spec:** [ตรวจต้นฉบับก่อนแปลงบท](../specs/2026-11-19-conversion-source-review-design.md)

## Global Constraints

- Keep scraper, reader outputs, existing corpus/source/plan/maps/receipts and legacy baseline untouched. Use temporary fixtures for behavior tests. Work in the current checkout as requested; stage only task paths, separate from the concurrent Boyish Friend recovery.
- No new dependencies, upstream network access in CLI/CI, automatic confirmation, or retroactive review of unchanged certified chapters. Continue to enforce the existing whole-novel and legacy rules.
- Source proof means the reviewer compared the body in order, beginning and end, notes and illustrations against upstream; an inaccessible reference is not confirmation. Keep this distinct from speaker review and conversion fidelity.

## Review Focus

- Legitimate short or illustrated chapter → warning is not a rejection (`short sources can pass after review`).
- Ordinary-length but incomplete source → the review requirement does not depend on the warning (`missing review blocks only its chapter`).
- Markdown changes between inspection and recording or after review → stale SHA is rejected (`stale source review never overwrites output`).
- Missing, corrupt, or replaced record after apply → audit rejects the v2 receipt (`v2 audit requires the exact source review`).
- Existing v1 chapter after mapping-only edits → valid on the old source SHA without new review (`v1 compatibility is limited to the same source`).
- Receipt from an older checkout for a new source → not exempt (`a fresh source cannot pass audit or apply with a v1 receipt from an old tool`).
- Heading-only Markdown → block only that chapter during `prepare`; a healthy sibling can proceed (`prepare blocks an empty source but still prepares its sibling`).

---

### Task 1: Add the source-review gate and document the workflow

**Files:**
- Create: `reader-web/scripts/conversion-source-review.mjs` (warning, record validation and fingerprinting).
- Modify: `reader-web/scripts/conversion-pipeline.mjs` (CLI, apply and audit wiring).
- Test: `reader-web/tests/conversion-pipeline.test.mjs` (reuse temp fixture and align existing test inputs).
- Modify: `AI_CONVERSION_GUIDE.md` and `reader-web/README.md` (workflow and command reference).

**Interfaces:**
- CLI: `conversion source-review --novel <id> --source-id <id> --source-sha <sha256> --reference <upstream-reference> --reviewed-by <name> --reason <comparison-notes>`; obtain SHA from `inspect`. `source-review` stores the operator's confirmation, not a network check.
- Module: `warnOnShortSource(source, parsed)` returns `null` or `{ sourceId, file, code: 'short-source', textChars, illustrationCount }`. Sum parsed text token lengths in UTF-16, excluding preamble; warn if under 300, including zero. A note-only chapter like the known case falls under this warning; all lengths require review for new/changed source.
- Module: `recordSourceReview(ctx, source, { sourceSha256, reference, reviewedBy, note })` atomically writes and returns `{ version: 1, sourceId, sourceSha256, reference, reviewedBy, note }`; trim text fields and require each nonempty. Check the provided digest against the current Markdown bytes before writing. Path: `.conversion/<novel-id>/source-reviews/<source-id>.json`.
- Module: `requireSourceReview(ctx, source)` returns `jsonHash(record)` or throws a source-specific error. Validate record version, source ID, current SHA, and all text fields; malformed records are not confirmation.

- [ ] **Write failing fixture tests and adapt existing setup.** Exercise the operator command directly with `runCLI`. Give existing apply tests valid synthetic source reviews where they intend to isolate mapping/output failures; tests for skipped or excluded chapters must retain their original intent. Assert that:
  - `short sources can pass after review`: `prepare` CLI warns with the short fixture's source ID/file; recording review plus valid mapping yields `verified`. A registered image-only chapter with valid image bytes also succeeds after confirmation.
  - `missing review blocks only its chapter`: a long chapter with valid mapping and no source review gets `blocked`, creates neither web nor mobile JSON nor receipt, and a reviewed sibling succeeds in the same batch; a full audit remains incomplete.
  - `stale source review never overwrites output`: change Markdown after a successful apply, rerun `prepare` and regenerate the test map; recording the old SHA fails; apply is blocked and published outputs/receipt are byte-identical. Record the new SHA and apply successfully.
  - `v2 audit requires the exact source review`: a fresh receipt has `version: 2` and `sourceReviewSha256`; audit passes as written, fails after the corresponding record is deleted, invalid JSON or modified. Audit never fetches the URL.
  - `v1 compatibility is limited to the same source`: derive a pre-feature fixture receipt by changing version to 1 and removing proof hash; remove record and check audit passes with unchanged source. Mapping-only reapply may keep v1. Change the Markdown and assert apply blocks without a new review.
- [ ] **Run red:** `node --test reader-web/tests/conversion-pipeline.test.mjs`; confirm the new behavior is missing, not a fixture/setup error.
- [ ] **Implement helpers and command.** Validate the known source ID via `context`; use `parseArgs` and `writeJson`. Print warnings from `prepare` CLI to stderr with the source ID/file, text length and instruction to compare upstream; keep plan JSON on stdout and do not persist warning state in the plan. Preserve existing map files. Leave other CLI operations offline.
- [ ] **Wire the gate before any output mutation.** Only a v1 receipt whose source ID and Markdown SHA match the receipt in the pre-rollout Git commit may be reused or rebuilt as v1. No receipt, changed SHA or existing v2 requires `requireSourceReview` before the first asset/output write; write receipt v2 with `sourceReviewSha256`. Extend `checkCertified` to accept v1/v2 and require the exact matching source-review hash for v2, keeping the other checks and counters unchanged. Never downgrade v2 to v1. Existing `apply` blocked checkpoint handling lets siblings continue.
- [ ] **Document usage.** Add the pre-mapping upstream comparison, warning semantics, `inspect` → `source-review` command and stale-proof recovery to the owning conversion guide, including main-agent ownership and an explicit no-confirmation rule when the original is inaccessible. Add a CLI quick reference in the web README. Do not duplicate the detailed source-acquisition checklist.
- [ ] **Run green:** `node --test reader-web/tests/conversion-pipeline.test.mjs` then `npm --prefix reader-web test`, `npm --prefix reader-web run lint`, and `npm --prefix reader-web run conversion:check`. If unfinished Boyish Friend recovery blocks the working-copy audit, verify the committed snapshot separately and report both results. Run `git diff --check` on task paths.
- [ ] **Deliver only task files** per `AGENTS.md#delivery`: stage only the two design/plan docs and the five implementation/docs/test files above, commit `Require upstream source review for chapter conversion`, and push only if validation is green for the commit. Do not claim publication.
