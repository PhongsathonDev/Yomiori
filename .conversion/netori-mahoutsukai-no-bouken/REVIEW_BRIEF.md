# Netori independent review brief

Novel ID: `netori-mahoutsukai-no-bouken`

You are the independent reviewer. You did not write these mappings. Do not edit
maps, decision files, plan, receipts, roster, catalog, indexes or sources. Read
only, verify, and report.

## Inputs

- Cue with numbered spans: `.conversion/netori-mahoutsukai-no-bouken/cues/<sourceId>.md`
- Final mapping: `.conversion/netori-mahoutsukai-no-bouken/maps/<sourceId>.json`
- Source chapter: shown in the cue header, under `novels_source/netori-mahoutsukai-no-bouken/`
- Roster: `reader-web/src/data/novels/netori-mahoutsukai-no-bouken/characters.json`

## Check every source

1. Rebuild mentally from the cue: every `DIALOGUE?` span became a dialogue block
   with a real roster speaker, and every `NARR-REVIEW?` span has a narration
   decision with a reason. `NARR` may stay narration.
2. For every dialogue block, open the surrounding cue paragraphs and confirm the
   speaker from evidence: narration tags, who is addressed, who answers, the
   scene's participants, gendered particles, nicknames. Report any line whose
   speaker is not supported.
3. Check quoted thoughts, titles, signs and sound effects were not turned into
   spoken dialogue; check spoken lines were not buried as narration.
4. Check group IDs are used only for genuinely unnamed/collective voices.
5. Check no prose was changed: spans cover the token text exactly and no text
   field exists.
6. Check the roster contains every named speaker in the chapter. Report missing
   names with the token ID instead of accepting a substitute.
7. Compute `jsonHash` of the final map exactly as `conversion-core.mjs` does.

## Report

Write `.conversion/netori-mahoutsukai-no-bouken/reports/<batch>-review.json`:

```json
{
  "batch": "b01",
  "reviewer": "independent-review-1",
  "sources": [{
    "sourceId": "179518",
    "chapterNo": "0",
    "mapJsonHash": "<64 hex>",
    "result": "pass",
    "issues": []
  }]
}
```

`result` is `pass` only when every dialogue span has a supported speaker and
every quoted narration decision is justified. Otherwise `fail` with one issue
per item: `tokenId`, the observed problem, and the evidence that contradicts it.
Do not propose a new mapping file; the original worker must fix it and you must
review the changed hash again.

Final response: counts of pass/fail and the report path only.
