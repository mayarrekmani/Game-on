import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import CreateGroupPageForm from "@/components/CreateGroupPageForm";

export default async function NewGroupPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
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
      <h1 className="mb-1 font-serif text-2xl font-extrabold">Create a group</h1>
      <p className="mb-6 text-sm text-slate-500">
        Give it a name and an icon — this is what shows up everywhere for your crew.
      </p>
      <CreateGroupPageForm userId={user.id} />
    </main>
  );
}
