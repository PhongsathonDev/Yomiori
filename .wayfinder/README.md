# Local Markdown issue tracker

แหล่งหลักของกติกา tracker และการสร้างกระดานงาน แหล่งข้อมูลจริงคือ `issues/` ส่วน `tasks.html` เป็นผลสร้างสำหรับเปิดดู งานเริ่มจาก [AGENTS.md](../AGENTS.md) แล้วอ่าน map/ticket ที่เกี่ยวข้อง ใช้งาน tracker ในเครื่องได้โดยไม่ต้องล็อกอิน GitHub CLI

## Scope and terms

- **Session** ในกฎด้านล่างหมายถึงรอบทำงานต่อเนื่องกับ decision ticket ที่เลือก ไม่ใช่หนึ่ง tool call; การย่อ context ไม่เริ่มสิทธิ์ปิด ticket เพิ่ม
- **HITL (human in the loop)** คือจุดที่ map/ticket ระบุให้ผู้ใช้ตัดสินหรือรับรอง เช่นภาพร่างและผลตรวจอุปกรณ์ ไม่ถือว่า tests ผ่านหรือผู้ช่วยเลือกเองเป็นการอนุมัติแทนผู้ใช้
- การอ่าน/review อย่างเดียวไม่ใช่การ claim หรือ resolve งาน หากทำงานตาม tracker ต้องอ่านขอบเขต/Notes ของ map ด้วย เพราะ frontier บอกเพียง blockers/claims ไม่ได้ยกเลิก planning-only หรือเงื่อนไขอนุมัติ
- วิธีจัดกลุ่มอยู่ใน [Grouping and coordination](#grouping-and-coordination); คำสั่ง update/check อยู่ใน [การอัปเดตกระดาน standalone](#การอัปเดตกระดาน-standalone) ไม่คัดลอกกติกาชุดเต็มไปไว้ใน entry point หรือไฟล์อื่น

## Issue format

แต่ละไฟล์ใน `issues/` เป็นหนึ่ง issue; `id` เป็นตัวตนถาวร และ `title` เป็นชื่อที่ใช้สื่อสารกับผู้ใช้ ลิงก์ทุกครั้งด้วยชื่อ ไม่ใช้เลข issue เปล่า ๆ

```yaml
---
id: WF-0002
title: ชื่อคำถามหรือสิ่งที่ต้องพิสูจน์
state: open
labels: wayfinder:task
assignee:
parent: WF-0001
---
```

- `state`: `open` หรือ `closed`
- `labels`: เฉพาะ `wayfinder:map`, `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling` หรือ `wayfinder:task` เท่านั้น
- `assignee`: เว้นว่างหมายถึงยังไม่ claim; ก่อนเริ่มทำ ticket ต้องใส่ชื่อ dev ผู้ขับเคลื่อนงาน
- `parent`: id ของ map; เว้นว่างสำหรับ map เอง
- `## Question`: คำถามหรือ prerequisite ที่ต้องจัดการ ไม่บันทึกคำตอบในส่วนนี้

## Wayfinding operations

**ค้นหา map:** ค้น `labels: wayfinder:map` ภายใน `issues/` แล้วอ่าน map ก่อนเลือก ticket

**Query frontier:**

```sh
node scripts/wayfinder-status.mjs WF-0001
```

แสดงเฉพาะ child tickets ที่เปิดอยู่ ไม่มี assignee และ blockers ปิดครบแล้ว หากต้องการตรวจ child tickets ทั้งหมด:

```sh
node scripts/wayfinder-status.mjs WF-0001 --all
```

**Parent/child:** ใช้ `parent` ใน metadata ของ child เป็นข้อมูลอ้างอิงหลัก Map ไม่เก็บรายชื่อ open tickets ซ้ำ

**Blocking:** Markdown ไม่มี native dependency relationship จึงใช้ `## Blocked by` ใน body ของ child เป็นแหล่งอ้างอิงหลัก โดยลิงก์ไปยัง issue ที่ขวางอยู่ด้วยชื่อเต็ม Script อ่านความสัมพันธ์จากส่วนนี้โดยตรง ไม่สร้าง blocker metadata อีกชุด

**Claim:** แก้ `assignee` จากค่าว่างเป็นชื่อ dev ก่อนเริ่มทำงาน ตรวจ frontier ใหม่ก่อน claim เพื่อหลีกเลี่ยงการชนกับ session อื่น

**Resolution comment:** ต่อท้าย ticket ด้วย `## Resolution comments` และ comment ที่มีวันเวลา ผู้ตอบ และคำตอบ/หลักฐาน ลิงก์ assets แทนการวางข้อมูลขนาดใหญ่ไว้ใน body จากนั้นตั้ง `state: closed` และเพิ่มลิงก์พร้อม gist หนึ่งบรรทัดใน Decisions so far ของ map

**Graduating fog:** สร้าง issue ใหม่ก่อน แล้วค่อยเติม parent/blocking/cross-references ด้วย id จริง ลบ fog ที่ย้ายมาเป็น ticket แล้วออกจาก map

**Out of scope:** ปิด ticket ที่หลุดขอบเขต และลิงก์พร้อมเหตุผลใน Out of scope ของ map ไม่เพิ่มเข้า Decisions so far

**One ticket per session:** การ chart map ไม่ resolve ticket ใด ๆ; session ที่ทำงานต่อ resolve ได้ไม่เกินหนึ่ง ticket ยกเว้น research ตามทักษะ wayfinder

หากจะใช้ข้อยกเว้น research ต้องอ่านทักษะ wayfinder ที่มีอยู่และระบุข้อยกเว้นที่ใช้ให้ชัด หากทักษะนั้นไม่มีหรืออ่านไม่ได้ ห้ามอนุมานว่าคำว่า research อนุญาตให้ปิดหลาย decision tickets ได้เอง

Tracker นี้อยู่ใน repo และใช้ git แชร์ระหว่าง session ก่อน commit หรือ push ให้รักษาขอบเขตที่ผู้ใช้อนุญาตและทำตาม [นโยบายส่งงาน](../AGENTS.md#delivery)

## Grouping and coordination

### หมวดหลักและงานที่เชื่อมกัน

- **กลุ่มงาน = แผนแม่** (`wayfinder:map`) ใช้ชื่อแผนเป็นชื่อกลุ่ม และ `parent` เป็นแหล่งข้อมูลสมาชิกเพียงแห่งเดียว ไม่สร้างรายการลูกซ้ำใน map หรือใน HTML
- งานใหม่ต้องมี `parent` ที่อ้างถึง map จริง ถ้าเป้าหมายต่างจากกลุ่มเดิมให้สร้าง map ใหม่ ไม่ย้ายงานเข้ากลุ่มเพียงเพราะใช้ไฟล์เดียวกัน
- งานเดี่ยวเก่าที่ยังไม่มี parent จะแสดงใน “งานแยก / ตรวจรับและส่งมอบ” เช่นงานตรวจ final APK ซึ่งอ้างอิงหลายแผน ไม่บังคับยัดเข้ากลุ่มใดโดยเปลี่ยนความหมายเดิม งานใหม่ที่ต้องเป็นงานเดี่ยวต้องบันทึกเหตุผลใน Notes ของ ticket
- **ต้องรอก่อน**: ใช้ `## Blocked by` ลิงก์ชื่อเต็มของ prerequisite สถานะเริ่มได้ต้องรอ blocker ทุกตัวปิด ความสัมพันธ์เป็นทิศทางและห้ามวนกลับ อ้างงานนอกแผนได้ถ้าจำเป็นจริง
- **ทำควบคู่กัน / ประสานบริบท**: ใช้ `## Work with` และลิงก์กลับทั้งสองฝั่ง หมายถึงควรอ่านผล/ตกลง interfaces ร่วมกัน ไม่ใช่ blocker และไม่ได้แปลว่าต้อง resolve พร้อมกัน อ้างข้ามกลุ่มได้โดยไม่เปลี่ยน parent
- ถ้าทำแยกแล้วตัดสินไม่ได้จริง ให้เก็บเป็น ticket เดียวที่ยังมีขนาดเหมาะสม ไม่ใช้ Work with ฝืนแบ่ง decision ที่แยกจากกันไม่ได้
- ข้อความ “เกี่ยวข้องกับ” ใน body ไม่ได้สร้างความสัมพันธ์อัตโนมัติ ห้ามตีความลิงก์หลักฐาน/Resolution ว่าเป็น prerequisite

ตัวอย่าง (ใช้รหัสจริงเมื่อสร้าง issue แล้ว):

```markdown
## Work with

- [เลือกภาพร่างชั้นหนังสือที่อ่านชื่อเรื่องง่ายบนมือถือและแท็บเล็ต](WF-0021.md)

## Blocked by

- [กำหนดเกณฑ์หมุนจอทั้งแอปโดยคงหน้าอ่านและตำแหน่งเดิม](WF-0022.md)
```

### สถานะที่แสดงและคำสั่งแบบกลุ่ม

- เริ่มได้: เปิด + ไม่มี assignee + blockers ปิดครบ; มีผู้รับผิดชอบ: เปิด มี assignee ไม่ติด blocker; ต้องรอ: เปิดและมี blocker ยังไม่ปิด/ไม่พบ; ปิดแล้ว: state closed (อาจเป็น out of scope ไม่ใช่เสร็จสำเร็จเสมอ)
- แผนแม่เป็นหัวกลุ่ม ไม่รวมในตัวเลขงานค้าง/ปิดแล้วซ้ำกับ tickets
- ปุ่มเริ่มกลุ่มคัดลอกบริบทและงานค้างของกลุ่มครบ แม้กำลังกรองบางรายการ แต่ให้เริ่มเฉพาะ frontier เท่านั้น ปุ่มจะปิดเมื่อไม่มีงานเริ่มได้
- คำสั่งกลุ่มไม่ยกเลิก claim, HITL, planning-only หรือหนึ่ง decision ticket ต่อ session งานคู่ทำได้คนละ session โดยประสานบริบท ไม่ปิดหลาย ticket แทนผู้ใช้
- ไม่เปลี่ยน state, assignee หรือ blockers เพียงเพื่อให้หน้ากระดานดูเรียบร้อย

<a id="dashboard"></a>
### การอัปเดตกระดาน standalone

`tasks.html` เปิดจาก `file:///D:/Yomiori/tasks.html` ได้โดยไม่ต้องรัน dev server ข้อมูลสำรอง/model ในไฟล์เป็น generated artifact แหล่งจริงยังเป็น Markdown และ `scripts/wayfinder-model.cjs` หน้าเว็บพยายามโหลดชุดข้อมูล GitHub main จาก commit เดียว หาก offline/timeout/rate limit จะเก็บข้อมูลเดิมไว้และแจ้งว่าอาจไม่ล่าสุด

หลังแก้ tracker ทุกครั้ง (รวมสร้าง/claim/resolve/เพิ่มความสัมพันธ์):

```sh
node scripts/update-task-dashboard.mjs
node --test scripts/wayfinder-model.test.cjs
node scripts/update-task-dashboard.mjs --check
node scripts/wayfinder-status.mjs WF-0020 --all
```

commit `tasks.html` ไปพร้อมข้อมูล tracker เสมอ ห้ามแก้ generated blocks ด้วยมือ ตัวตรวจจะปฏิเสธรหัสซ้ำ แผนแม่ผิด งานอ้างอิงหาย Work with ที่ไม่มีลิงก์กลับ และ dependency cycle
