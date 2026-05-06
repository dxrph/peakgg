import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, Menu, X, LogOut, MessageCircle, User as UserIcon, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import GameSwitcher from "@/components/GameSwitcher";
import { useAuth } from "@/hooks/useAuth";
import GoogleButton from "@/components/GoogleButton";
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
import { useI18n } from "@/i18n";
import { DISCORD_INVITE } from "@/lib/links";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
      scrolled
        ? "bg-background/70 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.6)]"
        : "bg-background/40"
    }`}>
      {/* Custom thin bottom border in dark red */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[#1e1e1e]" />

      <div className="container grid grid-cols-[auto_1fr_auto] items-center h-16 gap-3 lg:gap-6">
        {/* LEFT — Logo + Game Selector */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2.5 mr-4 lg:mr-6">
            <div className="w-8 h-8 rounded gradient-primary flex items-center justify-center">
              <Mountain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:inline">PEAKGG</span>
          </Link>

          <div className="hidden lg:flex items-center" title={t("nav.game_filter_hint")}>
            <div className="h-6 w-px bg-border/60 mr-3" />
            <GameSwitcher />
          </div>
        </div>

        {/* CENTER — Nav links */}
        <div className="hidden md:flex items-center justify-center gap-5 lg:gap-7">
          {([
            ["/tournaments", t("nav.tournaments")],
            ["/teams", t("nav.teams")],
            ["/free-agents", t("nav.free_agents")],
            ["/clips", t("nav.clips")],
            ["/leaderboard", t("nav.leaderboard")],
          ] as const).map(([href, label]) => (
            <Link
              key={href}
              to={href}
              className="group relative text-[12px] lg:text-[13px] text-muted-foreground hover:text-foreground transition-colors font-display font-medium uppercase tracking-[0.12em] whitespace-nowrap"
            >
              {label}
              <span className="absolute left-0 right-0 -bottom-1.5 h-px scale-x-0 bg-primary group-hover:scale-x-100 transition-transform origin-center" />
            </Link>
          ))}
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative text-[12px] lg:text-[13px] text-[#8a93f5] hover:text-white transition-colors font-display font-medium uppercase tracking-[0.12em] flex items-center gap-1.5 whitespace-nowrap"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {t("nav.discord")}
          </a>
        </div>

        {/* RIGHT — Lang | Notifications | Avatar */}
        <div className="hidden md:flex items-center gap-2.5 lg:gap-3">
          <LanguageSwitcher />
          {loading ? null : user ? (
            <>
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-md pl-1 pr-1.5 lg:pr-2.5 py-1 hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    aria-label={profile?.username ?? "Account"}
                  >
                    <Avatar className="h-7 w-7 border border-border">
                      <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.username ?? "user"} />
                      <AvatarFallback className="text-[10px]">{(profile?.username ?? "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline text-[13px] font-display font-semibold max-w-[110px] truncate">
                      {profile?.username ?? "Player"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-52">
                  <DropdownMenuLabel className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                    {profile?.username ?? "Player"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={profile?.username ? `/profile/${profile.username}` : "/dashboard"} className="cursor-pointer">
                      <UserIcon className="h-4 w-4 mr-2" /> {t("nav.menu_profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" /> {t("nav.menu_settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> {t("auth.signout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">{t("auth.login")}</Button></Link>
              <Link to="/register"><Button variant="neon" size="sm" className="rounded-sm uppercase tracking-wider">{t("auth.register")}</Button></Link>
            </>
          )}
        </div>

        {/* Mobile right cluster: Discord + Hamburger */}
        <div className="md:hidden col-start-3 justify-self-end flex items-center gap-1">
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-[#5865F2] text-white"
            aria-label="Discord"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
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
        <div className="md:hidden border-t border-border bg-background px-4 py-5 space-y-1">
          <div className="pb-3 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-display">{t("nav.menu")}</span>
            <LanguageSwitcher />
          </div>
          {([
            ["/play", t("nav.play")],
            ["/tournaments", t("nav.tournaments")],
            ["/teams", t("nav.teams")],
            ["/free-agents", t("nav.free_agents")],
            ["/clips", t("nav.clips")],
            ["/leaderboard", t("nav.leaderboard")],
            ["/scrims", t("nav.scrims")],
          ] as const).map(([href, label]) => (
            <Link key={href} to={href} onClick={() => setMobileOpen(false)} className="block text-sm font-display font-semibold uppercase tracking-wider py-2.5 border-b border-border/40">
              {label}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-2.5">
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="block"
            >
              <Button className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white border-0">
                <MessageCircle className="h-4 w-4 mr-2" /> {t("nav.discord")}
              </Button>
            </a>
            {user ? (
              <>
                <Link to={profile?.username ? `/profile/${profile.username}` : "/dashboard"} onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full"><UserIcon className="h-4 w-4 mr-2" />{t("nav.menu_profile")}</Button>
                </Link>
                <Link to="/settings" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full"><Settings className="h-4 w-4 mr-2" />{t("nav.menu_settings")}</Button>
                </Link>
                <Button variant="ghost" className="w-full text-destructive" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                  <LogOut className="h-4 w-4 mr-2" /> {t("auth.signout")}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">{t("auth.login")}</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}>
                  <Button variant="neon" className="w-full">{t("auth.register")}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
