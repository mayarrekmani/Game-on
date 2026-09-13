"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

const STICKERS = ["👍", "🔥", "🎉", "😂", "❤️", "🙌", "😢", "👏", "⚽", "🏆", "😴", "🤔"];

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_shape: string | null;
    avatar_color: string | null;
    avatar_icon: string | null;
    avatar_url: string | null;
  } | null;
};

export default function GroupChat({
  groupId,
  userId,
  initialMessages,
}: {
  groupId: string;
  userId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const refetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select(
        "id, user_id, content, created_at, profiles(display_name, avatar_shape, avatar_color, avatar_icon, avatar_url)"
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as unknown as Message[]);
  };

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
        () => refetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, supabase]);

  // Realtime websockets can silently drop (phone locks, tab backgrounds,
  // wifi hiccups) without reconnecting cleanly. As a safety net, refetch
  // whenever the tab/app regains focus, instead of relying purely on the
  // live connection.
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === "visible") refetchMessages();
    };
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, [groupId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!draft.trim()) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");
    await supabase.from("messages").insert({ group_id: groupId, user_id: userId, content });
    setSending(false);
  };

  const sendSticker = async (sticker: string) => {
    setShowStickers(false);
    await supabase.from("messages").insert({ group_id: groupId, user_id: userId, content: sticker });
  };

  return (
    <div>
      <div className="mb-3 flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">
            No messages yet — say hi to the group.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.user_id === userId;
          const name = m.profiles?.display_name ?? "Player";
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
            >
              <Avatar
                shape={(m.profiles?.avatar_shape as any) ?? "circle"}
                color={m.profiles?.avatar_color}
                icon={m.profiles?.avatar_icon}
                photoUrl={m.profiles?.avatar_url}
                name={name}
                size="xs"
              />
              <div className="max-w-[75%]">
                {STICKERS.includes(m.content) ? (
                  <div className="text-4xl">{m.content}</div>
                ) : (
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? "rounded-br-sm bg-brand-600 text-white"
                        : "rounded-bl-sm bg-slate-100 text-slate-800"
                    }`}
                  >
                    {m.content}
                  </div>
                )}
                <div
                  className={`mt-0.5 text-xs text-slate-400 ${mine ? "text-right" : ""}`}
                >
                  {name}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {showStickers && (
        <div className="mb-2 flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
          {STICKERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => sendSticker(s)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-white"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowStickers((s) => !s)}
          className="flex-shrink-0 rounded-full border border-slate-300 px-3 py-2.5 text-lg"
          title="Stickers"
        >
          😀
        </button>
        <input
          className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm"
          placeholder="Message the group..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
