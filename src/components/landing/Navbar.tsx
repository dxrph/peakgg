import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crosshair, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded gradient-primary flex items-center justify-center">
            <Crosshair className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">ARENA</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/matchmaking" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Matchmaking</Link>
          <Link to="/tournaments" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Tornei</Link>
          <Link to="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Classifica</Link>
          <Link to="/teams" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Team</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Accedi</Button>
          </Link>
          <Link to="/signup">
            <Button variant="hero" size="sm">Registrati</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-6 space-y-4">
          <Link to="/matchmaking" onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-2">Matchmaking</Link>
          <Link to="/tournaments" onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-2">Tornei</Link>
          <Link to="/leaderboard" onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-2">Classifica</Link>
          <Link to="/teams" onClick={() => setMobileOpen(false)} className="block text-sm font-medium py-2">Team</Link>
          <div className="pt-4 border-t border-border flex gap-3">
            <Link to="/login" className="flex-1">
              <Button variant="outline" className="w-full">Accedi</Button>
            </Link>
            <Link to="/signup" className="flex-1">
              <Button variant="hero" className="w-full">Registrati</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
