# Renai Soudan — original non-sexual character artwork

- Thai source / metadata: https://www.nekopost.net/novel/14609
- Original WN: https://ncode.syosetu.com/n5018if/
- Official publisher: https://dash.shueisha.co.jp/bookDetail/index/978-4-08-631548-7
- Author credit: Tetsujin jusu (source spelling); official 鉄人じゅす.
- Illustrator: Tantan / たん旦. Official ISBN: 9784086315487.

Only three non-sexual original references are retained from chapter 0 (chapterId
162013), obtained through image access URLs supplied by the site's reader API:

| Reference | Original image position | Canonical source URL |
| --- | --- | --- |
| `reference_cover.jpg` | 1 | https://www.osemocphoto.com/collectManga/14609/162013/image_674911db764396.09871720.jpeg |
| `reference_lunch.jpg` | 3 | https://www.osemocphoto.com/collectManga/14609/162013/image_674911db7a8635.05321909.jpeg |
| `reference_characters.jpg` | 17 | https://www.osemocphoto.com/collectManga/14609/162013/image_674911db8a76b8.99358192.jpeg |

The references are stored unchanged; the full illustration chapter is not archived.
The character chart explicitly labels 小暮涼真, 朝比奈アリサ, 平沢獅子 and 大月雫.
The same four identities and their relationships are confirmed by the Nekopost and
official publisher synopses. No AI artwork or speculative character matching is used.
All four active portraits use the original full-color lunch illustration, which
labels each character by name. Only cropping and resizing are applied; no AI
colorization, redrawing or linework changes are used. The original monochrome
portraits remain available as older assets. New `_color.jpg` paths avoid reusing
cached monochrome images on existing clients.

## Reader derivatives

Paths relative to `reader-web/public/illustrations/`. Cover copied byte-for-byte;
other files cropped and resized with Lanczos, JPEG quality 88.

| Reader asset | Reference | Crop (left, top, right, bottom) | Output |
| --- | --- | --- | --- |
| `renai_banner.jpg` | `reference_lunch.jpg` | `(37, 0, 1317, 720)` | 960×540 |
| `char_renai_ryoma_color.jpg` | `reference_lunch.jpg` | `(180, 390, 390, 600)` | 512×512 |
| `char_renai_arisa_color.jpg` | `reference_lunch.jpg` | `(875, 55, 1205, 385)` | 512×512 |
| `char_renai_reo_color.jpg` | `reference_lunch.jpg` | `(456, 257, 666, 467)` | 512×512 |
| `char_renai_shizuku_color.jpg` | `reference_lunch.jpg` | `(710, 234, 920, 444)` | 512×512 |

Web and mobile share avatar paths. Existing mobile apps may refresh CDN metadata;
this does not add chapters or change the native bundled chapter set.

## Reference SHA-256

- `reference_characters.jpg`: `d0735b51e017176758a8965b972e770af18c8acf0b53fcc59d00ad5b7eca633c`
- `reference_cover.jpg`: `5047580a19810e633f344ff342c7c59c6c2efe2da3552124ce52360becd40a9d`
- `reference_lunch.jpg`: `a82c658a4e943ec2c91559605b4314ac778e0f67151d4c057410eede71d76450`
