# Yomiori (読織) — มิติใหม่แห่งการอ่านนิยาย (Smart Novel Reader & AI Parsing Pipeline)
> ถักทอตัวอักษร สู่มิติใหม่แห่งการอ่าน (Settled Architecture & Implementation Blueprint)
> วันที่บันทึก: 29 กันยายน 2026

---

## 1. วิสัยทัศน์และวัตถุประสงค์ (Vision & Objective)
แก้ปัญหาความยากในการอ่านนิยายเว็บ/นิยายแปล (โดยเฉพาะที่มีบทสนทนาต่อเนื่องกันยาวๆ จนไม่รู้ว่าใครกำลังพูด และจินตนาการหน้าตาตัวละครไม่ออก) โดยแปลงเนื้อหาธรรมดาให้กลายเป็น **Enhanced Typography Reader**:
- แยกบทสนทนาออกจากบทบรรยายอย่างชัดเจน
- มี **Badge ชื่อตัวละคร + สีประจำตัว (Color Accent) + ไอคอนรูปหน้า (Avatar)** หน้าบทพูด
- คงความลื่นไหลของการอ่านแนวตั้ง (Vertical Scroll) ไม่รบกวนสมาธิด้วยกล่องแชทเทอะทะ
- ผู้ใช้และเพื่อนกลุ่มเล็กๆ สามารถร่วมกันอ่านและคลิกสลับคนพูด (Quick-Fix Correction) ได้ทันทีเมื่อระบบ AI ระบุผิด

---

## 2. สถาปัตยกรรมระบบโดยรวม (System Architecture)

```
[ แหล่งนิยายภายนอก (Web Novel) / ข้อความต้นฉบับ ]
         │
         ├── (1) Chrome Extension (One-click DOM Scraper)
         └── (2) Web Direct Paste Box (Manual Fallback)
         │
         ▼
[ Ingestion & Background Queue ]
         │
         ▼
[ AI Parser Engine (Gemini Flash + Structured JSON Schema) ]
         │
         ├── 1. ตัดแบ่ง Block: บทบรรยาย (Narration) vs บทสนทนา (Dialogue)
         ├── 2. ระบุ Speaker ID จาก Global Cast หรือตรวจจับตัวละครใหม่
         └── 3. ส่งคืน Structured Chapters JSON
         │
         ▼
[ Database & Storage (Supabase / SQLite / PostgreSQL) ]
         ├── Novels (ข้อมูลนิยาย)
         ├── Characters / Global Cast (ชื่อ, รูป Avatar, โทนสีประจำตัว)
         ├── Chapters & Blocks (เนื้อหาแต่ละตอนที่แปลงแล้ว)
         └── User Progress & Bookmarks (ความคืบหน้าการอ่านของแต่ละคน)
         │
         ▼
[ Enhanced Reader Web App (Next.js / React + Tailwind CSS) ]
         ├── Clean Reading Mode (Scrollable, Dark/Light/Sepia Theme, Font Size)
         ├── Dialogue Line with Character Badge & Portrait
         ├── Interactive Quick-Fix Speaker Selector (Click to switch speaker)
         └── Cast Management (เพิ่ม/แก้รูป/เปลี่ยนสีตัวละคร)
```

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
  * บันทึกการเปลี่ยนแปลงลงฐานข้อมูลแบบเรียลไทม์

### 3.2 สมุดรายชื่อตัวละครส่วนกลาง (Global Cast System)
* **Schema ตัวละคร:**
  * `id`: รหัสประจำตัว (UUID/Slug เช่น `toya`, `rino`)
  * `novel_id`: อ้างอิงนิยายเรื่องนั้น
  * `name`: ชื่อทางการ (เช่น วาตานูกิ ริโนะ)
  * `aliases`: ชื่อเรียกอื่น/คำระบุตัวตน (เช่น รุ่นพี่วาตานูกิ, ประธานชมรมยิงธนู, ริโนะ)
  * `avatar_url`: รูปภาพตัวละคร (รองรับ Local/Cloud Storage)
  * `color`: สีประจำตัว (HEX/Tailwind Color เช่น `#3B82F6`, `#EC4899`)
  * `description`: คำอธิบายบุคลิก/หน้าตาสำหรับ AI ช่วยจับคู่
* **การเพิ่ม/แก้ไข:**
  * AI ตรวจจับตัวละครใหม่ให้อัตโนมัติเมื่อพบในตอนใหม่
  * ผู้ใช้สามารถอัปโหลดรูปภาพ ปรับสี และแก้ไขรายละเอียดได้เอง

### 3.3 เครื่องยนต์แปลงเนื้อหาด้วย AI (Antigravity AI Agent Ingestion)
* **Model & Runtime:** ใช้ Antigravity AI ในตัว IDE โดยตรง (ฟรี รวดเร็ว ประหยัด ไม่ต้องตั้งค่า API Key หรือเสียค่าบริการภายนอก)
* **กระบวนการทำงาน:**
  1. ผู้ใช้วางไฟล์นิยายดิบ (Markdown / Text) ไว้ในโฟลเดอร์สำหรับจัดเก็บเนื้อหาตั้งต้น (เช่น `raw_staging/` หรือ `01_Original_Chapters/`)
  2. สั่ง Antigravity ในแชท IDE ให้แปลงตอนที่ต้องการ
  3. Antigravity จะอ่านโครงสร้าง ตรวจสอบรายชื่อตัวละครในสมุดรายชื่อ (Character Roster) และแปลงเป็น Structured JSON (แยก Narration vs Dialogue พร้อมใส่ Speaker ID และสี) บันทึกเข้าสู่ระบบเว็บโดยตรง
