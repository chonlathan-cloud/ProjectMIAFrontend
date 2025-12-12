// 🚨 Version นี้แก้ให้รองรับ SaaS + ผู้ใช้ใหม่แบบ 100%
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import QRCode from "react-qr-code";

import { authedJson, createLineConnect, saveLineCredentials } from "@/lib/api";
import { useStore } from "@/store/useStore";

export function LineSetup() {
  const navigate = useNavigate();
  const { user, store } = useStore();

  // ถ้ายังไม่มีร้าน ให้พาไปสร้างก่อน
  useEffect(() => {
    if (user && !store) {
      toast.info("กรุณาสร้างร้านก่อนเชื่อมต่อ LINE OA");
      navigate("/settings/store/create");
    }
  }, [user, store, navigate]);

  const storeId = store?.id; // ⭐ ใช้ store ปัจจุบันเท่านั้น

  // ---------------------------------------
  // STATE
  // ---------------------------------------
  const [step, setStep] = useState(1);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const [loginUrl, setLoginUrl] = useState("");

  const [channelAccessToken, setChannelAccessToken] = useState("");
  const [channelSecret, setChannelSecret] = useState("");
  const [lineUserId, setLineUserId] = useState("");
  const [displayName, setDisplayName] = useState("");

  // ---------------------------------------
  // โหลดสถานะ LINE เฉพาะร้านนี้
  // ---------------------------------------
  useEffect(() => {
    if (!storeId) return;

    async function loadStatus() {
      try {
        const fs = await authedJson(`/api/stores/${storeId}/line-credentials`, { method: "GET" });

        if (fs?.settings?.channelAccessToken) {
          setConnected(true);
          setChannelAccessToken(fs.settings.channelAccessToken);
          setChannelSecret(fs.settings.channelSecret || "");
          setLineUserId(fs.settings.lineUserId || "");
          setDisplayName(fs.settings.displayName || "");
          setStep(4);
        }
      } catch (err) {
        console.warn("No existing LINE OA for this store");
      }
    }

    loadStatus();
  }, [storeId]);

  // ---------------------------------------
  // เชื่อมต่อกับ LINE Messaging API (OAuth)
  // ---------------------------------------
  const handleConnect = async () => {
    if (!storeId) return toast.error("ไม่พบ storeId");

    try {
      setConnecting(true);

      const res = await authedJson("/api/line/connect", {
        method: "POST",
        body: JSON.stringify({
          state: {
            firebaseUid: user?.id,
            storeId, // ⭐ พา LINE login กลับมาถูกสโตร์
          },
        }),
      });

      if (!res?.data?.loginUrl) throw new Error("LINE connect failed");

      window.location.href = res.data.loginUrl;
    } catch (err) {
      toast.error("เชื่อมต่อ LINE OA ไม่สำเร็จ");
    } finally {
      setConnecting(false);
    }
  };

  // ---------------------------------------
  // แสดง QR สำหรับเชื่อมต่อ OA
  // ---------------------------------------
  const handleShowQr = async () => {
    if (!storeId) return;

    try {
      setConnecting(true);

      const { loginUrl: url } = await createLineConnect({
        state: {
          firebaseUid: user?.id,
          storeId,
        },
      });

      if (!url) throw new Error("No loginUrl");

      setLoginUrl(url);
      setStep(2);
    } catch (err) {
      toast.error("สร้าง QR ไม่สำเร็จ");
    } finally {
      setConnecting(false);
    }
  };

  // ---------------------------------------
  // บันทึก Credentials
  // ---------------------------------------
  const handleSaveCredentials = async () => {
    if (!storeId) return toast.error("ไม่พบสโตร์");

    if (!channelAccessToken.trim()) {
      return toast.error("กรุณากรอก Token");
    }

    try {
      setConnecting(true);

      await saveLineCredentials(storeId, {
        channelAccessToken,
        channelSecret,
        lineUserId,
        displayName,
      });

      toast.success("บันทึกข้อมูล LINE OA สำเร็จ");
      setConnected(true);
      setStep(4);
    } catch (err: any) {
      toast.error(err?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setConnecting(false);
    }
  };

  // ---------------------------------------
  // UI
  // ---------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {!storeId ? (
        <Card className="p-6 text-center">
          <p>กำลังสร้างร้านใหม่…</p>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>เชื่อมต่อ LINE OA กับร้าน: {store?.name}</CardTitle>
              <CardDescription>
                LINE OA จะผูกกับร้านนี้เท่านั้น (1 OA ต่อ 1 Store)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!connected ? (
                <>
                  <Button onClick={handleConnect} disabled={connecting}>
                    {connecting ? "กำลังเชื่อมต่อ…" : "เชื่อมต่อผ่าน LINE Login"}
                  </Button>
                  <Button variant="outline" className="ml-3" onClick={handleShowQr}>
                    แสดง QR เชื่อมต่อ OA
                  </Button>
                </>
              ) : (
                <p className="text-green-600 font-semibold">
                  ✓ เชื่อมต่อแล้วกับ OA: {displayName || "(ไม่ทราบชื่อ)"}
                </p>
              )}
            </CardContent>
          </Card>

          {step === 2 && loginUrl && (
            <Card>
              <CardHeader>
                <CardTitle>สแกน QR ด้วยแอป LINE</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <QRCode value={loginUrl} />
                <p className="text-gray-500 mt-4">สแกนเพื่ออนุญาตสิทธิ์ LINE OA</p>
                <Button className="mt-4" onClick={() => setStep(3)}>
                  ถัดไป
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>กรอกข้อมูล LINE OA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Channel Access Token</Label>
                  <Input value={channelAccessToken} onChange={(e) => setChannelAccessToken(e.target.value)} />
                </div>
                <div>
                  <Label>Channel Secret</Label>
                  <Input value={channelSecret} onChange={(e) => setChannelSecret(e.target.value)} />
                </div>
                <div>
                  <Label>LINE OA ID</Label>
                  <Input value={lineUserId} onChange={(e) => setLineUserId(e.target.value)} />
                </div>
                <div>
                  <Label>ชื่อ OA</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>

                <Button onClick={handleSaveCredentials} disabled={connecting}>
                  บันทึก
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card className="text-center p-10">
              <h2 className="text-2xl font-bold">เชื่อมต่อสำเร็จ!</h2>
              <p className="text-gray-600 mt-2">{displayName}</p>
              <Button className="mt-4" onClick={() => navigate("/")}>
                กลับไปหน้า Dashboard
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
