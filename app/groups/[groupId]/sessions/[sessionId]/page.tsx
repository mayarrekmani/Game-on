import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import RsvpPanel from "@/components/RsvpPanel";
import { SPORTS, type SportKey } from "@/lib/sports";

// This page shows live RSVP data that changes constantly — never serve a
// cached snapshot of it.
export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: { groupId: string; sessionId: string };
}) {
  const supabase = createClient();

  const {
    data: { session: authSession },
  } = await supabase.auth.getSession();
  const user = authSession?.user;
  if (!user) redirect("/login");

  // None of these three depend on each other's results (rsvps only needs
  // the sessionId from the URL, not the session row itself) — fetch them
  // together instead of one-after-another.
  const [{ data: profile }, { data: session }, { data: rsvps }, { data: teams }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, avatar_shape, avatar_color, avatar_icon, avatar_url")
        .eq("id", user.id)
        .single(),
      supabase.from("sessions").select("*, groups(name)").eq("id", params.sessionId).single(),
      supabase
        .from("rsvps")
        .select(
          "user_id, status, paid, team, profiles(display_name, avatar_shape, avatar_color, avatar_icon, avatar_url)"
        )
        .eq("session_id", params.sessionId)
        .order("responded_at", { ascending: true }),
      supabase
        .from("session_teams")
        .select("team_key, name")
        .eq("session_id", params.sessionId)
        .order("team_key", { ascending: true }),
    ]);

  if (!session) notFound();

  const date = new Date(session.starts_at);

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
        href={`/groups/${params.groupId}`}
        className="mb-4 inline-block text-sm text-brand-700 hover:underline"
      >
        ← {(session as any).groups?.name ?? "Back to group"}
      </Link>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-1 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {SPORTS[session.sport as SportKey].emoji} {SPORTS[session.sport as SportKey].name} · {session.format_label}
            {session.venue && ` · ${session.venue}`}
          </div>
          {session.created_by === user.id && (
            <Link
              href={`/groups/${params.groupId}/sessions/${params.sessionId}/edit`}
              className="text-xs font-semibold text-brand-700 underline"
            >
              Edit
            </Link>
          )}
        </div>
        <h1 className="font-serif text-xl font-extrabold">
          {session.title || `${SPORTS[session.sport as SportKey].name} session`}
        </h1>
        <p className="text-slate-600">{session.location}</p>
        <p className="text-slate-600">
          {date.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}{" "}
          at{" "}
          {date.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
        {session.fields_count > 1 && (
          <p className="mt-1 text-sm text-slate-500">
            {session.fields_count} {SPORTS[session.sport as SportKey].venues ? "courts" : "fields"} booked
          </p>
        )}
      </div>

      <RsvpPanel
        sessionId={session.id}
        userId={user.id}
        createdBy={session.created_by}
        sport={session.sport}
        perSide={session.per_side}
        fieldsCount={session.fields_count}
        totalCost={session.total_cost}
        initialRsvps={(rsvps ?? []) as any}
        initialTeams={(teams ?? []) as any}
      />
    </main>
  );
}
