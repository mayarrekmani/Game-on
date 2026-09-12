import { Resend } from "resend";
import { createRsvpToken } from "@/lib/rsvpToken";
import { SPORTS, type SportKey } from "@/lib/sports";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function sendSessionInviteEmail({
  to,
  recipientUserId,
  groupId,
  sessionId,
  groupName,
  sport,
  formatLabel,
  venue,
  location,
  startsAt,
  createdByName,
}: {
  to: string;
  recipientUserId: string;
  groupId: string;
  sessionId: string;
  groupName: string;
  sport: SportKey;
  formatLabel: string;
  venue: string | null;
  location: string;
  startsAt: string;
  createdByName: string;
}) {
  const sportConfig = SPORTS[sport];
  const date = new Date(startsAt);
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const yesUrl = `${siteUrl()}/api/rsvp?token=${createRsvpToken(sessionId, recipientUserId, "in")}`;
  const maybeUrl = `${siteUrl()}/api/rsvp?token=${createRsvpToken(sessionId, recipientUserId, "maybe")}`;
  const noUrl = `${siteUrl()}/api/rsvp?token=${createRsvpToken(sessionId, recipientUserId, "out")}`;
  const sessionUrl = `${siteUrl()}/groups/${groupId}/sessions/${sessionId}`;

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #14181f;">
      <div style="background:#1b2838; color:white; padding:24px; border-radius:12px 12px 0 0;">
        <div style="font-size:13px; opacity:0.75; margin-bottom:6px;">${groupName}</div>
        <h1 style="font-size:20px; margin:0 0 6px;">${sportConfig.emoji} ${sportConfig.name} — ${formatLabel}${venue ? " · " + venue : ""}</h1>
        <div style="font-size:14px; opacity:0.85;">${dateStr} at ${timeStr} · ${location}</div>
      </div>
      <div style="border:1px solid #e2e6eb; border-top:none; padding:24px; border-radius:0 0 12px 12px;">
        <p style="font-size:14px; color:#5b6472; margin:0 0 20px;">
          ${createdByName} suggested a session. Are you in?
        </p>
        <table style="width:100%; border-collapse: collapse;">
          <tr>
            <td style="padding:4px;">
              <a href="${yesUrl}" style="display:block; text-align:center; background:#2f855a; color:white; text-decoration:none; padding:12px; border-radius:8px; font-weight:700; font-size:14px;">Yes, I'm in</a>
            </td>
            <td style="padding:4px;">
              <a href="${maybeUrl}" style="display:block; text-align:center; background:#b9791f; color:white; text-decoration:none; padding:12px; border-radius:8px; font-weight:700; font-size:14px;">Not sure</a>
            </td>
            <td style="padding:4px;">
              <a href="${noUrl}" style="display:block; text-align:center; background:#4a5a6d; color:white; text-decoration:none; padding:12px; border-radius:8px; font-weight:700; font-size:14px;">Can't make it</a>
            </td>
          </tr>
        </table>
        <p style="font-size:12.5px; color:#5b6472; margin:20px 0 0;">
          Tapping a button registers your response immediately — no need to log in.
          You can also <a href="${sessionUrl}" style="color:#d9531e;">open the session</a> to see who else is in.
        </p>
      </div>
    </div>
  `;

  await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "Game On <onboarding@resend.dev>",
    to,
    subject: `${sportConfig.emoji} ${createdByName} posted a ${sportConfig.name} session — ${dateStr}`,
    html,
  });
}
