"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import VirtualCourt from "@/components/VirtualCourt";
import Avatar from "@/components/Avatar";
import { SPORTS, type SportKey } from "@/lib/sports";

type RsvpStatus = "in" | "out" | "maybe";

type RsvpRow = {
  user_id: string;
  status: RsvpStatus;
  paid: boolean;
  profiles: {
    display_name: string | null;
    avatar_shape: string | null;
    avatar_color: string | null;
    avatar_icon: string | null;
    avatar_url: string | null;
  } | null;
};

export default function RsvpPanel({
  sessionId,
  userId,
  createdBy,
  sport,
  perSide,
  fieldsCount,
  totalCost,
  initialRsvps,
}: {
  sessionId: string;
  userId: string;
  createdBy: string;
  sport: SportKey;
  perSide: number;
  fieldsCount: number;
  totalCost: number;
  initialRsvps: RsvpRow[];
}) {
  const [rsvps, setRsvps] = useState<RsvpRow[]>(initialRsvps);
  const [updating, setUpdating] = useState(false);
  const supabase = createClient();
  const isCreator = userId === createdBy;

  const refetchRsvps = async () => {
    const { data } = await supabase
      .from("rsvps")
      .select(
        "user_id, status, paid, profiles(display_name, avatar_shape, avatar_color, avatar_icon, avatar_url)"
      )
      .eq("session_id", sessionId);
    if (data) setRsvps(data as unknown as RsvpRow[]);
  };

  useEffect(() => {
    const channel = supabase
      .channel(`rsvps:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rsvps",
          filter: `session_id=eq.${sessionId}`,
        },
        () => refetchRsvps()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  // Same reliability fallback as chat — refetch whenever the tab/app
  // regains focus, since realtime connections can drop silently.
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === "visible") refetchRsvps();
    };
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, [sessionId, supabase]);

  const myRsvp = rsvps.find((r) => r.user_id === userId)?.status;

  const setStatus = async (status: RsvpStatus) => {
    setUpdating(true);

    // Optimistic update so the button highlights instantly instead of
    // waiting for the realtime echo.
    setRsvps((prev) => {
      const exists = prev.some((r) => r.user_id === userId);
      const myProfile = prev.find((r) => r.user_id === userId)?.profiles ?? null;
      if (exists) {
        return prev.map((r) => (r.user_id === userId ? { ...r, status } : r));
      }
      return [...prev, { user_id: userId, status, paid: false, profiles: myProfile }];
    });

    await supabase
      .from("rsvps")
      .upsert(
        { session_id: sessionId, user_id: userId, status },
        { onConflict: "session_id,user_id" }
      );
    setUpdating(false);

    // Let the creator know if this "yes" just pushed the group past what
    // they booked space for — fire-and-forget, doesn't block the RSVP.
    if (status === "in") {
      fetch("/api/sessions/check-overflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    }
  };

  const togglePaid = async (targetUserId: string) => {
    if (!isCreator) return;
    const target = rsvps.find((r) => r.user_id === targetUserId);
    if (!target) return;
    const newPaid = !target.paid;

    // Update the screen immediately instead of waiting for the realtime
    // round-trip to echo the change back — makes it feel instant. If the
    // save fails, flip it back.
    setRsvps((prev) =>
      prev.map((r) => (r.user_id === targetUserId ? { ...r, paid: newPaid } : r))
    );

    const { error } = await supabase
      .from("rsvps")
      .update({ paid: newPaid })
      .eq("session_id", sessionId)
      .eq("user_id", targetUserId);

    if (error) {
      setRsvps((prev) =>
        prev.map((r) => (r.user_id === targetUserId ? { ...r, paid: !newPaid } : r))
      );
    }
  };

  const toPlayer = (r: RsvpRow) => ({
    userId: r.user_id,
    name: r.profiles?.display_name ?? "Player",
    shape: r.profiles?.avatar_shape ?? "circle",
    color: r.profiles?.avatar_color ?? "#d9531e",
    icon: r.profiles?.avatar_icon ?? null,
    photoUrl: r.profiles?.avatar_url ?? null,
    paid: r.paid,
  });

  const yesList = rsvps.filter((r) => r.status === "in").map(toPlayer);
  const maybeList = rsvps.filter((r) => r.status === "maybe").map(toPlayer);
  const noList = rsvps.filter((r) => r.status === "out").map(toPlayer);

  const capacityPerField = perSide * 2;
  const totalCapacity = capacityPerField * fieldsCount;
  const isOverCapacity = yesList.length > totalCapacity;
  const confirmed = yesList.slice(0, totalCapacity);
  const extra = yesList.slice(totalCapacity);

  const trackPayment = totalCost > 0;
  const costPerPerson =
    yesList.length > 0 && totalCost > 0 ? totalCost / yesList.length : 0;

  const sportConfig = SPORTS[sport];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 grid grid-cols-3 gap-2">
          <RsvpButton
            label="Yes, I'm in"
            active={myRsvp === "in"}
            disabled={updating}
            onClick={() => setStatus("in")}
            variant="in"
          />
          <RsvpButton
            label="Not sure"
            active={myRsvp === "maybe"}
            disabled={updating}
            onClick={() => setStatus("maybe")}
            variant="maybe"
          />
          <RsvpButton
            label="Can't make it"
            active={myRsvp === "out"}
            disabled={updating}
            onClick={() => setStatus("out")}
            variant="out"
          />
        </div>

        {trackPayment && myRsvp === "in" && (
          <div className="rounded-lg bg-brand-50 p-4 text-center">
            <div className="text-sm text-slate-600">Your share</div>
            <div className="text-2xl font-bold text-brand-700">
              ${costPerPerson.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500">
              ${totalCost} total ÷ {yesList.length} confirmed · pay the organizer
              directly, they'll mark you paid
            </div>
          </div>
        )}
        {trackPayment && myRsvp !== "in" && (
          <div className="rounded-lg bg-slate-50 p-3 text-center text-sm text-slate-500">
            Cost per person will be ${costPerPerson > 0 ? costPerPerson.toFixed(2) : "—"}{" "}
            once you're in
          </div>
        )}
      </div>

      {isCreator && isOverCapacity && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <b>{yesList.length} people said yes</b>, but you only booked space for{" "}
          {totalCapacity}. Worth booking another {sportConfig.venues ? "court" : "field"}?
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-500">
            Virtual {sportConfig.venues ? "court" : "field"}
          </h3>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              isOverCapacity
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {yesList.length}/{totalCapacity}
          </span>
        </div>
        {trackPayment && (
          <p className="mb-2 text-xs text-slate-400">
            Red ring = not paid yet · Green ring = paid
            {isCreator ? " · tap anyone to toggle" : ""}
          </p>
        )}
        {Array.from({ length: fieldsCount }).map((_, fieldIdx) => (
          <div key={fieldIdx} className="mb-3">
            {fieldsCount > 1 && (
              <div className="mb-1 text-xs font-medium text-slate-400">
                {sportConfig.venues ? "Court" : "Field"} {fieldIdx + 1}
              </div>
            )}
            <VirtualCourt
              sport={sport}
              perSide={perSide}
              confirmed={confirmed.slice(
                fieldIdx * capacityPerField,
                (fieldIdx + 1) * capacityPerField
              )}
              trackPayment={trackPayment}
              canTogglePaid={isCreator}
              onTogglePaid={togglePaid}
            />
          </div>
        ))}
      </div>

      {extra.length > 0 && (
        <RsvpList
          title={`Extra confirmed (${extra.length}) — beyond booked capacity`}
          players={extra}
          trackPayment={trackPayment}
          isCreator={isCreator}
          onTogglePaid={togglePaid}
        />
      )}
      {maybeList.length > 0 && (
        <RsvpList title={`Not sure (${maybeList.length})`} players={maybeList} />
      )}
      {noList.length > 0 && (
        <RsvpList title={`Can't make it (${noList.length})`} players={noList} />
      )}

      {/* Simple plain-text summary of everyone who said yes, regardless of
          court capacity — separate from the fancier lists above. */}
      <div className="border-t border-slate-200 pt-4">
        <h3 className="mb-1 text-sm font-semibold text-slate-500">
          Who&apos;s going ({yesList.length})
        </h3>
        <p className="text-sm text-slate-700">
          {yesList.length > 0 ? yesList.map((p) => p.name).join(", ") : "No one yet"}
        </p>
      </div>
    </div>
  );
}

