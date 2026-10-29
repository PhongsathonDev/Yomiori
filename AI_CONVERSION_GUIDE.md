# คู่มือการสั่ง Antigravity แปลงเนื้อหานิยายเข้าเว็บ (AI Conversion Guide)

เอกสารนี้รวบรวมวิธีใช้งาน และคำสั่งตัวอย่างที่คุณสามารถก๊อปปี้ไปสั่ง **Antigravity** ในแชทได้ทันทีเมื่อมีตอนนิยายใหม่ๆ หรือนิยายเรื่องใหม่เข้ามา

---

## 1. วิธีการทำงานแบบ 3 ขั้นตอน

```
[1. นำไฟล์ตอนใหม่มาวาง]  ──>  [2. สั่งแปลงและตรวจข้อมูล]  ──>  [3. Build / Push / ตรวจ Deploy]
   ใน novels_source/<novel-id>/   ในช่องแชท (ดูคำสั่งด้านล่าง)         เปิดอ่านออนไลน์หลังยืนยัน CDN แล้ว
```

---

## 2. โครงสร้างโฟลเดอร์ในระบบ (Multi-Novel Architecture)

```
├── novels_source/                  # คลังจัดเก็บเนื้อหาต้นฉบับแยกตามเรื่อง
│   ├── kyudo-senpai/               # เรื่อง: รุ่นพี่สาวสวยจากชมรมยิงธนู
│   │   ├── Ch_01_<ชื่อตอน>.md     # ไฟล์ตอนอยู่ในโฟลเดอร์เรื่องโดยตรง
│   │   ├── Ch_02_<ชื่อตอน>.md
│   │   └── illustrations/          # ภาพประกอบต้นฉบับ
│   └── boyish-friend/              # ตัวอย่างอีกเรื่องที่มีอยู่ใน repo
│       └── Ch_01_<ชื่อตอน>.md
│
└── reader-web/src/data/            # ฐานข้อมูลของเว็บ แยกโฟลเดอร์ตามเรื่องชัดเจน
    ├── novels.json                 # ทะเบียนรายชื่อนิยายทั้งหมดในระบบ
    ├── index.ts                    # Central Data Aggregator
    └── novels/
        ├── kyudo-senpai/           # ข้อมูลเฉพาะของเรื่องรุ่นพี่สาวสวย
        │   ├── characters.json     # ตัวละครเฉพาะเรื่อง
        │   ├── chapters/           # ตอนทั้งหมด (ch-01.json, ch-02.json, ...)
        │   └── index.ts
        └── boyish-friend/          # ข้อมูลเฉพาะเรื่อง
            ├── characters.json     # ตัวละครเฉพาะเรื่อง
            ├── chapters/
            └── index.ts
```

---

## 3. รูปแบบคำสั่งที่ใช้สั่ง Antigravity (Prompt Templates)

### 📌 คำสั่งที่ 1: สั่งแปลงตอนใหม่ของเรื่องที่มีอยู่แล้ว
> "ช่วยแปลงตอน `Ch_04_<ชื่อตอน>.md` จากโฟลเดอร์ `novels_source/kyudo-senpai/` เข้าสู่ระบบ reader ของเรื่อง `kyudo-senpai` ให้หน่อย"

### 📌 คำสั่งที่ 2: สั่งแปลงหลายตอนพร้อมกันแบบแม่นยำสูง (Anti-Lazy Batch Protocol) ⭐ แนะนำ
> "ช่วยแปลงตอนที่ 7 ถึง ตอนที่ 9 ของเรื่อง `kyudo-senpai` เข้าสู่ระบบ reader โดยใช้กระบวนการ Sequential Tool Loop (เขียนลงไฟล์ทีละตอน, ตรวจจับตัวละครใหม่ลง characters.json อัตโนมัติ, อัปเดต chapters/index.ts, รัน verify-conversion เป็นตัวเตือนความยาว และเทียบข้อความทุกย่อหน้าตามลำดับ รวมภาพและเส้นแบ่งฉาก เพื่อยืนยันว่าไม่มีเนื้อหาตกหล่น)"

### 📌 คำสั่งที่ 3: สั่งเพิ่มนิยายเรื่องใหม่เข้ามาในคลัง
> "เราวางไฟล์ดิบของเรื่องใหม่ไว้ใน `novels_source/<novel-id>/` โดยตรงแล้ว ช่วยเพิ่มเรื่องนี้เข้าคลัง `reader-web/src/data/novels/` ให้หน่อย"

### 📌 คำสั่งที่ 4: สั่งเพิ่มหรือแก้ไขตัวละครใหม่
> "ในเรื่อง kyudo-senpai ตอนที่ 4 มีตัวละครใหม่ชื่อ 'อาจารย์ซาซากิ' ช่วยเพิ่มตัวละครนี้ลงใน `characters.json` ของเรื่องนั้น พร้อมกำหนดโทนสีและอวาตาร์ให้ด้วย"

