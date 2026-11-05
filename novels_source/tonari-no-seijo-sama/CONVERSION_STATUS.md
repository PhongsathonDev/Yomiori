# Tonari no Seijo-sama — reader conversion complete

- Nekopost project 17301: https://www.nekopost.net/novel/17301
- Source catalog lists 35 entries; **all 35 chapter files and `_source.json` are stored** in this folder.
- All 35 source entries are text-only on Nekopost; no chapter illustrations were found or downloaded.
- Raw source completeness checked against the Nekopost chapter API (text matches for every chapter, including the ending).
- Reader chapters: **35 of 35 converted** with the source-preserving whole-novel pipeline; `audit --complete` reports 35 verified, 0 legacy-unverified, 0 pending and 0 excluded.
- Every chapter has source/mapping/receipt checkpoints under `.conversion/tonari-no-seijo-sama/`; web and mobile chapter JSON, rosters and indexes are synchronized.
- Roster contains the two leads plus the supporting classmates, maid, Sayaka and the unnamed side characters who speak in chapter 27.
- No APK was built; the existing app can refresh catalog, characters and chapters through the deployed CDN.
