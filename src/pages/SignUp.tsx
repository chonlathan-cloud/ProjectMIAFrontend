import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("สมัครสมาชิกสำเร็จ!");
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>สมัครสมาชิก</CardTitle>
          <CardDescription>สร้างบัญชีใหม่เพื่อเริ่มใช้งานระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSignUp}>
            <div>
              <Label>อีเมล</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <Label>รหัสผ่าน</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-line text-white" disabled={loading}>
              {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </Button>

            <Button variant="link" className="w-full mt-2" onClick={() => navigate("/login")}>
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
