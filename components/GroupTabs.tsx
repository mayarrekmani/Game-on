"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "sessions" | "chat" | "members";

export default function GroupTabs({
  groupId,
  userId,
  sessionsContent,
  chatContent,
  membersContent,
  hasNewSessions,
  hasNewChat,
}: {
  groupId: string;
  userId: string;
  sessionsContent: React.ReactNode;
  chatContent: React.ReactNode;
  membersContent: React.ReactNode;
  hasNewSessions: boolean;
  hasNewChat: boolean;
}) {
  const [tab, setTab] = useState<Tab>("sessions");
  const supabase = createClient();

  const markSeen = async (which: Tab) => {
    if (which === "sessions") {
      await supabase.from("group_reads").upsert(
        { group_id: groupId, user_id: userId, last_seen_sessions_at: new Date().toISOString() },
        { onConflict: "group_id,user_id" }
      );
    } else if (which === "chat") {
      await supabase.from("group_reads").upsert(
        { group_id: groupId, user_id: userId, last_seen_chat_at: new Date().toISOString() },
        { onConflict: "group_id,user_id" }
      );
    }
  };

  const selectTab = (which: Tab) => {
    setTab(which);
    if (which === "sessions" || which === "chat") markSeen(which);
  };

  const tabClass = (active: boolean) =>
    `relative border-b-2 px-3 py-2.5 text-sm font-semibold ${
      active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500"
    }`;

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        <button onClick={() => selectTab("sessions")} className={tabClass(tab === "sessions")}>
          Sessions
          {hasNewSessions && tab !== "sessions" && (
            <span className="absolute -right-1 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
        <button onClick={() => selectTab("chat")} className={tabClass(tab === "chat")}>
          Chat
          {hasNewChat && tab !== "chat" && (
            <span className="absolute -right-1 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
        <button onClick={() => selectTab("members")} className={tabClass(tab === "members")}>
          Members
        </button>
      </div>

      <div className={tab === "sessions" ? "block" : "hidden"}>{sessionsContent}</div>
      <div className={tab === "chat" ? "block" : "hidden"}>{chatContent}</div>
      <div className={tab === "members" ? "block" : "hidden"}>{membersContent}</div>
    </div>
  );
}
