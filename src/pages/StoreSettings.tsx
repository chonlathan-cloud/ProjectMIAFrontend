// src/pages/StoreSettings.tsx
import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { getLineCredentials, saveLineCredentials } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowRight, CheckCircle, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom"; // 👈 พระเอกของเรา

export default function StoreSettings() {
  const { store } = useStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    channelAccessToken: "",
    channelSecret: "",
    lineUserId: "",
    displayName: ""
  });

  // 1. โหลดข้อมูลเก่า (เผื่อเคยตั้งค่าแล้ว)
  useEffect(() => {
    if (store?.id) {
      setLoading(true);
      getLineCredentials(store.id)
        .then((res: any) => {
           if (res.settings) {
             setFormData(prev => ({ ...prev, ...res.settings }));
           }
        })
        .finally(() => setLoading(false));
    }
  }, [store?.id]);

  // 2. ฟังก์ชันบันทึกและไปต่อ
  const handleSaveAndNext = async () => {
    if (!store?.id) return;
    
    // Validate แบบบ้านๆ
    if (!formData.channelAccessToken) {
        alert("กรุณากรอก Channel Access Token");
        return;
    }

    setSaving(true);
    try {
      // เรียก API บันทึก (Backend จะไปดึง Bot ID มาให้เอง)
      const res: any = await saveLineCredentials(store.id, formData);
      
      if (res.success) {
        // 🎉 UX Point: แจ้งเตือนเล็กน้อยแล้วพาไปต่อ
        // alert("เชื่อมต่อสำเร็จ! กำลังพาไปสร้างเว็บไซต์..."); 
        
        // 🚀 Redirect ไปหน้า WebBuilder (Step 3)
        navigate("/web-builder"); 
      }
    } catch (error) {
      console.error(error);
      alert("บันทึกไม่สำเร็จ กรุณาตรวจสอบ Token");
    } finally {
      setSaving(false);
    }
  };

  if (!store) return <div className="p-10 text-center">กำลังโหลดข้อมูลร้าน...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      
      {/* --- WIZARD PROGRESS BAR (Step 2 of 3) --- */}
      <div className="w-full max-w-2xl mb-8">
         <div className="flex items-center justify-between text-sm font-medium text-gray-500 mb-2">
            <span>Step 1: สมัครสมาชิก</span>
            <span className="text-black font-bold">Step 2: เชื่อมต่อ LINE OA</span>
            <span>Step 3: สร้างเว็บไซต์</span>
         </div>
         <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
            <div className="w-1/3 bg-emerald-500 h-full"></div>
            <div className="w-1/3 bg-emerald-500 h-full animate-pulse"></div>
            <div className="w-1/3 bg-gray-200 h-full"></div>
         </div>
      </div>

      <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-emerald-500">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-700">
                <ShieldCheck size={24} />
            </div>
            <div>
                <CardTitle className="text-xl">เชื่อมต่อ LINE Official Account</CardTitle>
                <CardDescription>
                    นำค่า Token จาก LINE Developers มาใส่เพื่อเริ่มใช้งาน
                </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
             <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>
          ) : (
            <>
              {/* Token Input */}
              <div className="space-y-2">
                <Label>Channel Access Token (Long-lived)</Label>
                <textarea 
                  className="w-full min-h-[100px] p-3 border rounded-md text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 ring-emerald-500 outline-none transition-all"
                  placeholder="วาง Access Token ยาวๆ ที่นี่..."
                  value={formData.channelAccessToken}
                  onChange={e => setFormData({...formData, channelAccessToken: e.target.value})}
                />
                <p className="text-xs text-gray-400">
                    * หาได้จาก LINE Developers Console {'>'} Messaging API Channel
                </p>
              </div>

              {/* Secret Input (Optional แต่ควรมี) */}
              <div className="space-y-2">
                <Label>Channel Secret</Label>
                <Input 
                  type="password"
                  placeholder="วาง Channel Secret ที่นี่"
                  value={formData.channelSecret}
                  onChange={e => setFormData({...formData, channelSecret: e.target.value})}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t flex items-center justify-between">
                 <button className="text-sm text-gray-500 hover:underline" onClick={() => window.open('https://developers.line.biz', '_blank')}>
                    วิธีหา Token?
                 </button>

                 <Button 
                    size="lg" 
                    className="bg-black hover:bg-gray-800 text-white gap-2 pl-8 pr-8"
                    onClick={handleSaveAndNext}
                    disabled={saving || !formData.channelAccessToken}
                 >
                    {saving ? (
                        <>
                           <Loader2 className="w-4 h-4 animate-spin" /> กำลังตรวจสอบ...
                        </>
                    ) : (
                        <>
                           บันทึก & ไปต่อ <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                 </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <p className="mt-8 text-center text-xs text-gray-400 max-w-md">
         ระบบจะทำการตรวจสอบ Token และดึงข้อมูลบอทของคุณโดยอัตโนมัติ <br/>
         เมื่อเชื่อมต่อสำเร็จ คุณจะถูกพาไปหน้าสร้างเว็บไซต์ทันที
      </p>
    </div>
  );
}