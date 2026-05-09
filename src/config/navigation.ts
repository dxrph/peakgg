import type { ComponentType } from "react";
import {
  Trophy,
  Users,
  UserPlus,
  Film,
  BarChart3,
  Crosshair,
  Compass,
  Award,
  Calendar,
  Newspaper,
  HelpCircle,
  Mail,
  ScrollText,
  Shield,
  LayoutDashboard,
  User as UserIcon,
  Settings,
  Bell,
  Swords,
  Mountain,
  Gauge,
  FileText,
  MessageSquare,
  ListChecks,
} from "lucide-react";

/**
 * Centralized PeakGG navigation config.
 * Single source of truth for navbar / More dropdown / footer / user menu / dashboard.
 * Add a page once here → it shows up everywhere it should.
 */

export type NavCategory =
  | "platform"   // primary public pages → main navbar
  | "tools"      // secondary public → More dropdown + footer Tools
  | "community"  // community / info pages
  | "account"    // logged-in user pages
  | "admin"      // admin only
  | "legal";     // legal footer links

export interface NavItem {
  key: string;
  labelKey: string;        // i18n key (under "navmap.*"). Falls back to label.
  label: string;           // English fallback
  path: string;
  icon?: ComponentType<{ className?: string }>;
  category: NavCategory;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  showInNavbar?: boolean;
  showInMoreDropdown?: boolean;
  showInFooter?: boolean;
  showInUserDropdown?: boolean;
  showInDashboard?: boolean;
  comingSoon?: boolean;
  external?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  // ───────── PLATFORM (main navbar) ─────────
  { key: "tournaments", labelKey: "navmap.tournaments", label: "Tournaments", path: "/tournaments", icon: Trophy, category: "platform", showInMoreDropdown: true, showInDashboard: true },
  { key: "leagues",     labelKey: "navmap.leagues",     label: "Peak League", path: "/leagues",     icon: Mountain, category: "platform", showInNavbar: true, showInFooter: true, showInDashboard: true },
  { key: "teams",       labelKey: "navmap.teams",       label: "Teams",       path: "/teams",       icon: Users,  category: "platform", showInNavbar: true, showInFooter: true, showInDashboard: true },
  { key: "free_agents", labelKey: "navmap.free_agents", label: "Free Agents", path: "/free-agents", icon: UserPlus, category: "platform", showInNavbar: true, showInFooter: true, showInDashboard: true },
  { key: "clips",       labelKey: "navmap.clips",       label: "Clips",       path: "/clips",       icon: Film,   category: "platform", comingSoon: true },
  { key: "leaderboard", labelKey: "navmap.leaderboard", label: "Leaderboard", path: "/leaderboard", icon: BarChart3, category: "platform", showInNavbar: true, showInFooter: true, showInDashboard: true },
  { key: "scrims",      labelKey: "navmap.scrims",      label: "Scrims",      path: "/scrims",      icon: Swords, category: "platform", showInMoreDropdown: true },
  { key: "play",        labelKey: "navmap.play",        label: "Find Match",  path: "/play",        icon: Mountain, category: "platform", requiresAuth: true, showInDashboard: true },

  // ───────── TOOLS / SECONDARY (More dropdown + footer) ─────────
  { key: "how_it_works",   labelKey: "navmap.how_it_works",   label: "How It Works",         path: "/about",                    icon: Compass,  category: "tools", showInMoreDropdown: true },
  { key: "rank_system",    labelKey: "navmap.rank_system",    label: "Rank System",          path: "/elo",                      icon: Award,    category: "tools", showInMoreDropdown: true },
  { key: "seasons",        labelKey: "navmap.seasons",        label: "Seasons",              path: "/seasons",                  icon: Calendar, category: "tools", comingSoon: true },
  { key: "aim_guide",      labelKey: "navmap.aim_guide",      label: "Aim Training Guide",   path: "/aim-guide",                icon: Crosshair, category: "tools", showInMoreDropdown: true },
  { key: "crosshair",      labelKey: "navmap.crosshair",      label: "Crosshair Builder",    path: "/tools/crosshair",          icon: Crosshair, category: "tools", comingSoon: true },
  { key: "sensitivity",    labelKey: "navmap.sensitivity",    label: "Sensitivity Calculator", path: "/tools/sensitivity",      icon: Gauge,    category: "tools", comingSoon: true },

  // ───────── COMMUNITY ─────────
  { key: "news",     labelKey: "navmap.news",     label: "News / Blog",   path: "/news",    icon: Newspaper, category: "community", comingSoon: true },
  { key: "faq",      labelKey: "navmap.faq",      label: "FAQ",           path: "/faq",     icon: HelpCircle, category: "community", showInMoreDropdown: true, showInFooter: true },
  { key: "rules",    labelKey: "navmap.rules",    label: "Community Rules", path: "/rules", icon: ScrollText, category: "community", comingSoon: true },
  { key: "contact",  labelKey: "navmap.contact",  label: "Contact",       path: "/contact", icon: Mail,      category: "community", showInFooter: true },

