import type { SummitPassConfig, SummitPassCheckpoint, SummitPassFormLine } from "./types";
import { defaultSummitPass } from "./config";

export type TournamentRow = {
  id: string;
  slug: string | null;
  name: string;
  game: string | null;
  status: string | null;
  short_description: string | null;
  description: string | null;
  start_date: string | null;
  registration_close_at?: string | null;
  max_teams: number | null;
  team_size: string | null;
  format: string | null;
  entry_cost_coins: number | null;
  // Optional summit-pass overrides
  route_label?: string | null;
  permit_number?: string | null;
  serial?: string | null;
  stamp_line1?: string | null;
  stamp_line2?: string | null;
  show_stamp?: boolean | null;
  summit_accent?: string | null;
};

function pad2(n: number) { return String(n).padStart(2, "0"); }

function formatDateLabel(iso: string | null | undefined) {
  if (!iso) return "Date TBA";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return "Date TBA"; }
}

function formatTimeLabel(iso: string | null | undefined) {
  if (!iso) return undefined;
  try {
    return (
      new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels",
      }) + " CEST"
    );
  } catch { return undefined; }
}

function makeSerial(t: TournamentRow) {
  const game = (t.game ?? "GG").toUpperCase().slice(0, 3);
  const region = "EU";
  const d = t.start_date ? new Date(t.start_date) : new Date();
  const yy = String(d.getUTCFullYear()).slice(-2);
  const ymd = `${yy}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
  const code = (t.slug ?? t.id.slice(0, 6)).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return `PGG-${game}-${region}-${ymd}-${code || "EVT"}`;
}

function partySize(team_size: string | null) {
  if (!team_size) return "Players";
  // "5v5" → 5
  const n = parseInt(team_size, 10);
  return Number.isFinite(n) && n > 0 ? `${n} climbers` : team_size;
}

export function tournamentToSummitPass(
  t: TournamentRow,
  registeredTeamsCount: number = 0,
): Partial<SummitPassConfig> {
  const countdownTarget = t.registration_close_at ?? t.start_date ?? defaultSummitPass.countdownTarget;
  const dateLabel = formatDateLabel(t.start_date);
  const timeLabel = formatTimeLabel(t.start_date);
  const fee = (t.entry_cost_coins ?? 0) > 0
    ? `${t.entry_cost_coins} coins`
    : "None — free ascent";

  const formLines: SummitPassFormLine[] = [
    { key: "Departure", value: dateLabel, valueSub: timeLabel },
    { key: "Party size", value: partySize(t.team_size), valueSub: "per rope team" },
    {
      key: "Expedition",
      value: t.max_teams ? `${t.max_teams} teams` : "Open roster",
      valueSub: t.format ?? "single elim",
    },
    {
      key: "Permit fee",
      value: fee,
      valueColor: (t.entry_cost_coins ?? 0) > 0 ? "default" : "green",
    },
  ];

  const checkpoints: SummitPassCheckpoint[] = defaultSummitPass.checkpoints;

  const isCompleted = (t.status ?? "").toLowerCase() === "completed";

  return {
    permitNumber: t.permit_number ?? defaultSummitPass.permitNumber,
    routeLabel: t.route_label ?? "EU — Open Face",
    game: t.game ? t.game.charAt(0).toUpperCase() + t.game.slice(1) : "Valorant",
    titleLine1: t.name?.split(" ").slice(0, -1).join(" ") || t.name || "Tournament",
    titleLine2: t.name?.split(" ").slice(-1).join(" ") || "",
    titleAccent: t.summit_accent ?? "",
    description:
      t.short_description ?? t.description ?? defaultSummitPass.description,
    checkpoints,
    formLines,
    stamp: {
      line1: isCompleted ? "Summited" : (t.stamp_line1 ?? "Free entry"),
      line2: t.stamp_line2 ?? "· Approved ·",
      show: t.show_stamp ?? true,
    },
    countdownTarget,
    countdownLabel: "Window closes in",
    slotsFilled: Math.min(registeredTeamsCount, t.max_teams ?? registeredTeamsCount),
    slotsTotal: t.max_teams ?? defaultSummitPass.slotsTotal,
    slotsLabel: "Rope teams",
    slotsWarning:
      t.max_teams && registeredTeamsCount >= t.max_teams
        ? "Window full — waitlist only"
        : undefined,
    serial: t.serial ?? makeSerial(t),
    ctaText: "Claim your spot",
    ctaHoverText: "Tear here →",
    ctaHref: `/tournaments/${t.slug ?? t.id}`,
  };
}