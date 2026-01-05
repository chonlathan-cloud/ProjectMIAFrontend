import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { completeLineCallback } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function LineCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setLineOA } = useStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('กำลังเชื่อมต่อ LINE...');

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const state = params.get('state');

      if (!code || !state) {
        setStatus('error');
        setMessage('ไม่พบ code/state จาก LINE');
        return;
      }

      try {
        const data = await completeLineCallback(code, state);
        const lineInfo = data.data || {};

        setLineOA({
          connected: true,
          name: lineInfo.displayName || 'LINE OA',
          id: lineInfo.userId,
          followers: lineInfo.followers,
          responseRate: lineInfo.responseRate,
        });

        setStatus('success');
        setMessage('เชื่อมต่อ LINE OA สำเร็จ');
        toast.success('เชื่อมต่อ LINE OA เรียบร้อย');
        setTimeout(() => navigate('/dashboard'), 1200);
      } catch (error: any) {
        console.error('Line callback error:', error);
        setStatus('error');
        setMessage('เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่');
        toast.error('เชื่อมต่อไม่สำเร็จ');
      }
    };

    run();
  }, [location.search, navigate, setLineOA]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-line/10 to-gray-50 dark:from-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">LINE Callback</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && <Loader2 className="w-10 h-10 animate-spin text-line" />}
          {status === 'success' && <CheckCircle2 className="w-12 h-12 text-green-600" />}
          {status === 'error' && <AlertCircle className="w-12 h-12 text-red-500" />}
          <p className="text-center text-base">{message}</p>
          {status === 'error' && (
            <Button onClick={() => navigate('/settings/store')}>กลับไปหน้าเชื่อมต่อ</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
