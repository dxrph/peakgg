import type { SummitPassConfig } from "./types";

export const defaultSummitPass: SummitPassConfig = {
  permitNumber: "Nº 001",
  routeLabel: "EU — West Face",
  game: "Valorant",

  titleLine1: "Community",
  titleLine2: "Cup",
  titleAccent: "#1",
  description:
    "Free EU tournament for community teams, amateur players and rising 5-stacks. Single elimination — one night, one summit.",

  checkpoints: [
    { label: "Base camp", sub: "Register", done: true },
    { label: "Check-in", sub: "18:00", done: true },
    { label: "Bracket", sub: "BO1", done: false },
    { label: "Summit", sub: "Final", done: false },
  ],

  formLines: [
    { key: "Departure", value: "16 May 2026", valueSub: "19:00 CEST" },
    { key: "Party size", value: "5 climbers", valueSub: "per rope team" },
    { key: "Expedition", value: "16 teams", valueSub: "single elim" },
    { key: "Permit fee", value: "None — free ascent", valueColor: "green" },
  ],

  stamp: { line1: "Free entry", line2: "· Approved ·", show: true },

  countdownTarget: "2026-05-16T19:00:00+02:00",
  countdownLabel: "Window closes in",
  slotsFilled: 12,
  slotsTotal: 16,
  slotsLabel: "Rope teams",
  serial: "PGG-VAL-EU-260516-CC1",
  ctaText: "Claim your spot",
  ctaHoverText: "Tear here →",
  ctaHref: "#",

  altitudeLines: [
    { elo: 1000, rank: "RIVAL" },
    { elo: 1400, rank: "EXPERT" },
    { elo: 2000, rank: "ELITE", hot: true },
    { elo: 2400, rank: "MASTER" },
  ],
};