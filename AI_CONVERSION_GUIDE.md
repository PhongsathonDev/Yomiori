# คู่มือแปลงนิยายเข้า Yomiori

เอกสารนี้เป็นแหล่งหลักของขั้นตอนแปลง/แก้ตอนและเผยแพร่ข้อมูล reader ใช้ร่วมกับ [AGENTS.md](AGENTS.md) ซึ่งเป็นจุดเริ่มอ่านและเจ้าของนโยบายส่งงาน รายละเอียดโครงสร้างระบบอยู่ใน [SYSTEM_BLUEPRINT.md](SYSTEM_BLUEPRINT.md)

<a id="scope"></a>
## เลือกขอบเขตให้ตรงคำสั่ง

| ผู้ใช้ขอ | ทำในขอบเขตนี้ |
| --- | --- |
| ดึงหรืออัปเดตต้นฉบับอย่างเดียว | ทำตาม [มาตรฐานต้นฉบับ](novels_source/README.md); ยังไม่แปลงหรือรายงานว่ามีตอนพร้อมอ่านบนแอป/CDN |
| เตรียมโครงเรื่อง ปก หรือตัวละคร | ตรวจ catalog/modules เว็บและมือถือ พร้อมเอกสารประจำเรื่อง; คงรายการตอนว่างถ้ายังไม่ได้แปลง ไม่สร้าง JSON ตอนหรือ fallback สมมติ |
| เพิ่ม/แปลง/แก้ตอนเข้า reader | อ่านและทำครบ 6 ขั้นตอนด้านล่าง |
| แก้ข้อมูลตัวละครอย่างเดียว | รักษา ID และซิงค์ roster เว็บ/มือถือ; ถ้าแก้ speaker หรือข้อความในตอนด้วย ให้ใช้ขั้นตอนแก้ตอนครบชุด |

อ่าน _source.json, overview, characters.json และเอกสาร CONVERSION_STATUS.md / visual-assets.md ของเรื่องเท่าที่มี เพื่อทราบแหล่งที่มาและขอบเขตเดิม ไม่ใช้จำนวนไฟล์ต้นฉบับแทนจำนวนตอนที่พร้อมอ่าน

<a id="chapter-protocol"></a>
## ขั้นตอนบังคับเมื่อเพิ่มหรือแก้ตอนเข้า reader

ต้องทำครบทั้ง 6 ขั้นตอน การขาด export, manifest หรือการ deploy CDN อาจทำให้มือถือไม่พบตอน ตัวอย่าง path และคำสั่งที่มีวงเล็บมุมให้แทนด้วยค่าของงานจริง

### ขั้นตอนที่ 1: แปลงลง Reader Web

- อ่านต้นฉบับจาก novels_source/<novel-id>/ โดยตรง ไม่สร้าง staging หรือโฟลเดอร์ซ้อนสำหรับไฟล์ตอน ตาม [มาตรฐานต้นฉบับ](novels_source/README.md)
- เขียน reader-web/src/data/novels/<novel-id>/chapters/ch-XX.json และอัปเดต chapters/index.ts ให้ import/export ตอนครบ
- ใช้ Chapter และ StoryBlock ใน [web types](reader-web/src/types.ts) และ [mobile types](reader-mobile/src/types/index.ts): ต้องมี novelId, novelTitle และ id บล็อกไม่ซ้ำภายในตอน
- แยกข้อความเป็น narration / dialogue; เก็บเส้นแบ่งฉากเป็น scene_break และภาพเป็น illustration ตามตำแหน่งเดิม
- ทุก dialogue ต้องมี speakerId และ speakerName ที่อ้างตัวละครจริง ตรวจชื่อ ฉายา สรรพนามและบริบทกับ roster; ห้ามใช้ unknown หรือเดาผู้พูดเพื่อให้ผ่านการตรวจ หากยังยืนยันไม่ได้ให้รายงานจุดที่ค้าง
- ตัวละครใหม่ให้เพิ่มใน characters.json ของเรื่อง พร้อม id, name, role, color, aliases และ description; สีอยู่ใน roster ไม่ต้องฝังซ้ำในบทสนทนา

### ขั้นตอนที่ 2: ตรวจความครบและความตรงของเนื้อหา

- รักษาข้อความทุกย่อหน้าและบทสนทนา ห้ามสรุป ตัดทอนหรือเปลี่ยนสำนวน ตรวจเนื้อเรื่องทุกย่อหน้าตามลำดับกับ JSON รวมเครื่องหมายและหมายเหตุ; แยกส่วนหัว/metadata ตามมาตรฐานต้นฉบับ
- ตรวจภาพและเส้นแบ่งฉากแยก พร้อมตรวจผู้พูดและ ID ทุกบล็อก
- รันตัวเตือนความยาวจากโฟลเดอร์ reader-web โดย path ในคำสั่งอ้างจากโฟลเดอร์นั้น:

```sh
npm run verify -- "../novels_source/<novel-id>/<source-file>.md" "src/data/novels/<novel-id>/chapters/ch-XX.json"
```

[verify-conversion.mjs](reader-web/scripts/verify-conversion.mjs) ปัจจุบันผ่านเมื่ออัตราความยาวอยู่ที่ 96–104% หลังตัดช่องว่าง เครื่องหมายบางชนิดและส่วนหัวออก ไม่ได้พิสูจน์ข้อความเท่ากัน ลำดับ ผู้พูด หรือภาพ แม้ผลพิมพ์ว่า 100% Fidelity ก็ห้ามใช้ยืนยัน zero-loss จากค่านี้อย่างเดียว รายงานว่ายังไม่ยืนยันความครบหากยังเทียบเนื้อหาไม่ได้

### ขั้นตอนที่ 3: ซิงค์ Mobile และตรวจ runtime lookup

