export interface SummitPassCheckpoint {
  label: string;
  sub: string;
  done: boolean;
}

export interface SummitPassFormLine {
  key: string;
  value: string;
  valueSub?: string;
  valueColor?: "default" | "green";
}

export interface SummitPassAltitudeLine {
  elo: number;
  rank: string;
  hot?: boolean;
}

export interface SummitPassConfig {
  permitNumber: string;
  routeLabel: string;
  game: string;

  titleLine1: string;
  titleLine2: string;
  titleAccent: string;
  description: string;

  checkpoints: SummitPassCheckpoint[];
  formLines: SummitPassFormLine[];

  stamp: { line1: string; line2: string; show: boolean };

  countdownTarget: string; // ISO date
  countdownLabel: string;
  slotsFilled: number;
  slotsTotal: number;
  slotsLabel: string;
  slotsWarning?: string;
  serial: string;
  ctaText: string;
  ctaHoverText: string;
  ctaHref: string;

  altitudeLines?: SummitPassAltitudeLine[];
}