---

## 4. กฎมาตรฐานที่ Antigravity ยึดถือในการแปลง (Zero-Loss Fidelity)
1. **แยกประเภทบล็อกอย่างแม่นยำ:**
   - `dialogue`: ข้อความที่อยู่ในเครื่องหมายคำพูด หรือประโยคที่ตัวละครสนทนาโต้ตอบกัน (พร้อมระบุตัวละคร)
   - `narration`: ข้อความบรรยายสภาพแวดล้อม ความรู้สึกในใจ หรือการกระทำทั่วไป
   - `scene_break`: เส้นแบ่งฉาก และ `illustration`: ภาพประกอบตามตำแหน่งต้นฉบับ
   - ใช้ schema จริงใน `reader-web/src/types.ts` และ `reader-mobile/src/types/index.ts`; ทุกตอนต้องมี `novelId`, `novelTitle` และทุกบล็อกต้องมี `id` ไม่ซ้ำภายในตอน
2. **จับคู่ตัวละครกับสมุดรายชื่อ (Character Roster):**
   - ตรวจสอบจากชื่อตัวละคร ฉายา หรือคำสรรพนาม
   - หากตรวจพบตัวละครใหม่ ให้ลงทะเบียนอัตโนมัติพร้อมกำหนดโทนสีประจำตัว (Smart Palette) ใน `characters.json`
3. **รักษาเนื้อหาดั้งเดิมครบถ้วน 100% (ห้ามสรุปความ):**
   - ไม่ตัดทอนเนื้อหา หรือเปลี่ยนสำนวนภาษาของผู้แต่ง/ผู้แปลต้นฉบับ
4. **ตรวจสอบความถูกต้องด้วย Automated Quality Guard:**
   - ทุกครั้งที่แปลงตอนเสร็จ ให้รันตรวจสอบอัตโนมัติ:
     ```bash
     npm --prefix reader-web run verify -- <path-to-raw.md> <path-to-ch-XX.json>
     ```
   - รันจากราก repo; path ของไฟล์ดิบและ JSON ในคำสั่งนี้อ้างจาก `reader-web/` ซึ่งเป็น working directory ของ npm script
   - สคริปต์ปัจจุบันผ่านเมื่อ **Character Ratio 96–104% หลัง normalization** โดยตัดช่องว่าง เครื่องหมายบางชนิด และส่วนหัวออก จึงเป็นเพียงตัวเตือนความยาว ไม่ได้ตรวจข้อความเท่ากัน ลำดับย่อหน้า ผู้พูด หรือความครบของภาพ แม้ข้อความผลลัพธ์จะระบุ `100% Fidelity` ก็ห้ามใช้เป็นหลักฐานยืนยัน zero-loss
   - ต้องเทียบเนื้อเรื่องทุกย่อหน้าตามลำดับกับ JSON และตรวจภาพ/เส้นแบ่งฉากแยก ส่วนหัวและ metadata ที่ไม่นำเข้าเนื้อเรื่องให้ยึด `novels_source/README.md`; ถ้ายังเทียบไม่ได้ให้รายงานว่ายังไม่ยืนยันความครบ

---

## 5. ขั้นตอนบังคับทุกครั้งเมื่อเพิ่มตอนใหม่ (Mandatory Checklist for AI & Devs) ⚠️

> [!CAUTION]
> **สำคัญสำหรับ AI:** เมื่อเพิ่มหรือแก้ไขตอนเข้า reader ต้องทำครบ 6 ขั้นตอนนี้ การขาด export, manifest หรือการ deploy CDN อาจทำให้มือถือไม่พบตอน งานเก็บต้นฉบับอย่างเดียวให้ทำตาม `novels_source/README.md` และไม่รายงานว่ามีตอนพร้อมอ่านเพิ่มแล้ว

### ขั้นตอนที่ 1: แปลงเนื้อหาลง Reader Web
- แปลงเนื้อหาจากไฟล์ดิบใน `novels_source/<novel-id>/` เข้าเป็น `reader-web/src/data/novels/<novel-id>/chapters/ch-XX.json`
- เพิ่ม import ใน `reader-web/src/data/novels/<novel-id>/chapters/index.ts`
- หากมีตัวละครใหม่ เพิ่มข้อมูลลงใน `reader-web/src/data/novels/<novel-id>/characters.json`

### ขั้นตอนที่ 2: ตรวจสอบความสมบูรณ์ของเนื้อหา (Quality Guard)
- ตรวจสอบว่าไม่มีบทสนทนาที่ไม่มีผู้พูด (`speakerId` ตกหล่น)
- ใช้สคริปต์ตรวจความยาวเป็นตัวเตือน แล้วเทียบข้อความทุกย่อหน้าตามลำดับ รวมภาพและเส้นแบ่งฉากตามหัวข้อ 4; ความยาวใกล้เคียงกันไม่ยืนยันความตรง 100%

