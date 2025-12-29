export const tierFeatures = {
  starter: {
    name: 'Starter',
    price: 0,
    features: [
      'ผู้ติดตามสูงสุด 1,000 คน',
      'แบรอดแคสต์ 500 ข้อความ/เดือน',
      'รายงานพื้นฐาน',
      'ตอบกลับอัตโนมัติ',
    ],
    limits: {
      maxFollowers: 1000,
      monthlyBroadcasts: 500,
      aiGeneration: 10,
      support: 'email',
    },
  },
  growth: {
    name: 'Growth',
    price: 1990,
    features: [
      'ผู้ติดตามสูงสุด 10,000 คน',
      'แบรอดแคสต์ไม่จำกัด',
      'รายงานขั้นสูง + Analytics',
      'AI สร้างข้อความ 100 ครั้ง/เดือน',
      'แท็กลูกค้าอัตโนมัติ',
      'Support แชทสด',
    ],
    limits: {
      maxFollowers: 10000,
      monthlyBroadcasts: Infinity,
      aiGeneration: 100,
      support: 'chat',
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 4990,
    features: [
      'ผู้ติดตามไม่จำกัด',
      'แบรอดแคสต์ไม่จำกัด',
      'รายงาน + Analytics แบบ Real-time',
      'AI สร้างข้อความไม่จำกัด',
      'API Access',
      'Custom Integration',
      'Dedicated Account Manager',
      'Support 24/7',
    ],
    limits: {
      maxFollowers: Infinity,
      monthlyBroadcasts: Infinity,
      aiGeneration: Infinity,
      support: '24/7',
    },
  },
};
