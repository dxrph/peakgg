import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Trophy, Swords, AlertTriangle, Users, UsersRound,
  Megaphone, BarChart3, Star, ShieldAlert, Gavel, Target, MessageSquare, Bell, Coins, CalendarRange, TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRoles } from "@/hooks/useUserRoles";

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
  { id: "matches",       label: "Partite",       icon: Swords,          to: "/admin/matches",        allow: ["admin", "organizer"] },
  { id: "tickets",       label: "Ticket",        icon: AlertTriangle,   to: "/admin/tickets",        allow: ["admin", "moderator"] },
  { id: "disputes",      label: "Dispute",       icon: Gavel,           to: "/admin/disputes",       allow: ["admin", "moderator"] },
  { id: "scrims",        label: "Scrims",        icon: Target,          to: "/admin/scrims",         allow: ["admin", "moderator"] },
  { id: "chat",          label: "Chat",          icon: MessageSquare,   to: "/admin/chat",           allow: ["admin", "moderator"] },
  { id: "announcements", label: "Annunci",       icon: Bell,            to: "/admin/announcements",  allow: ["admin", "moderator"] },
  { id: "players",       label: "Player",        icon: Users,           to: "/admin/players",        allow: ["admin", "moderator"] },
  { id: "teams",         label: "Team",          icon: UsersRound,      to: "/admin/teams",          allow: ["admin", "moderator"] },
  { id: "comms",         label: "Comunicazione", icon: Megaphone,       to: "/admin/communication",  allow: ["admin", "moderator"] },
  { id: "analytics",     label: "Analytics",     icon: BarChart3,       to: "/admin/analytics",      allow: ["admin", "organizer"] },
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
    <aside className="w-60 shrink-0 border-r border-border bg-card/30 backdrop-blur min-h-[calc(100vh-4rem)] hidden md:flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <p className="text-xs font-display uppercase tracking-widest text-muted-foreground">PeakGG</p>
        <p className="text-sm font-display font-bold">Admin Panel</p>
      </div>
      <nav className="flex-1 py-3 space-y-0.5">
        {visible.map((s) => {
          const isActive = s.to === "/admin" ? pathname === "/admin" : pathname.startsWith(s.to);
          return (
            <NavLink
              key={s.id}
              to={s.to}
              end={s.to === "/admin"}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-display uppercase tracking-wider transition-colors border-l-2",
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
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
