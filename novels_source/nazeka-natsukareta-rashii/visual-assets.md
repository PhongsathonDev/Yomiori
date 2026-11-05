# Nazeka Natsukareta Rashii — visual assets

Retrieved and checked: 2026-10-29. Artwork: **ぴろ瀬**; author: **あおぞら**.

## Sources and identification

- Thai source: https://www.nekopost.net/novel/14982
- Original work: https://kakuyomu.jp/works/16817330662103623297
- Official book metadata and cover: https://www.kadokawa.co.jp/product/322411001191/
  (ISBN 9784041160619). The official title is
  `学年の二大美少女にフラれたのに、何故か懐かれたらしい`.
- Official cover URL: https://cdn.kdkw.jp/cover_1000/322411/322411001191.webp
  — stored unchanged as `illustrations/nazeka_official_cover.webp` (700×1000).
- Nekopost Other Media lists `cover_72516.jpg`, titled `iPpjed2P_o.jpg`:
  https://www.osemocphoto.com/collectManga/14982/media/cover_72516.jpg
  — stored unchanged as `illustrations/nazeka_gallery.jpg` (1000×1419).
- Eita's portrait comes from the existing chapter 32 illustration:
  https://www.osemocphoto.com/collectManga/14982/168852/image_67c7abcc008372.07069624.jpeg
  — `illustrations/ch32_img1.jpg` (1409×2000), already registered in `_source.json`.

Yuzu is the short-haired girl on the left of the cover/gallery artwork. Her identity is
explicitly labelled **姶良柚 / Aira Yuzu** in `illustrations/ch26_img1.jpg`.
Mei is the long dark-haired girl with crossed hairpins on the right, matching her café
illustration in chapter 20 and the two heroines together in chapter 37. The boy in the
chapter 32 butler illustration is Eita; the chapter's title and scene identify him, with
both heroines pictured in the inset reactions. Names and spoiler-light roles also follow
chapter 1 and the official publisher synopsis (佐々木瑛太, 姶良柚, 姫野芽衣).

The gallery image and official cover are **not chapter inserts**. They are documented here,
not added to `_source.json`'s chapter image mappings. Original chapter text and images
remain untouched. No AI-generated artwork or speculative character matching is used.

## Reader assets

Paths below are relative to `reader-web/public/illustrations/`. Crop coordinates are
`left, top, right, bottom` in original-image pixels. JPEG derivatives use quality 88;
square portraits are resized to 512×512 with Lanczos. The official cover is copied
byte-for-byte, without cropping, resizing or recompression.

| Asset | Original source | Crop | Output |
| --- | --- | --- | --- |
| `nazeka_cover.webp` | `nazeka_official_cover.webp` | full, unchanged | 700×1000 |
| `nazeka_banner.jpg` | `nazeka_gallery.jpg` | `48,80,944,584` | 896×504 (16:9) |
| `char_nazeka_eita.jpg` | `ch32_img1.jpg` | `720,80,1220,580` | 512×512 |
| `char_nazeka_yuzu.jpg` | `nazeka_gallery.jpg` | `120,70,480,430` | 512×512 |
| `char_nazeka_mei.jpg` | `nazeka_gallery.jpg` | `540,100,900,460` | 512×512 |

Eita's portrait is intentionally monochrome: that is the original illustration, not an
invented colour treatment. Avatar IDs are namespaced `nazeka-*` so Mei cannot collide
with the unrelated character `mei` in Kyudo Senpai.

The web reader serves these relative paths from `public/`; mobile resolves the same
paths against the GitHub Pages CDN. Character metadata is bundled in both readers.
This does not add native offline image bundles or require an APK build.

## Original-image SHA-256

| Original | SHA-256 |
| --- | --- |
| `nazeka_official_cover.webp` | `3eec35ef4a30c9fe35daadfd871f18f61b7a5f91943009b2836600b52d797e0f` |
| `nazeka_gallery.jpg` | `cfd32bca9c23f0c3ae0c0a9f43b94ef76f3fa6587a616b89cd214a684b715498` |
| `ch32_img1.jpg` | `d0ca2dea305aa3f17a8623cf183fc4cda6a410adc2a36ff1728cb1e0ff58368c` |
