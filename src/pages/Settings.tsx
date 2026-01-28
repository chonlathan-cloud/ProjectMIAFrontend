import { useEffect, useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { getAiSettings, updateAiSettings } from '@/lib/api';
import {
  EmailAuthProvider,
  getAuth,
  linkWithCredential,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { toast } from 'sonner';

export function Settings() {
  const { user, store, setUser } = useStore();
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const hasPasswordProvider = currentUser?.providerData?.some(
    (provider) => provider.providerId === 'password'
  );
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkPasswordConfirm, setLinkPasswordConfirm] = useState('');
  const [linkingAuth, setLinkingAuth] = useState(false);
  const [updateEmailValue, setUpdateEmailValue] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!store?.id) return;
    const load = async () => {
      setAiError(null);
      try {
        const res: any = await getAiSettings(store.id);
        const enabled = res?.aiEnable ?? res?.data?.aiEnable ?? true;
        setAiEnabled(!!enabled);
      } catch (err: any) {
        console.error("load ai settings failed:", err);
        setAiError(err?.message || "โหลดสถานะ AI ไม่สำเร็จ");
      }
    };
    load();
  }, [store?.id]);

  useEffect(() => {
    setDisplayName(user?.name || '');
  }, [user?.name]);

  useEffect(() => {
    if (!user?.email) return;
    setLinkEmail(user.email);
    setUpdateEmailValue(user.email);
  }, [user?.email]);

  const handleToggleAi = async (next: boolean) => {
    if (!store?.id) return;
    setAiLoading(true);
    setAiError(null);
    setAiEnabled(next);
    try {
      await updateAiSettings(store.id, next);
    } catch (err: any) {
      console.error("update ai settings failed:", err);
      setAiError(err?.message || "บันทึกสถานะ AI ไม่สำเร็จ");
      setAiEnabled(!next);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error('กรุณากรอกชื่อที่ต้องการแสดง');
      return;
    }

    try {
      setSavingProfile(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      await updateProfile(currentUser, { displayName: displayName.trim() });
      if (user) {
        setUser({ ...user, name: displayName.trim() });
      }
      toast.success('อัปเดตข้อมูลสำเร็จ');
      setProfileOpen(false);
    } catch (err: any) {
      console.error('update profile failed:', err);
      toast.error(err?.message || 'อัปเดตข้อมูลไม่สำเร็จ');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetPassword = async () => {
    const email = user?.email || currentUser?.email;
    if (!email) {
      toast.error('ไม่พบอีเมลผู้ใช้งาน');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('ส่งอีเมลสำหรับเปลี่ยนรหัสผ่านแล้ว');
    } catch (err: any) {
      console.error('send reset email failed:', err);
      toast.error(err?.message || 'ส่งอีเมลไม่สำเร็จ');
    }
  };

  const handleLinkEmailPassword = async () => {
    if (!linkEmail.trim()) {
      toast.error('กรุณากรอกอีเมล');
      return;
    }
    if (linkPassword.length < 6) {
      toast.error('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (linkPassword !== linkPasswordConfirm) {
      toast.error('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (!currentUser) {
      toast.error('ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    try {
      setLinkingAuth(true);
      const credential = EmailAuthProvider.credential(linkEmail.trim(), linkPassword);
      await linkWithCredential(currentUser, credential);
      await currentUser.reload();
      const email = currentUser.email || linkEmail.trim();
      if (user) {
        setUser({ ...user, email });
      }
      setUpdateEmailValue(email);
      setLinkPassword('');
      setLinkPasswordConfirm('');
      toast.success('ผูกอีเมลและรหัสผ่านสำเร็จ');
    } catch (err: any) {
      console.error('link email/password failed:', err);
      const code = err?.code;
      if (code === 'auth/email-already-in-use') {
        toast.error('อีเมลนี้ถูกใช้งานแล้ว');
      } else if (code === 'auth/credential-already-in-use') {
        toast.error('บัญชีนี้ถูกเชื่อมกับผู้ใช้อื่นแล้ว');
      } else if (code === 'auth/provider-already-linked') {
        toast.error('บัญชีนี้ผูกอีเมลไว้แล้ว');
      } else {
        toast.error(err?.message || 'ผูกอีเมลไม่สำเร็จ');
      }
    } finally {
      setLinkingAuth(false);
    }
  };

  const handleUpdateEmail = async () => {
    const nextEmail = updateEmailValue.trim();
    if (!nextEmail) {
      toast.error('กรุณากรอกอีเมล');
      return;
    }

    if (!currentUser) {
      toast.error('ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    if (nextEmail === currentUser.email) {
      toast.info('อีเมลยังเหมือนเดิม');
      return;
    }

    try {
      setUpdatingEmail(true);
      await updateEmail(currentUser, nextEmail);
      if (user) {
        setUser({ ...user, email: nextEmail });
      }
      toast.success('อัปเดตอีเมลสำเร็จ');
    } catch (err: any) {
      console.error('update email failed:', err);
      const code = err?.code;
      if (code === 'auth/requires-recent-login') {
        toast.error('ต้องเข้าสู่ระบบใหม่ก่อนเปลี่ยนอีเมล');
      } else if (code === 'auth/email-already-in-use') {
        toast.error('อีเมลนี้ถูกใช้งานแล้ว');
      } else {
        toast.error(err?.message || 'อัปเดตอีเมลไม่สำเร็จ');
      }
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast.error('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (!currentUser) {
      toast.error('ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    try {
      setUpdatingPassword(true);
      await updatePassword(currentUser, newPassword);
      setNewPassword('');
      setNewPasswordConfirm('');
      toast.success('ตั้งรหัสผ่านใหม่สำเร็จ');
    } catch (err: any) {
      console.error('update password failed:', err);
      const code = err?.code;
      if (code === 'auth/requires-recent-login') {
        toast.error('ต้องเข้าสู่ระบบใหม่ก่อนเปลี่ยนรหัสผ่าน');
      } else {
        toast.error(err?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ตั้งค่า</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          จัดการการเชื่อมต่อ LINE OA และข้อมูลบัญชี
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>การเชื่อมต่อ LINE OA</CardTitle>
          <CardDescription>
            ตั้งค่า Channel Access Token และผูกร้านกับระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => navigate('/settings/store')}
            className="w-full bg-emerald-600 text-white flex items-center gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            ตั้งค่า LINE Token และผูกร้าน
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>การตั้งค่า AI</CardTitle>
          <CardDescription>เปิด/ปิดการตอบกลับอัตโนมัติของ MIA ต่อร้าน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
            <div>
              <p className="font-medium text-gray-900">AI Auto Reply</p>
              <p className="text-sm text-gray-500">ต้องให้ลูกค้ายอมรับ PDPA ก่อนจึงตอบได้</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={aiEnabled ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"}>
                {aiEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
              </Badge>
              <Switch
                checked={aiEnabled}
                onCheckedChange={handleToggleAi}
                disabled={!store?.id || aiLoading}
              />
            </div>
          </div>
          {aiError ? <p className="text-sm text-red-600">{aiError}</p> : null}
          {!store?.id ? (
            <p className="text-sm text-gray-500">กรุณาเลือกร้านก่อนตั้งค่า AI</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลบัญชี</CardTitle>
          <CardDescription>ข้อมูลส่วนตัวของคุณ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">ชื่อ</p>
              <p className="font-medium">{user?.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">อีเมล</p>
              <p className="font-medium">{user?.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">สถานะ</p>
              <Badge className="bg-green-600 text-white">ใช้งานอยู่</Badge>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button variant="outline" onClick={() => setProfileOpen(true)}>
              แก้ไขข้อมูล
            </Button>
            <Button variant="outline" onClick={handleResetPassword}>
              เปลี่ยนรหัสผ่าน
            </Button>
          </div>

          <div className="pt-6 border-t space-y-4">
            <div>
              <p className="font-medium text-gray-900">เข้าสู่ระบบด้วยอีเมล/รหัสผ่าน</p>
              <p className="text-sm text-gray-500">
                ผูกอีเมลเพื่อเข้าใช้งานผ่านเบราว์เซอร์ปกติได้
              </p>
            </div>

            {hasPasswordProvider ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">อีเมลที่ผูก</label>
                    <Input value={currentUser?.email || user?.email || ''} disabled />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">อีเมลใหม่ (ถ้าต้องการเปลี่ยน)</label>
                    <Input
                      value={updateEmailValue}
                      onChange={(event) => setUpdateEmailValue(event.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={handleUpdateEmail} disabled={updatingEmail}>
                  {updatingEmail ? 'กำลังอัปเดต...' : 'อัปเดตอีเมล'}
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">รหัสผ่านใหม่</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">ยืนยันรหัสผ่านใหม่</label>
                    <Input
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(event) => setNewPasswordConfirm(event.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleUpdatePassword} disabled={updatingPassword}>
                    {updatingPassword ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านใหม่'}
                  </Button>
                  <Button variant="outline" onClick={handleResetPassword}>
                    ส่งลิงก์รีเซ็ตรหัสผ่าน
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="text-sm text-gray-500">อีเมล (Gmail)</label>
                    <Input
                      type="email"
                      value={linkEmail}
                      onChange={(event) => setLinkEmail(event.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">รหัสผ่าน</label>
                    <Input
                      type="password"
                      value={linkPassword}
                      onChange={(event) => setLinkPassword(event.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">ยืนยันรหัสผ่าน</label>
                    <Input
                      type="password"
                      value={linkPasswordConfirm}
                      onChange={(event) => setLinkPasswordConfirm(event.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <Button onClick={handleLinkEmailPassword} disabled={linkingAuth}>
                  {linkingAuth ? 'กำลังผูกอีเมล...' : 'ผูกอีเมลและตั้งรหัสผ่าน'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลบัญชี</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-gray-500">ชื่อที่แสดง</label>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="เช่น Mia-Connect Team"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
