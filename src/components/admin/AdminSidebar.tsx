import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Trophy, Swords, AlertTriangle, Users, Mountain,
  Star, ShieldAlert, Gavel, Target, MessageSquare, Bell, Coins, CalendarRange, TrendingDown, Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRoles } from "@/hooks/useUserRoles";
import BrandLogo from "@/components/BrandLogo";

type SectionRole = "admin" | "moderator" | "organizer";

interface Section {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  allow: SectionRole[];
}

const SECTIONS: Section[] = [
  { id: "dashboard",     label: "Dashboard",     icon: LayoutDashboard, to: "/admin",                allow: ["admin", "moderator", "organizer"] },
  { id: "tournaments",   label: "Tornei",        icon: Trophy,          to: "/admin/tournaments",    allow: ["admin", "organizer"] },
  { id: "community-cup", label: "Community Cup", icon: Flag,            to: "/admin/community-cup",  allow: ["admin", "moderator", "organizer"] },
  { id: "leagues",       label: "Peak League",   icon: Mountain,        to: "/admin/leagues",        allow: ["admin"] },
  { id: "matches",       label: "Match monitor", icon: Swords,          to: "/admin/matches",        allow: ["admin", "moderator", "organizer"] },
  { id: "tickets",       label: "Ticket",        icon: AlertTriangle,   to: "/admin/tickets",        allow: ["admin", "moderator"] },
  { id: "disputes",      label: "Dispute",       icon: Gavel,           to: "/admin/disputes",       allow: ["admin", "moderator"] },
  { id: "scrims",        label: "Scrims",        icon: Target,          to: "/admin/scrims",         allow: ["admin", "moderator"] },
  { id: "chat",          label: "Chat",          icon: MessageSquare,   to: "/admin/chat",           allow: ["admin", "moderator"] },
  { id: "announcements", label: "Annunci",       icon: Bell,            to: "/admin/announcements",  allow: ["admin", "moderator"] },
  { id: "players",       label: "Player",        icon: Users,           to: "/admin/players",        allow: ["admin", "moderator"] },
  { id: "reputation",    label: "Reputazione",   icon: Star,            to: "/admin/reputation",     allow: ["admin", "moderator"] },
  { id: "economy",       label: "Economia",      icon: Coins,           to: "/admin/economy",        allow: ["admin"] },
  { id: "seasons",       label: "Stagioni",      icon: CalendarRange,   to: "/admin/seasons",        allow: ["admin"] },
  { id: "elo",           label: "ELO Tools",     icon: TrendingDown,    to: "/admin/elo",            allow: ["admin"] },
  { id: "security",      label: "Sicurezza",     icon: ShieldAlert,     to: "/admin/security",       allow: ["admin"] },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const { isAdmin, isModerator, isOrganizer } = useUserRoles();

  const visible = SECTIONS.filter((s) =>
    (s.allow.includes("admin") && isAdmin) ||
    (s.allow.includes("moderator") && isModerator) ||
    (s.allow.includes("organizer") && isOrganizer)
  );

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-[#08080d]/90 backdrop-blur-xl min-h-[calc(100vh-4rem)] hidden md:flex flex-col sticky top-16">
      <div className="px-4 py-4 border-b border-border flex items-center gap-3">
        <BrandLogo className="h-9 w-9 drop-shadow-[0_0_10px_rgba(255,70,85,0.4)]" />
        <div>
          <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">PeakGG</p>
          <p className="text-sm font-display font-bold">Admin Panel</p>
        </div>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto max-h-[calc(100vh-9rem)]">
        {visible.map((s) => {
          const isActive = s.to === "/admin" ? pathname === "/admin" : pathname.startsWith(s.to);
          return (
            <NavLink
              key={s.id}
              to={s.to}
              end={s.to === "/admin"}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-display uppercase tracking-[.12em] transition-all border",
                isActive
                  ? "border-primary/35 text-white bg-gradient-to-r from-primary/18 to-transparent shadow-[inset_3px_0_0_hsl(var(--primary))]"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/20"
              )}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

