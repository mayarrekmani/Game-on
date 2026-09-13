"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GroupIconPicker from "@/components/GroupIconPicker";

export default function EditGroupForm({
  group,
}: {
  group: {
    id: string;
    name: string;
    icon_emoji: string;
    color: string;
    avatar_url: string | null;
  };
}) {
  const [name, setName] = useState(group.name);
  const [identity, setIdentity] = useState({
    icon: group.icon_emoji,
    color: group.color,
    photoDataUrl: group.avatar_url,
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

    const { error: updateError } = await supabase
      .from("groups")
      .update({
        name: name.trim(),
        icon_emoji: identity.icon,
        color: identity.color,
        avatar_url: identity.photoDataUrl,
      })
      .eq("id", group.id);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push(`/groups/${group.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Group name
      </label>
      <input
        className="mb-6 w-full rounded border border-slate-300 px-3 py-2.5 text-sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="mb-6">
        <GroupIconPicker
          initialIcon={identity.icon}
          initialColor={identity.color}
          onChange={setIdentity}
        />
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
