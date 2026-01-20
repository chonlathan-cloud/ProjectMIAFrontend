File Path: /Users/tadapongsrilasak/clone/LineBoost/README.md

for study and desing database

# LineBoost

แพลตฟอร์มสำหรับจัดการ LINE OA, Broadcast, Inbox, Knowledge Base และการเชื่อมต่อร้านค้า โดยใช้ React + Vite + Firebase Auth + API แบบ `/api`.

**Quick Start**
- ติดตั้ง: `npm install`
- รัน dev: `npm run dev`
- Build: `npm run build`

**Environment Variables**
- `VITE_FIREBASE_API_KEY` / `VITE_FIREBASE_AUTH_DOMAIN` / `VITE_FIREBASE_PROJECT_ID` / `VITE_FIREBASE_STORAGE_BUCKET` / `VITE_FIREBASE_MESSAGING_SENDER_ID` / `VITE_FIREBASE_APP_ID` ใช้ใน `src/lib/firebase.ts`
- `VITE_API_BASE_URL` override base URL สำหรับ API ใน `src/lib/api.ts` (ค่าเริ่มต้น `/api`)
- `VITE_STORE_ID` ใช้ใน `src/pages/Website.tsx`
- `VITE_BUILDER_URL` ใช้ใน `src/pages/Website.tsx`

**Backend Base URL**
- Dev (ยังไม่ deploy): `http://localhost:3000`
- Prod (deploy แล้ว): `https://backend-lineboost.web.app`

**App Flow (ไฟล์สัมพันธ์กันอย่างไร)**
- `src/main.tsx` สร้าง React root แล้ว render `src/App.tsx`
- `src/App.tsx` กำหนด routing ทั้งหมด + auth listener (Firebase) + Guard
- `src/components/layout/*` เป็นโครง layout ที่ครอบทุกหน้า protected ผ่าน `MainLayout` (Sidebar/TopNav/MobileBottomNav)
- `src/store/useStore.ts` คือ global state (user/store/lineOA) ใช้ร่วมกันทุกหน้า
- `src/lib/api.ts` รวม API ที่เรียก `/api` พร้อมแนบ Firebase ID token
- `src/pages/*` คือหน้า UI แต่ละ feature และเรียก `useStore` + `lib/api` ตามบริบท

**Routing Map (อ้างอิง `src/App.tsx`)**
- Public
  - `/login` → `src/pages/Login.tsx`
  - `/signup` → `src/pages/SignUp.tsx`
  - `/forgot-password` → `src/pages/ForgotPassword.tsx`
  - `/reset-password` → `src/pages/ResetPassword.tsx`
- Protected (ครอบด้วย `MainLayout`)
  - `/dashboard` → `src/pages/Dashboard.tsx`
  - `/line-callback` → `src/pages/LineCallback.tsx`
  - `/broadcast` → `src/pages/Broadcast.tsx`
  - `/analytics` → `src/pages/Analytics.tsx`
  - `/customers` → `src/pages/Customers.tsx`
  - `/inbox` → `src/pages/Inbox.tsx`
  - `/ab-test` → `src/pages/ABTest.tsx`
  - `/website` → `src/pages/Website.tsx`
  - `/settings` → `src/pages/Settings.tsx`
  - `/settings/store` → `src/pages/settings/StoreIntegration.tsx`
  - `/store/:storeId/knowledge` → `src/pages/KnowledgeView.tsx`
  - `/stores/:storeId/knowledge-editor` → `src/pages/KnowledgeEditor.tsx`

**Pages ที่ยังไม่ได้ผูก Route (ยังเป็น reference/legacy)**
- `src/pages/StoreSettings.tsx` ฟอร์มเชื่อมต่อ LINE OA แบบเดิม
- `src/pages/LineSetup.tsx` ฟอร์มเชื่อมต่อ LINE OA แบบ token-based
- `src/pages/ConnectBridge.tsx` คู่มือฝัง script เพื่อติดตาม event
- `src/pages/PublicSite.tsx` หน้า public site demo + tracker
- `src/pages/WebBuilder.tsx` placeholder สำหรับ web builder
- `src/pages/KnowledgeAIGenerator.tsx` เรียก AI สร้าง knowledge

