import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

const STATUS_TEXT: Record<string, { headline: string; color: string }> = {
  in: { headline: "You're in! 🎉", color: "text-green-700" },
  maybe: { headline: "Marked you as \"not sure\"", color: "text-amber-700" },
  out: { headline: "Got it — you're marked as can't make it", color: "text-slate-600" },
};

export default async function RsvpConfirmedPage({
  searchParams,
}: {
  searchParams: { status?: string; groupId?: string; sessionId?: string };
}) {
  const { status, groupId, sessionId } = searchParams;
  const statusInfo = status ? STATUS_TEXT[status] : null;

  let sessionSummary: { location: string; sport: string; formatLabel: string } | null = null;
  if (sessionId) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("sessions")
      .select("location, sport, format_label")
      .eq("id", sessionId)
      .single();
    if (data) {
      sessionSummary = {
        location: data.location,
        sport: data.sport,
        formatLabel: data.format_label,
      };
    }
  }

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="max-w-sm rounded-lg border border-slate-200 bg-white p-8">
        <h1 className={`mb-2 text-xl font-bold ${statusInfo?.color ?? ""}`}>
          {statusInfo?.headline ?? "Thanks for responding"}
        </h1>
        {sessionSummary && (
          <p className="mb-6 text-sm text-slate-600">
            {sessionSummary.sport} ({sessionSummary.formatLabel}) at{" "}
            {sessionSummary.location}
          </p>
        )}
        {groupId && sessionId && (
          <Link
            href={`/groups/${groupId}/sessions/${sessionId}`}
            className="inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            View session details
          </Link>
        )}
        <p className="mt-4 text-xs text-slate-400">
          You'll need to sign in if you're on a new device — your RSVP is already saved.
        </p>
      </div>
    </main>
  );
}
