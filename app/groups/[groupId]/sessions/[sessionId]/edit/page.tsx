import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/Header";
import EditSessionForm from "@/components/EditSessionForm";

export const dynamic = "force-dynamic";

export default async function EditSessionPage({
  params,
}: {
  params: { groupId: string; sessionId: string };
}) {
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

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", params.sessionId)
    .single();

  if (!session) notFound();

  // Only the person who created the session can edit it.
  if (session.created_by !== user.id) redirect(`/groups/${params.groupId}/sessions/${params.sessionId}`);

  return (
    <main>
      <Header
        displayName={profile?.display_name ?? null}
        avatarShape={profile?.avatar_shape}
        avatarColor={profile?.avatar_color}
        avatarIcon={profile?.avatar_icon}
        avatarUrl={profile?.avatar_url}
      />
      <h1 className="mb-1 font-serif text-2xl font-extrabold">Edit session</h1>
      <p className="mb-6 text-sm text-slate-500">
        Sport and size can't be changed after people start RSVPing — location, time,
        price, and fields can.
      </p>
      <EditSessionForm groupId={params.groupId} session={session} />
    </main>
  );
}
