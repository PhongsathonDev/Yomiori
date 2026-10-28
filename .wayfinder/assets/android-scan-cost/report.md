# ต้นทุนสแกนคลังออฟไลน์ Reader Mobile — หลักฐาน WF-0011

วันที่ 28 October 2026 · source `e76517b` · harness [libraryScanCost.bench.ts](../../../reader-mobile/benchmarks/libraryScanCost.bench.ts) · ผลดิบ [results.json](results.json)

หลักฐานนี้ตอบ [เก็บหลักฐานต้นทุนสแกนคลังออฟไลน์ก่อนเลือกวิธีเร่ง](../../issues/WF-0011.md) เพื่อให้ [เลือกการใช้ผลสแกนซ้ำโดยรักษาการกู้ตอนจากไฟล์](../../issues/WF-0012.md) ใช้ตัดสินใจได้ ยังไม่เลือกวิธีเพิ่มความเร็วและไม่แก้ runtime ใด ๆ

## ขอบเขต

วัดจำนวน operation ที่โค้ดจริง `services/storage.ts` และ `services/api.ts` ทำต่อการเข้า **Bookshelf** และ **NovelDetail** บนคลังจำลอง 100 และ 1,000 ตอน ทั้งครั้งแรกและกลับเข้าซ้ำ รวมกรณีมีไฟล์เสียและ backup

ไม่ได้วัด: เวลาเปิดแอปจริง, native I/O latency, หน่วยความจำ/GC บนอุปกรณ์, อ่านเนื้อหาตอน, ดาวน์โหลดรูป, คอมเมนต์, storage sheet, หรือการเรนเดอร์ UI

## วิธีวัด

**Fixture** สร้างในหน่วยความจำเท่านั้น ไม่แตะไฟล์ผู้ใช้หรือไฟล์ใน repository

- 4 นิยายต่อคลัง (รูปทรงเดียวกับ catalog จริงที่มี 4 เรื่อง) เรื่องละ 25 หรือ 250 ตอน = คลัง 100 หรือ 1,000 ตอน
- บทเป็นข้อความไทยที่สร้างขึ้น เฉลี่ย **20.5 KB/ตอน** เทียบค่าจริงใน repo: ค่ามัธยฐาน 21.4 KB, ค่าเฉลี่ย 26.7 KB จาก 134 ไฟล์ bundled
- ตอนที่ 5 ของทุกเรื่องมีภาพประกอบ 1 block; `clean` มีไฟล์ภาพครบ ส่วน `mixed` ให้ภาพหาย 5% ของตอน
- `mixed` เพิ่มความเสียแบบกระจายทั้งคลัง: primary เสีย + `.bak` ที่กู้ได้ (ราว 2%), `.bak` ค้างข้าง primary ที่ยังดี (ราว 2.7%), `.bak` เดี่ยวที่ต้องกู้ (เรื่องละ 1), ไฟล์ JSON ที่ novelId ไม่ตรง (เรื่องละ 1), `.tmp` ค้าง (เรื่องละ 1)
- AsyncStorage seed ด้วย theme, catalog, manifest ของนิยายที่บันทึกไว้ และ progress จำลอง; เครือข่ายเป็น airplane mode (`fetch` reject ทันที) เพื่อไม่ให้เวลารอ network ปนกับการวัดสแกน

**Entry driver** เรียงลำดับการเรียกเหมือนโค้ดหน้าจอ ณ commit นี้

- Bookshelf: `getSavedTheme` + `fetchNovels(true)` → `loadExtras` ชุดแรก (ไม่ await) → `fetchNovels()` → `loadExtras` ชุดที่สอง ตรงกับ `BookshelfScreen.loadData`
- NovelDetail: `loadData(preferCache=true)` (getSavedTheme + readMetadata + fetchNovels(true) + getAvailableChapterList(true) + statuses) → `loadData(preferCache=false)` ชุดเดียวกันแบบ refreshed → `fetchIllustrations`/`fetchCharacters` ตรงกับ `NovelDetailScreen.loadData`

