import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import SettingsForm from "@/components/SettingsForm";
import SportSkillLevels from "@/components/SportSkillLevels";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect("/login");

  const [{ data: profile }, { data: skillRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_shape, avatar_color, avatar_icon, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase.from("player_skill_levels").select("sport, level").eq("user_id", user.id),
  ]);

  const initialLevels = Object.fromEntries(
    (skillRows ?? []).map((r) => [r.sport, r.level])
  );

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
      <div className="space-y-4">
        <SettingsForm userId={user.id} profile={profile} />
        <SportSkillLevels userId={user.id} initialLevels={initialLevels} />
      </div>
    </main>
  );
}
