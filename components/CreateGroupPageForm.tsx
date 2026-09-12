"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateInviteCode } from "@/lib/inviteCode";
import GroupIconPicker from "@/components/GroupIconPicker";

const SPORT_TAGS = ["Soccer", "Volleyball", "Basketball", "Flag Football", "Mixed"];

export default function CreateGroupPageForm({ userId }: { userId: string }) {
  const [name, setName] = useState("");
  const [sportTag, setSportTag] = useState<string | null>(null);
  const [identity, setIdentity] = useState({
    icon: "🏆",
    color: "#d9531e",
    photoDataUrl: null as string | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const invite_code = generateInviteCode();

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        sport: sportTag,
        icon_emoji: identity.icon,
        color: identity.color,
        avatar_url: identity.photoDataUrl,
        created_by: userId,
        invite_code,
      })
      .select()
      .single();

    if (groupError || !group) {
      setError(groupError?.message ?? "Could not create group");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: userId,
      role: "admin",
    });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    router.push(`/groups/${group.id}`);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6"
    >
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Group name
      </label>
      <input
        className="mb-6 w-full rounded border border-slate-300 px-3 py-2.5 text-sm"
        placeholder="e.g. Sunday Soccer Crew"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="mb-6">
        <GroupIconPicker onChange={setIdentity} />
      </div>

      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Primary sport (optional tag)
      </label>
      <div className="mb-6 flex flex-wrap gap-2">
        {SPORT_TAGS.map((tag) => (
          <button
            type="button"
            key={tag}
            onClick={() => setSportTag(sportTag === tag ? null : tag)}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold ${
              sportTag === tag
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-slate-200 text-slate-600"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create group"}
      </button>
    </form>
  );
}
