import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crosshair, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
      scrolled ? "border-border/60 bg-background/90 backdrop-blur-xl" : "border-transparent bg-transparent"
    }`}>
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded gradient-primary flex items-center justify-center">
            <Crosshair className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">RIFTARENA</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            ["/play", "Play"],
            ["/tournaments", "Tournaments"],
            ["/leaderboard", "Leaderboard"],
            ["/teams", "Teams"],
          ].map(([href, label]) => (
            <Link key={href} to={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display font-semibold uppercase tracking-wider">
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
          <Link to="/register"><Button variant="neon" size="sm">Register</Button></Link>
        </div>

        <button className="md:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-6 space-y-4">
          {[
            ["/play", "Play"],
            ["/tournaments", "Tournaments"],
            ["/leaderboard", "Leaderboard"],
            ["/teams", "Teams"],
          ].map(([href, label]) => (
            <Link key={href} to={href} onClick={() => setMobileOpen(false)} className="block text-sm font-display font-semibold uppercase tracking-wider py-2">
              {label}
            </Link>
          ))}
          <div className="pt-4 border-t border-border flex gap-3">
            <Link to="/login" className="flex-1"><Button variant="outline" className="w-full">Login</Button></Link>
            <Link to="/register" className="flex-1"><Button variant="neon" className="w-full">Register</Button></Link>
          </div>
        </div>
      )}
    </nav>
  );
}