  // ───────── ACCOUNT (user dropdown + dashboard) ─────────
  { key: "dashboard",      labelKey: "navmap.dashboard",      label: "Dashboard",        path: "/dashboard",     icon: LayoutDashboard, category: "account", requiresAuth: true, showInUserDropdown: true },
  { key: "my_profile",     labelKey: "navmap.my_profile",     label: "My Profile",       path: "/profile/me",    icon: UserIcon,        category: "account", requiresAuth: true, showInUserDropdown: true, showInDashboard: true },
  { key: "edit_profile",   labelKey: "navmap.edit_profile",   label: "Edit Profile",     path: "/settings",      icon: Settings,        category: "account", requiresAuth: true, showInDashboard: true },
  { key: "my_team",        labelKey: "navmap.my_team",        label: "My Team",          path: "/teams",         icon: Users,           category: "account", requiresAuth: true, showInUserDropdown: true, showInDashboard: true },
  { key: "my_tournaments", labelKey: "navmap.my_tournaments", label: "My Tournaments",   path: "/tournaments",   icon: Trophy,          category: "account", requiresAuth: true, showInUserDropdown: true, showInDashboard: true },
  { key: "my_clips",       labelKey: "navmap.my_clips",       label: "My Clips",         path: "/clips",         icon: Film,            category: "account", requiresAuth: true, comingSoon: true },
  { key: "notifications",  labelKey: "navmap.notifications",  label: "Notifications",    path: "/notifications", icon: Bell,            category: "account", requiresAuth: true, showInDashboard: true },
  { key: "settings",       labelKey: "navmap.settings",       label: "Settings",         path: "/settings",      icon: Settings,        category: "account", requiresAuth: true, showInUserDropdown: true, showInDashboard: true },

  // ───────── ADMIN ─────────
  { key: "admin_panel",        labelKey: "navmap.admin_panel",        label: "Admin Panel",         path: "/admin",               icon: Shield,        category: "admin", requiresAuth: true, adminOnly: true, showInUserDropdown: true, showInDashboard: true },
  { key: "admin_players",      labelKey: "navmap.admin_players",      label: "User Management",     path: "/admin/players",       icon: Users,         category: "admin", requiresAuth: true, adminOnly: true, showInDashboard: true },
  { key: "admin_tournaments",  labelKey: "navmap.admin_tournaments",  label: "Tournament Management", path: "/admin/tournaments", icon: Trophy,        category: "admin", requiresAuth: true, adminOnly: true, showInDashboard: true },
  { key: "admin_teams",        labelKey: "navmap.admin_teams",        label: "Team Management",     path: "/admin/teams",         icon: Users,         category: "admin", requiresAuth: true, adminOnly: true, showInDashboard: true },
  { key: "admin_disputes",     labelKey: "navmap.admin_disputes",     label: "Disputes & Reports",  path: "/admin/disputes",      icon: ListChecks,    category: "admin", requiresAuth: true, adminOnly: true, showInDashboard: true },
  { key: "admin_announcements",labelKey: "navmap.admin_announcements",label: "Announcements",       path: "/admin/announcements", icon: MessageSquare, category: "admin", requiresAuth: true, adminOnly: true, showInDashboard: true },
  { key: "admin_seasons",      labelKey: "navmap.admin_seasons",      label: "Seasons Management",  path: "/admin/seasons",       icon: Calendar,      category: "admin", requiresAuth: true, adminOnly: true },
  { key: "admin_elo",          labelKey: "navmap.admin_elo",          label: "ELO Settings",        path: "/admin/elo",           icon: Gauge,         category: "admin", requiresAuth: true, adminOnly: true },

  // ───────── LEGAL (footer only) ─────────
  { key: "privacy",  labelKey: "navmap.privacy",  label: "Privacy Policy",   path: "/privacy", icon: FileText, category: "legal", showInFooter: true },
  { key: "terms",    labelKey: "navmap.terms",    label: "Terms of Service", path: "/terms",   icon: FileText, category: "legal", showInFooter: true },
];

/* Helpers ------------------------------------------------------- */

export const navbarItems    = () => NAV_ITEMS.filter(i => i.showInNavbar);
export const moreItems      = () => NAV_ITEMS.filter(i => i.showInMoreDropdown);
export const userMenuItems  = () => NAV_ITEMS.filter(i => i.showInUserDropdown && !i.adminOnly);
export const userMenuAdmin  = () => NAV_ITEMS.filter(i => i.showInUserDropdown && i.adminOnly);
export const dashboardCards = () => NAV_ITEMS.filter(i => i.showInDashboard && !i.adminOnly);
export const dashboardAdmin = () => NAV_ITEMS.filter(i => i.showInDashboard && i.adminOnly);

export const footerByCategory = (cat: NavCategory) =>
  NAV_ITEMS.filter(i => i.showInFooter && i.category === cat);

/** Coming-soon pages route through a single catch-all page. */
export const resolvePath = (item: NavItem) =>
  item.comingSoon ? `/coming-soon?feature=${encodeURIComponent(item.label)}&from=${encodeURIComponent(item.path)}` : item.path;