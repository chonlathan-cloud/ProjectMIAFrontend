// src/pages/WebBuilder.tsx
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default function WebBuilder() {
  const { store } = useStore();

  if (!store) {
    return (
      <div className="p-10 text-center text-gray-500">
        กำลังโหลดข้อมูลร้านค้า…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-10 text-center">
      <h1 className="text-3xl font-bold mb-4">
        เว็บไซต์ของร้าน {store.name}
      </h1>

      <p className="text-gray-600 mb-6">
        ระบบได้สร้างเว็บไซต์ให้คุณอัตโนมัติแล้วเรียบร้อย
      </p>

      <div className="bg-gray-50 border rounded-xl p-6 mb-6">
        <p className="text-sm text-gray-500 mb-2">URL เว็บไซต์ของคุณ</p>
        <code className="block bg-white border rounded p-3 text-sm break-all">
          https://lineboost.app/s/{store.id}
        </code>
      </div>

      <Button
        className="mx-auto flex items-center gap-2"
        onClick={() =>
          window.open(`https://lineboost.app/s/${store.id}`, "_blank")
        }
      >
        <Globe className="w-4 h-4" />
        เปิดดูเว็บไซต์
      </Button>

      <p className="text-xs text-gray-400 mt-8">
        Website Builder (แก้ไขรูปแบบเว็บ) จะเปิดใช้งานในเวอร์ชันถัดไป
      </p>
    </div>
  );
}
