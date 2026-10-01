# คู่มือการใช้งานและ Build แอปมือถือ Yomiori (Reader Mobile)

โปรเจกต์ **reader-mobile** พัฒนาด้วย **React Native + Expo** ออกแบบมาสำหรับเปิดอ่านนิยายแบบพกพา รองรับการอ่านแบบ **Offline 100%** พร้อมระบบดาวน์โหลดตอนตามสั่ง (On-Demand Download) ผ่าน GitHub Pages CDN

---

## 📱 1. วิธีเปิดทดสอบบนมือถือของคุณ (ผ่าน Expo Go)

คุณสามารถเปิดทดสอบบนมือถือจริงได้ทันทีโดยไม่ต้องต่อสาย:

1. โหลดแอป **Expo Go** จาก Google Play Store ลงในมือถือ Android
2. ในเครื่องคอมพิวเตอร์ เปิด Terminal เข้าโฟลเดอร์ `reader-mobile`:
   ```bash
   cd reader-mobile
   npx expo start
   ```
3. ใช้กล้องมือถือหรือแอป Expo Go สแกน **QR Code** ที่ขึ้นใน Terminal
4. หน้าจอแอป Yomiori Mobile จะเปิดขึ้นบนมือถือของคุณทันที!

---

## 📦 2. วิธีสั่ง Build ไฟล์ APK สำหรับติดตั้งบน Android

โปรเจกต์ตั้งค่าไฟล์ `eas.json` ไว้เป็นโหมด **APK Standalone** เรียบร้อยแล้ว (สามารถติดตั้งบนมือถือได้โดยตรง ไม่ต้องผ่าน Google Play):

1. ติดตั้ง EAS CLI (ทำครั้งเดียว):
   ```bash
   npm install -g eas-cli
   ```
2. ล็อกอินบัญชี Expo (สมัครฟรีที่ expo.dev):
   ```bash
   eas login
   ```
3. สั่ง Build เป็นไฟล์ APK บน Cloud:
   ```bash
   cd reader-mobile
   eas build -p android --profile preview
   ```
4. เมื่อระบบคอมไพล์เสร็จ จะมี **ลิงก์ดาวน์โหลดไฟล์ `.apk`** และ QR Code ให้สแกนโหลดลงมือถือเพื่อกดติดตั้งได้ทันที!

---

## 🛠️ 3. สถาปัตยกรรมของแอป (Architecture)

- **UI / UX:** ออกแบบด้วย React Native แท้ๆ รองรับ Continuous Vertical Scroll, Visual Novel Dialogue Cards, แถบเปอร์เซ็นต์อ่าน, ปรับขนาดฟอนต์ และเปลี่ยนธีม (Light, Dark, Sepia)
- **Data Source:** ดึงเนื้อหาตอนและตัวละครจาก GitHub Pages Headless CDN (`/data/novels/...`)
- **Offline Storage:** จัดเก็บไฟล์ JSON ที่ดาวน์โหลดแล้วลงใน DocumentDirectory ของมือถือด้วย `expo-file-system` ทำให้เปิดอ่านตอนที่ดาวน์โหลดไว้ได้ตลอดเวลาแม้ไม่มีอินเทอร์เน็ต
- **Bookmarks & Progress:** บันทึกตอนที่อ่านล่าสุดและตำแหน่งเปอร์เซ็นต์การอ่านลงใน `AsyncStorage` ของตัวเครื่อง
