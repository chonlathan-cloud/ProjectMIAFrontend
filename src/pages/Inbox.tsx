import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authedJson, getRecentMessages, type RecentMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000";

type InboxCustomer = {
  userId: string;
  displayName: string;
  pictureUrl?: string | null;
  lastMessage?: string | null;
  lastTime?: string | Date | number | null;
};

type InboxMessage = {
  id: string;
  from: "user" | "ai" | "system";
  text: string | null;
  url?: string | null;
  image?: { url: string };
  timestamp: number;
};

const detectSender = (
  type?: string,
  isFromUser?: boolean,
  from?: string,
): InboxMessage["from"] => {
  if (from === "ai" || type?.startsWith("ai")) return "ai";
  if (isFromUser || from === "user" || type?.startsWith("message")) return "user";
  return "system";
};

const normalizeMessage = (payload: any): InboxMessage | null => {
  if (!payload) return null;
  const tsRaw = payload.timestamp ?? payload.createdAt;
  const timestamp =
    typeof tsRaw === "number"
      ? tsRaw
      : tsRaw
      ? new Date(tsRaw).getTime()
      : Date.now();

  const text = payload.text ?? payload.messageText ?? null;

  const rawUrl =
    payload.url ||
    payload?.image?.url ||
    payload?.audio?.url ||
    payload?.video?.url ||
    payload?.file?.url ||
    null;

  const isImage =
    typeof rawUrl === "string" &&
    rawUrl.match(/\.(png|jpg|jpeg|gif|webp)$/i);
  const imageUrl = payload?.image?.url || (isImage ? rawUrl : null);

  return {
    id:
      payload.id ||
      `${payload.type || "msg"}-${timestamp}-${Math.random()
        .toString(36)
        .slice(2)}`,
    from: detectSender(payload.type, payload.isFromUser, payload.from),
    text,
    url: rawUrl,
    image: imageUrl ? { url: imageUrl } : undefined,
    timestamp,
  };
};

const normalizeRecentLog = (
  log: RecentMessage,
  customerId: string,
): InboxMessage | null => {
  const belongsToCustomer =
    log.fromUserId === customerId || log.toUserId === customerId;
  if (!belongsToCustomer) return null;

  const timestamp = new Date(log.timestamp).getTime();
  const sender =
    !log.isFromUser && (log.type?.startsWith?.("ai") ?? false)
      ? "ai"
      : log.isFromUser
      ? "user"
      : "system";

  return {
    id: log.id || `${timestamp}-recent-${log.text?.slice(0, 5)}`,
    from: sender,
    text: log.text,
    timestamp,
  };
};

const mergeMessages = (items: Array<InboxMessage | null>) => {
  const list = items.filter(Boolean) as InboxMessage[];
  list.sort((a, b) => a.timestamp - b.timestamp);

  const merged: InboxMessage[] = [];
  list.forEach((msg) => {
    const dupIdx = merged.findIndex(
      (m) =>
        m.from === msg.from &&
        m.text === msg.text &&
        Math.abs(m.timestamp - msg.timestamp) <= 4000,
    );

    if (dupIdx >= 0) {
      const existing = merged[dupIdx];
      const existingIsLocal = existing.id?.startsWith("local-");
      const incomingIsLocal = msg.id?.startsWith("local-");

      if (existingIsLocal && !incomingIsLocal) {
        merged[dupIdx] = msg;
      } else if (!existingIsLocal && incomingIsLocal) {
        // keep existing
      } else if (msg.timestamp >= existing.timestamp) {
        merged[dupIdx] = msg;
      }
    } else {
      merged.push(msg);
    }
  });

  return merged;
};

const buildCustomers = (
  rawList: any[],
  logs: RecentMessage[],
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

    return {
      ...c,
      userId,
      displayName:
        c?.displayName ||
        c?.name ||
        c?.profile?.displayName ||
        userId ||
        "ลูกค้า",
      pictureUrl:
        c?.pictureUrl ||
        c?.avatar ||
        c?.profile?.pictureUrl ||
        c?.image,
      lastMessage: latest?.text ?? c?.lastMessage ?? c?.latestMessage ?? null,
      lastTime: latest?.timestamp ?? c?.lastTime ?? c?.latestTime ?? null,
    } as InboxCustomer;
  });

  return list
    .filter((c) => c.userId)
    .sort((a, b) => {
      const tsA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
      const tsB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
      return tsB - tsA;
    });
};

