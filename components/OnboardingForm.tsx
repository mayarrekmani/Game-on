"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProfileIdentityPicker, { type ProfileIdentity } from "@/components/ProfileIdentityPicker";

export default function OnboardingForm({
  userId,
  initialName,
}: {
  userId: string;
  initialName: string;
}) {
  const [identity, setIdentity] = useState<ProfileIdentity>({
    displayName: initialName,
    shape: "circle",
    color: "#d9531e",
    icon: null,
    photoDataUrl: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.displayName.trim()) return;
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: identity.displayName.trim(),
        avatar_shape: identity.shape,
        avatar_color: identity.color,
        avatar_icon: identity.icon,
        avatar_url: identity.photoDataUrl,
        onboarded: true,
      })
      .eq("id", userId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
      <ProfileIdentityPicker initial={identity} onChange={setIdentity} />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !identity.displayName.trim()}
        className="mt-6 w-full rounded bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}
