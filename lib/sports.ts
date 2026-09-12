export type SportKey = "volleyball" | "soccer" | "basketball" | "football";

export type SportFormat = {
  label: string; // e.g. "6v6"
  perSide: number;
};

export type SportConfig = {
  key: SportKey;
  name: string;
  emoji: string;
  formats: SportFormat[];
  venues: string[] | null; // e.g. ["Beach", "Gym"] for volleyball, null otherwise
};

export const SPORTS: Record<SportKey, SportConfig> = {
  volleyball: {
    key: "volleyball",
    name: "Volleyball",
    emoji: "🏐",
    formats: [{ label: "6v6", perSide: 6 }],
    venues: ["Beach", "Gym"],
  },
  soccer: {
    key: "soccer",
    name: "Soccer",
    emoji: "⚽",
    formats: [
      { label: "7v7", perSide: 7 },
      { label: "11v11", perSide: 11 },
    ],
    venues: null,
  },
  basketball: {
    key: "basketball",
    name: "Basketball",
    emoji: "🏀",
    formats: [{ label: "5v5", perSide: 5 }],
    venues: null,
  },
  football: {
    key: "football",
    name: "Flag Football",
    emoji: "🏈",
    formats: [
      { label: "7v7", perSide: 7 },
      { label: "11v11", perSide: 11 },
    ],
    venues: null,
  },
};

export function sportCapacity(sport: SportKey, perSide: number, fieldsCount: number) {
  return perSide * 2 * fieldsCount;
}