export default function Inbox() {
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
        toast.error((res as any).message || "แนะนำข้อความไม่สำเร็จ");
      }
    } catch {
      toast.error("แนะนำข้อความไม่สำเร็จ");
    } finally {
      setLoadingSuggest(false);
    }
  }, [selected]);

  const loadCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      const [data, recent] = await Promise.all([
        authedJson<any>("/api/inbox/customers").catch(() => ({ customers: [] })),
        getRecentMessages().catch(() => ({ data: { items: [] } })),
      ]);

      const rawList = data?.customers ?? data?.data?.customers ?? [];
      const recentItems = recent?.data?.items ?? [];
      setRecentLogs(recentItems);

      const list = buildCustomers(rawList, recentItems);
      setCustomers(list);

      if (list.length > 0) {
        setSelected((prev) => prev ?? list[0].userId);
      }
    } catch {
      toast.error("โหลดรายชื่อลูกค้าไม่สำเร็จ");
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const loadChatHistory = useCallback(
    async (customerId: string, opts: { silent?: boolean } = {}) => {
      try {
        if (!opts.silent) setLoadingMessages(true);

        const [historyRes, recentsRes] = await Promise.all([
          authedJson<any>(`/api/inbox/history/${customerId}`).catch(() => null),
          recentLogs.length
            ? Promise.resolve({ data: { items: recentLogs } })
            : getRecentMessages().catch(() => ({ data: { items: [] } })),
        ]);

        const historyRaw =
          historyRes?.messages ?? historyRes?.data?.messages ?? [];
        const historyMsgs = historyRaw
          .map(normalizeMessage)
          .filter(Boolean) as InboxMessage[];

        const relatedLogs = (recentsRes?.data?.items ?? []).map(
          (m: RecentMessage) => normalizeRecentLog(m, customerId),
        );

        setMessages((prev) =>
          mergeMessages([...prev, ...historyMsgs, ...relatedLogs]),
        );
      } catch {
        toast.error("โหลดประวัติแชทไม่สำเร็จ");
      } finally {
        if (!opts.silent) setLoadingMessages(false);
      }
    },
    [recentLogs],
  );

  const sendMessage = useCallback(
    async () => {
      if (!selected || !input.trim()) return;
      const text = input.trim();
      setSending(true);
      try {
        const localMsg: InboxMessage = {
          id: `local-${Date.now()}`,
          from: "system",
          text,
          timestamp: Date.now(),
        };
        setMessages((prev) => mergeMessages([...prev, localMsg]));
        setInput("");

        setCustomers((prev) =>
          prev
            .map((c) =>
              c.userId === selected
                ? { ...c, lastMessage: text, lastTime: Date.now() }
                : c,
            )
            .sort((a, b) => {
              const tsA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
              const tsB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
              return tsB - tsA;
            }),
        );

        await authedJson(`/api/inbox/send/${selected}`, {
          method: "POST",
          body: JSON.stringify({ message: text }),
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        toast.error("ส่งข้อความไม่สำเร็จ");
      } finally {
        setSending(false);
      }
    },
    [input, selected],
  );

  const connectRealtime = useCallback(
    (customerId: string) => {
      const sse = new EventSource(
        `${API_BASE_URL}/api/inbox/stream/${customerId}`,
      );

      sse.onmessage = (event) => {
        try {
          const msg = normalizeMessage(JSON.parse(event.data));
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
                : c,
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

      sse.onerror = () => {
        console.log("SSE disconnected, retrying...");
        sse.close();
      };

      return sse;
    },
    [],
  );

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!selected) return;
    setMessages([]);
    loadChatHistory(selected);
    const sse = connectRealtime(selected);
    return () => {
      sse?.close();
    };
  }, [connectRealtime, loadChatHistory, selected]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.userId === selected),
    [customers, selected],
  );

  return (
    <div className="flex h-full text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950">
      {/* ซ้าย: รายชื่อลูกค้า */}
      <div className="w-64 border-r border-gray-200 dark:border-slate-800 flex flex-col">
        <h2 className="p-4 font-bold text-lg border-b border-gray-100 dark:border-slate-800">
          Inbox
        </h2>
        <div className="flex-1 overflow-y-auto">
          {loadingCustomers && !customers.length && (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading...
            </div>
          )}
          {!loadingCustomers && !customers.length && (
            <div className="p-4 text-center text-sm text-gray-500">
              No customers found
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
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/40x40?text=?";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p
                      className={`font-medium truncate ${
                        isSelected
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-900 dark:text-gray-200"
                      }`}
                    >
                      {c.displayName}
                    </p>
                    {c.lastTime && (
                      <span className="text-[10px] text-gray-400">
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

      {/* ขวา: ส่วนแชท */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900/50">
        {!selected ? (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <span className="font-semibold">Inbox</span>
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2">
              <span className="text-4xl">💬</span>
              <p>เลือกลูกค้าเพื่อเริ่มสนทนา</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header: ชื่อลูกค้า + ปุ่ม AI */}
            <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <span className="font-semibold">Inbox</span>
              <span className="font-semibold ml-4 truncate">
                {selectedCustomer?.displayName || selected}
              </span>

              <div className="ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadSuggestions}
                  disabled={loadingSuggest || !selected}
                >
                  {loadingSuggest ? "AI กำลังคิด..." : "⚡ แนะนำข้อความ"}
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth">
              {loadingMessages && !messages.length && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  กำลังโหลดข้อความ...
                </div>
              )}

              {messages.map((m) => {
                const isAi = m.from === "ai";
                const isUser = m.from === "user";

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[75%] ${
                      isUser ? "self-start items-start" : "self-end items-end"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-sm shadow-sm ${
                        isUser
                          ? "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-slate-700"
                          : isAi
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-emerald-600 text-white rounded-tr-none"
                      }`}
                    >
                      {m.text}
                      {m.image?.url && (
                        <img
                          src={m.image.url}
                          alt="att"
                          className="mt-2 rounded-lg max-w-full"
                        />
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

            {/* AI suggestions */}
            {suggestions.length > 0 && (
              <div className="p-3 bg-white border-t space-y-2">
                <p className="text-sm font-semibold">AI แนะนำข้อความ:</p>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="block w-full text-left p-2 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => setInput(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-slate-800">
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  placeholder="พิมพ์ข้อความ..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="rounded-full w-24"
                >
                  {sending ? "กำลังส่ง..." : "ส่ง"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
