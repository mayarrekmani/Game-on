"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

type Member = {
  user_id: string;
  role: string;
  profiles: {
    display_name: string | null;
    avatar_shape: string | null;
    avatar_color: string | null;
    avatar_icon: string | null;
    avatar_url: string | null;
  } | null;
};

export default function MembersList({
  groupId,
  currentUserId,
  isAdmin,
  initialMembers,
}: {
  groupId: string;
  currentUserId: string;
  isAdmin: boolean;
  initialMembers: Member[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const kick = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this group?`)) return;
    setRemovingId(userId);
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
    setRemovingId(null);
    if (!error) {
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      router.refresh();
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {members.map((m) => {
        const name = m.profiles?.display_name ?? "Member";
        const canKick = isAdmin && m.user_id !== currentUserId;
        return (
          <span
            key={m.user_id}
            className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-sm"
          >
            <Avatar
              shape={m.profiles?.avatar_shape ?? "circle"}
              color={m.profiles?.avatar_color}
              icon={m.profiles?.avatar_icon}
              photoUrl={m.profiles?.avatar_url}
              name={name}
              size="xs"
            />
            {name}
            {m.role === "admin" && <span className="text-xs text-brand-600">· admin</span>}
            {canKick && (
              <button
                type="button"
                onClick={() => kick(m.user_id, name)}
                disabled={removingId === m.user_id}
                className="ml-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                title={`Remove ${name}`}
              >
                ✕
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
