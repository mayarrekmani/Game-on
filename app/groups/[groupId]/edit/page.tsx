import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/Header";
import EditGroupForm from "@/components/EditGroupForm";

export const dynamic = "force-dynamic";

export default async function EditGroupPage({
  params,
}: {
  params: { groupId: string };
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect("/login");

  const [{ data: profile }, { data: group }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_shape, avatar_color, avatar_icon, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase.from("groups").select("*").eq("id", params.groupId).single(),
    supabase
      .from("group_members")
      .select("role")
      .eq("group_id", params.groupId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!group) notFound();

  // Only admins can edit the group itself.
  if (membership?.role !== "admin") redirect(`/groups/${params.groupId}`);

  return (
    <main>
      <Header
        displayName={profile?.display_name ?? null}
        avatarShape={profile?.avatar_shape}
        avatarColor={profile?.avatar_color}
        avatarIcon={profile?.avatar_icon}
        avatarUrl={profile?.avatar_url}
      />
      <h1 className="mb-1 font-serif text-2xl font-extrabold">Edit group</h1>
      <p className="mb-6 text-sm text-slate-500">Update the name, icon, or photo everyone sees.</p>
      <EditGroupForm group={group} />
    </main>
  );
}
