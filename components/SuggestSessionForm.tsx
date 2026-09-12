"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SPORTS, sportCapacity, type SportKey } from "@/lib/sports";

export default function SuggestSessionForm({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [sport, setSport] = useState<SportKey>("volleyball");
  const [formatIdx, setFormatIdx] = useState(0);
  const [venue, setVenue] = useState<string | null>("Beach");
  const [fieldsCount, setFieldsCount] = useState(1);
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const sportConfig = SPORTS[sport];
  const format = sportConfig.formats[formatIdx];
  const capacity = sportCapacity(sport, format.perSide, fieldsCount);

  const selectSport = (key: SportKey) => {
    setSport(key);
    setFormatIdx(0);
    setVenue(SPORTS[key].venues ? SPORTS[key].venues![0] : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !startsAt) return;
    setLoading(true);
    setError(null);

    const { data: session, error: insertError } = await supabase
      .from("sessions")
      .insert({
        group_id: groupId,
        sport,
        format_label: format.label,
        per_side: format.perSide,
        venue,
        fields_count: fieldsCount,
        location: location.trim(),
        starts_at: new Date(startsAt).toISOString(),
        total_cost: totalCost ? parseFloat(totalCost) : 0,
        max_players: capacity,
        created_by: userId,
      })
      .select()
      .single();

    if (insertError || !session) {
      setError(insertError?.message ?? "Could not create session");
      setLoading(false);
      return;
    }

    // Fire-and-forget: notify the group by email. Not blocking the UI on
    // this means the person doesn't sit and wait for every email to send.
    fetch("/api/sessions/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id }),
    }).catch(() => {
      // Session was created either way; email failure shouldn't block them.
    });

    setOpen(false);
    setLoading(false);
    router.push(`/groups/${groupId}/sessions/${session.id}`);
    router.refresh();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-brand-500 hover:text-brand-600"
      >
        + Suggest a session
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="mb-4 font-semibold">Suggest a session</h3>

      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Sport
      </label>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.values(SPORTS).map((s) => (
          <button
            type="button"
            key={s.key}
            onClick={() => selectSport(s.key)}
            className={`flex flex-col items-center gap-1 rounded-lg border-2 py-3 text-xs font-semibold ${
              sport === s.key
                ? "border-brand-500 bg-brand-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="text-xl">{s.emoji}</span>
            {s.name}
          </button>
        ))}
      </div>

      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Format
      </label>
      <div className="mb-4 flex flex-wrap gap-2">
        {sportConfig.formats.map((f, i) => (
          <button
            type="button"
            key={f.label}
            onClick={() => setFormatIdx(i)}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold ${
              i === formatIdx
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {sportConfig.venues && (
        <>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Venue type
          </label>
          <div className="mb-4 flex flex-wrap gap-2">
            {sportConfig.venues.map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setVenue(v)}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold ${
                  venue === v
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </>
      )}

      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Number of fields / courts
      </label>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setFieldsCount((n) => Math.max(1, n - 1))}
          className="h-9 w-9 rounded-lg border border-slate-300 text-lg font-bold"
        >
          −
        </button>
        <span className="w-6 text-center text-lg font-bold">{fieldsCount}</span>
        <button
          type="button"
          onClick={() => setFieldsCount((n) => Math.min(6, n + 1))}
          className="h-9 w-9 rounded-lg border border-slate-300 text-lg font-bold"
        >
          +
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <input
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Total price ($)"
          value={totalCost}
          onChange={(e) => setTotalCost(e.target.value)}
        />
      </div>

      <label className="mb-1 block text-xs text-slate-500">Date & time</label>
      <input
        type="datetime-local"
        className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
        required
      />

      <div className="mb-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
        <b className="text-slate-700">
          {sportConfig.emoji} {sportConfig.name}
        </b>{" "}
        · {format.label}
        {venue && ` · ${venue}`} · {fieldsCount} {sportConfig.venues ? "court" : "field"}
        {fieldsCount > 1 ? "s" : ""}
        <br />
        Total capacity: <b>{capacity} players</b>. An email goes out to everyone in
        the group as soon as you post — they can tap Yes/No/Not sure right from the
        email.
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post session"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border border-slate-300 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
