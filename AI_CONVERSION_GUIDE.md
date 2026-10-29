# คู่มือการสั่ง Antigravity แปลงเนื้อหานิยายเข้าเว็บ (AI Conversion Guide)

เอกสารนี้รวบรวมวิธีใช้งาน และคำสั่งตัวอย่างที่คุณสามารถก๊อปปี้ไปสั่ง **Antigravity** ในแชทได้ทันทีเมื่อมีตอนนิยายใหม่ๆ หรือนิยายเรื่องใหม่เข้ามา

---

## 1. วิธีการทำงานแบบ 3 ขั้นตอน

```
[1. นำไฟล์ตอนใหม่มาวาง]  ──>  [2. พิมพ์สั่ง Antigravity]  ──>  [3. เปิดอ่านบนเว็บทันที!]
   ใน novels_source/<novel-id>/   ในช่องแชท (ดูคำสั่งด้านล่าง)         ข้อมูลจะเข้าเว็บแบบอัตโนมัติ
```

---

## 2. โครงสร้างโฟลเดอร์ในระบบ (Multi-Novel Architecture)

```
├── novels_source/                  # คลังจัดเก็บเนื้อหาต้นฉบับแยกตามเรื่อง
│   ├── kyudo-senpai/               # เรื่อง: รุ่นพี่สาวสวยจากชมรมยิงธนู
│   │   ├── Ch_01_<ชื่อตอน>.md     # ไฟล์ตอนอยู่ในโฟลเดอร์เรื่องโดยตรง
│   │   ├── Ch_02_<ชื่อตอน>.md
│   │   └── illustrations/          # ภาพประกอบต้นฉบับ
│   └── idol-neighbor/              # เรื่อง: เพื่อนสมัยเด็กที่เป็นไอดอล
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
        └── idol-neighbor/          # ข้อมูลเฉพาะของเรื่องเพื่อนสมัยเด็ก
            ├── characters.json     # ตัวละครเฉพาะเรื่อง
            ├── chapters/
            └── index.ts
```

---

## 3. รูปแบบคำสั่งที่ใช้สั่ง Antigravity (Prompt Templates)

### 📌 คำสั่งที่ 1: สั่งแปลงตอนใหม่ของเรื่องที่มีอยู่แล้ว
> "ช่วยแปลงตอน `Ch_04_<ชื่อตอน>.md` จากโฟลเดอร์ `novels_source/kyudo-senpai/` เข้าสู่ระบบ reader ของเรื่อง `kyudo-senpai` ให้หน่อย"

### 📌 คำสั่งที่ 2: สั่งแปลงหลายตอนพร้อมกันแบบแม่นยำสูง (Anti-Lazy Batch Protocol) ⭐ แนะนำ
> "ช่วยแปลงตอนที่ 7 ถึง ตอนที่ 9 ของเรื่อง `kyudo-senpai` เข้าสู่ระบบ reader โดยใช้กระบวนการ Sequential Tool Loop (เขียนลงไฟล์ทีละตอน, ตรวจจับตัวละครใหม่ลง characters.json อัตโนมัติ, อัปเดต chapters/index.ts และรัน verify-conversion เพื่อการันตีว่าไม่มีข้อความตกหล่น)"

### 📌 คำสั่งที่ 3: สั่งเพิ่มนิยายเรื่องใหม่เข้ามาในคลัง
> "เราวางไฟล์ดิบของเรื่องใหม่ไว้ใน `novels_source/<novel-id>/` โดยตรงแล้ว ช่วยเพิ่มเรื่องนี้เข้าคลัง `reader-web/src/data/novels/` ให้หน่อย"

### 📌 คำสั่งที่ 4: สั่งเพิ่มหรือแก้ไขตัวละครใหม่
> "ในเรื่อง kyudo-senpai ตอนที่ 4 มีตัวละครใหม่ชื่อ 'อาจารย์ซาซากิ' ช่วยเพิ่มตัวละครนี้ลงใน `characters.json` ของเรื่องนั้น พร้อมกำหนดโทนสีและอวาตาร์ให้ด้วย"

---

## 4. กฎมาตรฐานที่ Antigravity ยึดถือในการแปลง (Zero-Loss Fidelity)
1. **แยกประเภทบล็อกอย่างแม่นยำ:**
   - `dialogue`: ข้อความที่อยู่ในเครื่องหมายคำพูด หรือประโยคที่ตัวละครสนทนาโต้ตอบกัน (พร้อมระบุตัวละคร)
   - `narration`: ข้อความบรรยายสภาพแวดล้อม ความรู้สึกในใจ หรือการกระทำทั่วไป
2. **จับคู่ตัวละครกับสมุดรายชื่อ (Character Roster):**
   - ตรวจสอบจากชื่อตัวละคร ฉายา หรือคำสรรพนาม
   - หากตรวจพบตัวละครใหม่ ให้ลงทะเบียนอัตโนมัติพร้อมกำหนดโทนสีประจำตัว (Smart Palette) ใน `characters.json`
