"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SPORTS, type SportKey } from "@/lib/sports";

export default function EditSessionForm({
  groupId,
  session,
}: {
  groupId: string;
  session: {
    id: string;
    sport: SportKey;
    format_label: string;
    venue: string | null;
    fields_count: number;
    location: string;
    starts_at: string;
    total_cost: number;
  };
}) {
  const sportConfig = SPORTS[session.sport];
  const [location, setLocation] = useState(session.location);
  const [venue, setVenue] = useState<string | null>(session.venue);
  const [fieldsCount, setFieldsCount] = useState(session.fields_count);
  const [totalCost, setTotalCost] = useState(String(session.total_cost ?? 0));
  const [startsAt, setStartsAt] = useState(
    new Date(session.starts_at).toISOString().slice(0, 16)
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !startsAt) return;
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        location: location.trim(),
        venue,
        fields_count: fieldsCount,
        starts_at: new Date(startsAt).toISOString(),
        total_cost: totalCost ? parseFloat(totalCost) : 0,
      })
      .eq("id", session.id);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push(`/groups/${groupId}/sessions/${session.id}`);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this session? This can't be undone and removes everyone's RSVPs too.")) {
      return;
    }
    setDeleting(true);
    setError(null);

    const { error: deleteError } = await supabase.from("sessions").delete().eq("id", session.id);

    setDeleting(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    router.push(`/groups/${groupId}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        {sportConfig.emoji} {sportConfig.name} · {session.format_label} — locked after creation
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
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </>
      )}

      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Number of {sportConfig.venues ? "courts" : "fields"}
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
        <div>
          <label className="mb-1 block text-xs text-slate-500">Location</label>
          <input
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Total price ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
          />
        </div>
      </div>

      <label className="mb-1 block text-xs text-slate-500">Date & time</label>
      <input
        type="datetime-local"
        className="mb-6 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
        required
      />

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="mb-3 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="w-full rounded border-2 border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete this session"}
      </button>
    </form>
  );
}
