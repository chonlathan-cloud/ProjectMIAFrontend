// src/pages/inbox/Inbox.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authedJson, getRecentMessages, type RecentMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useStore } from "@/store/useStore"; // ตรวจสอบ path นี้ให้ตรงกับโปรเจกต์คุณ

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

// --- Types ---

type InboxCustomer = {
  userId: string;
  displayName: string;
  pictureUrl?: string | null;
  lastMessage?: string | null;
  lastTime?: string | Date | number | null;
};

type InboxMessage = {
  id: string;
  from: "customer" | "admin" | "ai" | "system"; // แยกประเภทให้ชัดเจน
  text: string | null;
  url?: string | null;
  image?: { url: string };
  timestamp: number;
};

// --- Helper Functions ---

/**
 * วิเคราะห์ว่าใครเป็นคนส่งข้อความ
 * - isFromUser=true -> ลูกค้า (Customer)
 * - isFromUser=false หรือ source='INBOX_ADMIN' -> แอดมิน (Admin)
 */
const detectSender = (payload: any): InboxMessage["from"] => {
  if (payload.from === "ai" || payload.type?.startsWith("ai")) return "ai";
  if (payload.source === "INBOX_ADMIN" || payload.from === "admin") return "admin";
  if (payload.isFromUser === false) return "admin"; // บอทหรือแอดมินตอบ
  
  // Default: ถ้ามาจาก user ปกติ คือลูกค้า
  return "customer";
};

/**
 * แปลงข้อมูลจาก API/Firestore ให้เป็น format กลาง
 */
const normalizeMessage = (payload: any): InboxMessage | null => {
  if (!payload) return null;

  // จัดการ Timestamp (รองรับทั้ง Firestore Timestamp และ Date String)
  let timestamp = Date.now();
  if (payload.timestamp) {
    if (typeof payload.timestamp === "number") {
      timestamp = payload.timestamp;
    } else if (typeof payload.timestamp === "object" && "_seconds" in payload.timestamp) {
      // Firestore Timestamp
      timestamp = payload.timestamp._seconds * 1000;
    } else {
      // Date string
      timestamp = new Date(payload.timestamp).getTime();
    }
  } else if (payload.createdAt) {
    timestamp = new Date(payload.createdAt).getTime();
  }

  const text = payload.text || payload.messageText || payload.payload?.text || null;

  const rawUrl =
    payload.url ||
    payload?.image?.url ||
    payload?.payload?.image?.url ||
    null;

  const isImage =
    typeof rawUrl === "string" &&
    rawUrl.match(/\.(png|jpg|jpeg|gif|webp)$/i);
  const imageUrl = payload?.image?.url || (isImage ? rawUrl : null);

  // Generate Stable ID
  const id = payload.id || payload.eventId || `${timestamp}-${text?.slice(0, 10)}`;

  return {
    id,
    from: detectSender(payload),
    text,
    url: rawUrl,
    image: imageUrl ? { url: imageUrl } : undefined,
    timestamp,
  };
};

/**
 * แปลง Log ล่าสุดจากหน้า Dashboard ให้เป็น format ข้อความ
 */
const normalizeRecentLog = (
  log: RecentMessage,
  customerId: string
): InboxMessage | null => {
  const belongsToCustomer =
    log.fromUserId === customerId || log.toUserId === customerId;
  if (!belongsToCustomer) return null;

  const timestamp = new Date(log.timestamp).getTime();
  
  let sender: InboxMessage["from"] = "system";
  if (!log.isFromUser) sender = "admin";
  if (log.type?.startsWith("ai")) sender = "ai";
  if (log.isFromUser) sender = "customer";

  return {
    id: log.id || `${timestamp}-recent-${log.text?.slice(0, 5)}`,
    from: sender,
    text: log.text,
    timestamp,
  };
};

/**
 * รวมรายการข้อความ + ตัดตัวซ้ำ (Dedup)
 */
