import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

/**
 * MVP decision:
 * - 1 ระบบ = 1 LINE OA
 * - ใช้ token-based connection เท่านั้น
 * - ไม่ผูก store / OAuth / QR
 */

export function LineSetup() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const [channelAccessToken, setChannelAccessToken] = useState("");
  const [channelSecret, setChannelSecret] = useState("");
  const [displayName, setDisplayName] = useState("");

  // -----------------------------
  // Load LINE OA status (PUBLIC)
  // -----------------------------
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch("/api/line/status");
        const json = await res.json();

        if (json?.data?.connected) {
          setConnected(true);
          setDisplayName(json.data.displayName || "LINE OA");
        }
      } catch (err) {
        console.warn("Load LINE status failed", err);
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, []);

  // -----------------------------
  // Connect LINE OA (token-based)
  // -----------------------------
const handleConnect = async () => {
  if (!channelAccessToken.trim()) {
    toast.error("กรุณากรอก Channel Access Token");
    return;
  }

  try {
    setConnecting(true);

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนเชื่อมต่อ LINE OA");
      return;
    }

    const idToken = await user.getIdToken();

    const res = await fetch("/api/line/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        channelAccessToken,
        channelSecret,
        displayName,
      }),
    });

    const json = await res.json();

    if (!json?.success) {
      throw new Error(json?.message || "Connect failed");
    }

    toast.success("เชื่อมต่อ LINE OA สำเร็จ");
    setConnected(true);
  } catch (err: any) {
    toast.error(err?.message || "เชื่อมต่อ LINE OA ไม่สำเร็จ");
  } finally {
    setConnecting(false);
  }
};


  // -----------------------------
  // UI
  // -----------------------------
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-6 text-center">
          <p>กำลังตรวจสอบสถานะ LINE OA…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>เชื่อมต่อ LINE Official Account</CardTitle>
          <CardDescription>
            ระบบรองรับ LINE OA 1 บัญชีต่อระบบ (เหมาะสำหรับ MVP)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!connected ? (
            <>
              <div className="space-y-2">
                <Label>Channel Access Token (Messaging API)</Label>
                <Input
                  value={channelAccessToken}
                  onChange={(e) => setChannelAccessToken(e.target.value)}
                  placeholder="ใส่ Channel Access Token (long-lived)"
                />
              </div>

              <div className="space-y-2">
                <Label>Channel Secret (ไม่บังคับ)</Label>
                <Input
                  value={channelSecret}
                  onChange={(e) => setChannelSecret(e.target.value)}
                  placeholder="Channel Secret (ถ้ามี)"
                />
              </div>

              <div className="space-y-2">
                <Label>ชื่อ LINE OA (สำหรับแสดงผล)</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="เช่น dev-project ai"
                />
              </div>

              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? "กำลังเชื่อมต่อ…" : "เชื่อมต่อ LINE OA"}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-green-600 font-semibold">
                ✓ เชื่อมต่อแล้วกับ LINE OA: {displayName}
              </p>
              <Button onClick={() => navigate("/")}>
                กลับไปหน้า Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