### ขั้นตอนที่ 3: ซิงค์ข้อมูลเข้าฝั่ง Mobile App (`reader-mobile`)
- ก๊อปปี้ไฟล์ `ch-XX.json` ไปที่ `reader-mobile/src/data/novels/<novel-id>/chapters/`
- อัปเดต `reader-mobile/src/data/novels/<novel-id>/chapters/index.ts` ให้ครบทุกตอน
- ก๊อปปี้ `characters.json` ไปที่ `reader-mobile/src/data/novels/<novel-id>/characters.json`
- ตรวจ `getBundledChapter` ใน `reader-mobile/src/services/storage.ts`: ปัจจุบันใช้ Kyudo ตอน 1 และชุดตอน Black Cat ที่ import อยู่ การคัดลอกไฟล์หรือเพิ่ม export อย่างเดียวไม่ทำให้ตอนถูกใช้งานแบบ bundled; คงขอบเขตเดิมเว้นแต่งานระบุให้เปลี่ยน และตรวจ runtime lookup ของตอนที่ตั้งใจให้มากับแอป
- ตรวจ `getAvailableChapterList` ใน `reader-mobile/src/services/api.ts` ซึ่งรวม manifest, ตอน bundled ของ Black Cat และไฟล์ที่บันทึกจริง fallback เดิมของ Kyudo 1–25 / Boyish 1–14 เป็นรายการสารบัญ ไม่ใช่หลักฐานว่ามีข้อความ bundled ห้ามเพิ่มจำนวนเพื่อทดแทน manifest หรือสร้างรายการตอนที่ยังไม่แปลง
- ตอนใหม่ต้องปรากฏใน manifest ที่ build แล้ว ส่วนการเปลี่ยน bundle ต้องออกแอป build ใหม่จึงถึงเครื่องผู้ใช้ การ push CDN ไม่เปลี่ยน bundle ใน APK เดิม

### ขั้นตอนที่ 4: รัน Build เพื่อสร้าง Assets และ Manifest ของ CDN
- สั่งรันคำสั่ง build ใน `reader-web`:
  ```bash
  cd reader-web && npm run build
  ```
- ขั้นตอนนี้จะรัน `postbuild.mjs` อัตโนมัติเพื่อ:
  - ส่งออกไฟล์ JSON ตอนทั้งหมดไปยัง `dist/data/novels/<novel-id>/chapters/`
  - อัปเดต `manifest.json` ระบุจำนวนตอนรวมล่าสุด (`totalAvailable`) เพื่อให้แอปมือถือตรวจพบตอนใหม่

### ขั้นตอนที่ 5: บันทึกและ Push งาน พร้อมส่งข้อมูลไปยังสาขา Deploy
- ตรวจ `git status` และสาขาปัจจุบัน เลือก stage เฉพาะไฟล์งาน แล้ว push สาขาพัฒนาปัจจุบันตามนโยบาย repo:
  ```sh
  git add -- <task-file-1> <task-file-2>
  git commit -m "feat(<novel-id>): add Ch.XX-YY and sync mobile cdn"
  git push origin HEAD
  ```
- `.github/workflows/deploy.yml` deploy เมื่อ push เข้า `main` / `master` หรือสั่ง workflow ด้วยมือ การ push สาขาอื่นอย่างเดียวยังไม่เผยแพร่ CDN; ต้องนำงานเข้าสาขา deploy ตามขอบเขตที่ได้รับอนุญาตก่อนรายงานว่าพร้อมใช้ออนไลน์ หากยังไม่ได้รวมให้รายงานว่ายังรอ deploy
- ถ้าทำงานบน `main` ให้ตรวจว่า commit ที่ push เป็นงานรอบนี้ อย่าใช้ `git push origin main` จากสาขาอื่นโดยคิดว่าจะส่งงานของสาขาปัจจุบัน เพราะคำสั่งนั้นส่ง ref `main` ในเครื่อง

### ขั้นตอนที่ 6: ตรวจสอบสถานะการ Deploy บน GitHub Actions
- ตรวจ run ของ commit ที่ส่งเข้าสาขา deploy โดยตรง:
  ```sh
  gh run list --workflow deploy.yml --commit <deployed-commit-sha>
  gh run watch <run-id> --exit-status
  ```
- ต้องผ่านทั้ง workflow ที่ตรง commit และ HTTP status 200 ของ JSON ตอนกับ manifest โดยไม่ผูกกับ HTTP version ตัวอย่างบน Windows: `curl.exe -f -I https://phongsathondev.github.io/Yomiori/data/novels/<novel-id>/chapters/ch-XX.json`
- เมื่อแก้ตอนเดิม ต้องเทียบ JSON ที่ดึงจาก CDN กับข้อมูลที่คาดหวังด้วย HTTP 200 ของ URL เดิมอย่างเดียวไม่ยืนยันว่าเป็นฉบับล่าสุด

