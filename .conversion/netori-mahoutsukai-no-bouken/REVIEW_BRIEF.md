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

Work chapter by chapter and write the report entry as soon as that chapter is
decided, so partial progress is not lost.

1. Read the cue's speaker totals and the chapter title/first paragraph to know
   who is in the scene.
2. Scan the map's dialogue decisions in order. For each line, the assigned
   speaker must be plausible from the line itself, the address terms, and the
   recorded `WHY`/context. Open the cue around that token only when the line or
   the reason leaves real doubt. Do not re-read the whole narration for every
   line.
3. Confirm that quoted thoughts, titles, signs and sound effects were not turned
   into spoken dialogue. Check the quoted-narration decisions in the map.
4. Check group IDs are used only for genuinely unnamed/collective voices, and
   that every named character in the scene has a roster entry.
5. Check spans cover the token text exactly and no segment carries a `text`
   field.
6. Compute `jsonHash` of the final map exactly as `conversion-core.mjs` does.

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
