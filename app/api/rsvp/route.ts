import { NextResponse } from "next/server";
import { verifyRsvpToken } from "@/lib/rsvpToken";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${origin}/?rsvp=error`);
  }

  const payload = verifyRsvpToken(token);
  if (!payload) {
    return NextResponse.redirect(`${origin}/?rsvp=expired`);
  }

  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, group_id")
    .eq("id", payload.sessionId)
    .single();

  if (!session) {
    return NextResponse.redirect(`${origin}/?rsvp=error`);
  }

  // Confirm the person is still a member of the group before recording
  // their RSVP — closes the door if they were removed after the email
  // was sent, while still not requiring them to be logged in right now.
  const { data: membership } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", session.group_id)
    .eq("user_id", payload.userId)
    .single();

  if (!membership) {
    return NextResponse.redirect(`${origin}/?rsvp=error`);
  }

  await supabase
    .from("rsvps")
    .upsert(
      { session_id: payload.sessionId, user_id: payload.userId, status: payload.action },
      { onConflict: "session_id,user_id" }
    );

  return NextResponse.redirect(
    `${origin}/rsvp-confirmed?status=${payload.action}&groupId=${session.group_id}&sessionId=${session.id}`
  );
}
