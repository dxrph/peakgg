import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Search, Trophy, User, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const hiddenRoutes = ["/", "/login", "/register", "/privacy", "/terms"];

export default function MobileDock() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const visible = Boolean(user) && !hiddenRoutes.includes(location.pathname) && !location.pathname.startsWith("/admin");

  useEffect(() => {
    document.body.classList.toggle("peak-mobile-dock", visible);
    return () => document.body.classList.remove("peak-mobile-dock");
  }, [visible]);

  if (!visible) return null;

  const items = [
    { label: "Home", path: "/dashboard", icon: LayoutDashboard },
    { label: "Trova", path: "/free-agents", icon: Search },
    { label: "Competi", path: "/tournaments", icon: Trophy, primary: true },
    { label: "Club", path: "/teams", icon: Users },
    { label: "Profilo", path: profile?.username ? `/profile/${profile.username}` : "/dashboard", icon: User },
  ];

  return (
    <nav className="peak-mobile-dock md:hidden" aria-label="Navigazione rapida">
      {items.map(({ label, path, icon: Icon, primary }) => {
        const active = location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path));
        return (
          <Link key={label} to={path} className={cn("peak-mobile-dock__item", active && "is-active", primary && "is-primary")}>
            <span className="peak-mobile-dock__icon"><Icon className="h-4 w-4" /></span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

