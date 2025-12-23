import { useEffect, useState } from "react";
import { listStores } from "@/lib/api";
import { useStore } from "@/store/useStore";

export default function TenantBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    store,
    setStores,
    setStore,
  } = useStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const res = await listStores();

        // รองรับ response ได้หลายรูปแบบ
        const stores =
          res?.data?.stores ||
          res?.stores ||
          res?.data ||
          [];

        setStores(stores);

        // safety: ถ้ายังไม่มี store → ตั้งร้านแรก
        if (!store && stores.length > 0) {
          setStore(stores[0]);
        }
      } catch (err) {
        console.error("[TenantBootstrap] failed", err);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading workspace…
      </div>
    );
  }

  return <>{children}</>;
}
