import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("กรุณากรอกอีเมล");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว ตรวจสอบอีเมลของคุณ");
      navigate("/login");
    } catch (err: any) {
      console.error("reset email error:", err);
      toast.error(err?.message || "ส่งอีเมลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-line/10 to-gray-50 dark:from-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-line flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">ลืมรหัสผ่าน</CardTitle>
            <CardDescription className="text-base mt-1">
              กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-line hover:bg-line-dark" disabled={loading}>
              {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/login")}
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
