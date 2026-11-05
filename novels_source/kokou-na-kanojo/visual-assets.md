# เรื่องลับๆ ในห้องของเธอผู้สันโดษ — original visual assets

Source: https://www.nekopost.net/novel/15830 (project 15830).
Author: 雲雀湯. Illustrator: 三守 なかば. Translator/provider: 6nal.
Original work: https://kakuyomu.jp/works/16818622177217453108

All reader images come from original chapter 0.9 artwork (ภาพประกอบ เล่ม 1).
No AI images are used. Source images are kept unchanged in `illustrations/`;
derivative images below live in `reader-web/public/illustrations/`.
The cover `kokou_cover.jpg` is a byte-for-byte copy of `ch0.9_img1.jpg`.

| Reader asset | Source image | Crop (left, top, right, bottom) | Output |
| --- | --- | --- | --- |
| `kokou_banner.jpg` | `ch0.9_img3.jpg` | `(0, 0, 2048, 1152)` | 1024×576 |
| `char_kokou_takumi.jpg` | `ch0.9_img7.jpg` | `(430, 0, 1330, 900)` | 512×512 |
| `char_kokou_kotori.jpg` | `ch0.9_img3.jpg` | `(1190, 30, 1850, 690)` | 512×512 |
| `char_kokou_akira.jpg` | `ch0.9_img3.jpg` | `(310, 30, 950, 670)` | 512×512 |

Crops use Pillow Lanczos and JPEG quality 88. Takumi stays monochrome.
The original two-character color spread explicitly labels 葉畑小鳥 (Kotori)
and 生駒瑛 (Ikoma). Chapter 6 introduces Ikoma as อิโคมะ อากิระ, while
the project synopsis uses อิโคมะ เอย์. The roster uses the chapter name and
retains the synopsis variant as an alias; the source synopsis remains unchanged.
Takumi is the boy in the upper panel of image 7, consistent with the opening
chapter's boy/Kotori pair; his image does not establish official hair/eye colors.
Web and mobile rosters share paths; existing mobile builds receive them by CDN refresh.
The new bundled metadata requires a new app build for offline fallback.

## Original image SHA-256

- `ch0.9_img1.jpg`: `c0eaeaa1ebf12d92c4eeef7d13736073e60c1106c6ea988581300ccb06789e74`
- `ch0.9_img10.jpg`: `083b98566787d400b1be808b38dbd10316413a65eb7d62a76491aa7fb663ee74`
- `ch0.9_img2.jpg`: `5c315414add36e62afb21ad021befff5e462e69a513956e59a59b02274e88be7`
- `ch0.9_img3.jpg`: `4f59df30d944901ffff5e65fa9c3cd1a05ba22a6138f439caf88ef6922044cf5`
- `ch0.9_img4.jpg`: `66cef2f749e4a1242c002639c0959c2a19dfa0a5bdd3bb8d14efc0889be4e349`
- `ch0.9_img5.jpg`: `3f73a730e8b8255638c20627c077a11ba3348a6c1a1caff1df91a89a9719d9ac`
- `ch0.9_img6.jpg`: `e9c779d5abb192bdbd8fa78b78c5c92891af4c2858f47083052b34c5c09f88b6`
- `ch0.9_img7.jpg`: `dd08df0171ef9151b012a022abdf0747b5dc66128611d449d17c7df1e2118970`
- `ch0.9_img8.jpg`: `e19b5e78f1580977e402ec011bb971e70561fcacfb344b9cca9fe15a4cc2f82c`
- `ch0.9_img9.jpg`: `a482e9f2cba534cbca992f5e23c5dc314ef0e7ca5387da0be95eb2a3aba0ac26`
- `ch999_img1.png`: `3cbd562af29b62651c73b91f98c55f229840d9ab0dc5d6957c0b320bf7363673`
