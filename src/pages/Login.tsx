import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // reset old store/session soบัญชีใหม่ไม่ปนข้อมูล
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentStoreId');
        localStorage.removeItem('lb_session_id');
        localStorage.removeItem('store');
        localStorage.removeItem('storeId');
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;

      setUser({
        id: user.uid,
        name: user.displayName || user.email || 'Mia-Connect BoosteSME User',
        email: user.email || email,
        tier: 'growth',
        avatar: user.photoURL || undefined,
      });
      const token = await user.getIdToken();
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('firebase_token', token);
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('เข้าสู่ระบบไม่สำเร็จ ตรวจสอบอีเมล/รหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-line/10 to-gray-50 dark:from-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-line rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Mia-Connect BoosteSME</CardTitle>
            <CardDescription className="text-base mt-2">
              เข้าสู่ระบบ Mia-Connect BoosteSME
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-line hover:bg-line-dark" disabled={loading}>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button asChild variant="link" className="text-sm">
              <Link to="/forgot-password">ลืมรหัสผ่าน?</Link>
            </Button>
            <span className="mx-2 text-gray-300">|</span>
            <Button asChild variant="link" className="text-sm">
              <Link to="/signup">สมัครสมาชิก</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
