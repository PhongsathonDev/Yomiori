# Yomiori (読織) — มิติใหม่แห่งการอ่านนิยาย (Smart Novel Reader & AI Parsing Pipeline)
> ถักทอตัวอักษร สู่มิติใหม่แห่งการอ่าน
> เริ่มบันทึก: 29 กันยายน 2026 · ตรวจข้อมูลปัจจุบันกับโค้ด: 29 ตุลาคม 2026
>
> หัวข้อ 1–3 อธิบายระบบปัจจุบัน หัวข้อ 4 เป็นประวัติการพัฒนาช่วงแรก ไม่ใช่รายการงานค้างหรือหลักฐานทดสอบของ commit ปัจจุบัน สถานะงานใช้ `.wayfinder/issues/` และผลตรวจมือถือใช้ `reader-mobile/VALIDATION.md`

---

## 1. วิสัยทัศน์และวัตถุประสงค์ (Vision & Objective)
แก้ปัญหาความยากในการอ่านนิยายเว็บ/นิยายแปล (โดยเฉพาะที่มีบทสนทนาต่อเนื่องกันยาวๆ จนไม่รู้ว่าใครกำลังพูด และจินตนาการหน้าตาตัวละครไม่ออก) โดยแปลงเนื้อหาธรรมดาให้กลายเป็น **Enhanced Typography Reader**:
- แยกบทสนทนาออกจากบทบรรยายอย่างชัดเจน
- มี **Badge ชื่อตัวละคร + สีประจำตัว (Color Accent) + ไอคอนรูปหน้า (Avatar)** หน้าบทพูด
- คงความลื่นไหลของการอ่านแนวตั้ง (Vertical Scroll) ไม่รบกวนสมาธิด้วยกล่องแชทเทอะทะ
- ในเว็บโหมดพัฒนาสามารถคลิกสลับคนพูด (Quick-Fix Correction) และบันทึกกลับไฟล์ JSON ได้ เว็บ production บน GitHub Pages ใช้สำหรับอ่าน ไม่มี backend เขียนไฟล์

---

## 2. สถาปัตยกรรมระบบโดยรวม (System Architecture)

```
[ Nekopost / ต้นฉบับที่ผู้ใช้จัดเตรียม ]
         │ scripts/scrape-nekopost.js / วางไฟล์ตาม novels_source/README.md
         ▼
[ novels_source/<novel-id>/ : Markdown + _source.json + illustrations/ ]
         │ AI assistant / สคริปต์แปลงเฉพาะเรื่อง + ตรวจข้อความและผู้พูด
         ▼
[ reader-web/src/data/ : novels.json + ข้อมูลรายเรื่องและตอน JSON ]
         ├── React + TypeScript + Vite + CSS → เว็บอ่าน
         │      └── Vite dev middleware → แก้ JSON ในเครื่อง (เฉพาะโหมดพัฒนา)
         ├── npm run build → postbuild.mjs → dist/data/ + manifests
         │      └── GitHub Actions → GitHub Pages เว็บและ Headless CDN
         └── ซิงค์สำเนาไป reader-mobile/src/data/ ตาม AGENTS.md
                └── เฉพาะไฟล์ที่ runtime import/lookup ใช้จึงเป็น bundled content

[ reader-mobile : React Native + Expo + React Navigation ]
         ├── อ่านไฟล์ตอนที่บันทึกไว้ / bundled content ก่อน
         ├── ดึง catalog, manifest, characters และตอนจาก GitHub Pages CDN
         ├── expo-file-system เก็บตอนและภาพที่ดาวน์โหลด
         └── AsyncStorage เก็บ settings, progress และ metadata
```

ระบบปัจจุบันไม่ใช้ Supabase/SQLite/PostgreSQL, Next.js หรือ Tailwind และไม่มี Chrome Extension, Direct Paste Box หรือ background AI queue ตามแผนภาพแนวคิดเดิม การแปลงเป็นงานของ assistant/สคริปต์ใน repo ไม่ใช่บริการ AI ที่รันอยู่บน GitHub Pages

---

## 3. รายละเอียดส่วนประกอบหลัก (Core Components)

### 3.1 รูปแบบการอ่าน (Reading Experience)
* **การแสดงผลบทบรรยาย (Narration):** เป็นพารากราฟปกติ อ่านสบายตา จัด Line-height และ Margin ที่ได้มาตรฐาน E-book Reader
* **การแสดงผลบทสนทนา (Dialogue):** 
  * แถบสีด้านข้าง (Border Accent) ตามสีเฉพาะของตัวละคร
  * รูปอวาตาร์ขนาดกะทัดรัด (Avatar Thumbnail) พร้อมชื่อตัวละครแบบ Tag/Badge
  * ข้อความคำพูดที่มีการเน้นชัดเจน
