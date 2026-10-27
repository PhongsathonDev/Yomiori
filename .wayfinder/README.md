# Local Markdown issue tracker

ที่เก็บ Wayfinder maps และ decision tickets ของ repo นี้ ใช้ระหว่างที่ยังไม่มี issue tracker ที่ตั้งค่าไว้ตาม `/setup-matt-pocock-skills` โดยไม่ต้องล็อกอิน GitHub CLI

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

Tracker นี้อยู่ใน repo และใช้ git แชร์ระหว่าง session ก่อน commit หรือ push ให้รักษาขอบเขตที่ผู้ใช้อนุญาต
