import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, Menu, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import GameSwitcher from "@/components/GameSwitcher";
import { useAuth } from "@/hooks/useAuth";
import GoogleButton from "@/components/GoogleButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationsBell from "@/components/NotificationsBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n";

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
        ? "border-border/60 bg-background/80 shadow-[0_1px_0_0_hsl(var(--primary)/0.08),0_8px_30px_-10px_rgba(0,0,0,0.5)]"
        : "border-border/30 bg-background/40"
    }`}>
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded gradient-primary flex items-center justify-center">
            <Mountain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">PEAKGG</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <GameSwitcher />
          {([
            ["/play", t("nav.play")],
            ["/tournaments", t("nav.tournaments")],
            ["/leaderboard", t("nav.leaderboard")],
            ["/teams", t("nav.teams")],
            ["/scrims", t("nav.scrims")],
          ] as const).map(([href, label]) => (
            <Link key={href} to={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display font-semibold uppercase tracking-wider">
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          {loading ? null : user ? (
            <>
              <NotificationsBell />
              <Link to={profile?.username ? `/profile/${profile.username}` : "/dashboard"} className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.username ?? "user"} />
                  <AvatarFallback>{(profile?.username ?? "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-display font-semibold">{profile?.username ?? "Player"}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label={t("auth.signout")}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">{t("auth.login")}</Button></Link>
              <div className="w-[200px]"><GoogleButton label={t("auth.signin_google")} /></div>
            </>
          )}
        </div>

        <button className="md:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-6 space-y-4">
          <GameSwitcher className="mb-4" />
          <div className="pb-2"><LanguageSwitcher /></div>
          {([
            ["/play", t("nav.play")],
            ["/tournaments", t("nav.tournaments")],
            ["/leaderboard", t("nav.leaderboard")],
            ["/teams", t("nav.teams")],
            ["/scrims", t("nav.scrims")],
          ] as const).map(([href, label]) => (
            <Link key={href} to={href} onClick={() => setMobileOpen(false)} className="block text-sm font-display font-semibold uppercase tracking-wider py-2">
              {label}
            </Link>
          ))}
          <div className="pt-4 border-t border-border flex gap-3">
            {user ? (
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" /> {t("auth.signout")}
              </Button>
            ) : (
              <div className="w-full space-y-2">
                <Link to="/login" className="block"><Button variant="outline" className="w-full">{t("auth.login")}</Button></Link>
                <GoogleButton label={t("auth.signin_google")} />
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
