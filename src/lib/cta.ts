import { DISCORD_INVITE } from "@/lib/links";

export interface CtaContext {
  isLoggedIn: boolean;
  hasTeam?: boolean;
  isCaptain?: boolean;
  openCupEnabled?: boolean;
}

export interface Cta {
  label: string;
  to?: string;
  href?: string;
  variant?: "primary" | "secondary" | "discord";
}

/**
 * Auth-aware primary CTA for marketing/empty-state surfaces.
 * Logged-in users NEVER get "Create Account".
 */
export function primaryCta(ctx: CtaContext): Cta {
  if (!ctx.isLoggedIn) return { label: "Create Account", to: "/register", variant: "primary" };
  if (ctx.openCupEnabled) return { label: "Join Open Cup", to: "/play", variant: "primary" };
  if (!ctx.hasTeam) return { label: "Create Team", to: "/teams", variant: "primary" };
  return { label: "View Dashboard", to: "/dashboard", variant: "primary" };
}

export function discordCta(label = "Join Discord"): Cta {
  return { label, href: DISCORD_INVITE, variant: "discord" };
}

export function openCupCta(ctx: CtaContext): Cta {
  if (ctx.openCupEnabled) return { label: "Join Open Cup", to: "/play", variant: "primary" };
  return { label: "Join Discord for Open Cup Beta", href: DISCORD_INVITE, variant: "discord" };
}