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

ก่อน build APK รุ่นใหม่เพื่อลง GitHub Releases ให้เพิ่ม `expo.version` และ `expo.android.versionCode` ใน `reader-mobile/app.json` พร้อมปรับเวอร์ชันรากของ `package.json` และ `package-lock.json` ให้ตรงกัน ใช้แท็ก Release เป็น `v<expo.version>` และชี้ไปยัง source commit ที่นำไป build จริง ผู้ใช้ย้ำความต้องการให้เพิ่มเลขเวอร์ชันเมื่อออกรุ่นใหม่เมื่อ 10 November 2026

ตรวจเลขเวอร์ชันที่ resolve จาก `npx expo config --type public` แล้ว commit/push ก่อนสั่ง build เพื่อให้ EAS ระบุ source commit ได้ตรงกับ Release รักษา package และคีย์เซ็นเดิมไว้ build APK จาก config ที่มีเลขเวอร์ชันใหม่ดังกล่าว

รันจาก `reader-mobile` หลังตรวจงานและถึงรอบส่งมอบที่ผู้ใช้ต้องการแล้ว ไม่สั่ง cloud build เพียงเพราะแก้เอกสารหรือ push ข้อมูล:

```sh
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

ใช้บัญชี/โครงการ/credentials เดิมตาม app.json และ eas.json เมื่อ build สำเร็จ EAS จะแสดงลิงก์ APK ให้ติดตั้งทับแอปเดิมโดยรักษาข้อมูล ทำ [device checks](reader-mobile/VALIDATION.md#required-device-checks-before-delivery) และบันทึกผลจริงก่อนรายงานว่าผ่านการตรวจบนเครื่อง

เมื่อลง GitHub Releases ให้เตรียม draft ที่ชี้ไปยัง source commit ของ APK พร้อมรายการเปลี่ยนแปลง ตรวจเวอร์ชันใน APK และใบรับรองเซ็นเทียบกับรุ่นเดิม แล้วแนบ APK กับไฟล์ SHA-256 หากช่องทางอัปโหลดของเครื่องทำงานไม่ได้ ใช้ workflow [Upload APK to draft release](.github/workflows/upload-apk.yml) โดยระบุแท็ก draft, EAS APK URL, checksum ที่ตรวจแล้ว และ source commit จากนั้นตรวจ digest ของ asset บน GitHub ให้ตรงก่อนเผยแพร่ Release ตัว workflow อัปโหลดเฉพาะไฟล์ที่ผ่านการตรวจและไม่เผยแพร่ draft เอง

---

## 🛠️ 3. เอกสารและข้อมูลที่เกี่ยวข้อง

- [System blueprint](SYSTEM_BLUEPRINT.md): สถาปัตยกรรมเว็บ/มือถือและ CDN
- [Reader contract](.wayfinder/assets/reader-contract/spec.md): พฤติกรรมอ่าน ออฟไลน์ ความคืบหน้าและหน้าตาปัจจุบัน
- [Chapter protocol](AI_CONVERSION_GUIDE.md#chapter-protocol): การเพิ่มตอนและตรวจข้อมูลบน CDN
- [Git delivery](AGENTS.md#delivery): นโยบาย commit/push; การ push CDN ไม่เปลี่ยนโค้ดหรือ bundled files ใน APK ที่ติดตั้งแล้ว
