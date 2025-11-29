# LineBoost SME

LineBoost SME เป็นแพลตฟอร์ม SaaS ที่ช่วยให้ SME ไทยจัดการ Line Official Account ได้อย่างมืออาชีพ

## ฟีเจอร์หลัก

### 🎯 Core Features
- **Dashboard แบบ Real-time**: ติดตามสถิติและผลการดำเนินงาน
- **เชื่อมต่อ Line OA**: Wizard ง่ายๆ สำหรับเชื่อมต่อบัญชี Line Official Account
- **ส่งข้อความแบรอดแคสต์**: ส่งข้อความถึงผู้ติดตามทั้งหมด
- **AI Message Generator**: สร้างข้อความด้วย AI (แพ็คเกจ Growth+)
- **Analytics & Reports**: รายงานสถิติและการวิเคราะห์ข้อมูล
- **Customer Management**: จัดการและแบ่งกลุ่มลูกค้า
- **A/B Testing**: ทดสอบข้อความหลายรูปแบบ (แพ็คเกจ Growth+)

### 💎 Tier System
- **Starter**: ฟรี - เหมาะสำหรับธุรกิจที่เริ่มต้น
- **Growth**: ฿1,990/เดือน - สำหรับธุรกิจที่กำลังเติบโต
- **Enterprise**: ฿4,990/เดือน - สำหรับองค์กรขนาดใหญ่

### 🎨 Design Features
- Responsive Design (Mobile-first)
- Dark/Light Mode
- Thai Language Support (Font: Prompt, Sarabun)
- Modern Card-based UI
- Line Official Account Green (#00B900)
- Mobile Bottom Navigation

## Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3.4+
- **UI Components**: shadcn/ui
- **Routing**: React Router v6
- **State Management**: Zustand + localStorage persistence
- **Charts**: Recharts
- **Tables**: TanStack Table (React Table)
- **Icons**: Lucide React
- **Notifications**: Sonner (Toast)

## การติดตั้ง

### Requirements
- Node.js 18+
- npm หรือ yarn

### Installation Steps

1. Clone repository หรือ extract ไฟล์โปรเจค

2. ติดตั้ง dependencies:
```bash
npm install
```

3. รันโปรเจค:
```bash
npm run dev
```

4. เปิดเบราว์เซอร์ที่ http://localhost:5173

## Demo Account

สำหรับทดสอบระบบ ใช้:
- **Email**: demo@lineboost.com
- **Password**: demo1234

## โครงสร้างโปรเจค

```
src/
├── components/
│   ├── layout/          # Layout components (Sidebar, TopNav, MobileNav)
│   └── ui/              # shadcn/ui components
├── pages/               # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── LineSetup.tsx
│   ├── Broadcast.tsx
│   ├── Analytics.tsx
│   ├── Customers.tsx
│   ├── Settings.tsx
│   └── ABTest.tsx
├── store/
│   └── useStore.ts      # Zustand store
├── lib/
│   ├── utils.ts         # Utility functions
│   └── mockData.ts      # Mock data for demo
└── App.tsx              # Main app with routing
```

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

## การใช้งาน

### 1. เข้าสู่ระบบ
- ใช้ demo account หรือสร้างบัญชีใหม่

### 2. เชื่อมต่อ Line OA
- ไปที่หน้า "ตั้งค่า Line OA"
- ทำตามขั้นตอน 4 ขั้นตอน
- สแกน QR Code (mock) และกรอกข้อมูล

### 3. ส่งข้อความ
- ไปที่หน้า "ส่งข้อความ"
- เขียนข้อความหรือใช้ AI Generator
- เลือกผู้รับและส่ง

### 4. ดูรายงาน
- ไปที่หน้า "รายงานสถิติ"
- ดู Charts และ Analytics แบบ Real-time

### 5. จัดการลูกค้า
- ไปที่หน้า "ลูกค้า"
- ค้นหา กรอง และแบ่งกลุ่มลูกค้า

### 6. A/B Testing
- ไปที่หน้า "A/B Testing"
- สร้างการทดสอบข้อความ 2 แบบ
- ดูผลลัพธ์และเลือกแบบที่ดีที่สุด

## Features โดยละเอียด

### Dashboard
- สถิติหลัก 4 ตัว (ผู้ติดตาม, ข้อความส่ง, อัตราคลิก, รายได้)
- ข้อมูล Line OA ที่เชื่อมต่อ
- แพ็คเกจปัจจุบัน
- Quick Actions

### Line OA Setup
- Wizard 4 ขั้นตอน
- QR Code scanning (mock)
- กรอกข้อมูลบัญชี
- Validation และ Success state

### Broadcast
- Editor ข้อความ
- AI Generator (3 variants)
- สถิติผู้รับ
- การใช้งานเหลือ
- Tips & Tricks

### Analytics
- 4 KPI Cards
- Line Chart: การเติบโตของผู้ติดตาม
- Bar Chart: ข้อความแยกตามประเภท
- Line Chart: Engagement ตามวัน
- 3 Additional Metrics

### Customers
- Data Table พร้อม sorting/filtering
- Search functionality
- Segment badges (VIP, Regular, New)
- Status indicators
- Export function (mock)

### Settings
- แสดงแพ็คเกจปัจจุบัน
- Pricing Cards ทั้งหมด
- Upgrade/Downgrade
- ข้อมูลบัญชี
- ประวัติการชำระเงิน

### A/B Testing
- สร้าง test ใหม่
- เปรียบเทียบ 2 variants
- แสดงผลลัพธ์แบบ Real-time
- Winner indication
- Multiple test states (draft, running, completed)

## Mobile Responsive

- Mobile-first design
- Collapsible sidebar on mobile
- Bottom navigation bar (4 main pages)
- Touch-friendly buttons
- Optimized charts for small screens
- Responsive tables with hidden columns

## Dark Mode

- Toggle ใน TopNav
- Persisted ใน localStorage
- Smooth transition
- Support ทุก component

## Customization

### เปลี่ยนสี
แก้ไขใน `tailwind.config.js`:
```js
colors: {
  line: {
    DEFAULT: '#00B900',  // Line green
    dark: '#009900',
  },
}
```

### เปลี่ยน Font
แก้ไขใน `tailwind.config.js`:
```js
fontFamily: {
  sans: ['Prompt', 'Sarabun', 'system-ui', 'sans-serif'],
}
```

### เปลี่ยน Theme Colors
แก้ไขใน `src/index.css`:
```css
:root {
  --background: ...;
  --primary: ...;
  ...
}
```

## Production Deployment

### Build
```bash
npm run build
```

Output จะอยู่ใน `dist/` folder

### Deploy
Deploy `dist/` folder ไปยัง:
- Vercel
- Netlify
- AWS S3 + CloudFront
- หรือ Static hosting ใดๆ

## Future Enhancements

- [ ] Connect to real Line Messaging API
- [ ] Backend API with authentication
- [ ] Database integration (Supabase recommended)
- [ ] Real AI message generation
- [ ] Payment integration (Stripe/Omise)
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Export reports (PDF, Excel)
- [ ] Multi-language support
- [ ] Team collaboration features

## Support

สำหรับคำถามและการสนับสนุน:
- Email: support@lineboost.com (mock)
- Line: @lineboost (mock)

## License

Copyright © 2025 LineBoost SME. All rights reserved.

---

Built with ❤️ for Thai SMEs
