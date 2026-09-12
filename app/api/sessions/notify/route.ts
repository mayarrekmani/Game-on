import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSessionInviteEmail } from "@/lib/email/sendSessionInvite";

export async function POST(request: Request) {
  const { sessionId } = await request.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*, groups(id, name)")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: creator } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", session.created_by)
    .single();

  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("user_id, profiles(id, email)")
    .eq("group_id", session.group_id);

  if (membersError || !members) {
    return NextResponse.json({ error: "Could not load members" }, { status: 500 });
  }

  const results = await Promise.allSettled(
    members
      .filter((m: any) => m.profiles?.email)
      .map((m: any) =>
        sendSessionInviteEmail({
          to: m.profiles.email,
          recipientUserId: m.user_id,
          groupId: session.group_id,
          sessionId: session.id,
          groupName: (session as any).groups?.name ?? "your group",
          sport: session.sport,
          formatLabel: session.format_label,
          venue: session.venue,
          location: session.location,
          startsAt: session.starts_at,
          createdByName: creator?.display_name ?? "Someone",
        })
      )
  );

  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent: results.length - failed, failed });
}