* **Interactive Quick-Fix:**
  * เมื่อคลิกที่รูปหรือชื่อตัวละครในบรรทัดใด จะมี Popover แสดงรายชื่อตัวละครในเรื่องให้เลือกเปลี่ยนได้ทันที
  * มีตัวเลือก "เปลี่ยนเป็นบทบรรยาย (Narration)" หรือ "สร้างตัวละครใหม่"
  * บันทึกกลับไฟล์ JSON ผ่าน Vite dev middleware ในโหมดพัฒนา แล้ว commit/push/build เพื่อเผยแพร่ตาม `AGENTS.md`

### 3.2 สมุดรายชื่อตัวละครส่วนกลาง (Global Cast System)
* **Schema ตัวละคร:**
  * `id`: รหัสประจำตัว (UUID/Slug เช่น `toya`, `rino`)
  * `role`: บทบาทตัวละคร; ความเป็นสมาชิกของเรื่องกำหนดจากตำแหน่ง `novels/<novel-id>/characters.json` ไม่ใช้ field `novel_id`
  * `name`: ชื่อทางการ (เช่น วาตานูกิ ริโนะ)
  * `aliases`: ชื่อเรียกอื่น/คำระบุตัวตน (เช่น รุ่นพี่วาตานูกิ, ประธานชมรมยิงธนู, ริโนะ)
  * `avatarUrl` (optional): URL/path รูปภาพตัวละคร
  * `color`: สีประจำตัว เช่น `#3B82F6`, `#EC4899`
  * `description`: คำอธิบายบุคลิก/หน้าตาสำหรับ AI ช่วยจับคู่
* **การเพิ่ม/แก้ไข:**
  * AI ตรวจจับตัวละครใหม่ให้อัตโนมัติเมื่อพบในตอนใหม่
  * ผู้ใช้สามารถอัปโหลดรูปภาพ ปรับสี และแก้ไขรายละเอียดในเว็บโหมดพัฒนาได้

### 3.3 เครื่องยนต์แปลงเนื้อหาด้วย AI (Antigravity AI Agent Ingestion)
* **Runtime:** ใช้ AI assistant ใน IDE หรือสคริปต์แปลงเฉพาะเรื่องเพื่อเขียนไฟล์ใน repo การตั้งค่าโมเดล/บัญชีเป็นของเครื่องมือที่ใช้ ไม่ใช่ backend ของเว็บ
* **กระบวนการทำงาน:**
  1. ผู้ใช้วางไฟล์นิยายดิบ (Markdown / Text) ไว้ใน `novels_source/<novel-id>/` โดยตรง ไม่แยกโฟลเดอร์ staging หรือโฟลเดอร์ซ้อนสำหรับไฟล์ตอน
  2. สั่ง Antigravity ในแชท IDE ให้แปลงตอนที่ต้องการ
  3. Assistant อ่านโครงสร้าง ตรวจรายชื่อตัวละคร และแปลงเป็น Structured JSON (narration, dialogue, scene_break, illustration) โดยบทสนทนาอ้าง `speakerId`/`speakerName` ส่วนสีอยู่ใน `characters.json`
  4. ตรวจข้อความทุกย่อหน้าตามลำดับ ภาพ เส้นแบ่งฉาก และผู้พูดให้ครบ ก่อนซิงค์มือถือ/build/push/ตรวจ CDN ตาม `AGENTS.md`; สคริปต์วัดความยาวอย่างเดียวไม่ยืนยัน zero-loss
* **Structured Output Schema:** ใช้ `Chapter`, `StoryBlock` และ `Character` ใน [web types](reader-web/src/types.ts) และ [mobile types](reader-mobile/src/types/index.ts) เป็นแหล่งอ้างอิงจริง ตัวอย่างด้านล่างแสดง fields บังคับและบล็อกทั้งสี่ชนิด; optional fields เพิ่มเติมให้ดู types
  ```typescript
  interface ParsedChapter {
    id: string; // เช่น ch-01
    novelId: string;
    chapterNumber: number;
    title: string;
    novelTitle: string;
    blocks: Array<
      | { id: string; type: "narration"; text: string }
      | { id: string; type: "dialogue"; speakerId: string; speakerName: string; text: string }
      | { id: string; type: "scene_break"; symbol?: string }
      | { id: string; type: "illustration"; src: string }
    >;
  }
  ```
  `id` ของบล็อกต้องไม่ซ้ำภายในตอน บทสนทนาต้องอ้างตัวละครที่มีจริง ภาพต้องคงตำแหน่งเดิมและมีไฟล์/path ที่ใช้ได้ ดูตัวตรวจ runtime ใน [validation.ts](reader-mobile/src/services/validation.ts)