function RsvpButton({
  label,
  active,
  disabled,
  onClick,
  variant,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  variant: "in" | "maybe" | "out";
}) {
  const colors = {
    in: active
      ? "bg-green-600 text-white border-green-600"
      : "border-green-300 text-green-700 hover:bg-green-50",
    maybe: active
      ? "bg-amber-500 text-white border-amber-500"
      : "border-amber-300 text-amber-700 hover:bg-amber-50",
    out: active
      ? "bg-slate-600 text-white border-slate-600"
      : "border-slate-300 text-slate-600 hover:bg-slate-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border-2 py-3 text-sm font-medium transition disabled:opacity-50 ${colors[variant]}`}
    >
      {label}
    </button>
  );
}

function RsvpList({
  title,
  players,
  trackPayment = false,
  isCreator = false,
  onTogglePaid,
}: {
  title: string;
  players: {
    userId: string;
    name: string;
    shape: string;
    color: string;
    icon: string | null;
    photoUrl: string | null;
    paid: boolean;
  }[];
  trackPayment?: boolean;
  isCreator?: boolean;
  onTogglePaid?: (userId: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-500">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <button
            key={p.userId}
            type="button"
            onClick={() => isCreator && onTogglePaid?.(p.userId)}
            disabled={!isCreator}
            className={`flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-sm ${
              isCreator ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <Avatar
              shape={p.shape}
              color={p.color}
              icon={p.icon}
              photoUrl={p.photoUrl}
              name={p.name}
              size="xs"
              ringColor={trackPayment ? (p.paid ? "#22c55e" : "#ef4444") : undefined}
            />
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
