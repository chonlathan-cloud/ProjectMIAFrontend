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

export function Login() {
  const [email, setEmail] = useState('demo@lineboost.com');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const { setUser } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;

      setUser({
        id: user.uid,
        name: user.displayName || user.email || 'LineBoost User',
        email: user.email || email,
        tier: 'growth',
        avatar: user.photoURL || undefined,
      });

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
            <CardTitle className="text-2xl font-bold">LineBoost SME</CardTitle>
            <CardDescription className="text-base mt-2">
              เข้าสู่ระบบเพื่อจัดการ Line Official Account
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

          <div className="mt-6 text-center text-sm text-gray-500">
            <p className="mb-2">Demo Account:</p>
            <p>Email: demo@lineboost.com</p>
            <p>Password: demo1234</p>
          </div>

          <div className="mt-6 text-center">
            <Button variant="link" className="text-sm">
              ลืมรหัสผ่าน?
            </Button>
            <span className="mx-2 text-gray-300">|</span>
            <Button variant="link" className="text-sm">
              สมัครสมาชิก
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
