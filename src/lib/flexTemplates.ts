export type FlexTemplate = {
  id: string;
  name: string;
  altText: string;
  description: string;
  contents: Record<string, unknown>;
};

const defaultImageUrl = 'https://lineboost-sme-sandbox.web.app/image/logo_mia.jpg';

export const flexTemplates: FlexTemplate[] = [
  {
    id: 'flash-sale',
    name: 'Flash Sale',
    altText: 'Flash Sale วันนี้เท่านั้น',
    description: 'บับเบิลภาพใหญ่ + ปุ่มสั่งซื้อ เหมาะกับโปรแรงช่วงเวลาจำกัด',
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: defaultImageUrl,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'Flash Sale 20%', weight: 'bold', size: 'xl' },
          { type: 'text', text: 'หมดเขต 23.59 น.', size: 'sm', color: '#888888' },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#00B900',
            action: { type: 'uri', label: 'สั่งซื้อ', uri: 'https://yourshop.com' },
          },
          {
            type: 'button',
            style: 'link',
            action: { type: 'uri', label: 'ดูรายละเอียด', uri: 'https://yourshop.com/promo' },
          },
        ],
      },
    },
  },
  {
    id: 'catalog',
    name: 'Catalog 2 สินค้า',
    altText: 'แนะนำสินค้าใหม่ 2 รายการ',
    description: 'คารูเซล 2 ชิ้น แสดงภาพ + ราคา + ปุ่มซื้อ',
    contents: {
      type: 'carousel',
      contents: [
        {
          type: 'bubble',
          hero: {
            type: 'image',
            url: defaultImageUrl,
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: 'สินค้า A', weight: 'bold', size: 'xl' },
              { type: 'text', text: '฿590', size: 'sm', color: '#00B900' },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                style: 'primary',
                action: { type: 'uri', label: 'หยิบลงตะกร้า', uri: 'https://yourshop.com/a' },
              },
            ],
          },
        },
        {
          type: 'bubble',
          hero: {
            type: 'image',
            url: defaultImageUrl,
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: 'สินค้า B', weight: 'bold', size: 'xl' },
              { type: 'text', text: '฿790', size: 'sm', color: '#00B900' },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                style: 'primary',
                action: { type: 'uri', label: 'หยิบลงตะกร้า', uri: 'https://yourshop.com/b' },
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'coupon-reminder',
    name: 'คูปองเตือนจ่าย',
    altText: 'อย่าลืมใช้คูปองก่อนหมดอายุ',
    description: 'บับเบิลข้อความ + badge เวลาก่อนหมดอายุ + ปุ่มชำระเงิน',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: 'คูปองลด 10%', weight: 'bold', size: 'xl' },
          { type: 'text', text: 'ใช้ก่อน 23:59 วันนี้', color: '#D23F31', weight: 'bold', size: 'sm' },
          { type: 'text', text: 'กดชำระเงินเพื่อใช้คูปองอัตโนมัติ', size: 'sm', color: '#666666', wrap: true },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#FF9500',
            action: { type: 'uri', label: 'ชำระเงิน', uri: 'https://yourshop.com/checkout' },
          },
          {
            type: 'button',
            style: 'link',
            action: { type: 'uri', label: 'ดูสินค้า', uri: 'https://yourshop.com/cart' },
          },
        ],
      },
    },
  },
];