const mergeMessages = (items: Array<InboxMessage | null>) => {
  const list = items.filter(Boolean) as InboxMessage[];
  list.sort((a, b) => a.timestamp - b.timestamp);

  const merged: InboxMessage[] = [];
  list.forEach((msg) => {
    // 1. เช็ค ID ตรงๆ
    const dupIdx = merged.findIndex((m) => m.id === msg.id);

    if (dupIdx >= 0) {
      // ถ้า ID ตรงกัน: ให้ตัวที่ไม่ใช่ Local (จาก Server) ทับตัว Local
      if (!msg.id.startsWith("local-")) {
        merged[dupIdx] = msg;
      }
    } else {
      // 2. Fuzzy Check (กรณี ID ไม่ตรง แต่เนื้อหา+เวลาใกล้เคียงกัน)
      const fuzzyIdx = merged.findIndex(
        (m) =>
          m.from === msg.from &&
          m.text === msg.text &&
          Math.abs(m.timestamp - msg.timestamp) <= 5000 // 5 วินาที
      );

      if (fuzzyIdx >= 0) {
        const existing = merged[fuzzyIdx];
        // ถ้าของเก่าเป็น Local แต่ของใหม่มาจาก Server -> อัปเดต
        if (existing.id.startsWith("local-") && !msg.id.startsWith("local-")) {
          merged[fuzzyIdx] = msg;
        }
      } else {
        merged.push(msg);
      }
    }
  });

  return merged;
};

/**
 * สร้างรายชื่อลูกค้า + ดึงข้อความล่าสุดมาแสดง
 */
const buildCustomers = (
  rawList: any[],
  logs: RecentMessage[]
): InboxCustomer[] => {
  const latestByUser = new Map<string, RecentMessage>();
  logs.forEach((log) => {
    const uid = log.isFromUser ? log.fromUserId : log.toUserId || log.fromUserId;
    if (!uid) return;
    const existing = latestByUser.get(uid);
    const ts = new Date(log.timestamp).getTime();
    const existingTs = existing ? new Date(existing.timestamp).getTime() : 0;
    if (!existing || ts > existingTs) {
      latestByUser.set(uid, log);
    }
  });

  const list = rawList.map((c: any) => {
    const userId =
      c?.userId ||
      c?.id ||
      c?.lineUserId ||
      c?.uid ||
      c?.user_id ||
      c?.line_user_id;

    const latest = userId ? latestByUser.get(userId) : null;
    
    // แปลงเวลาล่าสุด
    let lastTime = c?.lastActivity || c?.lastTime || latest?.timestamp || null;
    if (lastTime && typeof lastTime === 'object' && '_seconds' in lastTime) {
         lastTime = lastTime._seconds * 1000;
    }

    return {
      userId,
      displayName:
        c?.displayName ||
        c?.displayProfile?.displayName ||
        c?.name ||
        userId ||
        "ลูกค้าใหม่",
      pictureUrl:
        c?.pictureUrl ||
        c?.displayProfile?.pictureUrl ||
        c?.avatar,
      lastMessage: latest?.text ?? c?.latestMessage ?? c?.lastMessage ?? null,
      lastTime,
    } as InboxCustomer;
  });

  // กรองคนไม่มี ID ออก + เรียงตามเวลาล่าสุด
  return list
    .filter((c) => c.userId)
    .sort((a, b) => {
      const tsA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
      const tsB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
      return tsB - tsA;
    });
};

// --- Component ---