* **Structured Output Schema:**
  ```typescript
  interface ParsedChapter {
    id: string; // เช่น ch-01
    chapterNumber: number;
    title: string;
    blocks: Array<
      | { type: "narration"; text: string }
      | { type: "dialogue"; speakerId: string; speakerName: string; text: string }
    >;
  }
  ```

### 3.4 โฟลเดอร์นำเข้าและคลังข้อมูล (Multi-Novel Staging & Data Storage)
* **Raw Source Repository (`novels_source/`):** จัดเก็บไฟล์ต้นฉบับแยกตามเรื่องอย่างเป็นระเบียบ เช่น `novels_source/kyudo-senpai/` และ `novels_source/idol-neighbor/`
* **Dropzone Staging Folder (`raw_chapters/`):** โฟลเดอร์กลางสำหรับวางไฟล์ใหม่ชั่วคราวก่อนย้ายเข้า novel source
* **Structured Data per Novel (`reader-web/src/data/novels/<novel-id>/`):** 
  * `characters.json`: รายชื่อและโทนสีตัวละครเฉพาะเรื่องนั้น
  * `chapters/`: ตอนแต่ละตอน (ch-01.json, ch-02.json, ...)
  * `index.ts`: export โมดูลประจำเรื่อง
* **Central Catalog (`reader-web/src/data/novels.json` & `index.ts`):** ทะเบียนนิยายทั้งหมดและ aggregated API export

### 3.5 ระบบและการใช้งานของเพื่อน
* รันเว็บในเครื่อง หรือดีพลอยเว็บสแตติก/ง่ายๆ (เช่น Vercel / GitHub Pages / Cloudflare) ให้เพื่อนเปิดอ่าน
* มีไฟล์คู่มือ (`AI_CONVERSION_GUIDE.md`) อธิบายคำสั่งที่ใช้บอก Antigravity เวลาต้องการให้แปลงตอนใหม่ๆ

### 3.6 สถาปัตยกรรมข้อมูล: Local-First Web Editor (Vite Middleware + Git-Publish)
จากการตกผลึกร่วมกันผ่าน Grilling Session ได้ข้อสรุปการจัดเก็บและแก้ไขข้อมูลดังนี้:
* **ไม่ต้องใช้ Cloud Database ภายนอก**: ตัดความซับซ้อนเรื่องโควต้า, ค่าใช้จ่าย, และ Database ล่ม ข้อมูลทั้งหมดคงอยู่ในรูปแบบ Version-Controlled JSON ภายใต้ `src/data/novels/`
* **Vite Dev Middleware API (Localhost Backend)**:
  * ในโหมดพัฒนา (`npm run dev`) ตัว Vite Server จะเปิด Endpoints ขนาดเบาเพื่อรับคำสั่งเขียนไฟล์กลับสู่ดิสก์โดยตรง:
    * `POST /api/update-novel`: แก้ไขข้อมูลชื่อเรื่อง, เรื่องย่อ, ปก, แบนเนอร์, แท็ก
    * `POST /api/update-characters`: แก้ไขหรือเพิ่มตัวละครและสีประจำตัว
    * `POST /api/update-chapter-block`: แก้ไขข้อความในบล็อกบทสนทนาหรือสลับตัวละครผู้พูด
* **Admin PIN & Production Safeguard (ความปลอดภัยและการแสดงผลบน Cloud)**:
  * บน **Localhost (คอมพิวเตอร์)**: มีปุ่ม "✏️ โหมดแก้ไข" พร้อมปลดล็อกด้วย Admin PIN (เก็บจำใน LocalStorage) เพื่อให้แก้ไขได้ทันทีโดยไม่ต้องเปิดโค้ด
  * บน **Vercel / Cloud (มือถือ & แท็บเล็ต)**: ระบบตรวจจับ Production Environment (`import.meta.env.PROD`) และซ่อนปุ่มแก้ไขทั้งหมดออก ให้กลายเป็นเว็บอ่านนิยายที่เรียบหรู คลีนตา ไร้ปุ่มรก
* **การผสานงานร่วมกับ AI (Antigravity)**:
  * ข้อมูลทั้งหมดยังคงเป็น JSON ไฟล์เดียวกับที่ Antigravity ตรวจสอบและแปลงนิยายตอนใหม่เข้ามา ทำให้ AI และ Web Editor ทำงานบน Single Source of Truth เดียวกัน 100%

---

## 4. แผนงานการดำเนินการที่ปรับปรุงแล้ว (Revised Implementation Roadmap)

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
- [x] พัฒนา Quality Guard Script ([verify-conversion.mjs](file:///d:/Yomiori/reader-web/scripts/verify-conversion.mjs)) สำหรับตรวจสอบความสมบูรณ์ของตัวอักษรเทียบกับ Raw Markdown (Zero-loss Verification)
- [x] เพิ่มระบบ Dynamic Character Discovery ลงทะเบียนตัวละครใหม่สู่อัตโนมัติใน [characters.json](file:///d:/Yomiori/reader-web/src/data/novels/kyudo-senpai/characters.json)
- [x] แปลงและเพิ่มตอนที่ 4 ถึงตอนที่ 9 ของเรื่อง *รุ่นพี่สาวสวยจากชมรมยิงธนู* ผ่านการตรวจสอบ 100% Fidelity (Anti-Lazy Batch Protocol)
- [x] อัปเดตคู่มือ [AI_CONVERSION_GUIDE.md](file:///d:/Yomiori/AI_CONVERSION_GUIDE.md) ด้วย Anti-Lazy Batch Protocol Template