- คัดลอก JSON ตอนและ characters.json ไปยัง reader-mobile/src/data/novels/<novel-id>/ และอัปเดต chapters/index.ts ให้ export ตอนครบ
- ตรวจ [getBundledChapter ใน storage.ts](reader-mobile/src/services/storage.ts): ปัจจุบันใช้ Kyudo ตอน 1 และชุด Black Cat ที่ import อยู่ การคัดลอกไฟล์หรือเพิ่ม export ใน index ที่ไม่มีผู้ใช้ไม่ได้ทำให้ตอนนั้นเป็น runtime-bundled
- คงขอบเขต bundled เดิมเว้นแต่งานระบุให้เปลี่ยน สำหรับตอนที่ตั้งใจให้มากับแอป ต้องตรวจว่า runtime import/lookup เรียกได้จริง
- ตรวจ [getAvailableChapterList ใน api.ts](reader-mobile/src/services/api.ts) ซึ่งรวม CDN manifest, Black Cat bundled และไฟล์ที่บันทึกจริง fallback เดิม Kyudo 1–25 / Boyish 1–14 เป็นรายการสารบัญ ไม่ใช่หลักฐานว่ามีข้อความ bundled ห้ามเพิ่มจำนวนเพื่อทดแทน manifest หรือสร้างรายการของตอนที่ยังไม่แปลง
- การเปลี่ยน runtime bundle ต้องออกแอป build ใหม่จึงถึงเครื่องผู้ใช้ การ push CDN ไม่เปลี่ยน bundled files ใน APK เดิม; ใช้ [runbook มือถือ](reader-mobile/VALIDATION.md) สำหรับการตรวจที่เกี่ยวข้อง

### ขั้นตอนที่ 4: Build และตรวจ manifest

รันจากราก repo:

```sh
npm --prefix reader-web run build
```

คำสั่งนี้รัน TypeScript, Vite และ [postbuild.mjs](reader-web/scripts/postbuild.mjs) ส่งข้อมูลไป reader-web/dist/data/ พร้อมสร้าง manifest.json ของแต่ละเรื่อง ตรวจว่า chapters มี ID/เลขตอน/ชื่อที่ต้องการ และ totalAvailable ตรงกับรายการจริง ห้ามนับไฟล์ต้นฉบับหรือเลขตอนสูงสุดแทนจำนวนรายการพร้อมอ่าน

### ขั้นตอนที่ 5: Commit / Push และส่งเข้าสาขา Deploy

ทำตาม [นโยบายส่งงาน](AGENTS.md#delivery) ซึ่งกำหนดให้ stage เฉพาะไฟล์งาน ตรวจที่เกี่ยวข้องแล้ว commit/push สาขาพัฒนาปัจจุบันทันที

[deploy.yml](.github/workflows/deploy.yml) deploy เมื่อ push เข้า main / master หรือสั่ง workflow ด้วยมือ การ push สาขาอื่นอย่างเดียวยังไม่เผยแพร่ CDN ต้องนำงานเข้าสาขา deploy ตามขอบเขตที่ได้รับอนุญาตก่อนรายงานว่าพร้อมอ่านออนไลน์ หากยังไม่ได้รวมให้รายงานว่ายังรอ deploy ระวัง git push origin main จากสาขาอื่น: คำสั่งนั้นส่ง local ref main ไม่ใช่งานของสาขาปัจจุบัน

### ขั้นตอนที่ 6: ตรวจ Deploy ของ commit และข้อมูลบน CDN

รันจากราก repo โดยใช้ SHA ที่ส่งเข้าสาขา deploy:

```sh
gh run list --workflow deploy.yml --commit <deployed-commit-sha>
gh run watch <run-id> --exit-status
```

ต้องผ่านทั้ง workflow ที่ตรง commit และ HTTP status 200 ของ JSON ตอนกับ manifest ไม่ผูกผลกับ HTTP version ตัวอย่างบน Windows:

```sh
curl.exe -f -I "https://phongsathondev.github.io/Yomiori/data/novels/<novel-id>/chapters/ch-XX.json"
curl.exe -f -I "https://phongsathondev.github.io/Yomiori/data/novels/<novel-id>/manifest.json"
```

เมื่อแก้ตอนเดิม ให้เทียบ JSON ที่ดึงจาก CDN กับข้อมูลที่คาดหวังด้วย HTTP 200 ของ URL เดิมอย่างเดียวไม่ยืนยันว่าฉบับล่าสุดขึ้นแล้ว รายงานสิ่งที่ตรวจจริงและรายการค้าง

## ตัวอย่างคำสั่ง

- **แปลงตอนเดียว:** “แปลง Ch_04_<ชื่อตอน>.md ใน novels_source/kyudo-senpai/ เข้า reader ตามขั้นตอน 6 ขั้นใน AI_CONVERSION_GUIDE.md”
- **แปลงหลายตอน:** “แปลงตอน 7–9 ของ kyudo-senpai ทีละตอน ตรวจข้อความทุกย่อหน้า ผู้พูด ภาพและเส้นแบ่งฉาก แล้วทำขั้นตอนซิงค์/build/ส่งงาน/ตรวจ CDN ให้ครบตามคู่มือ”
- **เตรียมโครงเรื่องเท่านั้น:** “เตรียมโครงเรื่อง <novel-id> พร้อมปกและตัวละครในเว็บ/มือถือ ยังไม่แปลงตอน ไม่สร้างรายการตอนพร้อมอ่าน”
- **แก้ตัวละครเท่านั้น:** “เพิ่มอาจารย์ซาซากิใน roster ของ kyudo-senpai และซิงค์มือถือ รักษา ID เดิม งานนี้ไม่แก้ข้อความหรือผู้พูดในตอน”
