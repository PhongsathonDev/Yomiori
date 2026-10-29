# Boyish Friend — visual asset sources

## Selected artwork

- Source: KADOKAWA / カドコミ (ComicWalker), official series promotional artwork.
- Series page: https://comic-walker.com/detail/KC_006678_S
- Image: https://cdn.comic-walker.com/integration/cdpf/resources/006678/bb30d00d-f99a-4c6a-9ec4-d74f15e81764.jpg
- Retrieved: 2026-10-29.
- Credits shown by the publisher: あおむし (manga), 月見ハク (original story), あかつき聖 (character designs).
- The artwork remains the property of its respective rights holders; attribution is not a redistribution license.

The selected image is non-explicit promotional artwork showing Aya. The library cover is a portrait crop of that artwork, **not the published volume cover**. No chapter pages or explicit illustrations are included.

The requested Nekopost project cover was also checked. It was not copied because it sexualizes a school-age character; the non-explicit promotional image remains the selected alternative.

## Local derivatives

All paths below are relative to `reader-web/public/illustrations/`. Crops use Pillow coordinates `(left, top, right, bottom)` on the original 960 × 540 image, followed by Lanczos resizing and JPEG quality 92.

| File | Treatment | Size |
| --- | --- | --- |
| `boyish_promo_banner.jpg` | Original promotional image, unchanged | 960 × 540 |
| `boyish_promo_cover.jpg` | Crop `(480, 0, 840, 540)` | 600 × 900 |
| `char_boyish_aya.jpg` | Crop `(470, 25, 890, 445)` | 512 × 512 |

The web and mobile catalogs share these GitHub Pages asset paths. Versioned-by-name replacements avoid reusing cached placeholder images. Mobile character metadata is synchronized with the web; images are served by the existing CDN mechanism, not newly bundled for offline use.

## Characters without verified artwork

No confirmed, suitable portraits were found for the protagonist, Tokita, the classmates, or the tour guide. Their old shared compass-cover avatars were removed so the existing initials/icon fallback is used instead of misidentifying them with Aya's portrait.
