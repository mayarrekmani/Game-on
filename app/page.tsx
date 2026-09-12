import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import JoinGroupForm from "@/components/JoinGroupForm";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_shape, avatar_color, avatar_icon, avatar_url, onboarded")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded) redirect("/onboarding");

  const { data: memberships } = await supabase
    .from("group_members")
    .select(
      "group_id, groups(id, name, sport, icon_emoji, color, avatar_url)"
    )
    .eq("user_id", user.id);

  const groups = (memberships ?? []).map((m: any) => m.groups).filter(Boolean);

  // For each group: is there a session or chat message newer than the
  // last time this person viewed that tab? Drives the "new" badge.
  const groupsWithBadges = await Promise.all(
    groups.map(async (group: any) => {
      const [{ data: reads }, { data: latestSession }, { data: latestMessage }, { count: memberCount }] =
        await Promise.all([
          supabase
            .from("group_reads")
            .select("last_seen_sessions_at, last_seen_chat_at")
            .eq("group_id", group.id)
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("sessions")
            .select("created_at")
            .eq("group_id", group.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("messages")
            .select("created_at")
            .eq("group_id", group.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id),
        ]);

      const lastSeenSessions = reads?.last_seen_sessions_at ?? "1970-01-01";
      const lastSeenChat = reads?.last_seen_chat_at ?? "1970-01-01";
      const hasNewSession =
        !!latestSession && new Date(latestSession.created_at) > new Date(lastSeenSessions);
      const hasNewChat =
        !!latestMessage && new Date(latestMessage.created_at) > new Date(lastSeenChat);

      return {
        ...group,
        memberCount: memberCount ?? 0,
        hasNew: hasNewSession || hasNewChat,
      };
    })
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

      <h1 className="mb-1 font-serif text-2xl font-extrabold">Your groups</h1>
      <p className="mb-5 text-sm text-slate-500">
        {groups.length} group{groups.length === 1 ? "" : "s"} · tap one to see sessions
      </p>

      {groupsWithBadges.length === 0 ? (
        <p className="mb-6 text-slate-500">
          You&apos;re not in any groups yet. Create one or join with an invite code below.
        </p>
      ) : (
        <ul className="mb-4 space-y-3">
          {groupsWithBadges.map((group: any) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                className="relative flex items-center gap-4 overflow-hidden rounded-2xl p-4 text-white shadow-sm"
                style={{
                  background: group.avatar_url
                    ? undefined
                    : `linear-gradient(135deg, ${group.color}, ${group.color}cc)`,
                  backgroundImage: group.avatar_url ? `url(${group.avatar_url})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {!group.avatar_url && (
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xl">
                    {group.icon_emoji}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-serif text-base font-bold">{group.name}</div>
                  <div className="truncate text-xs opacity-85">
                    {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
                    {group.sport ? ` · ${group.sport}` : ""}
                  </div>
                </div>
                {group.hasNew && (
                  <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-900">
                    New
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/groups/new"
        className="mb-3 block w-full rounded-lg border-2 border-dashed border-slate-300 py-3 text-center text-sm font-medium text-slate-500 hover:border-brand-500 hover:text-brand-600"
      >
        + Create a new group
      </Link>

      <JoinGroupForm userId={user.id} />
    </main>
  );
}
