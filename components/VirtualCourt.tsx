"use client";

import { type SportKey } from "@/lib/sports";
import Avatar from "@/components/Avatar";

type Player = {
  userId: string;
  name: string;
  shape: string;
  color: string;
  icon: string | null;
  photoUrl: string | null;
  paid: boolean;
};

export default function VirtualCourt({
  sport,
  perSide,
  confirmed,
  trackPayment,
  canTogglePaid,
  onTogglePaid,
}: {
  sport: SportKey;
  perSide: number;
  confirmed: Player[];
  trackPayment: boolean;
  canTogglePaid: boolean;
  onTogglePaid?: (userId: string) => void;
}) {
  const sideA = confirmed.slice(0, perSide);
  const sideB = confirmed.slice(perSide, perSide * 2);

  const renderSlots = (players: Player[]) =>
    Array.from({ length: perSide }).map((_, i) => {
      const p = players[i];
      if (!p) {
        return (
          <div
            key={i}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-black/20 bg-white/30 text-xs text-transparent"
          />
        );
      }
      const ringColor = !trackPayment ? undefined : p.paid ? "#22c55e" : "#ef4444";
      return (
        <button
          key={p.userId}
          type="button"
          title={
            trackPayment
              ? `${p.name} — ${p.paid ? "paid" : "not paid yet"}${canTogglePaid ? " (click to toggle)" : ""}`
              : p.name
          }
          onClick={() => canTogglePaid && onTogglePaid?.(p.userId)}
          disabled={!canTogglePaid}
          className={canTogglePaid ? "cursor-pointer" : "cursor-default"}
        >
          <Avatar
            shape={p.shape}
            color={p.color}
            icon={p.icon}
            photoUrl={p.photoUrl}
            name={p.name}
            size="sm"
            ringColor={ringColor}
          />
        </button>
      );
    });

  // ---------- Volleyball: sand/gym court, net across the middle, attack lines ----------
  if (sport === "volleyball") {
    return (
      <div className="overflow-hidden rounded-lg border-2 border-black/10 bg-[#f4dfa8]">
        <div className="relative border-b-[3px] border-white/90 p-3 pb-5">
          <div className="pointer-events-none absolute inset-x-4 bottom-2 border-t border-dashed border-black/25" />
          <div className="flex flex-wrap justify-center gap-2">{renderSlots(sideA)}</div>
        </div>
        <div className="relative p-3 pt-5">
          <div className="pointer-events-none absolute inset-x-4 top-2 border-t border-dashed border-black/25" />
          <div className="flex flex-wrap justify-center gap-2">{renderSlots(sideB)}</div>
        </div>
      </div>
    );
  }

  // ---------- Soccer: pitch, halfway line + center circle, penalty boxes at each end ----------
  if (sport === "soccer") {
    return (
      <div className="relative flex overflow-hidden rounded-lg border-2 border-white/90 bg-[#4c9a5f]">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/80" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80" />
        <div className="pointer-events-none absolute left-0 top-1/2 h-24 w-10 -translate-y-1/2 border-2 border-l-0 border-white/70" />
        <div className="pointer-events-none absolute right-0 top-1/2 h-24 w-10 -translate-y-1/2 border-2 border-r-0 border-white/70" />
        <div className="relative flex flex-1 flex-wrap content-center justify-center gap-2 p-3 pl-12">
          {renderSlots(sideA)}
        </div>
        <div className="relative flex flex-1 flex-wrap content-center justify-center gap-2 p-3 pr-12">
          {renderSlots(sideB)}
        </div>
      </div>
    );
  }

  // ---------- Basketball: hardwood, center circle, key/paint at each end ----------
  if (sport === "basketball") {
    return (
      <div className="relative flex overflow-hidden rounded-lg border-2 border-white/90 bg-[#dba86a]">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/70" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
        <div className="pointer-events-none absolute left-0 top-1/2 h-20 w-14 -translate-y-1/2 border-2 border-l-0 border-white/60" />
        <div className="pointer-events-none absolute right-0 top-1/2 h-20 w-14 -translate-y-1/2 border-2 border-r-0 border-white/60" />
        <div className="pointer-events-none absolute left-14 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-2 border-white/50" />
        <div className="pointer-events-none absolute right-14 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-2 border-white/50" />
        <div className="relative flex flex-1 flex-wrap content-center justify-center gap-2 p-3 pl-16">
          {renderSlots(sideA)}
        </div>
        <div className="relative flex flex-1 flex-wrap content-center justify-center gap-2 p-3 pr-16">
          {renderSlots(sideB)}
        </div>
      </div>
    );
  }

  // ---------- Flag football: turf, yard lines, end zones ----------
  return (
    <div className="relative flex overflow-hidden rounded-lg border-2 border-white/90 bg-[#4c9a5f]">
      <div
        className="pointer-events-none absolute inset-y-0 left-8 right-8"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 2px, transparent 2px 30px)",
        }}
      />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-[#3d7a4c]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-[#3d7a4c]" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/80" />
      <div className="relative flex flex-1 flex-wrap content-center justify-center gap-2 p-3 pl-10">
        {renderSlots(sideA)}
      </div>
      <div className="relative flex flex-1 flex-wrap content-center justify-center gap-2 p-3 pr-10">
        {renderSlots(sideB)}
      </div>
    </div>
  );
}
