import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_shape, avatar_color, avatar_icon, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <main>
      <Header
        displayName={profile?.display_name ?? null}
        avatarShape={profile?.avatar_shape}
        avatarColor={profile?.avatar_color}
        avatarIcon={profile?.avatar_icon}
        avatarUrl={profile?.avatar_url}
      />
      <h1 className="mb-1 font-serif text-2xl font-extrabold">Edit profile</h1>
      <p className="mb-6 text-sm text-slate-500">
        Update how your name and icon show up to your groups.
      </p>
      <SettingsForm userId={user.id} profile={profile} />
    </main>
  );
}
