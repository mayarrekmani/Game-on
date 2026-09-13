"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatarImage } from "@/lib/uploadImage";

const ICONS = ["🏆", "⚽", "🏀", "🏐", "🏈", "🔥", "⚡", "🎯", "🦁", "🚀"];
const COLORS = ["#d9531e", "#2f855a", "#2569c9", "#7a4f9e", "#1b2838", "#b84316"];

export default function GroupIconPicker({
  initialIcon = "🏆",
  initialColor = "#d9531e",
  onChange,
}: {
  initialIcon?: string;
  initialColor?: string;
  onChange: (state: { icon: string; color: string; photoDataUrl: string | null }) => void;
}) {
  const [icon, setIcon] = useState(initialIcon);
  const [color, setColor] = useState(initialColor);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const update = (next: Partial<{ icon: string; color: string; photoDataUrl: string | null }>) => {
    const merged = { icon, color, photoDataUrl, ...next };
    setIcon(merged.icon);
    setColor(merged.color);
    setPhotoDataUrl(merged.photoDataUrl);
    onChange(merged);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    try {
      const url = await uploadAvatarImage(supabase, file, "groups");
      update({ photoDataUrl: url });
    } catch {
      setFileName("Upload failed — try again");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <div
        className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-cover bg-center text-2xl text-white"
        style={{
          background: photoDataUrl ? undefined : color,
          backgroundImage: photoDataUrl ? `url(${photoDataUrl})` : undefined,
        }}
      >
        {!photoDataUrl && icon}
      </div>

      <div className="flex-1">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Icon
        </span>
        <div className="mb-3 flex flex-wrap gap-2">
          {ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => update({ icon: ic, photoDataUrl: null })}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 text-base ${
                icon === ic && !photoDataUrl
                  ? "border-brand-500 bg-white"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              {ic}
            </button>
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
                color === c ? "border-slate-800" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer text-xs font-semibold text-brand-700 underline">
            📷 Or upload an image
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
          </label>
          {uploading && <span className="text-xs text-slate-400">Uploading...</span>}
          {!uploading && fileName && <span className="text-xs text-slate-400">{fileName}</span>}
        </div>
      </div>
    </div>
  );
}
