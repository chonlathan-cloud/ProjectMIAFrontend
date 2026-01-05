import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';

/**
 * ConnectBridge Setup Page
 *
 * This page guides merchants through connecting their own website with
 * the Mia-Connect backend so that AI can react to customer behaviour.
 * It generates a personalised script tag containing the user’s uid
 * which must be embedded into the merchant’s storefront.  When the
 * script is loaded it exposes a `connectBridge.sendEvent` function
 * which can be used to forward events.  For example:
 *
 * ```js
 * // When a product is viewed
 * connectBridge.sendEvent('product_view', { name: 'ชื่อสินค้า', price: 199 });
 * ```
 */
export function ConnectBridge() {
  const { user, store } = useStore();
  const [domain, setDomain] = useState('');
  const [scriptTag, setScriptTag] = useState('');

  useEffect(() => {
    if (!user?.id && !store?.id) return;

    const rawBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    const apiBase = rawBase
      ? rawBase.endsWith('/api')
        ? rawBase
        : `${rawBase}/api`
      : '/api';
    const params = new URLSearchParams();
    if (store?.id) params.set('storeId', store.id);
    if (user?.id) params.set('uid', user.id);
    const src = `${apiBase}/connectbridge/script.js?${params.toString()}`;
    setScriptTag(`<script src="${src}" defer></script>`);
  }, [user?.id, store?.id]);

  const resolveEventEndpoint = () => {
    const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    if (!base) return '/api/sites/event';
    if (base.endsWith('/api')) return `${base}/sites/event`;
    return `${base}/api/sites/event`;
  };

  const handleTest = async () => {
    if (!store?.id) {
      toast.error('กรุณาเลือกร้านก่อนทดสอบ');
      return;
    }

    try {
      const endpoint = resolveEventEndpoint();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          eventType: 'connectbridge_test',
          eventName: 'connectbridge_test',
          url: domain || window.location.href,
          page: domain || window.location.pathname,
          meta: { domain: domain || null },
        }),
      });
      if (!res.ok) throw new Error('ส่ง event ไม่สำเร็จ');
      toast.success('ส่ง event ทดสอบแล้ว ตรวจสอบใน Firestore/Inbox');
    } catch (error: any) {
      toast.error(error?.message || 'ทดสอบไม่สำเร็จ');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scriptTag);
      toast.success('คัดลอก Script แล้ว!');
    } catch {
      toast.error('ไม่สามารถคัดลอกได้');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">เชื่อมต่อเว็บไซต์ของคุณ</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          ติดตั้ง ConnectBridge บนเว็บไซต์เพื่อให้ AI สามารถรับรู้พฤติกรรมลูกค้าและส่งข้อความกลับไปทาง
          LINE ได้อย่างต่อเนื่อง
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ขั้นตอนที่ 1: เพิ่ม Script ลงในเว็บไซต์</CardTitle>
          <CardDescription>
            วางโค้ดต่อไปนี้ในส่วน &lt;head&gt; ของทุกหน้าที่ต้องการติดตาม
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={scriptTag}
            readOnly
            className="font-mono text-xs resize-none h-20"
          />
          <Button onClick={handleCopy} className="bg-line hover:bg-line-dark">
            คัดลอก Script
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ขั้นตอนที่ 2: เรียกใช้ฟังก์ชัน sendEvent</CardTitle>
          <CardDescription>
            เมื่อเกิดเหตุการณ์ที่ต้องการติดตาม เช่น ลูกค้าเข้าดูสินค้า ให้เรียกฟังก์ชัน
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">connectBridge.sendEvent(eventType, data)</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>
            ตัวอย่างการส่ง event เมื่อลูกค้าเข้าดูสินค้า:
          </p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
{`&lt;script&gt;
// สมมติว่าโค้ดนี้อยู่ในหน้าสินค้า
connectBridge.sendEvent('product_view', {
  name: 'เสื้อยืดสีดำ',
  price: 299,
});
&lt;/script&gt;`}
          </pre>
          <p>
            ระบบจะส่งข้อมูลไปยัง AI เพื่อสร้างข้อความที่เหมาะสมและส่งไปยัง LINE ของลูกค้าทันที
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ขั้นตอนที่ 3: ทดสอบการเชื่อมต่อ</CardTitle>
          <CardDescription>
            กรอกโดเมนของเว็บไซต์และลองส่ง event ตัวอย่างเพื่อทดสอบ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">โดเมนของเว็บไซต์ (เช่น https://myshop.com)</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <Button
            disabled={!domain || !store?.id}
            onClick={handleTest}
            className="bg-line hover:bg-line-dark"
          >
            ทดสอบการเชื่อมต่อ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
