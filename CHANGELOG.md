# LineBoost SME Changelog

รูปแบบอิงจาก Keep a Changelog และจัดเก็บสถานะปัจจุบันของฟีเจอร์ในฝั่ง Frontend (LineBoost SME)

## Unreleased

### Added (ฟีเจอร์ที่ใช้งานได้แล้ว)
- Auth พื้นฐาน: สมัครสมาชิก, ล็อกอิน, ลืมรหัสผ่าน, รีเซ็ตรหัสผ่าน (Firebase Auth)
- Dashboard: โหลดรายการร้านและตรวจสถานะการเชื่อมต่อ LINE OA
- LINE OAuth callback: รับผลจาก LINE และตั้งค่า state ของ LINE OA
- Broadcast UI: หน้าส่งข้อความพร้อม AI variants และเช็คสถานะ LINE OA
- Inbox: หน้าแชทลูกค้า, ดึงประวัติจาก API และแสดง UI พื้นฐาน
- PDPA Consent: หน้ายืนยันความยินยอม PDPA ต่อ store
- Knowledge Base: อ่าน/แก้ไข knowledge ของร้าน
- Store Integration: ฟอร์มเชื่อมต่อ LINE OA ต่อ store
- Website Status: หน้าแสดงสถานะเว็บไซต์และ analytics จาก backend
- Tracking: มีตัว tracker ฝั่งเว็บสำหรับยิง event ไป backend

### Notes (มีอยู่แต่ยังเป็น placeholder/legacy)
- Analytics และ Customers มีโครง UI แต่ยังเป็น placeholder
- A/B Test เป็น UI mock data
- Legacy pages: StoreSettings, LineSetup, ConnectBridge, PublicSite, WebBuilder, KnowledgeAIGenerator (ใช้เป็น reference)

### MVP TODO (งานที่ต้องทำให้เสร็จเพื่อไปถึง MVP)
- [ ] LIFF bridge: เก็บ lineUserId และ map เป็น storeId ผ่าน backend พร้อม handling error/expired session
- [ ] Inbox: เชื่อม API จริงสำหรับ customer list + history และรองรับ SSE realtime พร้อม empty/loading/error state
- [ ] PDPA: บันทึก consent + RoPA ให้ครบ flow (ตรวจซ้ำ, idempotent, success page)
- [ ] Tracking: เชื่อม /api/sites/event ด้วย base URL ถูกต้อง และทดสอบ event payload จริง
- [ ] Settings/Store Integration: validate token/credentials และแสดงสถานะการเชื่อมต่อแบบ realtime
- [ ] Auth + Guard: ปรับ guard ให้ครอบทุกหน้า protected และเพิ่ม redirect ที่ชัดเจน
- [ ] Deployment config: ตั้งค่า env สำหรับ dev/prod และตรวจการเรียก API ทุกหน้า
- [ ] UI polish: ทำ loading skeleton, empty state, และ error state ให้ครบทุกหน้าหลัก
