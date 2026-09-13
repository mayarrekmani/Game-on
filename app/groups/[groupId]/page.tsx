import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import SuggestSessionForm from "@/components/SuggestSessionForm";
import GroupChat from "@/components/GroupChat";
import GroupTabs from "@/components/GroupTabs";
import MembersList from "@/components/MembersList";
import { SPORTS, type SportKey } from "@/lib/sports";

// Sessions/chat/notification badges here change constantly — never serve
// a cached snapshot of this page.
export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: {
  params: { groupId: string };
}) {
  const supabase = createClient();

  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect("/login");

  // These two don't depend on each other — fetch them together instead
  // of one-after-another to save a full network round-trip.
  const [{ data: profile }, { data: group }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, avatar_shape, avatar_color, avatar_icon, avatar_url",
      )
      .eq("id", user.id)
      .single(),
    supabase.from("groups").select("*").eq("id", params.groupId).single(),
  ]);

  if (!group) notFound();

  const [
    { data: members },
    { data: sessions },
    { data: messages },
    { data: reads },
  ] = await Promise.all([
    supabase
      .from("group_members")
      .select(
        "user_id, role, profiles(display_name, avatar_shape, avatar_color, avatar_icon, avatar_url)",
      )
      .eq("group_id", params.groupId),
    supabase
      .from("sessions")
      .select("*")
      .eq("group_id", params.groupId)
      .order("starts_at", { ascending: true }),
    supabase
      .from("messages")
      .select(
        "id, user_id, content, created_at, profiles(display_name, avatar_shape, avatar_color, avatar_icon, avatar_url)",
      )
      .eq("group_id", params.groupId)
      .order("created_at", { ascending: true }),
    supabase
      .from("group_reads")
      .select("last_seen_sessions_at, last_seen_chat_at")
      .eq("group_id", params.groupId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const now = new Date();
  const upcoming = (sessions ?? []).filter((s) => new Date(s.starts_at) >= now);
  const past = (sessions ?? []).filter((s) => new Date(s.starts_at) < now);

  const lastSeenSessions = reads?.last_seen_sessions_at ?? "1970-01-01";
  const lastSeenChat = reads?.last_seen_chat_at ?? "1970-01-01";
  const hasNewSessions = (sessions ?? []).some(
    (s) => new Date(s.created_at) > new Date(lastSeenSessions),
  );
  const hasNewChat = (messages ?? []).some(
    (m) => new Date(m.created_at) > new Date(lastSeenChat),
  );

  const sessionsContent = (
    <div>
      {upcoming.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">No upcoming sessions yet.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {upcoming.map((s) => (
            <SessionListItem key={s.id} session={s} groupId={group.id} />
          ))}
        </ul>
      )}

      <SuggestSessionForm groupId={group.id} userId={user.id} />

      {past.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Past
          </h3>
          <ul className="space-y-2 opacity-60">
            {past.map((s) => (
              <SessionListItem key={s.id} session={s} groupId={group.id} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const chatContent = (
    <GroupChat
      groupId={group.id}
      userId={user.id}
      initialMessages={(messages ?? []) as any}
    />
  );

  const isAdmin =
    members?.some((m: any) => m.user_id === user.id && m.role === "admin") ??
    false;

  const membersContent = (
    <MembersList
      groupId={group.id}
      currentUserId={user.id}
      isAdmin={isAdmin}
      initialMembers={(members ?? []) as any}
    />
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

      <Link
        href="/"
        className="mb-3 inline-block text-sm text-brand-700 hover:underline"
      >
        ← All groups
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-cover bg-center text-xl text-white"
            style={{
              background: group.avatar_url ? undefined : group.color,
              backgroundImage: group.avatar_url
                ? `url(${group.avatar_url})`
                : undefined,
            }}
          >
            {!group.avatar_url && group.icon_emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl font-extrabold sm:text-2xl">
                {group.name}
              </h1>
              {isAdmin && (
                <Link
                  href={`/groups/${group.id}/edit`}
                  className="text-xs font-semibold text-brand-700 underline"
                >
                  Edit
                </Link>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {members?.length ?? 0} members
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-center">
          <div className="text-xs text-slate-500">Invite code</div>
          <div className="font-mono font-semibold tracking-widest">
            {group.invite_code}
          </div>
        </div>
      </div>

      <GroupTabs
        groupId={group.id}
        userId={user.id}
        sessionsContent={sessionsContent}
        chatContent={chatContent}
        membersContent={membersContent}
        hasNewSessions={hasNewSessions}
        hasNewChat={hasNewChat}
      />
    </main>
  );
}

function SessionListItem({
  session,
  groupId,
}: {
  session: any;
  groupId: string;
}) {
  const date = new Date(session.starts_at);
  const sportConfig = SPORTS[session.sport as SportKey];
  return (
    <li>
      <Link
        href={`/groups/${groupId}/sessions/${session.id}`}
        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3.5 hover:border-brand-500"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">
          {sportConfig.emoji}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {sportConfig.name} ({session.format_label}) — {session.location}
          </div>
          <div className="text-xs text-slate-500">
            {date.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            at{" "}
            {date.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
            {session.total_cost > 0 && ` · $${session.total_cost} total`}
          </div>
        </div>
      </Link>
    </li>
  );
}
