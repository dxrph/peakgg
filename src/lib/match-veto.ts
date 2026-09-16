export type VetoMode = "admin_manual" | "random" | "bo1_veto" | "bo3_veto";

export type VetoLogEntry = {
  action: string;
  map?: string;
  by?: string;
  at?: string;
};

export const VETO_MODE_LABEL: Record<string, string> = {
  admin_manual: "Admin Manual",
  random: "Random",
  bo1_veto: "Captain Veto (BO1)",
  bo3_veto: "Captain Veto (BO3)",
};

export function nextBo1Step(banned: string[], activePool: string[]) {
  const remaining = activePool.filter((m) => !banned.includes(m));
  return { remaining, isFinal: remaining.length === 1 };
}

/** Returns the next required action description for BO3 veto */
export function nextBo3Action(banned: string[], picked: string[]) {
  const total = banned.length + picked.length;
  // 0 ban A, 1 ban B, 2 pick A (game1), 3 pick B (game2), 4 ban A, 5 ban B, 6 decider
  switch (total) {
    case 0:
    case 1:
      return { type: "ban" as const, label: "Ban a map" };
    case 2:
    case 3:
      return { type: "pick" as const, label: "Pick your map" };
    case 4:
    case 5:
      return { type: "ban" as const, label: "Ban a map" };
    default:
      return { type: "decider" as const, label: "Decider — remaining map" };
  }
}
