import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { SPORTS, type SportKey } from "@/lib/sports";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: Request) {
  const { sessionId } = await request.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, groups(name)")
    .eq("id", sessionId)
    .single();
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { count: yesCount } = await supabase
    .from("rsvps")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "in");

  const capacity = session.per_side * 2 * session.fields_count;
  const confirmedCount = yesCount ?? 0;

  // Only fire right at the moment it first tips over, not on every
  // subsequent "yes" — avoids spamming the creator with repeat emails.
  const justCrossedThreshold = confirmedCount === capacity + 1;

  if (!justCrossedThreshold) {
    return NextResponse.json({ notified: false, confirmedCount, capacity });
  }

  const { data: creator } = await supabase
    .from("profiles")
    .select("email, display_name")
    .eq("id", session.created_by)
    .single();

  if (!creator?.email) {
    return NextResponse.json({ notified: false, reason: "no creator email" });
  }

  const sportConfig = SPORTS[session.sport as SportKey];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const sessionUrl = `${siteUrl}/groups/${session.group_id}/sessions/${session.id}`;

  await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "Game On <onboarding@resend.dev>",
    to: creator.email,
    subject: `${sportConfig.emoji} More people want in than you booked for`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #14181f;">
        <h2 style="font-size:18px;">You've got more than your booked space</h2>
        <p style="font-size:14px; color:#5b6472;">
          ${confirmedCount} people said yes to your ${sportConfig.name} session at
          ${session.location}, but you booked space for ${capacity}.
          Might be worth booking another ${sportConfig.venues ? "court" : "field"}.
        </p>
        <a href="${sessionUrl}" style="display:inline-block; margin-top:12px; background:#d9531e; color:white; text-decoration:none; padding:10px 18px; border-radius:8px; font-weight:700; font-size:14px;">
          View session
        </a>
      </div>
    `,
  });

  return NextResponse.json({ notified: true, confirmedCount, capacity });
}