**Mocks** `expo-file-system/legacy` เป็น in-memory filesystem ที่นับ `getInfoAsync`, `readAsStringAsync`, `readDirectoryAsync`, และ `JSON.parse` ทุกครั้ง; AsyncStorage ใช้ mock ทางการของแพ็กเกจและนับ `getItem` แยก; ทุก scenario รีเซ็ต module registry เพื่อไม่ให้ in-memory cache ข้าม scenario

ก่อนวัด entry จะมี sanity check ว่าคลังที่สแกนคืนตอนครบตามจำนวนที่วางไว้ รวมตอนที่กู้จาก `.bak` เดี่ยว และจำนวนตอน `text-only` ตรงกับจำนวนภาพที่จงใจให้หาย ถ้า fixture เสียจะหยุดก่อนถือตัวเลขเป็นหลักฐาน

**ทำซ้ำ**

```sh
cd reader-mobile
npm run benchmark:scan
# เก็บ JSON: ตั้ง env SCAN_BENCH_OUT=<path>.json ก่อนรัน
```

## ผลการวัด

### ต้นทุนหนึ่งรอบสแกนคลัง (getSavedLibrary)

| scenario | ตอนในคลัง | listDirectory | statChapter | readChapter | statIllustration | JSON.parse | MB อ่าน | desktop ms |
|---|---|---|---|---|---|---|---|---|
| 100 clean | 100 | 5 | 100 | 100 | 20 | 100 | 2.00 | 16 / 16 |
| 100 mixed | 100 | 5 | 114 | 106 | 20 | 106 | 2.08 | 15 / 13 |
| 1000 clean | 1,000 | 5 | 1,000 | 1,000 | 200 | 1,000 | 20.00 | 138 / 137 |
| 1000 mixed | 1,000 | 5 | 1,032 | 1,024 | 200 | 1,024 | 20.08 | 125 / 143 |

ต่อหนึ่งตอน = 1 stat + 1 read + 1 parse + 0.2 illustration stat โดยประมาณ; `getSavedNovel` ของเรื่องเดียวนับเป็นสัดส่วนเดียวกัน (1,000 ตอน → 250 reads ต่อเรื่อง, 5.00 MB)

**สองรอบติดกันมีจำนวน operation เท่ากันทุกค่า** — หลังสแกนจบ map `savedNovelScans` ลบ entry ทิ้ง จึงไม่มีการใช้ผลซ้ำแม้แต่ใน process เดียวกัน

### Bookshelf entry

| scenario | ครั้ง | statChapter | readChapter | statIllustration | JSON.parse | metaRead | network | MB อ่าน | desktop ms |
|---|---|---|---|---|---|---|---|---|---|
| 100 clean | first | 350 | 350 | 72 | 368 | 51 | 1 | 7.00 | 73 |
| 100 clean | repeat | 350 | 350 | 72 | 368 | 51 | 1 | 7.00 | 76 |
| 100 mixed | first | 399 | 371 | 72 | 389 | 51 | 1 | 7.28 | 56 |
| 1000 clean | first | 3,500 | 3,500 | 702 | 3,518 | 51 | 1 | 70.00 | 536 |
| 1000 clean | repeat | 3,500 | 3,500 | 702 | 3,518 | 51 | 1 | 70.00 | 485 |
| 1000 mixed | first | 3,612 | 3,584 | 702 | 3,602 | 51 | 1 | 70.29 | 473 |
| 1000 mixed | repeat | 3,612 | 3,584 | 702 | 3,602 | 51 | 1 | 70.29 | 543 |

### NovelDetail entry (เปิดนิยายเรื่องแรกของคลัง)