### 3.4 โฟลเดอร์นำเข้าและคลังข้อมูล (Multi-Novel Source & Data Storage)
* **Source Repository (`novels_source/`):** คลังต้นฉบับเพียงแห่งเดียว จัดเก็บไฟล์ตอนในโฟลเดอร์เรื่องโดยตรง เช่น `novels_source/kyudo-senpai/Ch_01_<ชื่อตอน>.md` พร้อม metadata/สารบัญและ `illustrations/` ตาม [มาตรฐานต้นฉบับ](novels_source/README.md) ไม่แยกโฟลเดอร์รับเข้าชั่วคราว
* **Structured Data per Novel (`reader-web/src/data/novels/<novel-id>/`):** 
  * `characters.json`: รายชื่อและโทนสีตัวละครเฉพาะเรื่องนั้น
  * `chapters/`: ตอนแต่ละตอน (ch-01.json, ch-02.json, ...)
  * `index.ts`: export โมดูลประจำเรื่อง
* **Central Catalog (`reader-web/src/data/novels.json` & `index.ts`):** ทะเบียนนิยายทั้งหมดและ aggregated API export

### 3.5 ระบบและการใช้งานของเพื่อน
* รันเว็บในเครื่องด้วย Vite; production ปัจจุบัน deploy ผ่าน `.github/workflows/deploy.yml` ไป GitHub Pages ที่ `https://phongsathondev.github.io/Yomiori/` และส่งข้อมูลให้มือถือผ่าน `/data/...`
* มีไฟล์คู่มือ (`AI_CONVERSION_GUIDE.md`) อธิบายคำสั่งที่ใช้บอก Antigravity เวลาต้องการให้แปลงตอนใหม่ๆ

### 3.6 สถาปัตยกรรมข้อมูล: Local-First Web Editor (Vite Middleware + Git-Publish)
จากการตกผลึกร่วมกันผ่าน Grilling Session ได้ข้อสรุปการจัดเก็บและแก้ไขข้อมูลดังนี้:
* **ไม่ต้องใช้ Cloud Database ภายนอก**: ตัดความซับซ้อนเรื่องโควต้า, ค่าใช้จ่าย, และ Database ล่ม ข้อมูลทั้งหมดคงอยู่ในรูปแบบ Version-Controlled JSON ภายใต้ `src/data/novels/`
* **Vite Dev Middleware API (Localhost Backend)**:
  * ในโหมดพัฒนา (`npm run dev`) ตัว Vite Server จะเปิด Endpoints ขนาดเบาเพื่อรับคำสั่งเขียนไฟล์กลับสู่ดิสก์โดยตรง:
    * `GET /api/status`: ตรวจสถานะการแก้ไขในโหมดพัฒนา
    * `POST /api/save-novel`: แก้ไขข้อมูลชื่อเรื่อง, เรื่องย่อ, ปก, แบนเนอร์, แท็ก
    * `POST /api/save-characters`: แก้ไขหรือเพิ่มตัวละครและสีประจำตัว
    * `POST /api/upload-character-image`: บันทึกภาพตัวละคร
    * `POST /api/save-chapter-block`: แก้ไขข้อความในบล็อกบทสนทนาหรือสลับตัวละครผู้พูด
    * `POST /api/save-chapter`: บันทึกทั้งตอน
  * ชื่อ endpoint และ payload ให้ตรวจจาก `reader-web/vite.config.ts` และ `reader-web/src/services/localApi.ts`
* **Admin PIN & Production Safeguard (ความปลอดภัยและการแสดงผลบน Cloud)**:
  * บน **Localhost (คอมพิวเตอร์)**: มีปุ่ม "✏️ โหมดแก้ไข" พร้อมปลดล็อกด้วย Admin PIN (เก็บจำใน LocalStorage) เพื่อให้แก้ไขได้ทันทีโดยไม่ต้องเปิดโค้ด
  * บน **เว็บ production (GitHub Pages)**: การแก้ไขปิดตาม `import.meta.env.DEV` และไม่มี Vite dev middleware ให้เขียนไฟล์ การเปิดเว็บจากมือถือไม่ได้ทำให้มี backend เพิ่มขึ้น
* **การผสานงานร่วมกับ AI (Antigravity)**:
  * ข้อมูลทั้งหมดยังคงเป็น JSON ไฟล์เดียวกับที่ Antigravity ตรวจสอบและแปลงนิยายตอนใหม่เข้ามา ทำให้ AI และ Web Editor ทำงานบน Single Source of Truth เดียวกัน 100%

