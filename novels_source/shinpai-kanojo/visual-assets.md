# Shinpai Kanojo — original visual assets

## Sources

- WN / Thai metadata: https://www.nekopost.net/novel/17236
- WN original: https://kakuyomu.jp/works/1177354054894867035
- Author's adaptation announcement: https://mypage.syosetu.com/mypageblog/view/userid/717526/blogkey/3445293/
- Official publisher: https://dash.shueisha.co.jp/bookDetail/index/978-4-08-631602-6
- LN title: 一途な彼女がフラれてくれない; ISBN 9784086316026.
- Author: 丸深まろやか. Official LN illustrator: **ものと** (Monoto).
  The Nekopost WN has no artist entry; its `_source.json` is preserved unchanged.
  The reader's artist credit describes the official artwork used here.

Original publisher images (downloaded unchanged):

- `publisher_cover.jpg`: https://dash.shueisha.co.jp/imagesBook/978-4-08-631602-6.jpg (510×729)
- `publisher_spread_01.jpg`: https://dash.shueisha.co.jp/imagesBook/978-4-08-631602-6-01.jpg (909×480)
- `publisher_spread_02.jpg`: https://dash.shueisha.co.jp/imagesBook/978-4-08-631602-6-02.jpg (909×480)

The author explicitly states that Aoto, Shizuno, **Shirato** and Aina retain almost
the same characterization in the LN (announcement paragraphs 105–106). The earlier
note excluding Shirato was overly restrictive and has been corrected. Her official
portrait is labeled 白戸華澄 in the publisher character spread. The added LN-only
湯野椿 must not be assigned to a WN character. The author confirms that WN supporting
heroines 御倉, 成瀬, 古柴 and 紗和 were removed from the LN.

Aoto, Shizuno, Aina and Shirato use original publisher artwork. The other 11 roster
entries use AI portraits explicitly authorized by the user on 2026-11-06 when no
verified official portrait was found. Their hair, facial features and other visual
details are imagined, not canonical character designs. Teacher and crowd are role
illustrations rather than verified individual appearances. See
`generated-portraits.json` for prompts, asset paths and SHA-256 hashes.

## Reader assets

Paths below are relative to `reader-web/public/illustrations/`.
`shinpai_cover.jpg` is a byte-for-byte copy of the official cover.
The four publisher portraits are cropped only; no recoloring, inpainting or
replacement faces. Generated avatars have distinct `_ai.png` paths and are copied
unchanged from the image generation output. They are not source chapter illustrations.
JPEG crops use quality 88 and Lanczos resizing.

| Asset | Original | Crop (left, top, right, bottom) | Output |
| --- | --- | --- | --- |
| `shinpai_banner.jpg` | `publisher_spread_02.jpg` | `(0, 0, 853, 480)` | 960×540 |
| `char_shinpai_aoto.jpg` | `publisher_spread_01.jpg` | `(745, 15, 909, 179)` | 512×512 |
| `char_shinpai_shizuno.jpg` | `publisher_cover.jpg` | `(70, 0, 310, 240)` | 512×512 |
| `char_shinpai_shirato.jpg` | `publisher_spread_01.jpg` | `(186, 65, 318, 197)` | 512×512 |
| `char_shinpai_aina.jpg` | `publisher_spread_01.jpg` | `(0, 65, 150, 215)` | 512×512 |

These three original references are not chapter inserts. They are not added to
`_source.json` chapter image mappings; the 69 source entries have no embedded images.
Web and mobile share avatar paths. Existing mobile apps receive online metadata
and pictures via CDN refresh; bundled metadata changes need a new app build.

## Original SHA-256

- `publisher_cover.jpg`: `fb6a0e765019942a7a3e5b92109e2a57a2622c881328808a08ff4e319d5b7adb`
- `publisher_spread_01.jpg`: `abe3573c231960e801a2f44b852023991a79a30136719b484f12a3c5878fb145`
- `publisher_spread_02.jpg`: `aec592de7102f68a9f2f360676cbcd7a2c072180c2abbdc04fba532d7cb514e5`
