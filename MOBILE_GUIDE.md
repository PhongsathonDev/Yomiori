# คู่มือการใช้งานและ Build แอปมือถือ Yomiori (Reader Mobile)

โปรเจกต์ **reader-mobile** พัฒนาด้วย **React Native + Expo** อ่านข้อความที่บันทึกไว้หรือ bundled ได้ออฟไลน์ ส่วนภาพประกอบต้องตรวจความครบแยกตาม [คำศัพท์ผลิตภัณฑ์](CONTEXT.md) เอกสารนี้เป็นคู่มือติดตั้ง/เปิดแอป/สั่ง build; กติกาเขียนโค้ดอยู่ใน [mobile AGENTS.md](reader-mobile/AGENTS.md) และขั้นตอนตรวจงานอยู่ใน [VALIDATION.md](reader-mobile/VALIDATION.md)

---

## 📱 1. ติดตั้ง dependencies และเปิดแอป

รันจากโฟลเดอร์ `reader-mobile` ซึ่งใช้ npm และ package-lock.json:

```sh
npm ci
npm start
```

เลือก client/อุปกรณ์ตามคำแนะนำของ Expo CLI และ SDK ใน package.json ใช้ Expo Go ได้เมื่อเวอร์ชันและ native modules เข้ากันได้; ถ้าต้องใช้ development build ให้ทำตามเอกสาร Expo ที่ตรง SDK ตาม mobile AGENTS.md ไม่รับรองว่า Expo Go จาก Store จะใช้ได้กับทุก SDK

---

## 📦 2. วิธีสั่ง Build ไฟล์ APK สำหรับติดตั้งบน Android

โปรเจกต์ตั้งค่าไฟล์ `eas.json` ไว้เป็นโหมด **APK Standalone** เรียบร้อยแล้ว (สามารถติดตั้งบนมือถือได้โดยตรง ไม่ต้องผ่าน Google Play):

รันจาก `reader-mobile` หลังตรวจงานและถึงรอบส่งมอบที่ผู้ใช้ต้องการแล้ว ไม่สั่ง cloud build เพียงเพราะแก้เอกสารหรือ push ข้อมูล:

```sh
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

ใช้บัญชี/โครงการ/credentials เดิมตาม app.json และ eas.json เมื่อ build สำเร็จ EAS จะแสดงลิงก์ APK ให้ติดตั้งทับแอปเดิมโดยรักษาข้อมูล ทำ [device checks](reader-mobile/VALIDATION.md#required-device-checks-before-delivery) และบันทึกผลจริงก่อนรายงานว่าผ่านการตรวจบนเครื่อง

---

## 🛠️ 3. เอกสารและข้อมูลที่เกี่ยวข้อง

- [System blueprint](SYSTEM_BLUEPRINT.md): สถาปัตยกรรมเว็บ/มือถือและ CDN
- [Reader contract](.wayfinder/assets/reader-contract/spec.md): พฤติกรรมอ่าน ออฟไลน์ ความคืบหน้าและหน้าตาปัจจุบัน
- [Chapter protocol](AI_CONVERSION_GUIDE.md#chapter-protocol): การเพิ่มตอนและตรวจข้อมูลบน CDN
- [Git delivery](AGENTS.md#delivery): นโยบาย commit/push; การ push CDN ไม่เปลี่ยนโค้ดหรือ bundled files ใน APK ที่ติดตั้งแล้ว