3. **รักษาเนื้อหาดั้งเดิมครบถ้วน 100% (ห้ามสรุปความ):**
   - ไม่ตัดทอนเนื้อหา หรือเปลี่ยนสำนวนภาษาของผู้แต่ง/ผู้แปลต้นฉบับ
4. **ตรวจสอบความถูกต้องด้วย Automated Quality Guard:**
   - ทุกครั้งที่แปลงตอนเสร็จ ให้รันตรวจสอบอัตโนมัติ:
     ```bash
     npm run verify <path-to-raw.md> <path-to-ch-XX.json>
     ```
   - ผลการตรวจสอบต้องได้ **Character Ratio 98-102% (Status: PASSED)** เสมอ

---

## 5. ขั้นตอนบังคับทุกครั้งเมื่อเพิ่มตอนใหม่ (Mandatory Checklist for AI & Devs) ⚠️

> [!CAUTION]
> **สำคัญมากสำหรับ AI:** หากแปลงตอนใหม่แต่ทำไม่ครบทั้ง 6 ขั้นตอนนี้ จะทำให้**เปิดอ่านบนแอปมือถือไม่ได้ (เจอ 404 / ตอนไม่ขึ้น)** ดังนั้นทุกครั้งที่เพิ่มหรือแก้ไขตอนนิยาย AI ต้องปฏิบัติตามขั้นตอนด้านล่างนี้ให้ครบถ้วนเสมอ!

### ขั้นตอนที่ 1: แปลงเนื้อหาลง Reader Web
- แปลงเนื้อหาจากไฟล์ดิบใน `novels_source/<novel-id>/` เข้าเป็น `reader-web/src/data/novels/<novel-id>/chapters/ch-XX.json`
- เพิ่ม import ใน `reader-web/src/data/novels/<novel-id>/chapters/index.ts`
- หากมีตัวละครใหม่ เพิ่มข้อมูลลงใน `reader-web/src/data/novels/<novel-id>/characters.json`

### ขั้นตอนที่ 2: ตรวจสอบความสมบูรณ์ของเนื้อหา (Quality Guard)
- ตรวจสอบว่าไม่มีบทสนทนาที่ไม่มีผู้พูด (`speakerId` ตกหล่น)
- เปรียบเทียบความยาวตัวอักษรกับไฟล์ดิบ การันตีความตรงกัน 100% ไม่มีข้อความตกหล่น

### ขั้นตอนที่ 3: ซิงค์ข้อมูลเข้าฝั่ง Mobile App (`reader-mobile`)
- ก๊อปปี้ไฟล์ `ch-XX.json` ไปที่ `reader-mobile/src/data/novels/<novel-id>/chapters/`
- อัปเดต `reader-mobile/src/data/novels/<novel-id>/chapters/index.ts` ให้ครบทุกตอน
- ก๊อปปี้ `characters.json` ไปที่ `reader-mobile/src/data/novels/<novel-id>/characters.json`
- ตรวจสอบ fallback loop ใน `reader-mobile/src/services/api.ts` ว่าครอบคลุมเลขตอนใหม่

### ขั้นตอนที่ 4: รัน Build เพื่อสร้าง Assets และ Manifest ของ CDN
- สั่งรันคำสั่ง build ใน `reader-web`:
  ```bash
  cd reader-web && npm run build
  ```
- ขั้นตอนนี้จะรัน `postbuild.mjs` อัตโนมัติเพื่อ:
  - ส่งออกไฟล์ JSON ตอนทั้งหมดไปยัง `dist/data/novels/<novel-id>/chapters/`
  - อัปเดต `manifest.json` ระบุจำนวนตอนรวมล่าสุด (`totalAvailable`) เพื่อให้แอปมือถือตรวจพบตอนใหม่

### ขั้นตอนที่ 5: บันทึกและ Push ขึ้น GitHub (`origin main`) ทันที
- **เนื่องจากแอป Mobile อ่านข้อมูลผ่าน GitHub Pages Headless CDN:**
  `https://phongsathondev.github.io/Yomiori/data/...`
- หากไม่ push ไฟล์ขึ้น GitHub ตัว CDN จะยังไม่มีตอนใหม่ และแอปจะขึ้น HTTP 404:
  ```bash
  git add .
  git commit -m "feat(<novel-id>): add Ch.XX-YY and sync mobile cdn"
  git push origin main
  ```

### ขั้นตอนที่ 6: ตรวจสอบสถานะการ Deploy บน GitHub Actions
- รันคำสั่งตรวจสอบ:
  ```bash
  gh run list -L 1
  ```
- รอจนกระทั่งสถานะขึ้น `✓` (เขียว) หรือตรวจสอบด้วย curl ว่าไฟล์บน CDN ตอบกลับ `HTTP/2 200` เรียบร้อยแล้ว