| scenario | ครั้ง | statChapter | readChapter | statIllustration | JSON.parse | metaRead | network | MB อ่าน | desktop ms |
|---|---|---|---|---|---|---|---|---|---|
| 100 clean | first | 200 | 200 | 40 | 205 | 10 | 3 | 4.00 | 38 |
| 100 clean | repeat | 200 | 200 | 40 | 205 | 10 | 3 | 4.00 | 26 |
| 100 mixed | first | 228 | 212 | 40 | 217 | 10 | 3 | 4.16 | 24 |
| 1000 clean | first | 2,000 | 2,000 | 400 | 2,005 | 10 | 3 | 40.00 | 276 |
| 1000 clean | repeat | 2,000 | 2,000 | 400 | 2,005 | 10 | 3 | 40.00 | 297 |
| 1000 mixed | first | 2,064 | 2,048 | 400 | 2,053 | 10 | 3 | 40.16 | 325 |
| 1000 mixed | repeat | 2,064 | 2,048 | 400 | 2,053 | 10 | 3 | 40.16 | 368 |

## ข้อค้นพบ

1. **การกลับเข้าใช้สแกนไม่ต่างจากการเข้าใหม่** ทุก entry ที่วัดซ้ำได้จำนวน operation เท่ากันทุกค่า (ต่างแค่ desktop wall time) ทั้งที่ theme/catalog/manifest ถูก cache ใน AsyncStorage แล้ว — ต้นทุนหลักคือไฟล์บท ไม่ใช่ metadata ที่ cache ไว้

2. **Bookshelf คิดเป็น 3.5 รอบของคลังทั้งคลัง** ต่อการเข้า 1 ครั้ง (1,000 ตอน → 3,500 reads / 3,500 stats / ~70 MB) จาก trigger 4 จุด ได้แก่ `fetchNovels(true)`, `loadExtras(initial)`, `fetchNovels(false)`, `loadExtras(fresh)` โดย in-flight sharing ลดไปได้ประมาณครึ่งรอบ (2 จาก 4 เรื่อง) ในตารางนี้ ตัวเลขจริงจึงขึ้นกับลำดับ microtask: ถ้าไม่มีการเหลื่อมเลยจะเป็น 4 รอบ (4,000 reads / 80 MB)

3. **NovelDetail อ่านคลังทั้งคลังถึง 2 รอบเพื่อแสดงเรื่องเดียว** (1,000 ตอน → 2,000 reads / ~40 MB) เพราะ `fetchNovels` ถูกเรียกในทั้ง pass cache และ refreshed และการใช้ผลซ้ำระหว่างกันเกิดเฉพาะตอน scan ยัง in-flight ไม่ใช่หลังจบ จึงไม่มีรอบไหนถูกข้าม

4. **ความเสียและ backup เพิ่มภาระเล็กน้อยแต่สม่ำเสมอ** ที่ 1,000 ตอน: +24 reads (+2.4%) และ +32 stats (+3.2%) ต่อรอบ เพราะต้อง stat/read primary ที่เสียก่อนแล้วจึงอ่าน `.bak` เพื่อกู้; ที่คลัง 100 ตอน overhead คิดเป็น +6% reads / +14% stats เพราะไฟล์ที่ตรึงจำนวนต่อเรื่อง (`.bak` เดี่ยว, foreign-id, `.tmp`) มีสัดส่วนสูงกว่า ต้นทุนนี้คือราคาของการกู้ข้อมูลที่ยอมรับไว้ใน `VALIDATION.md`

5. **Metadata reads ไม่ใช่คอขวด** Bookshelf 51 ครั้ง, NovelDetail 10 ครั้งต่อการเข้า เทียบกับ read ไฟล์บท 350–3,500 ครั้ง — การเพิ่ม/ลดการอ่าน AsyncStorage ไม่เปลี่ยนภาพรวม

6. **In-flight sharing ทำงานตามที่ออกแบบ แต่ครอบคลุมแค่ช่วงทับซ้อน** ตัวเลขที่วัดได้จึงเป็นจุดหนึ่งบนช่วง 3.5–4 รอบ (Bookshelf) และ 2–2.5 รอบ (NovelDetail) ขึ้นกับการจัดลำดับ promise บนอุปกรณ์จริง; ค่าที่แน่นอนจากการออกแบบคือจำนวน trigger ไม่ใช่จำนวนรอบที่วัดได้

