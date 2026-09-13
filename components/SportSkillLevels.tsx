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

export default function SportSkillLevels({
  userId,
  initialLevels,
}: {
  userId: string;
  initialLevels: Record<string, number>;
}) {
  const [levels, setLevels] = useState<Record<string, number | undefined>>(initialLevels);
  const [saved, setSaved] = useState<string | null>(null);
  const supabase = createClient();

  const setLevel = async (sport: SportKey, level: number) => {
    setLevels((prev) => ({ ...prev, [sport]: level }));
    await supabase
      .from("player_skill_levels")
      .upsert({ user_id: userId, sport, level }, { onConflict: "user_id,sport" });
    setSaved(sport);
    setTimeout(() => setSaved(null), 1500);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-1 font-serif text-lg font-bold">Skill levels</h2>
      <p className="mb-5 text-sm text-slate-500">
        Used to auto-balance teams. Set once per sport — change it anytime here.
      </p>
      <div className="space-y-4">
        {Object.values(SPORTS).map((sportConfig) => (
          <div key={sportConfig.key}>
            <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
              <span>{sportConfig.emoji}</span>
              {sportConfig.name}
              {saved === sportConfig.key && (
                <span className="text-xs font-normal text-green-600">Saved!</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(sportConfig.key, l.value)}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-semibold ${
                    levels[sportConfig.key] === l.value
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
