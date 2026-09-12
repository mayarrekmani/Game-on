"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProfileIdentityPicker, { type ProfileIdentity } from "@/components/ProfileIdentityPicker";

export default function SettingsForm({
  userId,
  profile,
}: {
  userId: string;
  profile: {
    display_name: string | null;
    avatar_shape: string;
    avatar_color: string;
    avatar_icon: string | null;
    avatar_url: string | null;
  } | null;
}) {
  const [identity, setIdentity] = useState<ProfileIdentity>({
    displayName: profile?.display_name ?? "",
    shape: (profile?.avatar_shape as ProfileIdentity["shape"]) ?? "circle",
    color: profile?.avatar_color ?? "#d9531e",
    icon: profile?.avatar_icon ?? null,
    photoDataUrl: profile?.avatar_url ?? null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.displayName.trim()) return;
    setLoading(true);
    setError(null);
    setSaved(false);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: identity.displayName.trim(),
        avatar_shape: identity.shape,
        avatar_color: identity.color,
        avatar_icon: identity.icon,
        avatar_url: identity.photoDataUrl,
      })
      .eq("id", userId);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaved(true);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
      <ProfileIdentityPicker initial={identity} onChange={setIdentity} />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm text-green-600">Saved!</p>}
      <div className="mt-6 flex gap-2">
        <button
          type="submit"
          disabled={loading || !identity.displayName.trim()}
          className="flex-1 rounded bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
