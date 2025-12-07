import { useEffect, useState } from "react";
import { authedJson } from "@/lib/api";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

export default function Inbox() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const storeId = "default-store"; // โหลดจริงจาก auth ภายหลัง
  const selectCustomer = (id: string) => setSelected(id);

  // 1) โหลดรายชื่อลูกค้า
  async function loadCustomers() {
    try {
      const data = await authedJson<any>(
        `/api/inbox/customers?storeId=${storeId}`
      );
      const rawList = data?.customers ?? data?.data?.customers ?? [];
      // ปรับโครงสร้างเพื่อให้แน่ใจว่ามี displayName/pictureUrl ใช้งานได้เสมอ
      const list = rawList.map((c: any) => {
        const userId =
          c?.userId ||
          c?.id ||
          c?.lineUserId ||
          c?.uid ||
          c?.user_id ||
          c?.line_user_id;

        return {
          ...c,
          userId,
          displayName:
            c?.displayName ||
            c?.name ||
            c?.profile?.displayName ||
            userId,
          pictureUrl:
            c?.pictureUrl ||
            c?.avatar ||
            c?.profile?.pictureUrl ||
            c?.image,
        };
      });
      setCustomers(list);
    } catch (err) {
      console.error("Failed to load customers", err);
    }
  }

  // 2) โหลดประวัติแชทเมื่อเลือก customer
  async function loadChatHistory(customerId: string) {
    try {
      const data = await authedJson<any>(
        `/api/inbox/history/${customerId}?storeId=${storeId}`
      );
      const list = data?.messages ?? data?.data?.messages ?? [];
      setMessages(list);
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  }

  // 3) Subscribe SSE realtime
  function connectRealtime(customerId: string) {
    const sse = new EventSource(
      `${API_BASE_URL}/api/inbox/stream/${customerId}?storeId=${storeId}`
    );

    sse.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    };

    sse.onerror = () => {
      console.log("SSE disconnected, retrying...");
      sse.close();
      setTimeout(() => connectRealtime(customerId), 2000);
    };

    return sse;
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!selected) return;

    let sse: EventSource | null = null;

    loadChatHistory(selected);
    sse = connectRealtime(selected);

    return () => {
      sse?.close();
    };
  }, [selected]);

  return (
    <div className="flex h-full text-gray-900 dark:text-gray-100">
      {/* ซ้าย: รายชื่อลูกค้า */}
      <div className="w-64 border-r bg-white dark:bg-gray-900 border-gray-200 dark:border-slate-800">
        <h2 className="p-3 font-bold text-lg text-gray-900 dark:text-gray-100">ลูกค้า</h2>
        {customers.map((c, idx) => {
          const customerId = c.userId || `customer-${idx}`;
          return (
          <div
            key={customerId}
            className={`flex items-center gap-3 p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
              selected === c.userId ? "bg-gray-100 dark:bg-slate-800/80" : ""
            }`}
            onClick={() => selectCustomer(customerId)}
          >
            <img
              src={c.pictureUrl || "/image/default-avatar.png"}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {c.displayName || c.name || c.userId}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{c.lastMessage}</p>
            </div>
          </div>
        );
        })}
      </div>

      {/* ขวา: ประวัติแชท */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-white dark:bg-gray-950">
        {!selected && (
          <div className="text-gray-400 dark:text-gray-500 text-center mt-20">
            เลือกลูกค้าจากด้านซ้าย
          </div>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg max-w-xl ${
              m.from === "user"
                ? "bg-green-100 self-start dark:bg-emerald-900/60 dark:border dark:border-emerald-700/50"
                : m.from === "ai"
                ? "bg-blue-100 self-end dark:bg-slate-800/80 dark:border dark:border-blue-800/60"
                : "bg-gray-200 self-end dark:bg-slate-700/80 dark:border dark:border-slate-600/60"
            }`}
          >
            {/* ข้อความ */}
            {m.text && <div className="text-gray-900 dark:text-gray-100">{m.text}</div>}

            {/* รูปภาพ */}
            {m.image?.url && (
              <img
                src={m.image.url}
                alt="img"
                className="rounded mt-2 max-w-xs"
              />
            )}

            {/* ไฟล์ / วิดีโอ / เสียง */}
            {m.url && (
              <a
                href={m.url}
                target="_blank"
                className="text-blue-600 underline block mt-2"
              >
                ดาวน์โหลดไฟล์
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