**File Map (Root)**
- `README.md` เอกสารโปรเจกต์ฉบับนี้
- `package.json` scripts + dependencies
- `package-lock.json` lockfile
- `index.html` Vite entry HTML
- `vite.config.ts` / `vite.config.cjs` Vite config (TS + CJS)
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` TypeScript config
- `tsconfig.app.tsbuildinfo` / `tsconfig.node.tsbuildinfo` build info
- `tailwind.config.js` Tailwind config
- `postcss.config.js` PostCSS config
- `eslint.config.js` ESLint config
- `firebase.json` Firebase hosting config
- `components.json` shadcn/ui config
- `line-boost.sh` สคริปต์ช่วยสตาร์ท backend + db (มีส่วนซ้ำอยู่ในไฟล์เดียว)
- `public/` ไฟล์ static
- `dist/` output build (generated)
- `node_modules/` dependencies (generated)

**File Map (src/ entry + global)**
- `src/main.tsx` จุดเริ่ม React app
- `src/App.tsx` Router + Auth listener + Guard
- `src/App.css` สไตล์เพิ่มเติมเฉพาะ app
- `src/index.css` global styles + Tailwind base
- `src/vite-env.d.ts` types สำหรับ Vite

**File Map (src/lib)**
- `src/lib/api.ts` API wrapper ทุก endpoint ใช้ Firebase token
- `src/lib/firebase.ts` ตั้งค่า Firebase app/auth/firestore
- `src/lib/plans.ts` ข้อมูลแพ็คเกจ + limits
- `src/lib/tracker.ts` ยิง event tracking (ปัจจุบันชี้ localhost)
- `src/lib/utils.ts` helper utilities
- `src/lib/flexTemplates.ts` template ข้อความ Flex Message

**File Map (src/store)**
- `src/store/useStore.ts` Zustand store หลัก (user/store/lineOA)
- `src/store/useKnowledgeEditor.ts` Zustand store สำหรับ Knowledge Editor

**File Map (src/hooks)**
- `src/hooks/use-toast.ts` logic toast แบบ local state

**File Map (src/components)**
- `src/components/TenantBootstrap.tsx` โหลดรายการร้านแล้วตั้งค่า store ก่อน render children
- `src/components/FirestoreDebug.tsx` ตัวอย่างอ่าน/เขียน Firestore

**File Map (src/components/layout)**
- `src/components/layout/MainLayout.tsx` Layout หลัก + Outlet
- `src/components/layout/Sidebar.tsx` เมนูด้านซ้าย
- `src/components/layout/TopNav.tsx` top navigation
- `src/components/layout/MobileBottomNav.tsx` bottom nav สำหรับมือถือ

**File Map (src/components/ui)**
- `src/components/ui/accordion.tsx` Accordion wrapper (shadcn/ui)
- `src/components/ui/alert-dialog.tsx` AlertDialog wrapper
- `src/components/ui/alert.tsx` Alert wrapper
- `src/components/ui/aspect-ratio.tsx` AspectRatio wrapper
- `src/components/ui/avatar.tsx` Avatar wrapper
- `src/components/ui/badge.tsx` Badge component
- `src/components/ui/breadcrumb.tsx` Breadcrumb component
- `src/components/ui/button.tsx` Button component
- `src/components/ui/calendar.tsx` Calendar component
- `src/components/ui/card.tsx` Card component
- `src/components/ui/carousel.tsx` Carousel component
- `src/components/ui/chart.tsx` Chart helper
- `src/components/ui/checkbox.tsx` Checkbox component
- `src/components/ui/collapsible.tsx` Collapsible component
- `src/components/ui/command.tsx` Command palette component
- `src/components/ui/context-menu.tsx` ContextMenu component
- `src/components/ui/dialog.tsx` Dialog component
- `src/components/ui/drawer.tsx` Drawer component
- `src/components/ui/dropdown-menu.tsx` DropdownMenu component
- `src/components/ui/form.tsx` React Hook Form helpers
- `src/components/ui/hover-card.tsx` HoverCard component
- `src/components/ui/input-otp.tsx` OTP input
- `src/components/ui/input.tsx` Input component
- `src/components/ui/label.tsx` Label component
- `src/components/ui/menubar.tsx` Menubar component
- `src/components/ui/navigation-menu.tsx` NavigationMenu component
- `src/components/ui/pagination.tsx` Pagination component
- `src/components/ui/popover.tsx` Popover component
- `src/components/ui/progress.tsx` Progress component
- `src/components/ui/radio-group.tsx` RadioGroup component
- `src/components/ui/resizable.tsx` Resizable panels
- `src/components/ui/scroll-area.tsx` ScrollArea component
- `src/components/ui/select.tsx` Select component
- `src/components/ui/separator.tsx` Separator component
- `src/components/ui/sheet.tsx` Sheet component
- `src/components/ui/skeleton.tsx` Skeleton component
- `src/components/ui/slider.tsx` Slider component
- `src/components/ui/sonner.tsx` Sonner toast adapter
- `src/components/ui/switch.tsx` Switch component
- `src/components/ui/table.tsx` Table component
- `src/components/ui/tabs.tsx` Tabs component
- `src/components/ui/textarea.tsx` Textarea component
- `src/components/ui/toast.tsx` Toast component
- `src/components/ui/toaster.tsx` Toast renderer
- `src/components/ui/toggle-group.tsx` ToggleGroup component
- `src/components/ui/toggle.tsx` Toggle component
- `src/components/ui/tooltip.tsx` Tooltip component

**File Map (src/pages)**
- `src/pages/Login.tsx` Firebase email/password login
- `src/pages/SignUp.tsx` สมัครสมาชิก (Firebase)
- `src/pages/ForgotPassword.tsx` ขอรีเซ็ตรหัสผ่าน
- `src/pages/ResetPassword.tsx` เปลี่ยนรหัสผ่าน
- `src/pages/Dashboard.tsx` หน้าหลัก + โหลดร้าน/เช็คการเชื่อมต่อ LINE OA
- `src/pages/Broadcast.tsx` ส่งข้อความ + AI variants + ตรวจสถานะ LINE OA
- `src/pages/Analytics.tsx` placeholder สำหรับ analytics จริงจาก backend
- `src/pages/Customers.tsx` placeholder สำหรับรายชื่อลูกค้า
- `src/pages/Inbox.tsx` Inbox/Chat ดึงจาก API
- `src/pages/Settings.tsx` เลือกแพ็คเกจ + ลิงก์หน้า Store Integration
- `src/pages/settings/StoreIntegration.tsx` ฟอร์มเชื่อม LINE OA ต่อ store แบบใหม่
- `src/pages/LineCallback.tsx` callback จาก LINE OAuth และเซ็ต lineOA state
- `src/pages/KnowledgeView.tsx` อ่าน knowledge ของร้าน
- `src/pages/KnowledgeEditor.tsx` CRUD knowledge ผ่าน `useKnowledgeEditor`
- `src/pages/Website.tsx` แสดงสถานะเว็บไซต์ + analytics จาก backend
- `src/pages/StoreSettings.tsx` ฟอร์มเชื่อมต่อ LINE OA แบบเดิม
- `src/pages/LineSetup.tsx` เชื่อม LINE OA แบบ token-based (legacy)
- `src/pages/ConnectBridge.tsx` คู่มือฝัง script เพื่อติดตาม event
- `src/pages/PublicSite.tsx` หน้า public site สำหรับ store slug + tracker
- `src/pages/WebBuilder.tsx` placeholder เว็บออโต้สำหรับร้าน
- `src/pages/KnowledgeAIGenerator.tsx` เรียก AI สร้าง knowledge

**Public Assets**
- `public/image/logo_mia.jpg` โลโก้ที่ใช้เป็น watermark ในบางหน้า

**Scripts (จาก `package.json`)**
- `npm run dev` เริ่ม Vite dev server
- `npm run build` typecheck + build
- `npm run preview` preview build
- `npm run lint` ESLint
- `npm run typecheck` TypeScript typecheck

ถ้าต้องการให้ปรับ README เพิ่มส่วน diagram หรืออธิบาย flow แบบละเอียดกว่านี้ บอกได้เลย.
