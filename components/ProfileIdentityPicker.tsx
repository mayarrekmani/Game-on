"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";

const SHAPES: { key: "circle" | "square" | "hex" | "shield"; label: string }[] = [
  { key: "circle", label: "Circle" },
  { key: "square", label: "Square" },
  { key: "hex", label: "Hexagon" },
  { key: "shield", label: "Shield" },
];
const COLORS = ["#d9531e", "#1b2838", "#2f855a", "#7a4f9e", "#2569c9", "#b84316"];
const ICONS = ["⚡", "🔥", "⭐", "🎯", "🦁", "🐺", "🚀", "🏆", "🌊", "🍀", "👑", "🦅"];

export type ProfileIdentity = {
  displayName: string;
  shape: "circle" | "square" | "hex" | "shield";
  color: string;
  icon: string | null;
  photoDataUrl: string | null;
};

export default function ProfileIdentityPicker({
  initial,
  onChange,
}: {
  initial: ProfileIdentity;
  onChange: (state: ProfileIdentity) => void;
}) {
  const [state, setState] = useState<ProfileIdentity>(initial);
  const [fileName, setFileName] = useState<string | null>(null);

  const update = (patch: Partial<ProfileIdentity>) => {
    const merged = { ...state, ...patch };
    setState(merged);
    onChange(merged);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => update({ photoDataUrl: ev.target?.result as string, icon: null });
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Username
      </label>
      <input
        className="mb-6 w-full rounded border border-slate-300 px-3 py-2.5 text-sm"
        placeholder="e.g. paulak"
        value={state.displayName}
        onChange={(e) => update({ displayName: e.target.value })}
        required
      />

      <div className="mb-6 flex items-center gap-5">
        <Avatar
          shape={state.shape}
          color={state.color}
          icon={state.icon}
          photoUrl={state.photoDataUrl}
          name={state.displayName}
          size="lg"
        />
        <div className="flex-1">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Shape
          </span>
          <div className="mb-3 flex flex-wrap gap-2">
            {SHAPES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => update({ shape: s.key })}
                title={s.label}
                className={`h-9 w-9 border-2 bg-slate-100 ${
                  state.shape === s.key ? "border-brand-500" : "border-slate-200"
                } ${
                  s.key === "circle"
                    ? "rounded-full"
                    : s.key === "square"
                    ? "rounded-lg"
                    : s.key === "hex"
                    ? "[clip-path:polygon(25%_6%,75%_6%,100%_50%,75%_94%,25%_94%,0%_50%)]"
                    : "[clip-path:polygon(50%_0%,100%_20%,100%_60%,50%_100%,0%_60%,0%_20%)]"
                }`}
              />
            ))}
          </div>

          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Color
          </span>
          <div className="mb-3 flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update({ color: c })}
                className={`h-6 w-6 rounded-full border-2 ${
                  state.color === c ? "border-slate-800" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Icon
      </span>
      <div className="mb-4 flex flex-wrap gap-2">
        {ICONS.map((ic) => (
          <button
            key={ic}
            type="button"
            onClick={() => update({ icon: ic, photoDataUrl: null })}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 text-base ${
              state.icon === ic && !state.photoDataUrl
                ? "border-brand-500 bg-white"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            {ic}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label className="cursor-pointer text-xs font-semibold text-brand-700 underline">
          📷 Or upload a photo
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </label>
        {fileName && <span className="text-xs text-slate-400">{fileName}</span>}
      </div>
    </div>
  );
}
