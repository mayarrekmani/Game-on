"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinGroupForm({ userId }: { userId: string }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    const { data: groupIdResult, error: lookupError } = await supabase.rpc(
      "group_id_from_invite_code",
      { p_code: code.trim().toUpperCase() }
    );

    if (lookupError || !groupIdResult) {
      setError("No group found with that code");
      setLoading(false);
      return;
    }

    const groupId = groupIdResult as string;

    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: userId,
      role: "member",
    });

    if (memberError && !memberError.message.includes("duplicate")) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    router.push(`/groups/${groupId}`);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <h3 className="mb-3 font-semibold">Join a group</h3>
      <input
        className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm uppercase tracking-widest"
        placeholder="INVITE CODE"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={8}
        required
      />
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded border border-brand-600 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
      >
        {loading ? "Joining..." : "Join group"}
      </button>
    </form>
  );
}
