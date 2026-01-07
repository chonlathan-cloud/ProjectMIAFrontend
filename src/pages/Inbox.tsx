// src/pages/Inbox.tsx
import { useEffect, useState, useRef } from "react";
import { useStore } from "@/store/useStore";
import { getAuthToken, getInboxCustomers, getInboxHistory, getInboxSuggestions, sendInboxMessage } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, RefreshCw, User as UserIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";

interface Customer {
  id: string; // Firestore Doc ID
  userId: string; // LINE User ID
  displayName: string;
  pictureUrl?: string;
  lastMessage?: string;
  lastActivity?: any;
}

interface Message {
  id: string;
  text: string;
  isFromUser: boolean;
  timestamp: any;
  from: string;
}

type StreamEvent = {
  id?: string;
  type?: string;
  messageText?: string;
  text?: string;
  createdAt?: string;
  timestamp?: any;
  lineUserId?: string;
};

export default function Inbox() {
  const { store } = useStore();
  
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Loading States
  const [loadingList, setLoadingList] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // Refs (สำหรับเลื่อนแชทลงล่างสุด)
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<EventSource | null>(null);

  // 1. โหลดรายชื่อลูกค้า
  const loadCustomers = async () => {
    if (!store?.id) return;
    setLoadingList(true);
    try {
      const res: any = await getInboxCustomers(store.id);
      if (res?.customers) {
        const normalized = res.customers.map((c: any) => ({
          id: c.userId || c.id,
          userId: c.userId || c.id,
          displayName: c.displayName,
          pictureUrl: c.pictureUrl,
          lastMessage: c.lastMessage,
          lastActivity: c.lastActivity || c.lastTime,
        }));
        setCustomers(normalized);
      }
    } catch (error) {
      console.error("Load customers failed", error);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [store?.id]);

  // 2. โหลดประวัติแชท เมื่อเลือกคน
  const loadChat = async (customer: Customer) => {
    if (!store?.id) return;
    setSelectedCustomer(customer);
    setSuggestions([]);
    setLoadingChat(true);
    try {
      // ใช้ ID ของ Customer (ซึ่งคือ UserID) ในการดึงแชท
      const res: any = await getInboxHistory(customer.id, store.id);
      if (res?.messages) {
        const normalized = res.messages.map((m: any, idx: number) => ({
          id: m.id || `${m.timestamp ?? "no-ts"}-${idx}`,
          text: m.text,
          isFromUser: m.isFromUser ?? m.from === "user",
          timestamp: m.timestamp,
          from: m.from,
        }));
        setMessages(normalized);
      }
    } catch (error) {
      console.error("Load chat failed", error);
    } finally {
      setLoadingChat(false);
    }
  };

  const loadSuggestions = async () => {
    if (!store?.id || !selectedCustomer) return;
    setLoadingSuggest(true);
    try {
      const res: any = await getInboxSuggestions(store.id, selectedCustomer.id);
      const replies = res?.replies || res?.data?.replies || [];
      setSuggestions(Array.isArray(replies) ? replies : []);
    } catch (error) {
      console.error("Load AI suggestions failed", error);
      toast.error("โหลดข้อความแนะนำไม่สำเร็จ");
    } finally {
      setLoadingSuggest(false);
    }
  };

  // Scroll ลงล่างเสมอเมื่อมีข้อความใหม่
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 3. ส่งข้อความ
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedCustomer || sending) return;

    const tempText = inputText;
    setInputText(""); // Clear input ก่อนเพื่อความลื่น
    setSending(true);

    try {
      // ยิง API
      await sendInboxMessage(selectedCustomer.id, tempText);
      
      // อัปเดตหน้าจอทันที (Optimistic UI) หรือโหลดใหม่
      await loadChat(selectedCustomer); 
      // โหลด list ใหม่ด้วยเผื่ออัปเดต last message
      loadCustomers(); 

    } catch {
      alert("ส่งข้อความไม่สำเร็จ");
      setInputText(tempText); // คืนค่าถ้าพัง
    } finally {
      setSending(false);
    }
  };

  // 4. Realtime stream (SSE)
  useEffect(() => {
    if (!selectedCustomer || !store?.id) return;

    let active = true;
    let es: EventSource | null = null;

    const handleMessage = (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data) as StreamEvent;
        if (data.lineUserId && data.lineUserId !== selectedCustomer.id) return;
        const text = data.messageText || data.text || "";
        if (!text) return;

        const isFromUser = data.type?.startsWith("message") ?? true;
        const incoming: Message = {
          id: data.id || `${Date.now()}-${Math.random()}`,
          text,
          isFromUser,
          timestamp: data.createdAt || data.timestamp || Date.now(),
          from: isFromUser ? "user" : "system",
        };

        setMessages((prev) => [...prev, incoming]);
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === selectedCustomer.id
              ? { ...c, lastMessage: text, lastActivity: incoming.timestamp }
              : c
          )
        );
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    const handleError = (err: Event) => {
      console.error("SSE error:", err);
    };

    const startStream = async () => {
      try {
        const token = await getAuthToken();
        if (!active) return;

        const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
        const path = `/inbox/stream/${selectedCustomer.id}?storeId=${encodeURIComponent(store.id)}&token=${encodeURIComponent(token)}`;
        const url = base.startsWith("http") ? `${base}${path}` : path;

        if (streamRef.current) {
          streamRef.current.close();
        }

        es = new EventSource(url);
        streamRef.current = es;
        es.onmessage = handleMessage;
        es.onerror = handleError;
      } catch (err) {
        console.error("SSE auth token failed:", err);
      }
    };

    startStream();

    return () => {
      active = false;
      es?.close();
      if (streamRef.current === es) {
        streamRef.current = null;
      }
    };
  }, [selectedCustomer?.id, store?.id]);

  if (!store) return <div className="p-10 text-center">กรุณาเลือกร้านค้า</div>;

  return (
    <div className="flex h-[calc(100vh-100px)] border rounded-xl overflow-hidden bg-white shadow-sm">
      
      {/* ---------------- LEFT: Customer List ---------------- */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <h2 className="font-semibold text-lg">Inboxes</h2>
          <Button variant="ghost" size="icon" onClick={loadCustomers} disabled={loadingList}>
            <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          {customers.length === 0 && !loadingList ? (
            <div className="p-10 text-center text-gray-400">ยังไม่มีลูกค้าทักมา</div>
          ) : (
            customers.map((c) => (
              <div
                key={c.id}
                onClick={() => loadChat(c)}
                className={`p-4 border-b cursor-pointer hover:bg-white transition-colors flex items-center gap-3
                  ${selectedCustomer?.id === c.id ? "bg-white border-l-4 border-l-emerald-500 shadow-sm" : "border-l-4 border-l-transparent"}
                `}
              >
                <Avatar>
                  <AvatarImage src={c.pictureUrl} />
                  <AvatarFallback>{c.displayName?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium truncate">{c.displayName || "Unknown"}</span>
                    <span className="text-xs text-gray-400">
                      {formatTimestamp(c.lastActivity)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {c.lastMessage || "No message"}
                  </p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* ---------------- RIGHT: Chat Area ---------------- */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedCustomer ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b flex items-center gap-3 shadow-sm z-10">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedCustomer.pictureUrl} />
                <AvatarFallback>{selectedCustomer.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold">{selectedCustomer.displayName}</h3>
                <p className="text-xs text-green-600 flex items-center gap-1">
                   <span className="w-2 h-2 rounded-full bg-green-500"></span>
                   LINE Customer
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingChat ? (
                 <div className="flex justify-center items-center h-full text-gray-400 gap-2">
                    <Loader2 className="animate-spin" /> กำลังโหลดแชท...
                 </div>
              ) : messages.length === 0 ? (
                 <div className="text-center text-gray-400 mt-10">เริ่มการสนทนากับลูกค้าได้เลย</div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${!msg.isFromUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          !msg.isFromUser
                            ? "bg-emerald-600 text-white rounded-tr-none"
                            : "bg-white text-gray-800 border rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                        <div className={`text-[10px] mt-1 opacity-70 ${!msg.isFromUser ? "text-emerald-100 text-right" : "text-gray-400"}`}>
                          {formatTimestamp(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 bg-white border-t">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">AI Suggest</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSuggestions}
                  disabled={loadingSuggest}
                >
                  {loadingSuggest ? "กำลังโหลด..." : "ขอคำแนะนำ"}
                </Button>
              </div>

              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {suggestions.map((text, idx) => (
                    <button
                      key={`suggest-${idx}`}
                      type="button"
                      className="text-xs px-3 py-1 rounded-full border bg-gray-50 hover:bg-gray-100"
                      onClick={() => setInputText(text)}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="พิมพ์ข้อความตอบกลับ..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !inputText.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-gray-400">
            <UserIcon className="w-16 h-16 mb-4 opacity-20" />
            <p>เลือกรายชื่อลูกค้าทางซ้ายเพื่อเริ่มแชท</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper: Formatter
function formatTimestamp(ts: any) {
  if (!ts) return "";
  const date = new Date(ts._seconds ? ts._seconds * 1000 : ts);
  if (isNaN(date.getTime())) return "";
  return format(date, "HH:mm", { locale: th });
}
