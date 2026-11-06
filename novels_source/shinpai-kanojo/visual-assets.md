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

The author explicitly notes that the LN changes its supporting cast. Use only the
three characters whose identities match the WN: 桜庭碧人 (Aoto), 遊薙静乃
(Shizuno), 桜庭藍奈 (Aina). The official character spread labels them by name;
Aina introduces herself as Aoto's younger sister in WN chapter 15. Do not assign
LN-only 湯野椿 or the changed supporting character 白戸華澄 to WN characters.
This skeleton is not a complete speaker roster for future chapter conversion.

## Reader assets

Paths below are relative to `reader-web/public/illustrations/`.
`shinpai_cover.jpg` is a byte-for-byte copy of the official cover.
No AI artwork, recoloring, inpainting or replacement faces are used.
JPEG crops use quality 88 and Lanczos resizing.

| Asset | Original | Crop (left, top, right, bottom) | Output |
| --- | --- | --- | --- |
| `shinpai_banner.jpg` | `publisher_spread_02.jpg` | `(0, 0, 853, 480)` | 960×540 |
| `char_shinpai_aoto.jpg` | `publisher_spread_01.jpg` | `(745, 15, 909, 179)` | 512×512 |
| `char_shinpai_shizuno.jpg` | `publisher_cover.jpg` | `(70, 0, 310, 240)` | 512×512 |
| `char_shinpai_aina.jpg` | `publisher_spread_01.jpg` | `(0, 65, 150, 215)` | 512×512 |

These three original references are not chapter inserts. They are not added to
`_source.json` chapter image mappings; the 69 source entries have no embedded images.
Web and mobile share avatar paths. Existing mobile apps receive online metadata
and pictures via CDN refresh; bundled metadata changes need a new app build.

## Original SHA-256

- `publisher_cover.jpg`: `fb6a0e765019942a7a3e5b92109e2a57a2622c881328808a08ff4e319d5b7adb`
- `publisher_spread_01.jpg`: `abe3573c231960e801a2f44b852023991a79a30136719b484f12a3c5878fb145`
- `publisher_spread_02.jpg`: `aec592de7102f68a9f2f360676cbcd7a2c072180c2abbdc04fba532d7cb514e5`
