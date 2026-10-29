# Makeine — visual asset sources

## Source

- Nekopost project 14560: `https://www.nekopost.net/novel/14560`
- Artwork taken from the project's **Other Media** gallery (the project's own cover file is a shared
  24,375-byte placeholder image, so it is not used).
- Gallery files are served from `https://www.osemocphoto.com/collectManga/14560/media/<FileName>`
  (the path was read from the live novel page network log on 2026-10-29).
- Retrieved: 2026-10-29. Artist of the original light novel: Imigimuru / いみぎむる.

### Gallery files

| File | Volume | Featured character |
| --- | --- | --- |
| `cover_89470.jpg` | 1 | Yanami Anna (blue-haired heroine) |
| `cover_19434.jpg` | 2 | Yakishio Lemon |
| `cover_68036.jpg` | 3 | Komari Chika |
| `cover_23281.jpg` | 4 | Shikiya Yumeko |
| `cover_61417.jpg` | 5 | Nukumizu Kaju |
| `cover_85499.jpg` | 6 | Asagumo Chihaya |
| `cover_24804.jpg` | 7 | Shiratama Riko |
| `cover_92619.jpg` | 8 | Basori Tiara |
| `14560_cover_5031.jpg` | 9 | Haguhara Hibari (โฮโคบารุ ฮิบาริ) |

Character assignment follows each volume's spotlight heroine and was cross-checked against the
official anime character thumbnails (hair colour, glasses, hairstyle).

## Local derivatives

All paths below are relative to `reader-web/public/illustrations/`. Source crops are given in
original cover pixels (`left, top, right, bottom`). Every portrait was cropped square and resized
to 512×512 with Lanczos, then saved as JPEG quality 88.

| File | Source | Crop | Treatment | Size |
| --- | --- | --- | --- | --- |
| `makeine_cover.jpg` | `cover_89470.jpg` (1000×1430) | full | resized to 900×1287, q86 | 900×1287 |
| `makeine_banner.jpg` | `cover_89470.jpg` | `0,30,1000,592` | 16:9 crop, resized to 960×540, q86 | 960×540 |
| `char_makeine_yanami.jpg` | `cover_89470.jpg` | `360,180,800,620` | square crop + 512×512 | 512×512 |
| `char_makeine_yakishio.jpg` | `cover_19434.jpg` | `363,262,763,662` | square crop + 512×512 | 512×512 |
| `char_makeine_komari.jpg` | `cover_68036.jpg` | `381,229,761,609` | square crop + 512×512 | 512×512 |
| `char_makeine_shikiya.jpg` | `cover_23281.jpg` | `462,181,842,561` | square crop + 512×512 | 512×512 |
| `char_makeine_kaju.jpg` | `cover_61417.jpg` | `365,181,745,561` | square crop + 512×512 | 512×512 |
| `char_makeine_asagumo.jpg` | `cover_85499.jpg` | `333,229,713,609` | square crop + 512×512 | 512×512 |
| `char_makeine_shiratama.jpg` | `cover_24804.jpg` | `171,252,571,652` | square crop + 512×512 | 512×512 |
| `char_makeine_tiara.jpg` | `cover_92619.jpg` | `333,197,713,577` | square crop + 512×512 | 512×512 |
| `char_makeine_haguhara.jpg` | `14560_cover_5031.jpg` (1401×2000) | `650,334,1130,814` | square crop + 512×512 | 512×512 |

## Notes

- The cover uses the volume 1 artwork (Yanami Anna), as requested.
- `nukumizu` (the male narrator) has no portrait yet: he does not appear on any gallery cover, and no
  other Nekopost artwork for this project is available. The roster shows his name initial instead.
- The web reader resolves `illustrations/...` from its own `public/` folder; the mobile app resolves
  the same relative paths against the GitHub Pages CDN, so the files above also serve mobile.
