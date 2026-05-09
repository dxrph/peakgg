import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, Menu, X, LogOut, MessageCircle, ChevronDown, Shield, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import GameSwitcher from "@/components/GameSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationsBell from "@/components/NotificationsBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n";
import { DISCORD_INVITE } from "@/lib/links";
import {
  navbarItems,
  moreItems,
  userMenuItems,
  resolvePath,
  type NavItem,
} from "@/config/navigation";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, signOut, loading } = useAuth();
  const { isAdmin } = useUserRoles();
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const tr = (item: NavItem) => t(item.labelKey, { defaultValue: item.label });
  const profilePath = profile?.username ? `/profile/${profile.username}` : "/dashboard";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) { setMyTeamId(null); return; }
    let cancelled = false;
    (async () => {
      const { data: owned } = await supabase
        .from("teams").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
      if (cancelled) return;
      if (owned?.id) { setMyTeamId(owned.id); return; }
      const { data: mem } = await supabase
        .from("team_members").select("team_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (cancelled) return;
      setMyTeamId(mem?.team_id ?? null);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const mainNav = navbarItems();
  const more = moreItems();
  const userNav = userMenuItems();
  const moreActive = more.some((i) => location.pathname.startsWith(i.path));

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-xl transition-all duration-300 ${
        scrolled
          ? "bg-background/75 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7)]"
          : "bg-background/45"
      }`}
    >
      <div className="container flex items-center justify-between h-14 lg:h-16 gap-4">
        {/* LEFT: logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded gradient-primary flex items-center justify-center">
            <Mountain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg lg:text-xl tracking-tight hidden sm:inline">PEAKGG</span>
        </Link>

        {/* CENTER: main nav + More */}
        <div className="hidden md:flex items-center justify-center flex-1 gap-4 lg:gap-7">
          {mainNav.map((item) => (
            <NavLink
              key={item.key}
              to={resolvePath(item)}
              className={({ isActive }) =>
                `group relative text-[12px] lg:text-[13px] transition-colors font-display font-medium uppercase tracking-[0.14em] whitespace-nowrap ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    {tr(item)}
                    {item.comingSoon && (
                      <span className="text-[8px] uppercase tracking-wider text-accent/80 border border-accent/40 rounded-sm px-1 py-px">
                        Soon
                      </span>
                    )}
                  </span>
                  <span
                    className={`absolute left-0 right-0 -bottom-1.5 h-px bg-primary transition-transform origin-center ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}

          {/* MORE dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`group relative inline-flex items-center gap-1 text-[12px] lg:text-[13px] font-display font-medium uppercase tracking-[0.14em] transition-colors focus:outline-none ${
                  moreActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("nav.more", { defaultValue: "More" })}
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                <span
                  className={`absolute left-0 right-4 -bottom-1.5 h-px bg-primary transition-transform origin-center ${
                    moreActive ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" sideOffset={10} className="w-64">
              <DropdownMenuLabel className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("nav.more_label", { defaultValue: "Tools & Community" })}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {more.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.key} asChild>
                    <Link to={resolvePath(item)} className="cursor-pointer flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                        {tr(item)}
                      </span>
                      {item.comingSoon && (
                        <Badge variant="outline" className="h-4 px-1.5 text-[9px] uppercase tracking-wider border-accent/40 text-accent">
                          Soon
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* RIGHT: utility */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          <div title={t("nav.game_filter_hint")} className="hidden lg:block">
            <GameSwitcher />
          </div>
          <div className="lg:hidden">
            <GameSwitcher compact />
          </div>

          <span className="hidden lg:inline-block w-px h-5 bg-border/60" />

          <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" aria-label="Discord">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 lg:px-3 rounded-md border-[#5865F2]/40 bg-[#5865F2]/10 text-[#a8b0f7] hover:bg-[#5865F2]/20 hover:text-white hover:border-[#5865F2]/60 font-display font-semibold uppercase tracking-wider text-[11px]"
            >
              <MessageCircle className="h-3.5 w-3.5 lg:mr-1.5" />
              <span className="hidden lg:inline">{t("nav.discord")}</span>
            </Button>
          </a>

          <LanguageSwitcher />

          {loading ? null : user ? (
            <>
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md p-1 lg:pr-2 hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    aria-label={profile?.username ?? "Account"}
                  >
                    <Avatar className="h-7 w-7 border border-border">
                      <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.username ?? "user"} />
                      <AvatarFallback className="text-[10px]">
                        {(profile?.username ?? "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden xl:inline text-[12px] font-display font-semibold max-w-[90px] truncate">
                      {profile?.username ?? "Player"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-60">
                  <DropdownMenuLabel className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                    {profile?.username ?? "Player"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userNav.map((item) => {
                    const Icon = item.icon;
                    const path = item.key === "my_profile" ? profilePath : resolvePath(item);
                    return (
                      <DropdownMenuItem key={item.key} asChild>
                        <Link to={path} className="cursor-pointer flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                            {tr(item)}
                          </span>
                          {item.comingSoon && (
                            <Badge variant="outline" className="h-4 px-1.5 text-[9px] uppercase tracking-wider border-accent/40 text-accent">
                              Soon
                            </Badge>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="font-display text-[10px] uppercase tracking-wider text-accent">
                        {t("nav.admin_label", { defaultValue: "Admin" })}
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Shield className="h-4 w-4 mr-2 text-accent" />
                          {t("navmap.admin_panel", { defaultValue: "Admin Panel" })}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> {t("auth.signout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="h-8">{t("auth.login")}</Button>
              </Link>
              <Link to="/register">
                <Button variant="neon" size="sm" className="h-8 rounded-md uppercase tracking-wider text-[11px]">
                  {t("auth.register")}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* MOBILE right cluster */}
        <div className="md:hidden flex items-center gap-1.5">
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-[#5865F2] text-white"
            aria-label="Discord"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          {user && (
            <Link to={profilePath} aria-label="Profile">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.username ?? "user"} />
                <AvatarFallback className="text-[10px]">
                  {(profile?.username ?? "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
          <button className="p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile horizontal game tabs row */}
      <div className="md:hidden border-t border-border/40 bg-background/60 px-3 py-2 overflow-x-auto no-scrollbar">
        <GameSwitcher />
      </div>

      {mobileOpen && (
        <MobileMenu
          onClose={() => setMobileOpen(false)}
          onSignOut={handleSignOut}
          isAdmin={isAdmin}
          profilePath={profilePath}
          isLoggedIn={!!user}
          tr={tr}
          t={t}
        />
      )}
    </nav>
  );
}

/* --------------------- MOBILE MENU --------------------- */

interface MobileMenuProps {
  onClose: () => void;
  onSignOut: () => void;
  isAdmin: boolean;
  profilePath: string;
  isLoggedIn: boolean;
  tr: (item: NavItem) => string;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function MobileMenu({ onClose, onSignOut, isAdmin, profilePath, isLoggedIn, tr, t }: MobileMenuProps) {
  const sections: { key: string; label: string; items: NavItem[] }[] = [
    { key: "platform", label: t("nav.section_platform", { defaultValue: "Platform" }), items: navbarItems() },
    { key: "tools", label: t("nav.section_tools", { defaultValue: "Tools & Community" }), items: moreItems() },
    ...(isLoggedIn
      ? [{ key: "account", label: t("nav.section_account", { defaultValue: "Account" }), items: userMenuItems() }]
      : []),
  ];

  return (
    <div className="md:hidden border-t border-border bg-background px-4 py-5 space-y-5 max-h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-display">{t("nav.menu")}</span>
        <LanguageSwitcher />
      </div>

      {sections.map((sec) => (
        <div key={sec.key}>
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-display mb-2">{sec.label}</div>
          <div className="grid grid-cols-1">
            {sec.items.map((item) => {
              const Icon = item.icon;
              const path = item.key === "my_profile" ? profilePath : resolvePath(item);
              return (
                <Link
                  key={item.key}
                  to={path}
                  onClick={onClose}
                  className="flex items-center justify-between text-sm font-display font-semibold uppercase tracking-wider py-2.5 border-b border-border/40"
                >
                  <span className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    {tr(item)}
                  </span>
                  {item.comingSoon && (
                    <span className="text-[9px] uppercase tracking-wider text-accent/90 border border-accent/40 rounded-sm px-1.5 py-px">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {isAdmin && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-display mb-2">
            {t("nav.admin_label", { defaultValue: "Admin" })}
          </div>
          <Link
            to="/admin"
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-display font-semibold uppercase tracking-wider py-2.5 border-b border-border/40"
          >
            <Shield className="h-4 w-4 text-accent" /> {t("navmap.admin_panel", { defaultValue: "Admin Panel" })}
          </Link>
        </div>
      )}

      <div className="pt-2 flex flex-col gap-2.5">
        <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" onClick={onClose}>
          <Button className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white border-0">
            <MessageCircle className="h-4 w-4 mr-2" /> {t("nav.discord")}
          </Button>
        </a>
        {isLoggedIn ? (
          <Button variant="ghost" className="w-full text-destructive" onClick={() => { onSignOut(); onClose(); }}>
            <LogOut className="h-4 w-4 mr-2" /> {t("auth.signout")}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link to="/login" onClick={onClose}>
              <Button variant="outline" className="w-full">{t("auth.login")}</Button>
            </Link>
            <Link to="/register" onClick={onClose}>
              <Button variant="neon" className="w-full">{t("auth.register")}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}