"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SPORTS, type SportKey } from "@/lib/sports";

const LEVELS = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Casual" },
  { value: 3, label: "Solid" },
  { value: 4, label: "Advanced" },
  { value: 5, label: "Elite" },
];

export default function SkillLevelPrompt({
  userId,
  sport,
  onSaved,
}: {
  userId: string;
  sport: SportKey;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const sportConfig = SPORTS[sport];

  const save = async (level: number) => {
    setSaving(true);
    await supabase.from("player_skill_levels").upsert(
      { user_id: userId, sport, level },
      { onConflict: "user_id,sport" }
    );
    setSaving(false);
    onSaved();
  };

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-700">
        What's your {sportConfig.name.toLowerCase()} skill level?
      </h3>
      <p className="mb-3 text-xs text-slate-500">
        One-time — helps the organizer balance teams later. You can change it anytime
        in Settings.
      </p>
      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.value}
            type="button"
            disabled={saving}
            onClick={() => save(l.value)}
            className="rounded-full border-2 border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-500 disabled:opacity-50"
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
