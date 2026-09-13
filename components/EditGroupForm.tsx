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
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete "${group.name}"? This permanently removes the group, every session, RSVP, and chat message in it — for everyone. This can't be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);

    const { error: deleteError } = await supabase.from("groups").delete().eq("id", group.id);

    setDeleting(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    router.push("/");
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

      <div className="mt-6 border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full rounded border-2 border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete this group"}
        </button>
        <p className="mt-2 text-center text-xs text-slate-400">
          Deletes everything — sessions, RSVPs, chat history — for every member.
        </p>
      </div>
    </form>
  );
}
