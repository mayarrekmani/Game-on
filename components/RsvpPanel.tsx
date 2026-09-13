"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import VirtualCourt from "@/components/VirtualCourt";
import Avatar from "@/components/Avatar";
import SkillLevelPrompt from "@/components/SkillLevelPrompt";
import { SPORTS, type SportKey } from "@/lib/sports";

type RsvpStatus = "in" | "out" | "maybe";

type RsvpRow = {
  user_id: string;
  status: RsvpStatus;
  paid: boolean;
  team: "A" | "B" | null;
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
  const [needsSkillLevel, setNeedsSkillLevel] = useState(false);
  const [balancing, setBalancing] = useState(false);
  const [skillLevels, setSkillLevels] = useState<Map<string, number>>(new Map());
  const supabase = createClient();
  const isCreator = userId === createdBy;

  // Check once whether the current user has already set a skill level
  // for this sport — if not, and they're confirmed "in", prompt them.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("player_skill_levels")
        .select("level")
        .eq("user_id", userId)
        .eq("sport", sport)
        .maybeSingle();
      if (!cancelled) setNeedsSkillLevel(!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, sport, supabase]);

  const refetchRsvps = async () => {
    const { data } = await supabase
      .from("rsvps")
      .select(
        "user_id, status, paid, team, profiles(display_name, avatar_shape, avatar_color, avatar_icon, avatar_url)"
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
      return [...prev, { user_id: userId, status, paid: false, team: null, profiles: myProfile }];
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
    team: r.team,
  });

  const yesList = rsvps.filter((r) => r.status === "in").map(toPlayer);
  const maybeList = rsvps.filter((r) => r.status === "maybe").map(toPlayer);
  const noList = rsvps.filter((r) => r.status === "out").map(toPlayer);

  const capacityPerField = perSide * 2;
  const totalCapacity = capacityPerField * fieldsCount;
  const isOverCapacity = yesList.length > totalCapacity;
  const confirmed = yesList.slice(0, totalCapacity);
  const extra = yesList.slice(totalCapacity);

  // If the creator has manually assigned teams, use that to decide who
  // shows up on which side of the court; anyone left unassigned just
  // fills whatever's left, same as before this feature existed.
  const courtOrder = [
    ...confirmed.filter((p) => p.team === "A"),
    ...confirmed.filter((p) => p.team === "B"),
    ...confirmed.filter((p) => !p.team),
  ];
  const hasManualTeams = confirmed.some((p) => p.team);

  const confirmedIdsKey = confirmed.map((p) => p.userId).sort().join(",");
  useEffect(() => {
    if (!isCreator || confirmed.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("player_skill_levels")
        .select("user_id, level")
        .eq("sport", sport)
        .in(
          "user_id",
          confirmed.map((p) => p.userId)
        );
      if (!cancelled) {
        setSkillLevels(new Map((data ?? []).map((l: any) => [l.user_id, l.level])));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmedIdsKey, isCreator, sport, supabase]);

  const assignTeam = async (targetUserId: string, team: "A" | "B" | null) => {
    if (!isCreator) return;
    setRsvps((prev) =>
      prev.map((r) => (r.user_id === targetUserId ? { ...r, team } : r))
    );
    await supabase
      .from("rsvps")
      .update({ team })
      .eq("session_id", sessionId)
      .eq("user_id", targetUserId);
  };

  const autoBalanceTeams = async () => {
    if (!isCreator || confirmed.length === 0) return;
    setBalancing(true);

    const confirmedIds = confirmed.map((p) => p.userId);
    const { data: levels } = await supabase
      .from("player_skill_levels")
      .select("user_id, level")
      .eq("sport", sport)
      .in("user_id", confirmedIds);

    const levelByUser = new Map((levels ?? []).map((l: any) => [l.user_id, l.level]));

    // Greedy balance: strongest players first, each one goes to whichever
    // team currently has the lower total skill — while respecting the
    // per-side capacity so team sizes stay even.
    const sorted = [...confirmed].sort(
      (a, b) => (levelByUser.get(b.userId) ?? 3) - (levelByUser.get(a.userId) ?? 3)
    );
    let sumA = 0;
    let sumB = 0;
    let countA = 0;
    let countB = 0;
    const assignments: { userId: string; team: "A" | "B" }[] = [];

    sorted.forEach((p) => {
      const level = levelByUser.get(p.userId) ?? 3;
      const canA = countA < perSide * fieldsCount;
      const canB = countB < perSide * fieldsCount;
      let team: "A" | "B";
      if (canA && canB) {
        team = sumA <= sumB ? "A" : "B";
      } else if (canA) {
        team = "A";
      } else {
        team = "B";
      }
      assignments.push({ userId: p.userId, team });
      if (team === "A") {
        sumA += level;
        countA += 1;
      } else {
        sumB += level;
        countB += 1;
      }
    });

    setRsvps((prev) =>
      prev.map((r) => {
        const match = assignments.find((a) => a.userId === r.user_id);
        return match ? { ...r, team: match.team } : r;
      })
    );

    await Promise.all(
      assignments.map((a) =>
        supabase
          .from("rsvps")
          .update({ team: a.team })
          .eq("session_id", sessionId)
          .eq("user_id", a.userId)
      )
    );

    setBalancing(false);
  };

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

      {myRsvp === "in" && needsSkillLevel && (
        <SkillLevelPrompt
          userId={userId}
          sport={sport}
          onSaved={() => setNeedsSkillLevel(false)}
        />
      )}

      {isCreator && isOverCapacity && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <b>{yesList.length} people said yes</b>, but you only booked space for{" "}
          {totalCapacity}. Worth booking another {sportConfig.venues ? "court" : "field"}?
        </div>
      )}

      {isCreator && confirmed.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500">Assign teams</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={autoBalanceTeams}
                disabled={balancing}
                className="text-xs font-semibold text-brand-700 underline disabled:opacity-50"
              >
                {balancing ? "Balancing..." : "⚖️ Auto-balance by skill"}
              </button>
              {hasManualTeams && (
                <button
                  type="button"
                  onClick={() => confirmed.forEach((p) => assignTeam(p.userId, null))}
                  className="text-xs text-slate-400 underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <p className="mb-3 text-xs text-slate-400">
            Optional — tap A or B for anyone you want on a specific side. Everyone
            else fills in around them.
          </p>
          <div className="space-y-1.5">
            {confirmed.map((p) => (
              <div key={p.userId} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm">
                  <Avatar
                    shape={p.shape}
                    color={p.color}
                    icon={p.icon}
                    photoUrl={p.photoUrl}
                    name={p.name}
                    size="xs"
                  />
                  {p.name}
                  {skillLevels.has(p.userId) && (
                    <span className="text-xs text-slate-400">
                      · {"★".repeat(skillLevels.get(p.userId)!)}
                    </span>
                  )}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => assignTeam(p.userId, p.team === "A" ? null : "A")}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                      p.team === "A"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => assignTeam(p.userId, p.team === "B" ? null : "B")}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                      p.team === "B"
                        ? "bg-orange-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    B
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              confirmed={courtOrder.slice(
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