## ขีดจำกัดของหลักฐาน: desktop กับ Android จริง

ตัวเลข operation เป็นแบบ deterministic จากโค้ด แต่ **เวลาและผลกระทบต่ออุปกรณ์ยังไม่ทราบ** ด้วยเหตุผลต่อไปนี้

1. **filesystem ปลอมในหน่วยความจำ** ทุก `getInfoAsync`/`readAsStringAsync` เป็น Map lookup ไม่มี native bridge, syscall หรือ flash I/O จริง ตัวเลข 3,500 native calls ต่อ entry บอกจำนวนงาน แต่ไม่บอกเวลาต่อ call บน Android
2. **JSON.parse บน V8 ไม่ใช่ Hermes** 70 MB ต่อ Bookshelf entry บน Node ใช้เวลาราวครึ่งวินาที แต่ Hermes บนมือถือรุ่นล่างช้ากว่าและมี memory ตึงกว่า; ยังไม่มีหลักฐานหน่วยความจำ/GC บนอุปกรณ์
3. **Desktop wall time ใช้อ้างอิงภายใน repo เท่านั้น** (win32-x64, Node 24) ห้ามใช้แทนเวลาเปิดแอป Android; เกณฑ์นี้ยังเป็นของ [ตรวจ APK สุดท้ายบน Android จริง](../../issues/WF-0008.md)
4. **ลำดับ async ของ mock ไม่เท่ากับ scheduler ของ React Native** จำนวนรอบจริงอาจอยู่ระหว่าง 3.5–4 (Bookshelf) และ 2–2.5 (NovelDetail) ตามที่กล่าวในข้อค้นพบ 6
5. **ไม่จำลอง I/O ล้มเหลวระหว่างทาง** เช่น ENOSPC, permission, storage ที่อ่านช้า หรือ OS page cache; mock `readDirectoryAsync` โยน error เมื่อไม่มีโฟลเดอร์เหมือน expo แต่ไม่ครอบคลุม error อื่น
6. **ไม่รวมงานที่เกิดพร้อมกันจริง** เช่น โหลดภาพประกอบ, คอมเมนต์, storage sheet (`getNovelOfflineStats`) และการ cache ข้อความอัตโนมัติหลัง fetch — ตัวเลขนี้เป็นขอบเขตของ "การค้นและสแกนคลัง" เท่านั้น

## สิ่งที่หลักฐานนี้ยังไม่ตัดสิน

- ไม่ได้เลือกว่าจะคงการค้นไฟล์เดิม เพิ่มการใช้ผลซ้ำตาม revision หรือทำ summary index — เป็นคำถามของ [WF-0012](../../issues/WF-0012.md)
- ยังไม่มีเกณฑ์เวลา/หน่วยความจำที่ผู้ใช้ยอมรับสำหรับการเปิดชั้นหนังสือหรือสารบัญ ซึ่งต้องมาจากการวัดบนอุปกรณ์จริง (WF-0008) หรือการยอมรับของผู้ใช้
- ไม่ได้ทดสอบผลของการใช้ผลซ้ำต่อการตรวจจับการเขียน/ล้างข้อมูล/ไฟล์เสีย/backup — ต้องออกแบบและทดสอบแยกถ้าเลือกทางนั้น

## สถานะการตรวจ

- `npm run typecheck` ผ่าน, `npm run lint` ผ่าน, `npm test` ผ่าน 67 tests (รอบแรกมีเทสต์คอมเมนต์ที่ไม่เกี่ยวข้อง timeout 5 วินาทีครั้งเดียวภายใต้โหลด แล้วผ่านทั้งแบบเดี่ยวและทั้งชุด)
- `npm run benchmark:scan` ผ่าน 4 scenarios ใช้เวลาราว 9–10 วินาทีบน desktop
- ไม่มีการสร้าง APK หรือแก้ runtime ในรอบเก็บหลักฐานนี้