---

## 4. ประวัติการพัฒนาช่วงแรก (Historical Implementation Roadmap)

รายการด้านล่างเก็บเหตุการณ์และรายงานในช่วงเริ่มโครงการ การกล่าวถึง Vercel, จำนวนสองเรื่อง หรือผลทดสอบเก่าไม่ได้ระบุ hosting/จำนวนเรื่อง/ผลตรวจปัจจุบัน การทำงานต่อให้อ่านโค้ดและ tracker ปัจจุบันก่อน

### เฟสที่ 1: พัฒนาระบบ Core Reader & Interactive UI (เสร็จสิ้น ✅)
- [x] พัฒนาเว็บแอปพลิเคชัน Enhanced Reader ด้วย React + TypeScript + Vanilla Modern CSS
- [x] ออกแบบหน้าอ่านนิยาย Japan Muji Minimalist (Washi paper, Charcoal, Hinoki wood, Terracotta accent, IBM Plex Sans Thai)
- [x] ทำบล็อกบทสนทนา (Dialogue Block) พร้อม Avatar, ชื่อตัวละคร, แถบสีประจำตัว
- [x] ทำระบบ **Interactive Quick-Fix** (คลิกที่ชื่อ/รูปเพื่อเปลี่ยนคนพูดได้ทันที)
- [x] ทำหน้า **Global Character Cast** แสดงรายชื่อตัวละคร รูปวาด และสีประจำตัว

### เฟสที่ 2: จัดโครงสร้าง Multi-Novel & AI Pipeline (เสร็จสิ้น ✅)
- [x] จัดระเบียบโฟลเดอร์ต้นฉบับแยกรายเรื่องใน `novels_source/`
- [x] ปรับโครงสร้างข้อมูลแบบแยกส่วน (`src/data/novels/<novel-id>/`) พร้อม Central Catalog
- [x] แปลงเนื้อหาตอนทดสอบของทั้ง 2 เรื่องเข้าสู่ระบบ
- [x] เขียนคู่มือการแปลงนิยายด้วย Antigravity (`AI_CONVERSION_GUIDE.md`)

### เฟสที่ 3: ระบบแก้ไขข้อมูลผ่านหน้าเว็บ (Local-First Web Editor) & Cloud Deploy (เสร็จสิ้น ✅)
- [x] ติดตั้ง **Vite Dev Middleware** ใน `vite.config.ts` สำหรับบันทึกไฟล์ JSON ลงโฟลเดอร์ `src/data/`
- [x] พัฒนา **Admin Mode & PIN Auth** (เปิด/ปิดโหมดแก้ไขบน Localhost, ซ่อนอัตโนมัติบน Vercel)
- [x] พัฒนา **Novel Metadata Edit Modal** (แก้ไขชื่อเรื่อง, เรื่องย่อ, แท็ก, ภาพปก ได้จากหน้าเว็บ)
- [x] พัฒนา **Dialogue Quick-Save** (คลิกแก้ข้อความในบทแล้วบันทึกกลับลงไฟล์ทันที)
- [x] ทดสอบการบันทึกข้อมูลจริงและตรวจสอบความเข้ากันได้กับการ Build บน Vercel (ทดสอบ build ผ่าน 100%)

### เฟสที่ 4: Anti-Lazy Batch Pipeline & Quality Guard (เสร็จสิ้น ✅)
- [x] พัฒนา Quality Guard Script ([verify-conversion.mjs](reader-web/scripts/verify-conversion.mjs)) สำหรับเตือนความต่างของความยาวข้อความที่ normalize แล้ว ช่วงผ่านปัจจุบันคือ 96–104%; ไม่ใช่ตัวพิสูจน์ข้อความตรงกันทุกตัวอักษร
- [x] เพิ่มการลงทะเบียนตัวละครระหว่างแปลงลง [characters.json](reader-web/src/data/novels/kyudo-senpai/characters.json)
- [x] แปลงและเพิ่มตอนที่ 4 ถึงตอนที่ 9 ของเรื่อง *รุ่นพี่สาวสวยจากชมรมยิงธนู* (Anti-Lazy Batch Protocol); บันทึกเดิมระบุ 100% Fidelity แต่ผลวัดความยาวอย่างเดียวไม่เพียงพอจะยืนยันข้ออ้างนี้
- [x] อัปเดตคู่มือ [AI_CONVERSION_GUIDE.md](AI_CONVERSION_GUIDE.md) ด้วย Anti-Lazy Batch Protocol Template