export default function Inbox() {
  // Global Store (สำหรับดึง Token)
  const { user, token: storeToken } = useStore(); // ถ้าใช้ Zustand
  // หรือถ้าเก็บใน localStorage: const token = localStorage.getItem('token');
  const token = storeToken || localStorage.getItem("token");

  const [customers, setCustomers] = useState<InboxCustomer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectCustomer = (id: string) => setSelected(id);

  // 1. Load Suggestions (AI)
  const loadSuggestions = useCallback(async () => {
    if (!selected) return;
    setLoadingSuggest(true);
    setSuggestions([]);

    try {
      const res = await authedJson("/api/inbox/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected }),
      });

      if ((res as any).success) {
        setSuggestions((res as any).replies || []);
      } else {
        toast.error((res as any).message || "AI คิดไม่ออก");
      }
    } catch {
      toast.error("AI Service Error");
    } finally {
      setLoadingSuggest(false);
    }
  }, [selected]);

  // 2. Load Customer List
  const loadCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      
      // ดึง Store ID ปัจจุบัน (ถ้ามี Multi-store)
      // const storeId = user?.storeId || ""; 
      // ในที่นี้สมมติ backend หา storeId เองจาก user หรือ default

      const [data, recent] = await Promise.all([
        authedJson<any>("/api/inbox/customers").catch(() => ({ customers: [] })),
        getRecentMessages().catch(() => ({ data: { items: [] } })),
      ]);

      const rawList = data?.customers ?? data?.data?.customers ?? [];
      const recentItems = recent?.data?.items ?? [];
      setRecentLogs(recentItems);

      const list = buildCustomers(rawList, recentItems);
      setCustomers(list);

      if (list.length > 0 && !selected) {
        setSelected(list[0].userId);
      }
    } catch {
      toast.error("โหลดรายชื่อลูกค้าไม่สำเร็จ");
    } finally {
      setLoadingCustomers(false);
    }
  }, [selected]); // เพิ่ม selected ใน dep ถ้าต้องการ logic เลือกคนแรก

  // 3. Load Chat History
  const loadChatHistory = useCallback(
    async (customerId: string, opts: { silent?: boolean } = {}) => {
      try {
        if (!opts.silent) setLoadingMessages(true);

        const [historyRes, recentsRes] = await Promise.all([
          authedJson<any>(`/api/inbox/history/${customerId}`).catch(() => null),
          // ใช้ recentLogs ที่มีอยู่แล้ว หรือดึงใหม่ถ้าจำเป็น
          recentLogs.length > 0 
            ? Promise.resolve({ data: { items: recentLogs } }) 
            : getRecentMessages().catch(() => ({ data: { items: [] } })),
        ]);

        const historyRaw =
          historyRes?.messages ?? historyRes?.data?.messages ?? [];
        const historyMsgs = historyRaw
          .map(normalizeMessage)
          .filter(Boolean) as InboxMessage[];

        const relatedLogs = (recentsRes?.data?.items ?? []).map(
          (m: RecentMessage) => normalizeRecentLog(m, customerId)
        );

        setMessages((prev) =>
          mergeMessages([...prev, ...historyMsgs, ...relatedLogs])
        );
      } catch {
        toast.error("โหลดประวัติแชทไม่สำเร็จ");
      } finally {
        if (!opts.silent) setLoadingMessages(false);
      }
    },
    [recentLogs]
  );

  // 4. Send Message
  const sendMessage = useCallback(
    async () => {
      if (!selected || !input.trim()) return;
      const text = input.trim();
      setSending(true);
      try {
        // Optimistic Update: แสดงข้อความทันที
        const localMsg: InboxMessage = {
          id: `local-${Date.now()}`,
          from: "admin",
          text,
          timestamp: Date.now(),
        };
        setMessages((prev) => mergeMessages([...prev, localMsg]));
        setInput("");

        // อัปเดตรายการลูกค้าซ้ายมือให้เด้งขึ้นบน
        setCustomers((prev) =>
          prev
            .map((c) =>
              c.userId === selected
                ? { ...c, lastMessage: text, lastTime: Date.now() }
                : c
            )
            .sort((a, b) => {
              const tsA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
              const tsB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
              return tsB - tsA;
            })
        );

        // ยิง API
        const res = await authedJson(`/api/inbox/send/${selected}`, {
          method: "POST",
          body: JSON.stringify({ message: text }),
          headers: { "Content-Type": "application/json" },
        });
        
        if(!(res as any).success) {
           throw new Error((res as any).message);
        }

      } catch (err: any) {
        toast.error(err.message || "ส่งข้อความไม่สำเร็จ");
        // TODO: อาจจะลบ localMsg ออกถ้าส่งไม่ผ่าน
      } finally {
        setSending(false);
      }
    },
    [input, selected]
  );

  // 5. Realtime Connection (SSE)
  const connectRealtime = useCallback(
    (customerId: string) => {
      if (!token) return null;

      // 🔥 ส่ง Token ไปทาง URL (Query Param) เพื่อให้ Backend Authenticate ได้
      const url = `${API_BASE_URL}/api/inbox/stream/${customerId}?token=${encodeURIComponent(token)}`;
      console.log("[Inbox] Connecting SSE:", url);
      
      const sse = new EventSource(url);

      sse.onmessage = (event) => {
        try {
          // ข้าม Ping/Heartbeat
          if(event.data === 'ping' || event.data.includes('"type":"ping"')) return;

          const data = JSON.parse(event.data);
          const msg = normalizeMessage(data);
          if (!msg) return;

          setMessages((prev) => mergeMessages([...prev, msg]));

          setCustomers((prev) => {
            const next = prev.map((c) =>
              c.userId === customerId
                ? {
                    ...c,
                    lastMessage: msg.text ?? c.lastMessage,
                    lastTime: msg.timestamp,
                  }
                : c
            );
            return next.sort((a, b) => {
              const tsA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
              const tsB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
              return tsB - tsA;
            });
          });
        } catch (e) {
          console.error("SSE Parse Error", e);
        }
      };

      sse.onerror = (e) => {
        console.warn("[Inbox] SSE Disconnected/Error", e);
        sse.close();
      };

      return sse;
    },
    [token]
  );

  // --- Effects ---

  // Initial Load
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // On Select Customer -> Load Chat & Connect SSE
  useEffect(() => {
    if (!selected) return;
    
    setMessages([]); // เคลียร์ข้อความเก่าก่อน
    loadChatHistory(selected);
    
    const sse = connectRealtime(selected);
    return () => {
      sse?.close();
    };
  }, [connectRealtime, loadChatHistory, selected]);

  // Auto Scroll to Bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.userId === selected),
    [customers, selected]
  );

  // --- Render ---

  return (
    <div className="flex h-full text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950">
      
      {/* 🟢 SIDEBAR: รายชื่อลูกค้า */}
      <div className="w-64 border-r border-gray-200 dark:border-slate-800 flex flex-col">
        <h2 className="p-4 font-bold text-lg border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          Inbox
          <Button variant="ghost" size="icon" onClick={() => loadCustomers()} title="Refresh">
            ↻
          </Button>
        </h2>
        <div className="flex-1 overflow-y-auto">
          {loadingCustomers && !customers.length && (
            <div className="p-4 text-center text-sm text-gray-500">
              กำลังโหลด...
            </div>
          )}
          {!loadingCustomers && !customers.length && (
            <div className="p-4 text-center text-sm text-gray-500">
              ไม่พบลูกค้า
            </div>
          )}
          {customers.map((c, idx) => {
            const customerId = c.userId || `temp-${idx}`;
            const isSelected = selected === c.userId;
            return (
              <div
                key={customerId}
                className={`flex items-center gap-3 p-3 border-b border-gray-50 dark:border-slate-800/50 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-blue-50 dark:bg-slate-800 border-l-4 border-l-blue-500"
                    : "hover:bg-gray-50 dark:hover:bg-slate-900"
                }`}
                onClick={() => selectCustomer(customerId)}
              >
                <div className="relative">
                  <img
                    src={c.pictureUrl || "https://placehold.co/40x40?text=U"}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700 bg-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/40x40?text=?";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p
                      className={`font-medium truncate text-sm ${
                        isSelected
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-900 dark:text-gray-200"
                      }`}
                    >
                      {c.displayName}
                    </p>
                    {c.lastTime && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                        {new Date(c.lastTime).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {c.lastMessage || "ไม่มีข้อความ"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔵 MAIN: พื้นที่แชท */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900/50">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <span className="text-5xl">💬</span>
            <p>เลือกลูกค้าเพื่อเริ่มสนทนา</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <span className="font-semibold text-lg ml-2 truncate">
                {selectedCustomer?.displayName || "Unknown"}
              </span>

              <div className="ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadSuggestions}
                  disabled={loadingSuggest}
                  className="text-xs"
                >
                  {loadingSuggest ? "AI กำลังคิด..." : "⚡ แนะนำคำตอบ"}
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth">
              {loadingMessages && !messages.length && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  กำลังโหลดข้อความ...
                </div>
              )}

              {messages.map((m) => {
                const isAi = m.from === "ai";
                const isCustomer = m.from === "customer";
                // Admin, System, AI อยู่ขวา | Customer อยู่ซ้าย

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[80%] md:max-w-[60%] ${
                      isCustomer ? "self-start items-start" : "self-end items-end"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                        isCustomer
                          ? "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-slate-700"
                          : isAi
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-emerald-600 text-white rounded-tr-none"
                      }`}
                    >
                      {m.text}
                      {m.image?.url && (
                        <a href={m.image.url} target="_blank" rel="noreferrer">
                          <img
                            src={m.image.url}
                            alt="attachment"
                            className="mt-2 rounded-lg max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90"
                          />
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {isAi ? "AI • " : ""}
                      {new Date(m.timestamp).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Suggestion Box */}
            {suggestions.length > 0 && (
              <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-slate-700 space-y-2 animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    ✨ AI Suggestion
                  </p>
                  <button 
                    onClick={() => setSuggestions([])} 
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    ปิด
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="text-left text-sm px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-100 dark:border-indigo-800"
                      onClick={() => {
                        setInput(s);
                        setSuggestions([]);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-slate-800">
              <div className="flex gap-2">
                <Input
                  className="flex-1 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus-visible:ring-indigo-500"
                  placeholder="พิมพ์ข้อความตอบกลับ..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={sending}
                  autoFocus
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="rounded-full w-24 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {sending ? "..." : "ส่ง"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}